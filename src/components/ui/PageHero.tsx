import { Link } from 'react-router-dom';
import { Container } from './Container';
import { PageMetadata } from './PageMetadata';
import { SiteText, useSitePageEdit } from '@/site/SiteContent';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  text: string;
  image?: string;
  /** Content paths used by the visual customization preview. */
  paths?: { eyebrow?: string; title?: string; text?: string; image?: string };
}

export const PageHero = ({ eyebrow, title, text, image, paths }: PageHeroProps) => {
  const edit = useSitePageEdit();
  return (
  <section
    className="relative isolate flex min-h-[360px] items-end overflow-hidden bg-brand-900 py-16 text-white sm:min-h-[420px]"
    style={image ? { backgroundImage: `linear-gradient(90deg, rgba(4,58,33,.92), rgba(4,58,33,.52)), url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
  >
    <PageMetadata title={title} description={text} />
    {edit.editMode && (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          edit.emit(paths?.image ?? 'hero.image', 'image', image ?? '');
        }}
        className="absolute right-4 top-4 z-10 rounded border border-brand-300 bg-white/95 px-3 py-2 text-xs font-bold text-brand-800 shadow"
      >
        Change hero image
      </button>
    )}
    {!image && <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_10%,rgba(183,227,107,.27),transparent_40%),linear-gradient(120deg,#043a21,#0b6b3a_58%,#16a05d)]" />}
    <Container className="relative">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/70">
        <Link to="/" className="hover:text-white">Home</Link><span className="px-2">/</span><span className="text-white">{title}</span>
      </nav>
      <SiteText path={paths?.eyebrow ?? 'hero.eyebrow'} value={eyebrow} as="p" className="text-xs font-bold uppercase tracking-[.18em] text-lime-accent" />
      <SiteText path={paths?.title ?? 'hero.title'} value={title} as="h1" className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl" />
      <SiteText path={paths?.text ?? 'hero.text'} value={text} as="p" className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg" multiline />
    </Container>
  </section>
  );
};
