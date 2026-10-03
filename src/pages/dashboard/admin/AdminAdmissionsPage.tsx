import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';

interface Application {
  id: string;
  applicantName: string;
  classSought: string;
  guardianName: string;
  guardianPhone: string;
  stage: string;
  notes?: string | null;
}

const STAGES = ['Enquiry', 'Documents', 'Interview', 'Offer', 'Accepted', 'Enrolled', 'Rejected'];

export const AdminAdmissionsPage = () => {
  const { data, loading, error, reload } = useResource<Application[]>('/admissions', { limit: 50 });
  const [form, setForm] = useState({ applicantName: '', classSought: 'JSS 1', guardianName: '', guardianPhone: '' });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await apiPost('/admissions', form);
      setNotice('Application recorded.');
      setForm({ applicantName: '', classSought: 'JSS 1', guardianName: '', guardianPhone: '' });
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Failed to record');
    } finally {
      setBusy(false);
    }
  };

  const setStage = async (id: string, stage: string) => {
    try {
      await apiPatch(`/admissions/${id}/stage`, { stage });
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Update failed');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    try {
      await apiDelete(`/admissions/${id}`);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admissions" title="Admissions pipeline" text="From enquiry to enrolment — interviews, offers and documents in one queue." />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">New application</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">Record enquiry</h3>
          <form className="mt-5 space-y-4" onSubmit={create}>
            <label className="block text-sm font-semibold">Applicant<input required value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
            <label className="block text-sm font-semibold">Class sought
              <select value={form.classSought} onChange={(e) => setForm({ ...form, classSought: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
                {['Creche', 'Primary 4', 'JSS 1', 'SS 1'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">Guardian<input required value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
            <label className="block text-sm font-semibold">Guardian phone<input required value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} placeholder="+234…" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
            <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : '+ New application'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHead title="Application queue" sub="All active applications" />
          {loading ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
          ) : error || !data ? (
            <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
          ) : data.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No applications yet." /></div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr><Th>Applicant</Th><Th>Guardian</Th><Th>Stage</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
                <tbody>
                  {data.map((a) => (
                    <tr key={a.id}>
                      <Td><span className="font-bold">{a.applicantName}</span><span className="block text-xs text-muted">{a.classSought}</span></Td>
                      <Td className="text-muted">{a.guardianName}<span className="block text-xs">{a.guardianPhone}</span></Td>
                      <Td>
                        <select value={a.stage} onChange={(e) => setStage(a.id, e.target.value)} className="rounded border border-line bg-white px-2 py-1.5 text-xs font-bold">
                          {STAGES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <span className="mt-1 block"><Pill tone={a.stage === 'Enrolled' || a.stage === 'Accepted' ? 'emerald' : a.stage === 'Rejected' ? 'rose' : 'amber'}>{a.stage}</Pill></span>
                      </Td>
                      <Td><button type="button" onClick={() => remove(a.id)} className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">Delete</button></Td>
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
