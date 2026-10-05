import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { ROUTES } from '@/routes/paths';
import { apiGetPublic, apiPost } from '@/lib/api';
import type { NoticeData } from '@/data/dashboard';
import { Check, ChevronLeft, Link2, ThumbsDown, ThumbsUp } from 'lucide-react';

// Code-split: editor package (viewer) loads only on this route.
const NewsContent = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsContent })));

type Vote = 'like' | 'dislike' | null;
const voteKey = (id: string) => `lwu_react_${id}`;

const plainExcerpt = (markdown: string, max = 160) => {
  const text = markdown
    .replace(/[#>*_`[\]()!-]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

export const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NoticeData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [vote, setVote] = useState<Vote>(null);
  const [counts, setCounts] = useState({ likeCount: 0, dislikeCount: 0 });
  const [voting, setVoting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      setStatus('missing');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    try {
      setVote((localStorage.getItem(voteKey(id)) as Vote) ?? null);
    } catch {
      /* private mode — voting still works, just not remembered */
    }
    apiGetPublic<NoticeData>(`/public-notices/${id}`)
      .then((res) => {
        if (!cancelled) {
          setArticle(res.data);
          setCounts({ likeCount: res.data.likeCount, dislikeCount: res.data.dislikeCount });
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

  const castVote = async (next: 'like' | 'dislike') => {
    if (!id || !article || voting) return;
    const previous = vote;
    const toggled: Vote = previous === next ? null : next;
    setVote(toggled);
    setCounts((c) => ({
      likeCount: Math.max(0, c.likeCount + (toggled === 'like' ? 1 : 0) - (previous === 'like' ? 1 : 0)),
      dislikeCount: Math.max(0, c.dislikeCount + (toggled === 'dislike' ? 1 : 0) - (previous === 'dislike' ? 1 : 0)),
    }));
    setVoting(true);
    try {
      const res = await apiPost<{ likeCount: number; dislikeCount: number }>(`/public-notices/${id}/react`, {
        reaction: toggled,
        previous,
      });
      setCounts({ likeCount: res.data.likeCount, dislikeCount: res.data.dislikeCount });
      try {
        if (toggled) localStorage.setItem(voteKey(id), toggled);
        else localStorage.removeItem(voteKey(id));
      } catch {
        /* ignore */
      }
    } catch {
      // Revert optimistic update on failure.
      setVote(previous);
      setCounts({ likeCount: article.likeCount, dislikeCount: article.dislikeCount });
    } finally {
      setVoting(false);
    }
  };

  const copyLink = async () => {
    // Copy the OG-preview URL so social bots can see the banner + title.
    // Human recipients are instantly redirected to the real article page.
    const rawApiUrl = (import.meta as any).env?.VITE_API_URL ?? 'https://api.learnwithuncletee.org';
    const origin = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    const shareUrl = id
      ? `${origin}/api/og/news/${id}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };


  return (
    <Layout>
      {status === 'ready' && article && (
        <PageMetadata
          title={article.title}
          description={article.description || plainExcerpt(article.body)}
          image={article.coverUrl ?? '/school.JPG'}
          type="article"
          publishedTime={article.createdAt}
          modifiedTime={article.updatedAt ?? article.createdAt}
          section={article.category}
          tags={article.category}
          author="Learnwithuncletee"
          jsonLd={[
            {
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              headline: article.title,
              description: article.description || plainExcerpt(article.body),
              image: [article.coverUrl ?? `${typeof window !== 'undefined' ? window.location.origin : ''}/school.JPG`],
              datePublished: article.createdAt,
              dateModified: article.updatedAt ?? article.createdAt,
              author: [{ '@type': 'Organization', name: 'Learnwithuncletee', url: 'https://learnwithuncletee.org' }],
              publisher: {
                '@type': 'Organization',
                name: 'Learnwithuncletee',
                logo: { '@type': 'ImageObject', url: 'https://learnwithuncletee.org/logo.png' },
              },
              url: typeof window !== 'undefined' ? window.location.href : '',
              articleSection: article.category,
              inLanguage: 'en-NG',
              isAccessibleForFree: true,
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://learnwithuncletee.org' },
                { '@type': 'ListItem', position: 2, name: 'News', item: 'https://learnwithuncletee.org/news' },
                { '@type': 'ListItem', position: 3, name: article.title, item: typeof window !== 'undefined' ? window.location.href : '' },
              ],
            },
          ]}
        />
      )}

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

                <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6" aria-label="React to this announcement">
                  <span className="mr-1 text-sm font-bold text-muted">Was this helpful?</span>
                  <button
                    type="button"
                    onClick={() => castVote('like')}
                    disabled={voting}
                    aria-pressed={vote === 'like'}
                    className={`inline-flex min-h-11 items-center gap-2 rounded border px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60 ${
                      vote === 'like'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-line bg-white text-ink hover:border-brand-500 hover:text-brand-700'
                    }`}
                  >
                    <ThumbsUp aria-hidden="true" size={16} /> {counts.likeCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => castVote('dislike')}
                    disabled={voting}
                    aria-pressed={vote === 'dislike'}
                    className={`inline-flex min-h-11 items-center gap-2 rounded border px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60 ${
                      vote === 'dislike'
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-line bg-white text-ink hover:border-rose-300 hover:text-rose-700'
                    }`}
                  >
                    <ThumbsDown aria-hidden="true" size={16} /> {counts.dislikeCount}
                  </button>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
                  >
                    {copied ? <Check aria-hidden="true" size={16} /> : <Link2 aria-hidden="true" size={16} />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>

                <Link to={ROUTES.news} className="mt-6 inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700">
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
