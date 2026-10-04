import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import type { ClassItem, CourseAssignmentItem, ExamItem, StaffRow, SubjectItem } from '@/data/dashboard';
import { Pencil, Plus, Trash2 } from 'lucide-react';

interface TeacherForm {
  user_name: string;
  user_email: string;
  password: string;
  active: boolean;
  photoUrl: string;
}

const emptyForm = (): TeacherForm => ({ user_name: '', user_email: '', password: '', active: true, photoUrl: '' });

export const AdminTeachersPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useResource<StaffRow[]>('/staff', { search: query, limit: 50 });
  const assignments = useResource<CourseAssignmentItem[]>('/course-assignments', { limit: 100 });
  const exams = useResource<ExamItem[]>('/exams', { limit: 100 });
  const subjects = useResource<SubjectItem[]>('/subjects', { limit: 100 });
  const classes = useResource<ClassItem[]>('/classes');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm());
  const [created, setCreated] = useState<{ email: string; password: string; staffCode: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  // Assigned-courses composer (per selected teacher in the section below).
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignExamId, setAssignExamId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setCreated(null);
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (row: StaffRow) => {
    setEditing(row);
    setForm({ user_name: row.user_name, user_email: row.user_email, password: '', active: row.active, photoUrl: '' });
    setCreated(null);
    setNotice(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setCreated(null);
    try {
      if (editing) {
        await apiPatch(`/staff/${editing.id}`, { user_name: form.user_name.trim(), active: form.active });
        setNotice(`"${form.user_name.trim()}" updated.`);
      } else {
        const res = await apiPost<{ login: { email: string; password: string }; profile: { staffCode: string } }>('/staff', {
          user_name: form.user_name.trim(),
          user_email: form.user_email.trim(),
          password: form.password || undefined,
          photoUrl: form.photoUrl || undefined,
        });
        setCreated({ email: res.data.login.email, password: res.data.login.password, staffCode: res.data.profile.staffCode });
        setNotice(null);
      }
      setModalOpen(false);
      setEditing(null);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: StaffRow) => {
    if (!confirm(`Delete teacher "${row.user_name}"? Their account is removed. This cannot be undone.`)) return;
    setRowBusy(row.id);
    try {
      await apiDelete(`/users/${row.id}`);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    } finally {
      setRowBusy(null);
    }
  };

  const toggleActive = async (row: StaffRow) => {
    setRowBusy(row.id);
    try {
      await apiPatch(`/staff/${row.id}`, { active: !row.active });
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not change status');
    } finally {
      setRowBusy(null);
    }
  };

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeacherId) {
      setNotice('Select a teacher first.');
      return;
    }
    if (!assignExamId && !assignSubjectId && !assignClassId) {
      setNotice('Pick at least an exam, a subject or a class to assign.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await apiPost('/course-assignments', {
        teacherId: assignTeacherId,
        examId: assignExamId || undefined,
        subjectId: assignSubjectId || undefined,
        classId: assignClassId || undefined,
      });
      setNotice('Course assigned.');
      setAssignExamId('');
      setAssignSubjectId('');
      setAssignClassId('');
      assignments.reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not assign course');
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async (id: string) => {
    if (!confirm('Remove this course assignment?')) return;
    try {
      await apiDelete(`/course-assignments/${id}`);
      assignments.reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not remove assignment');
    }
  };

  const coursesByTeacher = (teacherId: string) => (assignments.data ?? []).filter((a) => a.teacherId === teacherId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Teachers & staff"
        text="Accounts, course assignments and access."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> Add Teacher
          </button>
        }
      />
      {notice && !modalOpen && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
      {created && (
        <Card className="border-lime-accent p-4 text-sm">
          <p className="font-extrabold text-brand-800">Account created — share these login details now (shown once):</p>
          <ul className="mt-2 space-y-1 font-mono text-[13px]">
            <li>Email: <b>{created.email}</b></li>
            <li>Password: <b>{created.password}</b></li>
            <li>Staff ID: <b>{created.staffCode}</b></li>
          </ul>
        </Card>
      )}

      <Card>
        <CardHead title="Assigned courses" sub="Link a teacher to an exam, a subject and/or a class" />
        <form onSubmit={addAssignment} className="grid gap-3 border-b border-line px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm font-semibold">Teacher
            <select required value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
              <option value="">— Select —</option>
              {(data ?? []).filter((t) => t.role === 'TEACHER').map((t) => <option key={t.id} value={t.id}>{t.user_name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Exam
            <select value={assignExamId} onChange={(e) => setAssignExamId(e.target.value)} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
              <option value="">— None —</option>
              {(exams.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.exam_name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Subject
            <select value={assignSubjectId} onChange={(e) => setAssignSubjectId(e.target.value)} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
              <option value="">— None —</option>
              {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Class
            <select value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
              <option value="">— None —</option>
              {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? '…' : 'Assign'}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHead title="Staff directory" sub="Search, edit and manage records" />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
          }}
        >
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
        </form>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No staff found." /></div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead><tr><Th>Staff</Th><Th>Role</Th><Th>Assigned courses</Th><Th>Status</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
              <tbody>
                {data.map((s) => {
                  const courses = coursesByTeacher(s.id);
                  return (
                    <tr key={s.id}>
                      <Td><span className="font-bold">{s.user_name}</span><span className="block text-xs text-muted">{s.user_email}{s.teacher ? ` · ${s.teacher.staffCode}` : ''}</span></Td>
                      <Td><Pill tone="ink">{s.role}</Pill></Td>
                      <Td className="text-muted">
                        {courses.length === 0 ? '—' : (
                          <ul className="space-y-1">
                            {courses.map((c) => (
                              <li key={c.id} className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-ink">{[c.exam?.exam_name, c.subject?.name, c.class?.name].filter(Boolean).join(' · ') || 'Assigned'}</span>
                                <button type="button" onClick={() => removeAssignment(c.id)} aria-label="Remove assignment" title="Remove" className="font-bold text-rose-700 hover:underline">✕</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Td>
                      <Td><Pill tone={s.active ? 'emerald' : 'rose'}>{s.active ? 'Active' : 'Inactive'}</Pill></Td>
                      <Td>
                        <span className="flex gap-1.5">
                          <button type="button" onClick={() => openEdit(s)} aria-label={`Edit ${s.user_name}`} title="Edit" className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                            <Pencil aria-hidden="true" size={14} />
                          </button>
                          <button type="button" disabled={rowBusy === s.id} onClick={() => toggleActive(s)} aria-label={s.active ? `Deactivate ${s.user_name}` : `Activate ${s.user_name}`} title={s.active ? 'Deactivate' : 'Activate'} className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-60">
                            {s.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button type="button" disabled={rowBusy === s.id} onClick={() => remove(s)} aria-label={`Delete ${s.user_name}`} title="Delete" className="rounded border border-line px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-60">
                            <Trash2 aria-hidden="true" size={14} />
                          </button>
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">Full name
            <input required value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} placeholder="e.g. Mr. Balogun" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" />
          </label>
          <label className="block text-sm font-semibold">Email (login)
            <input
              required={!editing}
              disabled={!!editing}
              type="email"
              value={form.user_email}
              onChange={(e) => setForm({ ...form, user_email: e.target.value })}
              placeholder="teacher@example.com"
              title={editing ? 'Email is fixed after creation' : undefined}
              className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 disabled:bg-cream disabled:text-muted"
            />
          </label>
          {!editing && (
            <>
              <label className="block text-sm font-semibold">Password (optional — auto-generated if blank)
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto-generate" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" />
              </label>
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
            </>
          )}
          <div className="flex items-center justify-between gap-3 rounded border border-line bg-cream px-4 py-3">
            <div>
              <p className="text-sm font-bold">Active account</p>
              <p className="text-xs text-muted">Inactive teachers cannot sign in.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              aria-label="Active account"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full px-1 transition-colors ${form.active ? 'bg-brand-500' : 'bg-line'}`}
            >
              <span className={`h-4 w-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {notice && <p role={editing ? 'status' : 'alert'} className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
