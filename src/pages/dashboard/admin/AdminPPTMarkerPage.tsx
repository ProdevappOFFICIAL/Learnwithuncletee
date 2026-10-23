import { Link } from 'react-router-dom';
import { Card, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { ROUTES } from '@/routes/paths';
import { ChevronLeft, Presentation } from 'lucide-react';

export const AdminPPTMarkerPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Academics · PPT Marker"
      title="PPT Marker"
      text="Mark students ppt exam sheet by scanning it."
      actions={<Pill tone="amber">Under development</Pill>}
    />
    <Card className="p-8 text-center sm:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Presentation aria-hidden="true" size={26} />
      </span>
      <h3 className="mt-4 font-display text-xl font-extrabold">Under development</h3>
      <p className="hidden mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">
        The PPT Marker is being built. Soon you will be able to collect slide decks, score them with a
        rubric and publish the marks straight to the results module.
      </p>


      <Link
        to={ROUTES.adminDashboard}
        className="mt-6 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
      >
        <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back to dashboard
      </Link>
    </Card>
  </div >
);
