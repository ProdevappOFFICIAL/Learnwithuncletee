import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import type { ClassItem, CombinationItem, DisciplineActionItem, ResultDocItem, StudentRow } from '@/data/dashboard';
import { FileText, Gavel, Pencil, Plus, Trash2 } from 'lucide-react';

interface PendingUser {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

// ─── Caching strategy ─────────────────────────────────────────────────────────
// staleTime 5 min (directory changes rarely) + gcTime 30 min (back/forward is
// instant) + keepPreviousData (page turns reuse old rows, no flash) +
// prefetch of adjacent pages + targeted invalidation on every mutation.

const PAGE_SIZE = 10;
const LIST_STALE = 5 * 60 * 1000;
const LIST_GC = 30 * 60 * 1000;

const fetchStudents = (search: string, classId: string, page: number) =>
  apiGet<StudentRow[]>('/students', {
    search: search || undefined,
    classId: classId || undefined,
    page,
    limit: PAGE_SIZE,
  });

const PendingApprovals = () => {
  const { can } = useAuth();
  const { data, loading, reload } = useResource<PendingUser[]>('/users', { limit: 100 });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!can('users.write')) return null;
  const pending = (data ?? []).filter((u) => !u.active);

  const approve = async (id: string, name: string) => {
    setBusy(id);
    setNotice(null);
    try {
      await apiPost(`/users/${id}/approve`);
      setNotice(`${name} approved — they can now sign in.`);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Approval failed');
    } finally {
      setBusy(null);
    }
  };

  if (loading || pending.length === 0) return null;

  return (
    <Card>
      <CardHead title="Pending approvals" sub={`${pending.length} account(s) waiting`} />
      {notice && <p role="status" className="border-b border-line bg-brand-50 px-5 py-3 text-sm text-brand-800">{notice}</p>}
      <ul className="divide-y divide-line">
        {pending.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div>
              <p className="text-sm font-bold">{u.user_name} <Pill tone="amber">{u.role}</Pill></p>
              <p className="text-xs text-muted">{u.user_email} · registered {new Date(u.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              type="button"
              disabled={busy === u.id}
              onClick={() => approve(u.id, u.user_name)}
              className="rounded bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy === u.id ? 'Approving…' : 'Approve'}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const initialsOf = (name: string) =>
  name.split(' ').map((p) => p.replace('.', '')[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'LW';

/** Pupil photo with initials fallback. */
export const PupilPhoto = ({ row, size = 'h-10 w-10' }: { row: Pick<StudentRow, 'user_name' | 'img' | 'student'>; size?: string }) => {
  const src = row.student?.photoUrl || row.img || null;
  if (src) return <img src={src} alt="" className={`${size} shrink-0 rounded-full border border-line object-cover`} />;
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-extrabold text-lime-accent`}>
      {initialsOf(row.user_name)}
    </span>
  );
};

/** Uploaded result sheets belonging to one pupil. */
const PupilResults = ({ row, onClose }: { row: StudentRow; onClose: () => void }) => {
  const docs = useQuery({
    queryKey: ['student-results', row.id],
    queryFn: () => apiGet<ResultDocItem[]>('/result-documents', { studentId: row.id }),
    staleTime: LIST_STALE,
    gcTime: LIST_GC,
  });
  const list = docs.data?.data ?? [];

  return (
    <Modal open onClose={onClose} title={`Results — ${row.user_name}`}>
      {docs.isPending ? (
        <LoadingSkeleton rows={3} />
      ) : docs.isError || !docs.data ? (
        <ErrorState message="Could not load results" onRetry={() => docs.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState message="No uploaded results for this pupil yet." />
      ) : (
        <ul className="divide-y divide-line">
          {list.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText aria-hidden="true" size={18} className="shrink-0 text-brand-700" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{d.title}</p>
                  <p className="text-xs text-muted">
                    {[d.subject, d.session, d.term].filter(Boolean).join(' · ')}
                    {' · '}{new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                Open PDF
              </a>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

const DISCIPLINE_PRESETS = ['Warning', 'Detention', 'Suspension', 'Advise to withdraw', 'Repeat class', 'Expulsion', 'Community service'];

const disciplineTone = (action: string) =>
  ['Suspension', 'Expulsion', 'Advise to withdraw'].includes(action) ? 'rose' : action === 'Warning' || action === 'Detention' ? 'amber' : 'ink';

/** Discipline history + record-a-new-action, per pupil. */
const PupilDiscipline = ({ row, onClose }: { row: StudentRow; onClose: () => void }) => {
  const qc = useQueryClient();
  const key = ['discipline', row.id] as const;
  const history = useQuery({
    queryKey: key,
    queryFn: () => apiGet<DisciplineActionItem[]>('/discipline', { studentId: row.id }),
    staleTime: 60 * 1000,
    gcTime: LIST_GC,
  });
  const [action, setAction] = useState(DISCIPLINE_PRESETS[0]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const list = history.data?.data ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim()) {
      setMsg('Pick or type an action.');
      return;
    }
    setBusy('add');
    setMsg(null);
    try {
      await apiPost('/discipline', { studentId: row.id, action: action.trim(), reason: reason.trim() || undefined });
      setAction(DISCIPLINE_PRESETS[0]);
      setReason('');
      setMsg('Action recorded.');
      refresh();
    } catch (err: any) {
      setMsg(err?.message ?? 'Could not record action');
    } finally {
      setBusy(null);
    }
  };

  const lift = async (id: string) => {
    setBusy(id);
    try {
      await apiPatch(`/discipline/${id}/lift`);
      refresh();
    } catch (err: any) {
      setMsg(err?.message ?? 'Could not lift action');
    } finally {
      setBusy(null);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this discipline record? This cannot be undone.')) return;
    setBusy(id);
    try {
      await apiDelete(`/discipline/${id}`);
      refresh();
    } catch (err: any) {
      setMsg(err?.message ?? 'Could not delete record');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Discipline — ${row.user_name}`}>
      <form onSubmit={add} className="space-y-3 border-b border-line pb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Action
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              list="discipline-presets"
              placeholder="e.g. Suspension"
              className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
            />
            <datalist id="discipline-presets">
              {DISCIPLINE_PRESETS.map((p) => <option key={p} value={p} />)}
            </datalist>
          </label>
          <label className="block text-sm font-semibold">Reason
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this action taken?"
              className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
            />
          </label>
        </div>
        <button type="submit" disabled={busy === 'add'} className="min-h-11 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy === 'add' ? 'Recording…' : 'Record action'}
        </button>
      </form>
      {msg && <p role="status" className="mt-3 border-l-2 border-lime-accent bg-brand-50 px-4 py-2 text-sm text-brand-800">{msg}</p>}
      <div className="mt-3">
        {history.isPending ? (
          <LoadingSkeleton rows={3} />
        ) : history.isError ? (
          <ErrorState message="Could not load history" onRetry={() => history.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState message="No discipline records for this pupil." />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {d.action}
                    <Pill tone={d.status === 'LIFTED' ? 'emerald' : disciplineTone(d.action) as any}>
                      {d.status === 'LIFTED' ? 'Lifted' : 'Active'}
                    </Pill>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {[d.reason, d.creator?.user_name ? `by ${d.creator.user_name}` : null, new Date(d.createdAt).toLocaleDateString()].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="flex gap-1.5">
                  {d.status !== 'LIFTED' && (
                    <button type="button" disabled={busy === d.id} onClick={() => lift(d.id)} className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-60">
                      Lift
                    </button>
                  )}
                  <button type="button" disabled={busy === d.id} onClick={() => del(d.id)} aria-label="Delete record" title="Delete" className="rounded border border-line px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-60">
                    <Trash2 aria-hidden="true" size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

interface StudentForm {
  user_name: string;
  user_email: string;
  password: string;
  classId: string;
  combinationId: string;
  active: boolean;
  photoUrl: string;
}

const emptyForm = (defaultClassId: string): StudentForm => ({
  user_name: '',
  user_email: '',
  password: '',
  classId: defaultClassId,
  combinationId: '',
  active: true,
  photoUrl: '',
});

export const AdminStudentsPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['admin-students', query, classFilter, page],
    queryFn: () => fetchStudents(query, classFilter, page),
    staleTime: LIST_STALE,
    gcTime: LIST_GC,
    placeholderData: keepPreviousData,
  });
  const rows = list.data?.data ?? [];
  const total = (list.data?.meta as { total?: number } | undefined)?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  // Prefetch neighbours so Prev/Next feel instant.
  useEffect(() => {
    if (safePage < pageCount) {
      void qc.prefetchQuery({
        queryKey: ['admin-students', query, classFilter, safePage + 1],
        queryFn: () => fetchStudents(query, classFilter, safePage + 1),
        staleTime: LIST_STALE,
      });
    }
    if (safePage > 1) {
      void qc.prefetchQuery({
        queryKey: ['admin-students', query, classFilter, safePage - 1],
        queryFn: () => fetchStudents(query, classFilter, safePage - 1),
        staleTime: LIST_STALE,
      });
    }
  }, [qc, query, classFilter, safePage, pageCount]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-students'] });

  const classes = useResource<ClassItem[]>('/classes');
  const combinations = useResource<CombinationItem[]>('/combinations', { limit: 100 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm(''));
  const [created, setCreated] = useState<{ email: string; password: string; studentCode: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [resultsRow, setResultsRow] = useState<StudentRow | null>(null);
  const [disciplineRow, setDisciplineRow] = useState<StudentRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(classes.data?.[0]?.id ?? ''));
    setCreated(null);
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (row: StudentRow) => {
    setEditing(row);
    setForm({
      user_name: row.user_name,
      user_email: row.user_email,
      password: '',
      classId: row.classId ?? '',
      combinationId: row.student?.combinationId ?? '',
      active: row.active,
      photoUrl: '',
    });
    setCreated(null);
    setNotice(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId) {
      setNotice('Select a class for this pupil.');
      return;
    }
    setBusy(true);
    setNotice(null);
    setCreated(null);
    try {
      if (editing) {
        await apiPatch(`/students/${editing.id}`, {
          user_name: form.user_name.trim(),
          classId: form.classId,
          combinationId: form.combinationId || null,
          active: form.active,
        });
        setNotice(`"${form.user_name.trim()}" updated.`);
      } else {
        const res = await apiPost<{ login: { email: string; password: string }; profile: { studentCode: string } }>('/students', {
          user_name: form.user_name.trim(),
          user_email: form.user_email.trim(),
          password: form.password || undefined,
          classId: form.classId,
          combinationId: form.combinationId || undefined,
          photoUrl: form.photoUrl || undefined,
        });
        setCreated({ email: res.data.login.email, password: res.data.login.password, studentCode: res.data.profile.studentCode });
        setNotice(null);
      }
      setModalOpen(false);
      setEditing(null);
      invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: StudentRow) => {
    if (!confirm(`Delete pupil "${row.user_name}"? Their account and records are removed. This cannot be undone.`)) return;
    setRowBusy(row.id);
    try {
      await apiDelete(`/users/${row.id}`);
      invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    } finally {
      setRowBusy(null);
    }
  };

  const toggleActive = async (row: StudentRow) => {
    setRowBusy(row.id);
    try {
      await apiPatch(`/students/${row.id}`, { active: !row.active });
      invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not change status');
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Students"
        text="Enrolment, class allocation, combinations and account access."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> Enroll Student
          </button>
        }
      />
      <PendingApprovals />
      {notice && !modalOpen && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="Student directory" sub={`${total} pupil(s) · search, filter and manage records`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            setPage(1);
          }}
        >
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or admission no…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} aria-label="Filter by class" className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
            <option value="">All classes</option>
            {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {(search || classFilter) && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setClassFilter(''); setPage(1); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {list.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : list.isError || !list.data ? (
          <div className="px-5 py-5"><ErrorState message="Could not load students" onRetry={() => list.refetch()} /></div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No students found. Enroll the first one." /></div>
        ) : (
          <>
            <TableWrap>
              <table className={`w-full min-w-[960px] text-left text-sm transition-opacity ${list.isFetching ? 'opacity-60' : ''}`}>
                <thead><tr><Th>Photo</Th><Th>Pupil</Th><Th>Class</Th><Th>Combination</Th><Th>Results</Th><Th>Discipline</Th><Th>Status</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <Td><PupilPhoto row={r} /></Td>
                      <Td><span className="font-bold">{r.user_name}</span><span className="block text-xs text-muted">{r.student?.studentCode ?? r.user_email}</span></Td>
                      <Td>{r.student?.className ?? '—'}</Td>
                      <Td className="text-muted">{r.student?.combination?.name ?? '—'}</Td>
                      <Td>
                        <button type="button" onClick={() => setResultsRow(r)} title="View uploaded results" className="inline-flex items-center gap-1.5 rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                          <FileText aria-hidden="true" size={14} /> View
                        </button>
                      </Td>
                      <Td>
                        <button type="button" onClick={() => setDisciplineRow(r)} title="Record or review discipline actions" className="inline-flex items-center gap-1.5 rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                          <Gavel aria-hidden="true" size={14} /> Manage
                        </button>
                      </Td>
                      <Td><Pill tone={r.active ? 'emerald' : 'rose'}>{r.active ? 'Active' : 'Inactive'}</Pill></Td>
                      <Td>
                        <span className="flex gap-1.5">
                          <button type="button" onClick={() => openEdit(r)} aria-label={`Edit ${r.user_name}`} title="Edit" className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                            <Pencil aria-hidden="true" size={14} />
                          </button>
                          <button type="button" disabled={rowBusy === r.id} onClick={() => toggleActive(r)} aria-label={r.active ? `Deactivate ${r.user_name}` : `Activate ${r.user_name}`} title={r.active ? 'Deactivate' : 'Activate'} className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-60">
                            {r.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button type="button" disabled={rowBusy === r.id} onClick={() => remove(r)} aria-label={`Delete ${r.user_name}`} title="Delete" className="rounded border border-line px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-60">
                            <Trash2 aria-hidden="true" size={14} />
                          </button>
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-sm">
              <p className="text-muted">{total} pupil(s) · page {safePage} of {pageCount}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1 || list.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="min-h-10 rounded border border-line px-4 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  disabled={safePage >= pageCount || list.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="min-h-10 rounded border border-line px-4 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Enroll Student'}>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">Full name
            <input required value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} placeholder="e.g. Daniel E." className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" />
          </label>
          <label className="block text-sm font-semibold">Email / admission no
            <input
              required={!editing}
              disabled={!!editing}
              value={form.user_email}
              onChange={(e) => setForm({ ...form, user_email: e.target.value })}
              placeholder="pupil@example.com"
              title={editing ? 'Email is fixed after creation' : undefined}
              className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 disabled:bg-cream disabled:text-muted"
            />
          </label>
          {!editing && (
            <label className="block text-sm font-semibold">Password (optional — auto-generated if blank)
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto-generate" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" />
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Grade (class)
              <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
                <option value="" disabled>Select a class</option>
                {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">Combination (optional)
              <select value={form.combinationId} onChange={(e) => setForm({ ...form, combinationId: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
                <option value="">None</option>
                {(combinations.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between gap-3 rounded border border-line bg-cream px-4 py-3">
            <div>
              <p className="text-sm font-bold">Active enrollment</p>
              <p className="text-xs text-muted">Inactive pupils cannot sign in.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              aria-label="Active enrollment"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full px-1 transition-colors ${form.active ? 'bg-brand-500' : 'bg-line'}`}
            >
              <span className={`h-4 w-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {!editing && (
            <div className="flex items-center gap-3">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Avatar preview" className="h-11 w-11 rounded-full border border-line object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-sm font-extrabold text-brand-700">?</span>
              )}
              <div>
                <p className="text-sm font-semibold">Avatar {form.photoUrl && <span className="text-emerald-700">✓ set</span>}</p>
                <div className="mt-1">
                  <UploadButton endpoint="avatarUploader" label="Upload avatar" onClientUploadComplete={(res) => setForm({ ...form, photoUrl: res?.[0]?.ufsUrl ?? '' })} onUploadError={(err) => setNotice(err.message)} />
                </div>
              </div>
            </div>
          )}
          {notice && <p role={editing ? 'status' : 'alert'} className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>
      {created && (
        <Card className="hidden border-lime-accent p-4 text-sm" >
          <p className="font-extrabold text-brand-800">Last created login (copy before leaving):</p>
          <ul className="mt-2 space-y-1 font-mono text-[13px]">
            <li>Email: <b>{created.email}</b></li>
            <li>Password: <b>{created.password}</b></li>
            <li>Student ID: <b>{created.studentCode}</b></li>
          </ul>
        </Card>
      )}
      {resultsRow && <PupilResults row={resultsRow} onClose={() => setResultsRow(null)} />}
      {disciplineRow && <PupilDiscipline row={disciplineRow} onClose={() => setDisciplineRow(null)} />}
    </div>
  );
};
