import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SiteIcon, SiteImage, SiteLink, SiteText, useSiteGallery, useSitePage, useSiteTestimonials } from '@/site/SiteContent';
import { ROUTES } from '@/routes/paths';
import { apiGetPublic } from '@/lib/api';

const fallbackGallery = [
  { id: 'g1', url: '/school.JPG', caption: 'School campus', category: 'Campus' },
  { id: 'g2', url: '/academics.jpeg', caption: 'Classroom learning', category: 'Academics' },
  { id: 'g3', url: '/students_playing_games.jfif', caption: 'Sports day', category: 'Sports' },
  { id: 'g4', url: '/events.jfif', caption: 'School event', category: 'Events' },
];

const SectionHead = ({
  page,
  base,
  align = 'center',
}: {
  page: any;
  base: string;
  align?: 'center' | 'left';
}) => (
  <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
    <SiteText path={`${base}.eyebrow`} value={page.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
    <SiteText path={`${base}.title`} value={page.title} as="h2" className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl" />
    <SiteText path={`${base}.text`} value={page.text} as="p" className="mt-3 text-muted" multiline />
  </div>
);

export const StatsStrip = () => {
  const home = useSitePage<any>('home');
  return (
    <section className="border-b border-line bg-white py-8">
      <Container>
        <div className="grid grid-cols-2 gap-y-6 md:grid-cols-5">
          {(home.stats ?? []).map((stat: any, index: number) => (
            <div key={stat.id ?? index} className="text-center">
              <SiteText path={`home.stats.${index}.value`} value={stat.value} as="p" className="font-display text-3xl font-extrabold text-brand-700" />
              <SiteText path={`home.stats.${index}.label`} value={stat.label} as="p" className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export const WelcomeSection = () => {
  const home = useSitePage<any>('home');
  const welcome = home.welcome ?? {};
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <SectionHead page={welcome} base="home.welcome" align="left" />
          <SiteText path="home.welcome.body" value={welcome.body} as="p" className="mt-5 text-sm leading-relaxed text-muted" multiline />
          <SiteLink path="home.welcome.link" to={welcome.linkTo ?? ROUTES.about} label={welcome.linkLabel ?? 'Discover our story'} className="mt-7 inline-flex items-center gap-2 font-bold text-brand-700 hover:text-brand-500">
            {welcome.linkLabel ?? 'Discover our story'} <ChevronRight aria-hidden="true" size={16} />
          </SiteLink>
        </div>
        <div className="relative">
          <SiteImage path="home.welcome.image" src={welcome.image} alt="School building" className="aspect-[4/3] w-full border-8 border-lime-accent object-cover" />
          <div className="absolute -bottom-5 left-4 max-w-xs border-l-4 border-lime-accent bg-white p-5 shadow-lg sm:left-8">
            <SiteText path="home.welcome.caption" value={welcome.caption} as="p" className="text-lg font-bold text-brand-800" />
            <SiteText path="home.welcome.captionText" value={welcome.captionText} as="p" className="mt-2 text-xs text-muted" />
          </div>
        </div>
      </Container>
    </section>
  );
};

export const ProgrammesSection = () => {
  const home = useSitePage<any>('home');
  const block = home.programmes ?? {};
  return (
    <section className="bg-cream py-20 shadow-lg sm:py-24">
      <Container>
        <SectionHead page={block} base="home.programmes" />
        <div className="mt-12 grid gap-6">
          {(block.items ?? []).map((programme: any, index: number) => (
            <article key={programme.id ?? index} className="group border border-line bg-white">
              <div className="relative">
                <SiteImage path={`home.programmes.items.${index}.image`} src={programme.image} alt={`${programme.title} learning`} className="aspect-[16/10] w-full rounded-3xl object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                <span className="absolute bottom-3 left-3 bg-white px-3 py-1 text-xs font-bold text-brand-800">
                  <SiteText path={`home.programmes.items.${index}.ageRange`} value={programme.ageRange} />
                </span>
              </div>
              <div className="p-6">
                <SiteText path={`home.programmes.items.${index}.level`} value={programme.level} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-600" />
                <SiteText path={`home.programmes.items.${index}.title`} value={programme.title} as="h3" className="mt-2 text-xl font-extrabold text-ink" />
                <SiteText path={`home.programmes.items.${index}.description`} value={programme.description} as="p" className="mt-3 text-sm leading-relaxed text-muted" multiline />
                <SiteLink path={`home.programmes.items.${index}.link`} to={ROUTES.academics} label="Learn more" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
                  Learn more <ChevronRight aria-hidden="true" size={16} />
                </SiteLink>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
};

export const WhyChooseUsSection = () => {
  const home = useSitePage<any>('home');
  const block = home.whyChooseUs ?? {};
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHead page={block} base="home.whyChooseUs" />
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {(block.items ?? []).map((item: any, index: number) => (
            <article key={item.id ?? index} className="flex gap-4 border-t border-line pt-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-brand-50 text-brand-700" aria-hidden="true"><SiteIcon name={item.icon} /></span>
              <div>
                <SiteText path={`home.whyChooseUs.items.${index}.title`} value={item.title} as="h3" className="font-bold text-ink" />
                <SiteText path={`home.whyChooseUs.items.${index}.text`} value={item.text} as="p" className="mt-2 text-sm leading-relaxed text-muted" multiline />
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
};

export const ServicesSection = () => {
  const home = useSitePage<any>('home');
  const block = home.services ?? {};
  return (
    <section className="bg-brand-50 py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <SectionHead page={block} base="home.services" align="left" />
          <SiteLink path="home.services.link" to={block.linkTo ?? ROUTES.services} label={block.linkLabel ?? 'View all services'} className="mb-1 inline-flex shrink-0 items-center font-bold text-brand-700">
            {block.linkLabel ?? 'View all services'} <ChevronRight aria-hidden="true" size={16} />
          </SiteLink>
        </div>
        <div className="mt-10 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {(block.items ?? []).map((service: any, index: number) => (
            <article key={service.id ?? index} className="bg-white p-7">
              <SiteIcon name={service.icon} size={28} className="text-brand-700" />
              <SiteText path={`home.services.items.${index}.title`} value={service.title} as="h3" className="mt-5 text-xl font-extrabold text-ink" />
              <SiteText path={`home.services.items.${index}.summary`} value={service.summary} as="p" className="mt-2 text-sm leading-relaxed text-muted" multiline />
              <SiteLink path={`home.services.items.${index}.link`} to={ROUTES.services} label="Learn more" className="mt-5 inline-flex items-center text-sm font-bold text-brand-700">
                Learn more <ChevronRight aria-hidden="true" size={16} />
              </SiteLink>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
};

export const FacilitiesSection = () => {
  const home = useSitePage<any>('home');
  const block = home.facilities ?? {};
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHead page={block} base="home.facilities" />
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(block.items ?? []).map((facility: any, index: number) => (
            <article key={facility.id ?? index} className="border border-line p-5 sm:p-6">
              <SiteIcon name={facility.icon} size={24} className="text-brand-700" />
              <SiteText path={`home.facilities.items.${index}.title`} value={facility.title} as="h3" className="mt-4 text-base font-bold text-ink" />
              <SiteText path={`home.facilities.items.${index}.description`} value={facility.description} as="p" className="mt-2 text-xs leading-relaxed text-muted" multiline />
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
};

export const StudentLifeSection = () => {
  const home = useSitePage<any>('home');
  const block = home.studentLife ?? {};
  if (!block.enabled) return null;
  return (
    <section className="bg-cream py-20 sm:py-24">
      <Container>
        <SectionHead page={block} base="home.studentLife" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {(block.items ?? []).map((item: any, index: number) => (
            <article key={item.title ?? index} className="relative min-h-[330px] overflow-hidden bg-brand-900 text-white">
              <SiteImage path={`home.studentLife.items.${index}.image`} src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/25 to-transparent" />
              <div className="absolute bottom-0 p-6">
                <SiteText path={`home.studentLife.items.${index}.title`} value={item.title} as="h3" className="text-2xl font-extrabold" />
                <SiteText path={`home.studentLife.items.${index}.text`} value={item.text} as="p" className="mt-2 text-sm text-white/80" multiline />
              </div>
            </article>
          ))}
        </div>
        <div className="mt-7 text-center">
          <SiteLink path="home.studentLife.link" to={block.linkTo ?? ROUTES.studentLife} label={block.linkLabel ?? 'Explore student life'} className="inline-flex items-center gap-1 font-bold text-brand-700">
            {block.linkLabel ?? 'Explore student life'} <ChevronRight aria-hidden="true" size={16} />
          </SiteLink>
        </div>
      </Container>
    </section>
  );
};

export const NewsSection = () => {
  const home = useSitePage<any>('home');
  const block = home.news ?? {};
  const news = useQuery({
    queryKey: ['home-news', block.limit ?? 3],
    queryFn: async () => (await apiGetPublic<any[]>('/public-notices', { limit: block.limit ?? 3 })).data,
    staleTime: 2 * 60_000,
  });
  const articles = (news.data ?? []).slice(0, block.limit ?? 3);
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <SectionHead page={block} base="home.news" align="left" />
          <SiteLink path="home.news.link" to={block.linkTo ?? ROUTES.news} label={block.linkLabel ?? 'All news'} className="mb-1 inline-flex shrink-0 items-center font-bold text-brand-700">
            {block.linkLabel ?? 'All news'} <ChevronRight aria-hidden="true" size={16} />
          </SiteLink>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.map((article: any) => (
            <article key={article.id} className="border-b border-line pb-5">
              <img src={article.coverUrl ?? '/school.JPG'} alt={article.title} loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <div className="mt-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-brand-700">
                <span>{article.category}</span>
                <time dateTime={article.createdAt} className="font-medium text-muted">{new Date(article.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
              </div>
              <h3 className="mt-2 text-xl font-extrabold text-ink">{article.title}</h3>
              {article.description && <p className="mt-2 text-sm leading-relaxed text-muted">{article.description}</p>}
              <Link to={`/news/${article.id}`} className="mt-4 inline-flex items-center text-sm font-bold text-brand-700">Read more <ChevronRight aria-hidden="true" size={16} /></Link>
            </article>
          ))}
        </div>
        {!news.isPending && !articles.length && (
          <p className="mt-8 text-center text-sm text-muted">No news has been published yet.</p>
        )}
      </Container>
    </section>
  );
};

export const GalleryPreviewSection = () => {
  const home = useSitePage<any>('home');
  const block = home.gallery ?? {};
  const remote = useSiteGallery();
  const images = remote.length ? remote : fallbackGallery;
  return (
    <section className="bg-brand-900 py-20 text-white sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <SiteText path="home.gallery.eyebrow" value={block.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-lime-accent" />
            <SiteText path="home.gallery.title" value={block.title} as="h2" className="mt-3 text-3xl font-extrabold sm:text-4xl" />
            <SiteText path="home.gallery.text" value={block.text} as="p" className="mt-3 max-w-xl text-sm text-white/70" multiline />
          </div>
          <SiteLink path="home.gallery.link" to={block.linkTo ?? ROUTES.gallery} label={block.linkLabel ?? 'View full gallery'} className="inline-flex items-center font-bold text-lime-accent hover:text-white">
            {block.linkLabel ?? 'View full gallery'} <ChevronRight aria-hidden="true" size={16} />
          </SiteLink>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4">
          {images.slice(0, block.limit ?? 4).map((image: any, index: number) => (
            <Link to={ROUTES.gallery} key={image.id ?? index} className={`group relative overflow-hidden ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
              <img src={image.url ?? image.color} alt={image.caption ?? ''} loading="lazy" className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${index === 0 ? 'aspect-square h-full' : 'aspect-[4/3]'}`} />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-sm font-semibold">{image.category}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};

export const TestimonialsSection = () => {
  const home = useSitePage<any>('home');
  const block = home.testimonials ?? {};
  const remote = useSiteTestimonials();
  const items = remote;
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHead page={block} base="home.testimonials" />
        {items.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {items.map((item: any) => (
              <figure key={item.id} className="border border-line bg-white p-6">
                <div className="text-amber-500" aria-label={`${item.rating ?? 5} out of 5 stars`}>{'★'.repeat(item.rating ?? 5)}</div>
                <blockquote className="mt-4 text-base leading-relaxed text-ink">“{item.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                      {String(item.name ?? '?').split(' ').map((part: string) => part[0]).slice(0, 2).join('')}
                    </span>
                  )}
                  <span><strong className="block text-sm">{item.name}</strong><span className="text-xs text-muted">{item.role}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-muted">No testimonials have been added yet.</p>
        )}
      </Container>
    </section>
  );
};
