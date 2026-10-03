import { Suspense, lazy } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, EmptyState, LoadingSkeleton, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { ROUTES } from '@/routes/paths';
import type { NoticeData } from '@/data/dashboard';
import { ChevronLeft, EyeOff } from 'lucide-react';

// Code-split: viewer chunk shared with the public detail page.
const NewsContent = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsContent })));

interface DraftPreview {
  title: string;
  description: string;
  body: string;
  category: string;
  coverUrl: string;
}

const DRAFT_KEY = 'lwu_news_draft';

const readSessionDraft = (): (DraftPreview & { editingId?: string }) | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftPreview) : null;
  } catch {
    return null;
  }
};

interface PreviewModel {
  title: string;
  description?: string | null;
  body: string;
  category: string;
  coverUrl?: string | null;
  createdAt?: string;
  isPublished?: boolean;
  saved: boolean;
}

const PreviewArticle = ({ model, savedLabel }: { model: PreviewModel; savedLabel: React.ReactNode }) => (
  <div className="space-y-6">
    <section
      className="relative isolate overflow-hidden rounded bg-brand-900 p-6 text-white sm:p-8"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(4,46,26,.94) 0%, rgba(4,58,33,.72) 55%, rgba(4,58,33,.28) 100%), url(${model.coverUrl || '/school.JPG'})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="ink">{model.category}</Pill>
          {savedLabel}
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          {model.title || <span className="text-white/50">Untitled announcement</span>}
        </h2>
        {model.createdAt && (
          <p className="mt-2 text-xs text-white/70">{new Date(model.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
      </div>
    </section>

    <Card className="p-5 sm:p-8">
      <div className="mx-auto max-w-3xl">
        {model.description ? (
          <p className="border-l-2 border-brand-500 pl-4 text-lg font-semibold leading-relaxed text-ink">{model.description}</p>
        ) : (
          <p className="border-l-2 border-line pl-4 text-sm italic text-muted">No description added.</p>
        )}
        <div className="mt-6">
          {model.body.trim() ? (
            <Suspense fallback={<LoadingSkeleton rows={5} />}>
              <NewsContent markdown={model.body} />
            </Suspense>
          ) : (
            <EmptyState message="No content written yet." />
          )}
        </div>
      </div>
    </Card>
  </div>
);

export const AdminNewsPreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const state = (location.state ?? {}) as { draft?: DraftPreview; id?: string };

  const draft: DraftPreview | null = state.draft ?? readSessionDraft();
  const id: string | null = state.id ?? params.get('id');

  const { data, loading } = useResource<NoticeData[]>('/notices');
  const existing = id ? (data ?? []).find((n) => n.id === id) ?? null : null;

  const back = () => navigate(ROUTES.adminNews);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communications · Preview"
        title="Announcement preview"
        text="Exactly how this will look on the public News page. Nothing here is published."
        actions={
          <button type="button" onClick={back} className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700">
            <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back to editor
          </button>
        }
      />

      {!id && draft && (
        <PreviewArticle
          model={{ ...draft, saved: false }}
          savedLabel={
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800">
              <EyeOff aria-hidden="true" size={12} /> Draft — not published
            </span>
          }
        />
      )}

      {id && (
        <>
          {loading ? (
            <LoadingSkeleton rows={6} />
          ) : existing ? (
            <PreviewArticle
              model={{ ...existing, saved: true }}
              savedLabel={
                existing.isPublished ? (
                  <Pill tone="emerald">Published</Pill>
                ) : (
                  <Pill tone="amber">Hidden</Pill>
                )
              }
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="font-display text-lg font-extrabold">Announcement not found</p>
              <p className="mt-2 text-sm text-muted">It may have been deleted. Return to the list and try again.</p>
              <button type="button" onClick={back} className="mt-4 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
                Back to News
              </button>
            </Card>
          )}
        </>
      )}

      {!id && !draft && (
        <Card className="p-8 text-center">
          <p className="font-display text-lg font-extrabold">Nothing to preview</p>
          <p className="mt-2 text-sm text-muted">Write an announcement first, or open Preview from an existing post.</p>
          <button type="button" onClick={back} className="mt-4 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            Back to News
          </button>
        </Card>
      )}
    </div>
  );
};
