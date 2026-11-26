import { useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeoProps {
  title: string;
  description: string;
  /** Absolute or site-relative image URL for og:image / twitter:image. */
  image?: string;
  /** Absolute canonical URL. Defaults to the current location. */
  url?: string;
  /** og:type — 'website' for listings, 'article' for detail pages. */
  type?: 'website' | 'article';
  /** Article-only extras. */
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  /** Comma-separated tags for article:tag */
  tags?: string;
  author?: string;
  /** Pass false to noindex (e.g. auth pages, dashboards). */
  robots?: string;
  /** JSON-LD object(s) to inject — array or single object. */
  jsonLd?: object | object[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolves relative paths (e.g. /school.JPG) to absolute URLs that crawlers require. */
export const absoluteUrl = (url?: string | null, fallback = '/school.JPG') => {
  const raw = url || fallback;
  if (/^(https?:|data:)/.test(raw)) return raw;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
};

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.content = content;
};

const setLink = (rel: string, href: string) => {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.append(el);
  }
  el.href = href;
};

const upsertJsonLd = (id: string, data: object | object[]) => {
  const payload = Array.isArray(data) ? data : [data];
  let el = document.querySelector<HTMLScriptElement>(`script[data-lwu-ld="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-lwu-ld', id);
    document.head.append(el);
  }
  el.textContent = JSON.stringify(payload.length === 1 ? payload[0] : payload);
};

const removeJsonLd = (id: string) => {
  document.querySelector(`script[data-lwu-ld="${id}"]`)?.remove();
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * God-level SEO head manager.
 * Sets: title, description, canonical, Open Graph (link unfurls with banner
 * image on WhatsApp / Telegram / Facebook / LinkedIn), Twitter large-image
 * card, article-specific OG properties, robots, and any JSON-LD structured data.
 *
 * Works client-side (SPA). For social-bot previews of individual articles,
 * pair this with the /api/og/news/:id server endpoint which serves pre-rendered
 * OG HTML for crawlers that don't execute JavaScript.
 */
export const PageMetadata = ({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  section,
  tags,
  author = 'Learnwithuncletee',
  robots = 'index, follow, max-image-preview:large, max-snippet:-1',
  jsonLd,
}: SeoProps) => {
  useEffect(() => {
    const SITE = 'Learnwithuncletee';
    const fullTitle = `${title} | ${SITE}`;
    const pageUrl  = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    const imageUrl = absoluteUrl(image);

    // ── title + basic meta ──────────────────────────────────────────────────
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'author', author);
    setMeta('name', 'robots', robots);

    // ── canonical ───────────────────────────────────────────────────────────
    if (pageUrl) setLink('canonical', pageUrl);

    // ── Open Graph ──────────────────────────────────────────────────────────
    setMeta('property', 'og:site_name',  SITE);
    setMeta('property', 'og:locale',     'en_NG');
    setMeta('property', 'og:type',       type);
    setMeta('property', 'og:url',        pageUrl);
    setMeta('property', 'og:title',      fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image',      imageUrl);
    setMeta('property', 'og:image:secure_url', imageUrl);
    setMeta('property', 'og:image:width',  '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt',    `${title} — ${SITE}`);
    // Hinted content type so platforms know what to expect
    const ext = imageUrl.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
    setMeta('property', 'og:image:type', mime);

    // ── Article-specific OG ─────────────────────────────────────────────────
    if (type === 'article') {
      if (publishedTime) setMeta('property', 'article:published_time', publishedTime);
      if (modifiedTime)  setMeta('property', 'article:modified_time',  modifiedTime);
      if (section)       setMeta('property', 'article:section',         section);
      if (author)        setMeta('property', 'article:author',          author);
      if (tags) {
        tags.split(',').map((t) => t.trim()).filter(Boolean).forEach((tag) => {
          // Each tag needs its own <meta> element — dedupe by content
          if (!document.querySelector(`meta[property="article:tag"][content="${tag}"]`)) {
            const el = document.createElement('meta');
            el.setAttribute('property', 'article:tag');
            el.content = tag;
            document.head.append(el);
          }
        });
      }
    }

    // ── Twitter / X ─────────────────────────────────────────────────────────
    // summary_large_image = full banner thumbnail shown on share
    setMeta('name', 'twitter:card',        'summary_large_image');
    setMeta('name', 'twitter:site',        '@learnwithuncletee');
    setMeta('name', 'twitter:creator',     '@learnwithuncletee');
    setMeta('name', 'twitter:title',       fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image',       imageUrl);
    setMeta('name', 'twitter:image:alt',   `${title} — ${SITE}`);

    // ── JSON-LD structured data ──────────────────────────────────────────────
    if (jsonLd) {
      upsertJsonLd('page', jsonLd);
    } else {
      removeJsonLd('page');
    }
  }, [title, description, image, url, type, publishedTime, modifiedTime, section, tags, author, robots, jsonLd]);

  return null;
};
