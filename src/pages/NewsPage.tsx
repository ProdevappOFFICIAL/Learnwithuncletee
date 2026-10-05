import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { apiGetPublic } from '@/lib/api';
import type { NoticeData } from '@/data/dashboard';
import { ChevronRight } from 'lucide-react';

const filters = ['All', 'Announcement', 'Academic', 'Sports', 'Cultural', 'Events', 'News'] as const;
type NewsFilter = (typeof filters)[number];

const NewsCard = ({ article }: { article: NoticeData }) => (
  <Link to={`/news/${article.id}`} className="group block border-b border-line pb-6">
    <img
      src={article.coverUrl ?? '/school.JPG'}
      alt={article.title}
      loading="lazy"
      className="aspect-[16/10] w-full object-cover"
    />
    <div className="mt-4 flex items-center justify-between gap-3 text-xs">
      <span className="font-bold uppercase tracking-widest text-brand-700">{article.category}</span>
      <time dateTime={article.createdAt} className="text-muted">
        {new Date(article.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
      </time>
    </div>
    <h2 className="mt-2 text-xl font-extrabold group-hover:text-brand-700">{article.title}</h2>
    {article.description && <p className="mt-2 text-sm leading-relaxed text-muted">{article.description}</p>}
    <span className="mt-4 inline-flex items-center text-sm font-bold text-brand-700">
      Read more <ChevronRight aria-hidden="true" className="ml-2" size={16} />
    </span>
  </Link>
);

export const NewsPage = () => {
  const [filter, setFilter] = useState<NewsFilter>('All');
  const [articles, setArticles] = useState<NoticeData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetPublic<NoticeData[]>('/public-notices', { limit: 50 })
      .then((res) => {
        if (!cancelled) setArticles(res.data);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Could not load news');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = (articles ?? []).filter((a) => filter === 'All' || a.category === filter);

  return (
    <Layout>
      <PageMetadata
        title="News & Events"
        description="School updates, upcoming moments and stories from the Learnwithuncletee learning community."
        image="/school.JPG"
        type="website"
        author="Learnwithuncletee"
        robots="index, follow, max-image-preview:large, max-snippet:-1"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'News & Events — Learnwithuncletee',
            description: 'School updates, upcoming moments and stories from the Learnwithuncletee learning community.',
            url: 'https://learnwithuncletee.org/news',
            publisher: {
              '@type': 'Organization',
              name: 'Learnwithuncletee',
              logo: { '@type': 'ImageObject', url: 'https://learnwithuncletee.org/logo.png' },
            },
            ...(articles && articles.length > 0
              ? {
                  mainEntity: {
                    '@type': 'ItemList',
                    itemListElement: articles.slice(0, 10).map((a, i) => ({
                      '@type': 'ListItem',
                      position: i + 1,
                      url: `https://learnwithuncletee.org/news/${a.id}`,
                      name: a.title,
                    })),
                  },
                }
              : {}),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://learnwithuncletee.org' },
              { '@type': 'ListItem', position: 2, name: 'News & Events', item: 'https://learnwithuncletee.org/news' },
            ],
          },
        ]}
      />
      <PageHero eyebrow="From our community" title="News & Events" text="School updates, upcoming moments and stories from our learning community." image="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=85" />
      <section className="py-14 sm:py-18">
        <Container>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter news by category">
            {filters.map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`min-h-10 rounded px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-brand-700 text-white' : 'border border-line text-muted hover:border-brand-500 hover:text-brand-700'}`}>
                {item}
              </button>
            ))}
          </div>
          {error ? (
            <p role="alert" className="mt-9 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}. Is the API running?</p>
          ) : articles === null ? (
            <div className="mt-9 grid gap-7 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading">
              {[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse bg-brand-50" />)}
            </div>
          ) : (
            <>
              <div className="mt-9 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((article) => <NewsCard key={article.id} article={article} />)}
              </div>
              {list.length === 0 && <p className="py-16 text-center text-muted">No updates in this category yet.</p>}
            </>
          )}
        </Container>
      </section>
      <section className="bg-cream py-14"><Container className="grid gap-8 md:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Calendar</p><h2 className="mt-2 text-2xl font-extrabold">Upcoming events</h2><p className="mt-3 text-sm text-muted">Official dates and event details will be added when confirmed by the school.</p></div><div className="border-t border-line pt-4"><p className="text-sm font-semibold text-ink">No confirmed upcoming events are published yet.</p><p className="mt-2 text-xs text-muted">Check back for the current school calendar.</p></div></Container></section>
    </Layout>
  );
};
