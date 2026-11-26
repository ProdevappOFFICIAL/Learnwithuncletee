import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { Card, CardHead, PageHeader } from '@/components/dashboard/DashboardUI';
import { Image as ImageIcon, Info, LayoutTemplate } from 'lucide-react';

const sections = [
  { to: '/dashboard/admin/website/banner', title: 'Banner Image', text: 'Homepage hero artwork, headline and call-to-action.', icon: ImageIcon },
  { to: '/dashboard/admin/website/information', title: 'Information', text: 'School name, contacts, addresses and site-wide notices.', icon: Info },
  { to: ROUTES.adminWebsitePages, title: 'Pages', text: 'Home, About, Gallery and every other public page.', icon: LayoutTemplate },
];

export const AdminWebsitePage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Settings · Website"
      title="Website Management"
      text="Everything visitors see on the public website — banners, information and pages."
    />
    <Card>
      <CardHead title="Manage" sub="Pick a section" />
      <div className="grid gap-4 p-5 md:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.title} to={s.to} className="border border-line bg-white p-5 hover:border-brand-500">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <s.icon size={20} aria-hidden="true" />
            </span>
            <span className="mt-3 block font-display text-base font-extrabold">{s.title}</span>
            <span className="mt-1 block text-sm text-muted">{s.text}</span>
          </Link>
        ))}
      </div>
    </Card>
  </div>
);
