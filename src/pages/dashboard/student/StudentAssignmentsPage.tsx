import { Card, CardHead, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { studentAssignments } from '@/data/dashboard';

export const StudentAssignmentsPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Assignments"
      title="Assignments"
      text="Submit classwork before the due date. Graded work shows your score and teacher feedback."
    />

    <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Submit assignment</p>
        <h3 className="mt-2 font-display text-lg font-extrabold">Upload your work</h3>
        <p className="mt-1 text-sm text-muted">PDF, DOC or clear photos (max 10MB). Submissions are timestamped.</p>
        <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <label className="block text-sm font-semibold">Assignment
            <select className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500">
              {studentAssignments.filter((a) => a.status === 'Pending').map((a) => <option key={a.id}>{a.subject} — {a.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Upload file
            <input type="file" className="mt-2 w-full rounded border border-dashed border-line bg-cream px-3 py-6 text-sm text-muted" />
          </label>
          <label className="block text-sm font-semibold">Note for teacher (optional)
            <textarea rows={3} placeholder="Anything your teacher should know…" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
          </label>
          <button type="submit" className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">Submit assignment</button>
        </form>
      </Card>

      <Card>
        <CardHead title="All assignments" sub={`${studentAssignments.length} this term`} />
        <ul className="divide-y divide-line">
          {studentAssignments.map((a) => (
            <li key={a.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">{a.subject} · {a.teacher}</p>
                  <h4 className="mt-1 font-display text-sm font-extrabold">{a.title}</h4>
                  <p className="mt-1 text-xs text-muted">Due {a.due}</p>
                </div>
                <Pill tone={a.status === 'Pending' ? 'amber' : a.status === 'Submitted' ? 'sky' : 'emerald'}>{a.status}</Pill>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" className="rounded border border-line px-3 py-2 text-xs font-bold hover:border-brand-500 hover:text-brand-700">View details</button>
                {a.status === 'Pending' && <button type="button" className="rounded bg-brand-900 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700">Submit now</button>}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  </div>
);
