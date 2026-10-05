import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { heroSlides } from '@/data/heroSlides';
import { Container } from '@/components/ui/Container';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Hero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const touchStartX = useRef<number | null>(null);
  const slide = heroSlides[activeIndex];

  useEffect(() => {
    heroSlides.forEach((item) => {
      const image = new Image();
      image.src = item.image;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % heroSlides.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const showSlide = (index: number) => setActiveIndex((index + heroSlides.length) % heroSlides.length);

  return (
    <section
      className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-brand-900 text-white sm:min-h-[680px]"
      aria-roledescription="carousel"
      aria-label="School highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) return;
        const endX = event.changedTouches[0]?.clientX;
        if (endX !== undefined && Math.abs(endX - touchStartX.current) > 45) showSlide(activeIndex + (endX < touchStartX.current ? 1 : -1));
        touchStartX.current = null;
      }}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <PageMetadata title="Nurturing Future Leaders" description="Academic excellence, strong character and a supportive environment for every learner at Learnwithuncletee." />
      {heroSlides.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 -z-10 transition-opacity duration-700 ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden="true"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(4,46,26,.92) 0%, rgba(4,58,33,.72) 48%, rgba(4,58,33,.20) 100%), url(${item.image})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
        />
      ))}
      <Container className="relative pb-20 pt-16 sm:pb-24">
        <div key={slide.id} className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-accent">{slide.eyebrow}</p>
          <h1 className="mt-5 max-w-2xl text-5xl font-extrabold leading-[1.04] sm:text-6xl lg:text-7xl">{slide.title}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{slide.text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={slide.primaryCta.to} className="inline-flex min-h-12 items-center rounded bg-lime-accent px-6 py-3 text-sm font-bold text-brand-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{slide.primaryCta.label}<ChevronRight aria-hidden="true" className="ml-2" size={16} /></Link>
            {slide.secondaryCta && <Link to={slide.secondaryCta.to} className="inline-flex min-h-12 items-center rounded border border-white/60 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">{slide.secondaryCta.label}</Link>}
          </div>
        </div>
        <div className="absolute bottom-7 left-5 flex items-center gap-3 sm:left-8" aria-label="Carousel controls">
          <button type="button" onClick={() => showSlide(activeIndex - 1)} aria-label="Previous slide" className="flex h-10 w-10 items-center justify-center rounded border border-white/40 hover:bg-white/15"><ChevronLeft aria-hidden="true" size={18} /></button>
          {heroSlides.map((item, index) => <button key={item.id} type="button" onClick={() => showSlide(index)} aria-label={`Show slide ${index + 1}`} aria-current={index === activeIndex} className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-9 bg-lime-accent' : 'w-2.5 bg-white/60 hover:bg-white'}`} />)}
          <button type="button" onClick={() => showSlide(activeIndex + 1)} aria-label="Next slide" className="flex h-10 w-10 items-center justify-center rounded border border-white/40 hover:bg-white/15"><ChevronRight aria-hidden="true" size={18} /></button>
            </div>
      </Container>
    </section>
  );
};
