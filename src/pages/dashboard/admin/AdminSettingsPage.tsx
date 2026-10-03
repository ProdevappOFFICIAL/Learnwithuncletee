import { Card, CardHead, PageHeader } from '@/components/dashboard/DashboardUI';

const input = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const AdminSettingsPage = () => (
  <div className="space-y-6">
    <PageHeader eyebrow="Control" title="Settings" text="School profile, session, roles and portal preferences." />
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">School profile</p>
        <h3 className="mt-2 font-display text-lg font-extrabold">Identity & contacts</h3>
        <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <label className="block text-sm font-semibold">School name<input defaultValue="Learnwithuncletee" className={input} /></label>
          <label className="block text-sm font-semibold">Address<input defaultValue="5 Unity Avenue, Valentino Ondo" className={input} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Phone<input defaultValue="+2347039334594" className={input} /></label>
            <label className="block text-sm font-semibold">Email<input defaultValue="info@learnwithuncletee.org" className={input} /></label>
          </div>
          <button type="submit" className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">Save changes</button>
        </form>
      </Card>
      <div className="space-y-5">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Session</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">2026/27 · First Term</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[['Term dates', '15 Sep – 12 Dec 2026'], ['Mid-term break', '27 – 31 Oct 2026'], ['Portal access', 'Students · Parents · Teachers · Admin']].map(([k, v]) => (
              <p key={k} className="flex justify-between gap-3 border-b border-line pb-3"><span className="font-bold">{k}</span><span className="text-muted">{v}</span></p>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="Roles & access" sub="Who can do what" />
          <ul className="space-y-3 px-5 py-5 text-sm">
            {[['Administrator', 'Full access — all records & settings'], ['Teacher', 'Classes, assignments, results entry'], ['Student', 'Fees, results, assignments, virtual class'], ['Parent', 'Mirror of ward — fees & results']].map(([role, desc]) => (
              <li key={role} className="flex items-center justify-between gap-3 border border-line p-3">
                <span><span className="font-bold">{role}</span><span className="block text-xs text-muted">{desc}</span></span>
                <button type="button" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Manage</button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  </div>
);
