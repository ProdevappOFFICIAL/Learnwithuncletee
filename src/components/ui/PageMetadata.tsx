import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  /** Absolute image URL for og:image / twitter:image. Relative paths are resolved against the origin. */
  image?: string;
  /** Absolute canonical URL. Defaults to the current location. */
  url?: string;
  /** og:type — 'website' for listings, 'article' for detail pages. */
  type?: 'website' | 'article';
  /** Article extras (only when type === 'article'). */
  publishedTime?: string;
  section?: string;
}

/** Resolves upload URLs (already absolute) and site-relative paths to absolute URLs crawlers require. */
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

/**
 * Blog-grade head tags: title, description, canonical, Open Graph
 * (link unfurls with banner image) + Twitter large-image card.
 * Backward compatible with the old (title, description) usage.
 */
export const PageMetadata = ({ title, description, image, url, type = 'website', publishedTime, section }: SeoProps) => {
  useEffect(() => {
    const fullTitle = `${title} | Learnwithuncletee`;
    document.title = fullTitle;
    setMeta('name', 'description', description);

    const pageUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    const imageUrl = absoluteUrl(image);
    if (pageUrl) {
      setLink('canonical', pageUrl);
      setMeta('property', 'og:url', pageUrl);
    }
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'Learnwithuncletee');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', imageUrl);
    if (type === 'article') {
      if (publishedTime) setMeta('property', 'article:published_time', publishedTime);
      if (section) setMeta('property', 'article:section', section);
    }
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);
  }, [title, description, image, url, type, publishedTime, section]);

  return null;
};
