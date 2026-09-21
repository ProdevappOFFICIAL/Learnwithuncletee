import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/Badge';
import { resourceItems } from '@/data/content';

const filters = ['All', 'Primary', 'Secondary', 'General'] as const;

export const ResourcesPage = () => {
  const [active, setActive] = useState<(typeof filters)[number]>('All');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    return resourceItems.filter((r) => {
      const matchLevel = active === 'All' || r.level === active;
      const matchQuery = r.title.toLowerCase().includes(query.toLowerCase());
      return matchLevel && matchQuery;
    });
  }, [active, query]);

  return (
    <Layout>
      <section className="bg-violet-50/70 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Badge tone="violet">📦 Resource Hub</Badge>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Instant downloads, zero stress.</h1>
          <p className="mt-3 max-w-xl text-lg text-slate-600">Worksheets, lecture notes and past papers — filter by level and download.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search worksheets, notes, past papers…"
              className="w-full max-w-md rounded-full border border-slate-200 bg-white px-5 py-3 text-sm focus:border-violet-400 focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${active === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border hover:border-slate-900'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <article key={r.id} className="group rounded-3xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">{r.category}</span>
              <span className="text-xs font-semibold text-slate-500">{r.format} • ⬇ {r.downloads}</span>
            </div>
            <h3 className="mt-3 font-extrabold leading-snug">{r.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{r.level} level</p>
            <button className="mt-4 w-full rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-violet-600">
              Download Now ⬇
            </button>
          </article>
        ))}
        {list.length === 0 && <p className="col-span-full text-center text-slate-500">No resources found. Try another search.</p>}
      </section>
    </Layout>
  );
};
