import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPatch, apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import type { LessonData } from '@/data/dashboard';

export const AdminVirtualClassPage = () => {
  const { data, loading, error, reload } = useResource<LessonData[]>('/virtual-lessons');
  const [form, setForm] = useState({ topic: '', subject: 'Mathematics', className: 'JSS 2 Diamond', startsAt: '', durationMins: '45', joinUrl: 'https://meet.google.com/new' });
  const [coverUrl, setCoverUrl] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    try {
      await apiPost('/virtual-lessons', { ...form, durationMins: Number(form.durationMins) || 45, coverUrl: coverUrl || undefined });
      setNotice('Lesson scheduled.');
      setForm({ topic: '', subject: 'Mathematics', className: '', startsAt: '', durationMins: '45', joinUrl: 'https://meet.google.com/new' });
      setCoverUrl('');
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Failed to schedule');
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await apiPatch(`/virtual-lessons/${id}/status`, { status });
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="E-learning" title="Virtual classes" text="Schedule, links, recordings and status for online lessons." />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Schedule</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">New lesson</h3>
          <form onSubmit={create} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold">Topic<input required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Subject<input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
              <label className="block text-sm font-semibold">Starts<input required type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
            </div>
            <label className="block text-sm font-semibold">Join URL<input required value={form.joinUrl} onChange={(e) => setForm({ ...form, joinUrl: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
            <div>
              <p className="text-sm font-semibold">Cover image {coverUrl && <span className="text-emerald-700">✓ uploaded</span>}</p>
              <div className="mt-2">
                <UploadButton endpoint="lessonMaterialUploader" onClientUploadComplete={(res) => setCoverUrl(res?.[0]?.ufsUrl ?? '')} onUploadError={(err) => setNotice(err.message)} />
              </div>
            </div>
            <button type="submit" className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">+ Schedule class</button>
          </form>
        </Card>

        <Card>
          <CardHead title="Schedule" sub="All lessons" />
          {loading ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
          ) : error || !data ? (
            <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
          ) : data.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No lessons scheduled." /></div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr><Th>Topic</Th><Th>When</Th><Th>Status</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.id}>
                      <Td><span className="font-bold">{r.topic}</span><span className="block text-xs text-muted">{r.subject} · {r.teacher?.user_name ?? ''} · {r.className}</span></Td>
                      <Td className="text-muted">{new Date(r.startsAt).toLocaleString()}</Td>
                      <Td><Pill tone={r.status === 'Live' ? 'emerald' : 'sky'}>{r.status}</Pill></Td>
                      <Td>
                        <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded border border-line bg-white px-2 py-1.5 text-xs font-bold">
                          {['Scheduled', 'Live', 'Ended'].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </div>
    </div>
  );
};
