import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { useAuth } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { Pencil, Plus, Trash2 } from 'lucide-react';

interface MemberRow {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface MemberForm {
  user_name: string;
  user_email: string;
  password: string;
  active: boolean;
}

const emptyForm = (): MemberForm => ({ user_name: '', user_email: '', password: '', active: true });

/** Generic MEMBER accounts (replaces the old bursar slot) — created like staff. */
export const AdminMemberPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const members = usePagedList<MemberRow>(
    ['admin-members', query],
    (page, limit) => apiGet<MemberRow[]>('/users', { role: 'MEMBER', searchTerm: query || undefined, page, limit }),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm());
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (row: MemberRow) => {
    setEditing(row);
    setForm({ user_name: row.user_name, user_email: row.user_email, password: '', active: row.active });
    setNotice(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_name.trim() || !form.user_email.trim()) {
      setNotice('Name and email are required.');
      return;
    }
    if (!editing && form.password.length < 8) {
      setNotice('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (editing) {
        await apiPatch(`/users/${editing.id}`, { user_name: form.user_name.trim(), active: form.active });
        setNotice(`"${form.user_name.trim()}" updated.`);
      } else {
        await apiPost('/users', {
          user_name: form.user_name.trim(),
          user_email: form.user_email.trim(),
          user_password: form.password,
          role: 'MEMBER',
          active: form.active,
          workspaceId: user?.workspaceId,
        });
        setNotice(`Member "${form.user_email.trim()}" created — they can sign in with email.`);
      }
      setModalOpen(false);
      setEditing(null);
      members.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: MemberRow) => {
    if (!confirm(`Delete member "${row.user_name}"? Their account is removed. This cannot be undone.`)) return;
    setRowBusy(row.id);
    try {
      await apiDelete(`/users/${row.id}`);
      members.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    } finally {
      setRowBusy(null);
    }
  };

  const toggleActive = async (row: MemberRow) => {
    setRowBusy(row.id);
    try {
      await apiPatch(`/users/${row.id}`, { active: !row.active });
      members.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not change status');
    } finally {
      setRowBusy(null);
    }
  };

  const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Members"
        text="General member accounts — created like staff, signing in with email."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> Add Member
          </button>
        }
      />
      {notice && !modalOpen && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="Member directory" sub={`${members.total} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            members.resetPage();
          }}
        >
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); members.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {members.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : members.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load members" onRetry={() => members.refetch()} /></div>
        ) : members.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={query ? 'No members match your search.' : 'No members yet — add the first one.'} /></div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${members.isFetching ? 'opacity-60' : ''}`}>
              {members.rows.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold">{m.user_name} <Pill tone={m.active ? 'emerald' : 'rose'}>{m.active ? 'Active' : 'Inactive'}</Pill></p>
                    <p className="text-xs text-muted">{m.user_email} · joined {new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => openEdit(m)} aria-label={`Edit ${m.user_name}`} title="Edit" className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                      <Pencil aria-hidden="true" size={14} />
                    </button>
                    <button type="button" disabled={rowBusy === m.id} onClick={() => toggleActive(m)} aria-label={m.active ? `Deactivate ${m.user_name}` : `Activate ${m.user_name}`} title={m.active ? 'Deactivate' : 'Activate'} className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-60">
                      {m.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" disabled={rowBusy === m.id} onClick={() => remove(m)} aria-label={`Delete ${m.user_name}`} title="Delete" className="rounded border border-line px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-60">
                      <Trash2 aria-hidden="true" size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <Pagination
              total={members.total}
              page={members.page}
              pageCount={members.pageCount}
              limit={members.limit}
              onPage={members.setPage}
              onLimit={members.setLimit}
              disabled={members.isFetching}
              noun="member(s)"
            />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Member' : 'Add Member'}>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">Full name
            <input required value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} placeholder="e.g. Mrs. Adaeze O." className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">Email (login)
            <input
              required={!editing}
              disabled={!!editing}
              type="email"
              value={form.user_email}
              onChange={(e) => setForm({ ...form, user_email: e.target.value })}
              placeholder="member@example.com"
              title={editing ? 'Email is fixed after creation' : undefined}
              className={`${inputClass} disabled:bg-cream disabled:text-muted`}
            />
          </label>
          {!editing && (
            <label className="block text-sm font-semibold">Password (min 8 characters)
              <input type="text" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set an initial password" className={inputClass} />
            </label>
          )}
          <div className="flex items-center justify-between gap-3 rounded border border-line bg-cream px-4 py-3">
            <div>
              <p className="text-sm font-bold">Active account</p>
              <p className="text-xs text-muted">Inactive members cannot sign in.</p>
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
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
