import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { galleryImages } from '@/data/gallery';
import type { GalleryImage } from '@/types';

const categories = ['All', 'Campus', 'Academics', 'Students', 'Sports', 'Cultural', 'Events', 'Staff'] as const;
type GalleryFilter = (typeof categories)[number];

export const GalleryPage = () => {
  const [filter, setFilter] = useState<GalleryFilter>('All');
  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);
  const visible = filter === 'All' ? galleryImages : galleryImages.filter((image) => image.category === filter);
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

  const moveImage = (direction: number) => setActiveImage(visible[(activeIndex + direction + visible.length) % visible.length]);

  return (
    <Layout>
      <PageHero eyebrow="A look around" title="Gallery" text="Browse moments from campus, learning, student life and school events." image="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=85" />
      <section className="py-14 sm:py-18"><Container><div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery by category">{categories.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`min-h-10 rounded px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-brand-700 text-white' : 'border border-line text-muted hover:border-brand-500 hover:text-brand-700'}`}>{item}</button>)}</div><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((image, index) => <button key={image.id} type="button" onClick={() => setActiveImage(image)} className={`group relative overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-brand-600 ${index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`} aria-label={`View ${image.caption}`}><img src={image.color} alt={image.caption} loading="lazy" className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${index === 0 ? 'aspect-square h-full' : 'aspect-[4/3]'}`} /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-left text-xs font-semibold text-white sm:text-sm">{image.category}</span></button>)}</div><p className="mt-5 text-xs text-muted">Sample photographs shown for layout. Replace with approved school images and captions.</p></Container></section>
      {activeImage && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Gallery image viewer" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveImage(null); }}><div className="relative flex max-h-full w-full max-w-5xl flex-col items-center"><button type="button" onClick={() => setActiveImage(null)} aria-label="Close image viewer" className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded border border-white/40 text-2xl text-white">×</button><img src={activeImage.color} alt={activeImage.caption} className="max-h-[75vh] max-w-full object-contain" /><div className="mt-4 flex w-full items-center justify-between gap-4 text-sm text-white"><button type="button" onClick={() => moveImage(-1)} className="min-h-11 rounded border border-white/40 px-4 hover:bg-white/10">← Previous</button><p className="text-center">{activeImage.caption} · {activeImage.category}</p><button type="button" onClick={() => moveImage(1)} className="min-h-11 rounded border border-white/40 px-4 hover:bg-white/10">Next →</button></div></div></div>}
    </Layout>
  );
};
