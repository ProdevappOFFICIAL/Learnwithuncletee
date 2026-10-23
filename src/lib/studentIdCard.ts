import { toPng } from 'html-to-image';

const slugify = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'student-id-card';

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map((img) => img.decode().catch(() => undefined)));
};

/**
 * html-to-image crashes with a SecurityError when it tries to read cssRules
 * from cross-origin stylesheets (e.g. Google Fonts).  We work around this by:
 *   1. Passing a `filter` that skips <link> elements pointing to remote URLs.
 *   2. Injecting an inline <style> that re-declares the font-family stacks so
 *      the captured image still renders with the correct typefaces (the fonts
 *      themselves are already downloaded into the browser's font cache by the
 *      time the user opens the ID-card modal).
 */
function buildInlineFontStyle(): HTMLStyleElement {
  // Declare the same font stacks used by the card.  The browser already has
  // the actual font files in memory; this just ensures the cloned document
  // knows which family names to use for the text nodes.
  const css = `
    @font-face { font-family: 'Open Sans'; font-weight: 500 800; src: local('Open Sans'); }
    @font-face { font-family: 'Lilita One'; font-weight: 400; src: local('Lilita One'); }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  return style;
}

export async function downloadStudentIdCard(
  node: HTMLElement,
  { fileName, pixelRatio = 3 }: { fileName: string; pixelRatio?: number },
) {
  await document.fonts?.ready;
  await waitForImages(node);

  // Use scrollWidth/scrollHeight so we capture the full rendered content,
  // not just the clipped visible box from getBoundingClientRect.
  const width = node.scrollWidth;
  const height = node.scrollHeight;

  // Temporarily force the node to not clip its own overflow during capture.
  const prevOverflow = node.style.overflow;
  const prevMaxWidth = node.style.maxWidth;
  node.style.overflow = 'visible';
  node.style.maxWidth = 'none';

  // Inject inline font declarations so the cloned DOM has the right families.
  const inlineStyle = buildInlineFontStyle();
  node.prepend(inlineStyle);

  let dataUrl: string;
  try {
    dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio,
      width,
      height,
      // Skip cloning <link rel="stylesheet"> nodes that point to external
      // origins — reading their cssRules throws a SecurityError (CORS).
      filter: (domNode: Node) => {
        if (domNode instanceof HTMLLinkElement && domNode.rel === 'stylesheet') {
          const href = domNode.getAttribute('href') ?? '';
          if (href.startsWith('http://') || href.startsWith('https://')) {
            return false; // drop this node from the clone
          }
        }
        return true;
      },
    });
  } finally {
    inlineStyle.remove();
    node.style.overflow = prevOverflow;
    node.style.maxWidth = prevMaxWidth;
  }

  const link = document.createElement('a');
  link.download = `${slugify(fileName)}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

