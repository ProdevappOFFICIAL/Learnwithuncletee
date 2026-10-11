import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import type { MaterialItem } from '@/data/dashboard';

const formatSize = (bytes?: number | null) => {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const StudentMaterialsPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useResource<MaterialItem[]>('/materials/mine', {
    search: query || undefined,
    limit: 100,
  });

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Study"
        title="Materials"
        text="Download study packs for your class, plus files shared with every student."
      />

      <Card>
        <CardHead title="Study materials" sub={`${rows.length} file(s)`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or description…"
            aria-label="Search materials"
            className="min-h-11 w-full max-w-xs rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={query ? 'No materials match your search.' : 'No materials shared yet. Check back soon.'} /></div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={m.class ? 'emerald' : 'violet'}>{m.class?.name ?? 'All classes'}</Pill>
                      {m.fileName && <Pill tone="sky">{m.fileName.split('.').pop()?.toUpperCase() ?? 'FILE'}</Pill>}
                      {m.sizeBytes ? <span className="text-xs text-muted">{formatSize(m.sizeBytes)}</span> : null}
                      <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="mt-1 font-display text-sm font-extrabold">{m.name}</h4>
                    {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
                  </div>
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={m.fileName ?? true}
                    className="inline-flex shrink-0 items-center rounded bg-brand-900 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
