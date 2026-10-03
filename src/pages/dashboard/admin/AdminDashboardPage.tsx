import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { adminOverview } from '@/data/dashboard';
import { BannerCard, Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

export const AdminDashboardPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Admin dashboard"
      title="School at a glance 🏫"
      text="Admissions, fees, staffing and academics — everything that needs your attention today."
      actions={
        <>
          <Link to={ROUTES.adminAdmissions} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            Review admissions (24)
          </Link>
          <Link to={ROUTES.adminNews} className="inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            Post announcement
          </Link>
        </>
      }
    />

    <BannerCard
      eyebrow="2026/27 admissions open"
      title="24 applications waiting for review."
      text="5 entrance interviews are scheduled for today. Publish news, assign classes and notify parents in one click."
      image="/students_playing_games.jfif"
      action={
        <>
          <Link to={ROUTES.adminAdmissions} className="inline-flex min-h-11 items-center rounded bg-lime-accent px-5 py-2.5 text-sm font-bold text-brand-900">Open admissions</Link>
          <Link to={ROUTES.adminFees} className="inline-flex min-h-11 items-center rounded border border-white/50 px-5 py-2.5 text-sm font-bold text-white">View fee collection</Link>
        </>
      }
    />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {adminOverview.stats.map((s) => <StatTile key={s.id} label={s.label} value={s.value} hint={s.hint} />)}
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHead title="Fee collection" sub="First Term 2026/27" link={{ to: ROUTES.adminFees, label: 'Open finance' }} />
        <div className="space-y-4 px-5 py-5">
          {[
            { label: 'Collected — ₦48.2M of ₦62M (78%)', width: '78%', bar: 'bg-brand-500' },
            { label: 'Early Years — 92% collected', width: '92%', bar: 'bg-lime-accent' },
            { label: 'Primary — 81% collected', width: '81%', bar: 'bg-brand-400' },
            { label: 'Secondary — 69% collected', width: '69%', bar: 'bg-amber-400' },
          ].map((row) => (
            <div key={row.label}>
              <p className="text-xs font-bold">{row.label}</p>
              <div className="mt-2 h-2.5 rounded bg-brand-50"><div className={`h-full rounded ${row.bar}`} style={{ width: row.width }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Today's agenda" sub="5 interviews · 2 inspections" link={{ to: ROUTES.adminVirtualClass, label: 'Timetable' }} />
        <ul className="divide-y divide-line">
          {[
            { t: 'Entrance interviews — 9:00 AM', d: 'Hall B · 5 families', tone: 'amber' },
            { t: 'Staff briefing — 11:00 AM', d: 'Conference room · All HODs', tone: 'sky' },
            { t: 'JSS 2 live revision audit — 4:00 PM', d: 'Virtual · Mr. Balogun', tone: 'emerald' },
            { t: 'PTA exco call — 6:00 PM', d: 'Online · Agenda sent', tone: 'violet' },
          ].map((item) => (
            <li key={item.t} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div><p className="text-sm font-bold">{item.t}</p><p className="text-xs text-muted">{item.d}</p></div>
              <Pill tone={item.tone as 'amber'}>Today</Pill>
            </li>
          ))}
        </ul>
      </Card>
    </div>

    <Card>
      <CardHead title="Latest applications" sub="Admissions inbox" link={{ to: ROUTES.adminAdmissions, label: 'View all 24' }} />
      <TableWrap>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead><tr><Th>Applicant</Th><Th>Class sought</Th><Th>Guardian</Th><Th>Status</Th></tr></thead>
          <tbody>
            {[
              { n: 'Adaeze N.', c: 'JSS 1', g: '0803 442 2974', s: 'Interview today' },
              { n: 'Ibrahim S.', c: 'Primary 4', g: '0703 933 4594', s: 'Documents pending' },
              { n: 'Funke A.', c: 'Creche', g: '0805 111 2233', s: 'Offer sent' },
            ].map((r) => (
              <tr key={r.n}>
                <Td className="font-bold">{r.n}</Td><Td>{r.c}</Td><Td className="text-muted">{r.g}</Td>
                <Td><Pill tone={r.s === 'Offer sent' ? 'emerald' : 'amber'}>{r.s}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  </div>
);
