import { Link, useParams } from 'react-router-dom';
import { Card, PageHeader } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/routes/paths';
import { ChevronLeft, LayoutTemplate } from 'lucide-react';

/**
 * Temporary homes for website sections whose full CMS module isn't built yet.
 * Each entry is replaced by a real page when its module lands — routes stay.
 */

const WEBSITE_SECTIONS: Record<string, { title: string; text: string }> = {
  banner: { title: 'Banner Image', text: 'Manage the homepage hero banner — artwork, headline and call-to-action. Website controls live here once the CMS module is built.' },
  information: { title: 'Information', text: 'School name, contacts, addresses and announcement bars shown across the public website.' },
  home: { title: 'Home Page', text: 'Edit the homepage sections — hero, stats, programmes and testimonials.' },
  about: { title: 'About Page', text: 'Edit the story, mission, vision and leadership sections of the About page.' },
  gallery: { title: 'Gallery Page', text: 'Curate albums and photos shown in the public gallery.' },
  other: { title: 'Other Pages', text: 'Admissions, Academics, Student Life, Services, Contact and any extra pages.' },
};

const Shell = ({
  eyebrow,
  title,
  text,
  icon,
}: {
  eyebrow: string;
  title: string;
  text: string;
  icon: React.ReactNode;
}) => (
  <div className="space-y-6">
    <PageHeader eyebrow={eyebrow} title={title} text={text} />
    <Card className="p-8 text-center sm:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">{icon}</span>
      <h3 className="mt-4 font-display text-xl font-extrabold">Coming soon</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        This section is reserved in the sidebar and will become fully functional when its module is built. Existing pages keep working meanwhile.
      </p>
      <Link to={ROUTES.adminDashboard} className="mt-6 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
        <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back to dashboard
      </Link>
    </Card>
  </div>
);

export const WebsiteSectionPage = () => {
  const { section = '' } = useParams<{ section: string }>();
  const meta = WEBSITE_SECTIONS[section] ?? { title: 'Website Management', text: 'Banners, information and pages of the public website.' };
  return (
    <Shell
      eyebrow="Settings · Website Management"
      title={meta.title}
      text={meta.text}
      icon={<LayoutTemplate aria-hidden="true" size={24} />}
    />
  );
};
