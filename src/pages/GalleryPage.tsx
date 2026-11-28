import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SiteText, useSiteGallery, useSitePage } from '@/site/SiteContent';
import { galleryImages as fallbackImages } from '@/data/gallery';

interface GalleryImageItem {
  id: string;
  url: string;
  caption: string;
  category: string;
}

export const GalleryPage = () => {
  const page = useSitePage<any>('gallery');
  const remote = useSiteGallery();
  const images = useMemo<GalleryImageItem[]>(
    () =>
      remote.length
        ? remote.map((image: any) => ({
            id: image.id,
            url: image.url,
            caption: image.caption ?? '',
            category: image.category ?? 'Campus',
          }))
        : fallbackImages.map((image) => ({
            id: image.id,
            url: image.color,
            caption: image.caption,
            category: image.category,
          })),
    [remote],
  );
  const categories = page.categories ?? ['All'];
  const [filter, setFilter] = useState('All');
  const [activeImage, setActiveImage] = useState<GalleryImageItem | null>(null);
  const visible = filter === 'All' ? images : images.filter((image) => image.category === filter);
  const activeIndex = activeImage ? visible.findIndex((image) => image.id === activeImage.id) : -1;

  useEffect(() => {
    if (!activeImage) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveImage(null);
      if (event.key === 'ArrowRight') setActiveImage(visible[(activeIndex + 1) % visible.length]);
      if (event.key === 'ArrowLeft') setActiveImage(visible[(activeIndex - 1 + visible.length) % visible.length]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImage, activeIndex, visible]);

  const moveImage = (direction: number) => {
    if (!visible.length) return;
    setActiveImage(visible[(activeIndex + direction + visible.length) % visible.length]);
  };

  return (
    <Layout>
      <PageHero
        eyebrow={page.hero?.eyebrow}
        title={page.hero?.title}
        text={page.hero?.text}
        image={page.hero?.image}
        paths={{ eyebrow: 'gallery.hero.eyebrow', title: 'gallery.hero.title', text: 'gallery.hero.text' }}
      />
      <section className="py-14 sm:py-18">
        <Container>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery by category">
            {categories.map((item: string) => (
              <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`min-h-10 rounded px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-brand-700 text-white' : 'border border-line text-muted hover:border-brand-500 hover:text-brand-700'}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((image, index) => (
              <button key={image.id} type="button" onClick={() => setActiveImage(image)} className={`group relative overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-brand-600 ${index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`} aria-label={`View ${image.caption}`}>
                <img src={image.url} alt={image.caption} loading="lazy" className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${index === 0 ? 'aspect-square h-full' : 'aspect-[4/3]'}`} />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-left text-xs font-semibold text-white sm:text-sm">{image.category}</span>
              </button>
            ))}
          </div>
          <SiteText path="gallery.notice" value={page.notice} as="p" className="mt-5 text-xs text-muted" multiline />
        </Container>
      </section>
      {activeImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Gallery image viewer" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveImage(null); }}>
          <div className="relative flex max-h-full w-full max-w-5xl flex-col items-center">
            <button type="button" onClick={() => setActiveImage(null)} aria-label="Close image viewer" className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded border border-white/40 text-white"><X aria-hidden="true" size={20} /></button>
            <img src={activeImage.url} alt={activeImage.caption} className="max-h-[75vh] max-w-full object-contain" />
            <div className="mt-4 flex w-full items-center justify-between gap-4 text-sm text-white">
              <button type="button" onClick={() => moveImage(-1)} className="inline-flex min-h-11 items-center gap-2 rounded border border-white/40 px-4 hover:bg-white/10"><ChevronLeft aria-hidden="true" size={16} />Previous</button>
              <p className="text-center">{activeImage.caption} · {activeImage.category}</p>
              <button type="button" onClick={() => moveImage(1)} className="inline-flex min-h-11 items-center gap-2 rounded border border-white/40 px-4 hover:bg-white/10">Next<ChevronRight aria-hidden="true" size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
