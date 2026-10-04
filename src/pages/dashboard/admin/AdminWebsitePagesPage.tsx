import { Link } from 'react-router-dom';
import { Card, CardHead, PageHeader } from '@/components/dashboard/DashboardUI';
import { FileText, Home, Image as ImageIcon } from 'lucide-react';

const pages = [
  { to: '/dashboard/admin/website/home', title: 'Home Page', text: 'Hero, stats, programmes and testimonials.', icon: Home },
  { to: '/dashboard/admin/website/about', title: 'About Page', text: 'Story, mission, vision and leadership.', icon: FileText },
  { to: '/dashboard/admin/website/gallery', title: 'Gallery Page', text: 'Albums and photos shown publicly.', icon: ImageIcon },
  { to: '/dashboard/admin/website/other', title: 'Other Pages', text: 'Admissions, Academics, Student Life, Services, Contact.', icon: FileText },
];

export const AdminWebsitePagesPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Settings · Website · Pages"
      title="Pages"
      text="Each public page gets its own management section."
    />
    <Card>
      <CardHead title="Manage" sub="Pick a page" />
      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        {pages.map((p) => (
          <Link key={p.title} to={p.to} className="border border-line bg-white p-5 hover:border-brand-500">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <p.icon size={20} aria-hidden="true" />
            </span>
            <span className="mt-3 block font-display text-base font-extrabold">{p.title}</span>
            <span className="mt-1 block text-sm text-muted">{p.text}</span>
          </Link>
        ))}
      </div>
    </Card>
  </div>
);
