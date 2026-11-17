import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, IdCard, Plus, UserCog, Users, X } from 'lucide-react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pill,
  TableWrap,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { SearchSelect, type SearchOption } from '@/components/dashboard/SearchSelect';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import type { ClassItem, StatusAssignmentItem, StatusDefinitionItem, StatusScope } from '@/data/dashboard';

interface StatusUserRow {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  active?: boolean;
  class?: { name?: string } | null;
}

const SCOPES = [
  {
    id: 'TEACHER',
    label: 'Teachers',
    singular: 'teacher',
    hint: 'Create leadership labels such as Principal, Class Teacher or Head of Department.',
    icon: UserCog,
    placeholder: 'e.g. PRINCIPAL',
  },
  {
    id: 'MEMBER',
    label: 'Members',
    singular: 'member',
    hint: 'Create labels for non-teaching members, such as Bursar or Board Member.',
    icon: IdCard,
    placeholder: 'e.g. BURSAR',
  },
  {
    id: 'STUDENT',
    label: 'Students',
    singular: 'student',
    hint: 'Create pupil leadership labels such as School Prefect or House Captain.',
    icon: Users,
    placeholder: 'e.g. SCHOOL PREFECT',
  },
] as const;

const scopeTone = (scope: StatusScope) =>
  scope === 'TEACHER' ? 'violet' : scope === 'MEMBER' ? 'sky' : 'emerald';

export const AdminStatusPage = () => {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<StatusScope>('TEACHER');
  const meta = SCOPES.find((item) => item.id === scope) ?? SCOPES[0];

  const [notice, setNotice] = useState<string | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignStatusId, setAssignStatusId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const definitions = useQuery({
    queryKey: ['status-definitions', scope],
    queryFn: async () => (await apiGet<StatusDefinitionItem[]>('/statuses/definitions', { scope })).data,
  });
  const assignments = useQuery({
    queryKey: ['status-assignments', scope],
    queryFn: async () => (await apiGet<StatusAssignmentItem[]>('/statuses/assignments', { scope })).data,
  });
  const users = useQuery({
    queryKey: ['status-users', scope],
    queryFn: async () => (await apiGet<StatusUserRow[]>('/users', { role: scope, limit: 500 })).data,
  });
  const classes = useQuery({
    queryKey: ['status-classes'],
    queryFn: async () => (await apiGet<ClassItem[]>('/classes', { limit: 200 })).data,
    enabled: scope === 'TEACHER',
  });

  useEffect(() => {
    setNotice(null);
    setNewStatusName('');
    setAssignUserId('');
    setAssignStatusId('');
    setAssignClassId('');
  }, [scope]);

  const userOptions = useMemo<SearchOption[]>(
    () =>
      (users.data ?? []).map((user) => ({
        id: user.id,
        label: user.user_name,
        hint: [user.user_email, user.class?.name, user.active === false ? 'Inactive' : '']
          .filter(Boolean)
          .join(' · '),
      })),
    [users.data],
  );
  const statusOptions = useMemo<SearchOption[]>(
    () =>
      (definitions.data ?? []).map((status) => ({
        id: status.id,
        label: status.name,
        hint: `${status._count?.assignments ?? 0} assigned`,
      })),
    [definitions.data],
  );
  const classOptions = useMemo<SearchOption[]>(
    () => (classes.data ?? []).map((cls) => ({ id: cls.id, label: cls.name })),
    [classes.data],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['status-definitions', scope] });
    queryClient.invalidateQueries({ queryKey: ['status-assignments', scope] });
  };

  const createStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newStatusName.trim();
    if (!name) {
      setNotice('Enter a status name first.');
      return;
    }

    setBusy('create');
    setNotice(null);
    try {
      await apiPost('/statuses/definitions', { name, scope });
      setNewStatusName('');
      setNotice(`Status "${name}" created for ${meta.label.toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ['status-definitions', scope] });
    } catch (error: any) {
      setNotice(error?.message ?? 'Could not create status');
    } finally {
      setBusy(null);
    }
  };

  const deleteStatus = async (status: StatusDefinitionItem) => {
    const count = status._count?.assignments ?? 0;
    if (
      !window.confirm(
        `Delete the status "${status.name}"?${count > 0 ? ` It will be removed from ${count} person(s).` : ''}`,
      )
    ) {
      return;
    }

    setBusy(`status:${status.id}`);
    setNotice(null);
    try {
      await apiDelete(`/statuses/definitions/${status.id}`);
      setNotice(`Status "${status.name}" deleted.`);
      refresh();
    } catch (error: any) {
      setNotice(error?.message ?? 'Could not delete status');
    } finally {
      setBusy(null);
    }
  };

  const assignStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignUserId) {
      setNotice(`Select a ${meta.singular} first.`);
      return;
    }
    if (!assignStatusId) {
      setNotice('Select the status to assign.');
      return;
    }

    setBusy('assign');
    setNotice(null);
    try {
      await apiPost('/statuses/assignments', {
        userId: assignUserId,
        statusId: assignStatusId,
        ...(scope === 'TEACHER' && assignClassId ? { classId: assignClassId } : {}),
      });
      setAssignStatusId('');
      setAssignClassId('');
      setNotice('Status assigned.');
      refresh();
    } catch (error: any) {
      setNotice(error?.message ?? 'Could not assign status');
    } finally {
      setBusy(null);
    }
  };

  const removeAssignment = async (assignment: StatusAssignmentItem) => {
    if (!window.confirm(`Remove "${assignment.status.name}" from ${assignment.user.user_name}?`)) return;

    setBusy(`assignment:${assignment.id}`);
    setNotice(null);
    try {
      await apiDelete(`/statuses/assignments/${assignment.id}`);
      setNotice('Status assignment removed.');
      refresh();
    } catch (error: any) {
      setNotice(error?.message ?? 'Could not remove assignment');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Statuses"
        text="Create statuses for teachers, members and students, then assign them. Teacher statuses can also be tied to a class."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status scope">
        {SCOPES.map((item) => {
          const Icon = item.icon;
          const active = item.id === scope;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setScope(item.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded border px-4 text-sm font-bold transition-colors ${
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-900'
                  : 'border-line bg-white text-muted hover:border-brand-300 hover:text-ink'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {notice}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHead title={`${meta.label} statuses`} sub="Create the labels available for this group." />
          <form onSubmit={createStatus} className="flex flex-wrap gap-2 border-b border-line px-5 py-4">
            <input
              value={newStatusName}
              onChange={(event) => setNewStatusName(event.target.value)}
              placeholder={meta.placeholder}
              aria-label={`New ${meta.singular} status name`}
              className="min-h-11 min-w-0 flex-1 rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={busy === 'create'}
              className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Plus size={15} aria-hidden="true" />
              {busy === 'create' ? 'Adding...' : 'Add status'}
            </button>
          </form>

          <div className="px-5 py-5">
            {definitions.isPending ? (
              <LoadingSkeleton rows={2} />
            ) : definitions.isError ? (
              <ErrorState message="Could not load statuses" onRetry={() => definitions.refetch()} />
            ) : (definitions.data ?? []).length === 0 ? (
              <EmptyState message="No statuses yet. Create the first one above." />
            ) : (
              <ul className="flex flex-wrap gap-2">
                {(definitions.data ?? []).map((status) => (
                  <li
                    key={status.id}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-cream py-1.5 pl-3 pr-1.5"
                  >
                    <span className="text-sm font-bold text-ink">{status.name}</span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                      {status._count?.assignments ?? 0} assigned
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteStatus(status)}
                      disabled={busy === `status:${status.id}`}
                      aria-label={`Delete ${status.name}`}
                      title="Delete status"
                      className="rounded-full p-1 text-muted hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="Assign a status" sub={meta.hint} />
          <form onSubmit={assignStatus} className="space-y-4 px-5 py-5">
            <SearchSelect
              label={`${meta.label.slice(0, -1)} account`}
              placeholder={`Search ${meta.label.toLowerCase()}...`}
              items={userOptions}
              value={assignUserId}
              onChange={setAssignUserId}
              loading={users.isFetching}
              emptyText={`No ${meta.label.toLowerCase()} found.`}
            />
            <SearchSelect
              label="Status"
              placeholder="Search statuses..."
              items={statusOptions}
              value={assignStatusId}
              onChange={setAssignStatusId}
              disabled={statusOptions.length === 0}
              loading={definitions.isFetching}
              emptyText={statusOptions.length === 0 ? 'Create a status first.' : 'No matching statuses.'}
            />
            {scope === 'TEACHER' && (
              <SearchSelect
                label="Class (optional)"
                placeholder="Search classes..."
                items={classOptions}
                value={assignClassId}
                onChange={setAssignClassId}
                loading={classes.isFetching}
                emptyText="No classes found."
              />
            )}
            {statusOptions.length === 0 && (
              <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Create a status above before assigning it.
              </p>
            )}
            <p className="text-xs text-muted">
              {scope === 'TEACHER'
                ? 'Leave the class blank for a school-wide role like Principal. Pick a class for a Class Teacher status.'
                : `A ${meta.singular} can hold more than one status.`}
            </p>
            {users.isError && (
              <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                Could not load {meta.label.toLowerCase()}.
              </p>
            )}
            <button
              type="submit"
              disabled={busy === 'assign' || !assignUserId || !assignStatusId}
              className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <BadgeCheck size={15} aria-hidden="true" />
              {busy === 'assign' ? 'Assigning...' : 'Assign status'}
            </button>
          </form>
        </Card>
      </div>

      <Card>
        <CardHead
          title="Current assignments"
          sub={`${assignments.data?.length ?? 0} ${meta.singular} status assignment(s)`}
        />
        {assignments.isPending ? (
          <div className="px-5 py-5">
            <LoadingSkeleton rows={4} />
          </div>
        ) : assignments.isError ? (
          <div className="px-5 py-5">
            <ErrorState message="Could not load assignments" onRetry={() => assignments.refetch()} />
          </div>
        ) : (assignments.data ?? []).length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState message={`No ${meta.label.toLowerCase()} statuses assigned yet.`} />
          </div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr>
                  <Th>Person</Th>
                  <Th>Status</Th>
                  <Th>Class</Th>
                  <Th>Assigned</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {(assignments.data ?? []).map((assignment) => (
                  <tr key={assignment.id}>
                    <Td>
                      <span className="font-bold">{assignment.user.user_name}</span>
                      <span className="block text-xs text-muted">{assignment.user.user_email}</span>
                    </Td>
                    <Td>
                      <Pill tone={scopeTone(assignment.status.scope)}>{assignment.status.name}</Pill>
                    </Td>
                    <Td className="text-muted">{assignment.class?.name ?? '-'}</Td>
                    <Td className="text-xs text-muted">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => removeAssignment(assignment)}
                        disabled={busy === `assignment:${assignment.id}`}
                        className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
};
