import { Link } from 'react-router-dom';
import { facilities } from '@/data/facilities';
import { galleryImages } from '@/data/gallery';
import { keyStats, testimonials, whyChooseUs } from '@/data/content';
import { newsArticles } from '@/data/news';
import { programmes } from '@/data/programmes';
import { services } from '@/data/services';
import { ROUTES } from '@/routes/paths';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatCard } from '@/components/ui/StatCard';
import { StarRating } from '@/components/ui/StarRating';

const SampleNote = () => <p className="mt-5 text-xs text-muted">Sample content and imagery shown for layout only. Please confirm with school management before publishing.</p>;

export const StatsStrip = () => (
  <section className="border-b border-line bg-white py-8">
    <Container>
      <div className="grid grid-cols-2 gap-y-6 md:grid-cols-5">
        {keyStats.map((stat) => <StatCard key={stat.id} item={stat} />)}
      </div>
      <SampleNote />
    </Container>
  </section>
);

export const WelcomeSection = () => (
  <section className="py-20 sm:py-24">
    <Container className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
      <div>
        <SectionHeading align="left" eyebrow="Welcome to our school" title="A place to learn, grow and belong" text="We bring academic learning, character development and a caring school community together so every learner can discover their potential." />
        <p className="mt-5 text-sm leading-relaxed text-muted">Learnwithuncletee welcomes families seeking a supportive environment where children are encouraged to think, create and build confidence. Our school community works in partnership with families at every stage of the learning journey.</p>
        <Link to={ROUTES.about} className="mt-7 inline-flex items-center gap-2 font-bold text-brand-700 hover:text-brand-500">Discover our story <span aria-hidden="true">→</span></Link>
      </div>
      <div className="relative">
        <img src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=85" alt="School building, sample image" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        <div className="absolute -bottom-5 left-4 max-w-xs border-l-4 border-lime-accent bg-white p-5 shadow-lg sm:left-8">
          <p className="text-lg font-bold text-brand-800">A welcoming community for every learner</p>
          <p className="mt-2 text-xs text-muted">Sample image. Replace with an approved school photograph.</p>
        </div>
      </div>
    </Container>
  </section>
);

export const ProgrammesSection = () => (
  <section className="bg-cream py-20 sm:py-24">
    <Container>
      <SectionHeading eyebrow="Learning pathways" title="A strong start at every stage" text="Explore the learning pathways available for children as they grow and prepare for what comes next." />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {programmes.map((programme, index) => (
          <article key={programme.id} className="group border border-line bg-white">
            <div className="relative">
              <img src={[
                'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80',
              ][index]} alt={`${programme.title}, sample image`} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              <span className="absolute bottom-3 left-3 bg-white px-3 py-1 text-xs font-bold text-brand-800">{programme.ageRange}</span>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{programme.level}</p>
              <h3 className="mt-2 text-xl font-extrabold text-ink">{programme.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{programme.description}</p>
              <Link to={ROUTES.academics} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700">Learn more <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        ))}
      </div>
      <SampleNote />
    </Container>
  </section>
);

export const WhyChooseUsSection = () => (
  <section className="py-20 sm:py-24">
    <Container>
      <SectionHeading eyebrow="Why families choose us" title="A school experience built around the whole child" text="Learning is strongest when students feel supported, challenged and part of a community." />
      <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {whyChooseUs.map((item) => <article key={item.id} className="flex gap-4 border-t border-line pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-brand-50 text-2xl" aria-hidden="true">{item.icon}</span>
          <div><h3 className="font-bold text-ink">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p></div>
        </article>)}
      </div>
      <SampleNote />
    </Container>
  </section>
);

export const ServicesSection = () => (
  <section className="bg-brand-50 py-20 sm:py-24">
    <Container>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading align="left" eyebrow="More than education" title="Support for school and beyond" text="Discover services designed to complement learning and support the wider school community." />
        <Link to={ROUTES.services} className="mb-1 inline-flex shrink-0 items-center font-bold text-brand-700">View all services <span className="ml-2">→</span></Link>
      </div>
      <div className="mt-10 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 3).map((service) => <article key={service.id} className="bg-white p-7">
          <span className="text-3xl" aria-hidden="true">{service.icon}</span>
          <h3 className="mt-5 text-xl font-extrabold text-ink">{service.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{service.summary}</p>
          <Link to={ROUTES.services} className="mt-5 inline-flex text-sm font-bold text-brand-700">Learn more <span className="ml-2">→</span></Link>
        </article>)}
      </div>
      <SampleNote />
    </Container>
  </section>
);

export const FacilitiesSection = () => (
  <section className="py-20 sm:py-24">
    <Container>
      <SectionHeading eyebrow="Our spaces" title="Room to learn, play and thrive" text="Take a first look at some of the spaces that can support a well-rounded school day." />
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {facilities.map((facility) => <article key={facility.id} className="border border-line p-5 sm:p-6">
          <span className="text-2xl" aria-hidden="true">{facility.icon}</span>
          <h3 className="mt-4 text-base font-bold text-ink">{facility.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted">{facility.description}</p>
        </article>)}
      </div>
      <SampleNote />
    </Container>
  </section>
);

export const StudentLifeSection = () => (
  <section className="bg-cream py-20 sm:py-24">
    <Container>
      <SectionHeading eyebrow="Student life" title="Every day is a chance to discover more" text="From teamwork to creative expression, student life makes room for connection, confidence and curiosity." />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          { title: 'Clubs & Societies', text: 'Find a community around interests, ideas and new skills.', img: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80' },
          { title: 'Sports & Recreation', text: 'Build teamwork, resilience and healthy habits through play.', img: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80' },
          { title: 'Culture & Creativity', text: 'Celebrate expression, heritage and the talents of our students.', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80' },
        ].map((item) => <article key={item.title} className="relative min-h-[330px] overflow-hidden bg-brand-900 text-white">
          <img src={item.img} alt={`${item.title}, sample image`} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/25 to-transparent" />
          <div className="absolute bottom-0 p-6"><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-lime-accent">Sample image</p><h3 className="text-2xl font-extrabold">{item.title}</h3><p className="mt-2 text-sm text-white/80">{item.text}</p></div>
        </article>)}
      </div>
      <div className="mt-7 text-center"><Link to={ROUTES.studentLife} className="font-bold text-brand-700">Explore student life <span aria-hidden="true">→</span></Link></div>
    </Container>
  </section>
);

export const NewsSection = () => (
  <section className="py-20 sm:py-24">
    <Container>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading align="left" eyebrow="From our community" title="Latest news & events" text="Updates and highlights from across the school community." />
        <Link to={ROUTES.news} className="mb-1 inline-flex shrink-0 items-center font-bold text-brand-700">All news <span className="ml-2">→</span></Link>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {newsArticles.slice(0, 3).map((article) => <article key={article.id} className="border-b border-line pb-5">
          <img src={article.image} alt={`${article.title}, sample image`} loading="lazy" className="aspect-[16/10] w-full object-cover" />
          <div className="mt-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-brand-700"><span>{article.category}</span><time dateTime={article.date} className="font-medium text-muted">{new Date(article.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</time></div>
          <h3 className="mt-2 text-xl font-extrabold text-ink">{article.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{article.excerpt}</p>
          <Link to={ROUTES.news} className="mt-4 inline-flex text-sm font-bold text-brand-700">Read more <span className="ml-2">→</span></Link>
        </article>)}
      </div>
      <SampleNote />
    </Container>
  </section>
);

export const GalleryPreviewSection = () => (
  <section className="bg-brand-900 py-20 text-white sm:py-24">
    <Container>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="text-xs font-bold uppercase tracking-widest text-lime-accent">A look around</p><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Moments from school life</h2><p className="mt-3 max-w-xl text-sm text-white/70">Sample photographs shown for layout. Replace with approved school images.</p></div>
        <Link to={ROUTES.gallery} className="inline-flex items-center font-bold text-lime-accent hover:text-white">View full gallery <span className="ml-2">→</span></Link>
      </div>
      <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4">
        {galleryImages.slice(0, 4).map((image, index) => <Link to={ROUTES.gallery} key={image.id} className={`group relative overflow-hidden ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
          <img src={image.color} alt={image.caption} loading="lazy" className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${index === 0 ? 'aspect-square h-full' : 'aspect-[4/3]'}`} />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-sm font-semibold">{image.category}</span>
        </Link>)}
      </div>
    </Container>
  </section>
);

export const TestimonialsSection = () => (
  <section className="py-20 sm:py-24">
    <Container>
      <SectionHeading eyebrow="Community voices" title="A school community that cares" text="Placeholder testimonials for visual layout only. Replace with approved, permissioned quotes before launch." />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => <figure key={item.id} className="border border-line bg-white p-6">
          <StarRating />
          <blockquote className="mt-4 text-base leading-relaxed text-ink">“{item.quote}”</blockquote>
          <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{item.initials}</span>
            <span><strong className="block text-sm">{item.name}</strong><span className="text-xs text-muted">Sample {item.role} quote</span></span>
          </figcaption>
        </figure>)}
      </div>
    </Container>
  </section>
);
