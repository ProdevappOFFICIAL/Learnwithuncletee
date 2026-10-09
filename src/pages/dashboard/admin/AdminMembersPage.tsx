import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { Card, CardHead, PageHeader, Pill, StatTile } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { IdCard, UserCog, UserPlus, Users } from 'lucide-react';

export const AdminMembersPage = () => {
  const students = useResource<unknown[]>('/students', { limit: 1 });
  const staff = useResource<unknown[]>('/staff', { limit: 1 });
  const users = useResource<Array<{ active: boolean }>>('/users', { limit: 100 });
  const pending = (users.data ?? []).filter((u) => !u.active).length;

  const cards = [
    { to: ROUTES.adminStudents, title: 'Students', text: 'Directory, enrolment, guardians and fee status.', icon: Users },
    { to: ROUTES.adminTeachers, title: 'Teachers', text: 'Staff directory, departments and subjects.', icon: UserCog },
    { to: ROUTES.adminMembersList, title: 'Members', text: 'General member accounts with email login.', icon: IdCard },
    { to: ROUTES.adminMembersList, title: 'Add Member', text: 'Create a member account + login details.', icon: UserPlus },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Members"
        text="Everyone in the school — pupils, teachers, members and pending signups."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Students" value={students.meta ? String(students.meta.total) : '—'} hint="Enrolled pupils" />
        <StatTile label="Teachers & Staff" value={staff.meta ? String(staff.meta.total) : '—'} hint="Active staff" />
        <StatTile label="Pending approvals" value={String(pending)} hint="Awaiting activation" />
      </div>

      <Card>
        <CardHead title="Manage" sub="Pick a section" />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.title} to={c.to} className="border border-line bg-white p-5 hover:border-brand-500">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <c.icon size={20} aria-hidden="true" />
              </span>
              <span className="mt-3 flex items-center justify-between gap-2">
                <span className="font-display text-base font-extrabold">{c.title}</span>
                {c.title === 'Add Member' && <Pill tone="emerald">Action</Pill>}
              </span>
              <span className="mt-1 block text-sm text-muted">{c.text}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};
