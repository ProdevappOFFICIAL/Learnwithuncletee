import { Card, CardHead, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

const assignments = [
  { title: 'Quadratic equations — exercise 4a', klass: 'JSS 2 Diamond', due: 'Fri, 09 Oct', submitted: '31 / 42', status: 'Collecting' },
  { title: 'Number bases worksheet', klass: 'JSS 1 Gold', due: 'Mon, 05 Oct', submitted: '38 / 40', status: 'Grading' },
  { title: 'Simultaneous equations', klass: 'JSS 3 Emerald', due: 'Submitted 28 Sep', submitted: '46 / 46', status: 'Graded' },
];

export const TeacherAssignmentsPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Assignments"
      title="Assignments"
      text="Create classwork, track submissions and publish grades. Pupils see feedback instantly."
      actions={
        <button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
          + New assignment
        </button>
      }
    />

    <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Create assignment</p>
        <h3 className="mt-2 font-display text-lg font-extrabold">New classwork</h3>
        <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <label className="block text-sm font-semibold">Title<input required placeholder="e.g. Quadratic equations — exercise 5b" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Class
              <select className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm"><option>JSS 2 Diamond</option><option>JSS 1 Gold</option><option>JSS 3 Emerald</option></select>
            </label>
            <label className="block text-sm font-semibold">Due date<input type="date" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          </div>
          <label className="block text-sm font-semibold">Instructions<textarea rows={3} placeholder="What should pupils do and submit?" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" /></label>
          <button type="submit" className="min-h-11 w-full rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">Publish to class</button>
        </form>
      </Card>

      <Card>
        <CardHead title="My assignments" sub="Term · Mathematics" />
        <TableWrap>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr><Th>Title</Th><Th>Submitted</Th><Th>Status</Th></tr></thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.title}>
                  <Td><span className="font-bold">{a.title}</span><span className="block text-xs text-muted">{a.klass} · Due {a.due}</span></Td>
                  <Td className="font-semibold">{a.submitted}</Td>
                  <Td><Pill tone={a.status === 'Graded' ? 'emerald' : a.status === 'Grading' ? 'sky' : 'amber'}>{a.status}</Pill></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
          <button type="button" className="rounded bg-brand-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700">Grade pending (12)</button>
          <button type="button" className="rounded border border-line px-4 py-2.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Export marks</button>
        </div>
      </Card>
    </div>
  </div>
);
