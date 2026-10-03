import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { ROUTES } from '@/routes/paths';
import { apiGetPublic } from '@/lib/api';
import type { NoticeData } from '@/data/dashboard';
import { ChevronLeft } from 'lucide-react';

// Code-split: editor package (viewer) loads only on this route.
const NewsContent = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsContent })));

export const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NoticeData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    if (!id) {
      setStatus('missing');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    apiGetPublic<NoticeData>(`/public-notices/${id}`)
      .then((res) => {
        if (!cancelled) {
          setArticle(res.data);
          setStatus('ready');
        }
      })
      .catch((e: any) => {
        if (!cancelled) setStatus(e?.status === 404 ? 'missing' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Layout>
      {status === 'loading' && (
        <Container>
          <div className="animate-pulse py-14" aria-label="Loading">
            <div className="h-6 w-64 bg-brand-50" />
            <div className="mt-4 h-72 bg-brand-50" />
            <div className="mx-auto mt-8 max-w-3xl space-y-3">
              <div className="h-8 w-3/4 bg-brand-50" />
              <div className="h-4 w-full bg-brand-50" />
              <div className="h-4 w-5/6 bg-brand-50" />
            </div>
          </div>
        </Container>
      )}

      {(status === 'missing' || status === 'error') && (
        <Container>
          <div className="mx-auto max-w-2xl py-20 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Not available</p>
            <h1 className="mt-3 text-3xl font-extrabold">
              {status === 'missing' ? 'This announcement is unavailable' : 'Could not load this announcement'}
            </h1>
            <p className="mt-3 text-muted">
              {status === 'missing'
                ? 'It may have been removed or hidden by the school.'
                : 'Check your connection and try again.'}
            </p>
            <Link to={ROUTES.news} className="mt-6 inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back to News
            </Link>
          </div>
        </Container>
      )}

      {status === 'ready' && article && (
        <>
          <section
            className="relative isolate flex min-h-[320px] items-end overflow-hidden bg-brand-900 py-14 text-white sm:min-h-[400px]"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(4,58,33,.92), rgba(4,58,33,.52)), url(${article.coverUrl ?? '/school.JPG'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <Container className="relative">
              <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/70">
                <Link to={ROUTES.home} className="hover:text-white">Home</Link>
                <span className="px-2">/</span>
                <Link to={ROUTES.news} className="hover:text-white">News</Link>
                <span className="px-2">/</span>
                <span className="text-white" aria-current="page">{article.title}</span>
              </nav>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-lime-accent">{article.category}</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">{article.title}</h1>
                {article.description && (
                  <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/85">
                    {article.description}
                  </p>
                )}
              <p className="mt-3 text-sm text-white/70">
                <time dateTime={article.createdAt}>
                  {new Date(article.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              </p>
            </Container>
          </section>

          <section className="py-12">
            <Container>
              <div className="mx-auto max-w-3xl">
           
                <div className="mt-6">
                  <Suspense fallback={<div className="h-40 animate-pulse bg-brand-50" aria-label="Loading content" />}>
                    <NewsContent markdown={article.body} />
                  </Suspense>
                </div>
                <Link to={ROUTES.news} className="mt-10 inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700">
                  <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> All announcements
                </Link>
              </div>
            </Container>
          </section>
        </>
      )}
    </Layout>
  );
};
