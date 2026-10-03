import { useState } from 'react';
import { Card, CardHead, PageHeader, Pill } from '@/components/dashboard/DashboardUI';

const seed = [
  { title: 'First term PTA meeting — Sat 18 Oct', tag: 'Announcement', date: 'Posted 02 Oct', text: 'All parents are invited to the first term general meeting at the school hall, 10 AM.' },
  { title: 'Inter-house sports heats begin Monday', tag: 'Sports', date: 'Posted 30 Sep', text: 'Heats for track events start Monday at the school field. Full fixture list attached.' },
  { title: 'Mid-term break: 27 – 31 Oct', tag: 'Academic', date: 'Posted 28 Sep', text: 'School closes for mid-term break. Boarders return Sunday 02 Nov by 4 PM.' },
];

export const AdminNewsPage = () => {
  const [items] = useState(seed);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Communications" title="News & events" text="Announcements published here appear on the website News page." actions={<button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">+ New post</button>} />
      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Compose</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">New announcement</h3>
          <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <label className="block text-sm font-semibold">Title<input required placeholder="e.g. Open day — 15 Nov" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
            <label className="block text-sm font-semibold">Category
              <select className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm"><option>Announcement</option><option>Academic</option><option>Sports</option><option>Cultural</option><option>Events</option></select>
            </label>
            <label className="block text-sm font-semibold">Message<textarea rows={4} placeholder="Write the announcement…" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" /></label>
            <button type="submit" className="min-h-11 w-full rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">Publish</button>
          </form>
        </Card>
        <Card>
          <CardHead title="Published" sub={`${items.length} posts`} />
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li key={n.title} className="px-5 py-4">
                <div className="flex items-center gap-2"><Pill tone="sky">{n.tag}</Pill><span className="text-xs text-muted">{n.date}</span></div>
                <h4 className="mt-2 font-display text-sm font-extrabold">{n.title}</h4>
                <p className="mt-1 text-sm text-muted">{n.text}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Edit</button>
                  <button type="button" className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">Unpublish</button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
