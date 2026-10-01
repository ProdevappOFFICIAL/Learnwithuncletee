import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SampleNotice } from '@/components/ui/SampleNotice';
import { newsArticles } from '@/data/news';
import type { NewsArticle } from '@/types';
import { ChevronRight } from 'lucide-react';

const filters = ['All', 'News', 'Events', 'Announcements', 'Academic', 'Sports', 'Cultural'] as const;
type NewsFilter = (typeof filters)[number];

const NewsCard = ({ article }: { article: NewsArticle }) => (
  <article className="border-b border-line pb-6">
    <img src={article.image} alt={`${article.title}, sample image`} loading="lazy" className="aspect-[16/10] w-full object-cover" />
    <div className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="font-bold uppercase tracking-widest text-brand-700">{article.category}</span><time dateTime={article.date} className="text-muted">{new Date(article.date).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</time></div>
    <h2 className="mt-2 text-xl font-extrabold">{article.title}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{article.excerpt}</p>
    <span className="mt-4 inline-flex items-center text-sm font-bold text-brand-700">Article coming soon <ChevronRight aria-hidden="true" className="ml-2" size={16} /></span>
  </article>
);

export const NewsPage = () => {
  const [filter, setFilter] = useState<NewsFilter>('All');
  const list = filter === 'All' ? newsArticles : newsArticles.filter((article) => article.category === filter);

  return (
    <Layout>
      <PageHero eyebrow="From our community" title="News & Events" text="School updates, upcoming moments and stories from our learning community." image="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=85" />
      <section className="py-14 sm:py-18"><Container><div className="flex flex-wrap gap-2" role="group" aria-label="Filter news by category">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`min-h-10 rounded px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-brand-700 text-white' : 'border border-line text-muted hover:border-brand-500 hover:text-brand-700'}`}>{item}</button>)}</div><div className="mt-9 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{list.map((article) => <NewsCard key={article.id} article={article} />)}</div>{list.length === 0 && <p className="py-16 text-center text-muted">No updates in this category yet.</p>}<div className="mt-7"><SampleNotice>Articles and dates are examples for layout only. Replace with approved school updates.</SampleNotice></div></Container></section>
      <section className="bg-cream py-14"><Container className="grid gap-8 md:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Calendar</p><h2 className="mt-2 text-2xl font-extrabold">Upcoming events</h2><p className="mt-3 text-sm text-muted">Official dates and event details will be added when confirmed by the school.</p></div><div className="border-t border-line pt-4"><p className="text-sm font-semibold text-ink">No confirmed upcoming events are published yet.</p><p className="mt-2 text-xs text-muted">Check back for the current school calendar.</p></div></Container></section>
    </Layout>
  );
};
