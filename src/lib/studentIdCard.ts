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

  let dataUrl: string;
  try {
    dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio,
      width,
      height,
    });
  } finally {
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
