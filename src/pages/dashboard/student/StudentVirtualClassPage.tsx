import { Video } from 'lucide-react';
import { BannerCard, Card, CardHead, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { virtualClasses } from '@/data/dashboard';

export const StudentVirtualClassPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Virtual class"
      title="Virtual classroom"
      text="Join live lessons, watch recordings and download lesson notes."
    />

    <BannerCard
      eyebrow="Live now · Mathematics"
      title="Quadratic equations revision with Mr. Balogun"
      text="Today · 4:00 PM · 45 mins · JSS 2 Diamond. Join with your full name and keep your microphone muted on entry."
      image="/school.JPG"
      action={
        <>
          <span className="inline-flex min-h-11 items-center gap-2 rounded bg-lime-accent px-5 py-2.5 text-sm font-bold text-brand-900"><Video size={16} aria-hidden="true" /> Join now</span>
          <span className="inline-flex min-h-11 items-center rounded border border-white/50 px-5 py-2.5 text-sm font-bold text-white">Test audio / video</span>
        </>
      }
    />

    <Card>
      <CardHead title="Scheduled classes" sub="This week · Africa/Lagos" />
      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        {virtualClasses.map((v) => (
          <article key={v.id} className="flex flex-col overflow-hidden border border-line bg-white">
            <div
              className="flex h-32 items-end bg-brand-900 p-4"
              style={{ backgroundImage: `linear-gradient(0deg, rgba(4,46,26,.85), rgba(4,58,33,.2)), url(${v.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <Pill tone={v.status === 'Join now' ? 'emerald' : 'ink'}>{v.status}</Pill>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">{v.subject} · {v.teacher}</p>
              <h4 className="mt-1 font-display text-base font-extrabold">{v.topic}</h4>
              <p className="mt-1 text-xs text-muted">{v.time} · {v.duration}</p>
              <div className="mt-4 flex gap-2">
                <button type="button" className="flex-1 rounded bg-brand-500 px-3 py-2.5 text-xs font-bold text-white hover:bg-brand-700">
                  {v.status === 'Join now' ? 'Join class' : 'Set reminder'}
                </button>
                <button type="button" className="rounded border border-line px-3 py-2.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Notes</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>

    <Card>
      <CardHead title="Classroom rules" sub="For a smooth lesson" />
      <ul className="grid gap-3 px-5 py-5 text-sm text-muted sm:grid-cols-2">
        {['Join 5 minutes early with your full name', 'Keep microphone muted unless speaking', 'Use the chat for questions during the lesson', 'Recordings are shared here within 24 hours'].map((rule) => (
          <li key={rule} className="flex gap-2 border-l-2 border-brand-400 pl-3">{rule}</li>
        ))}
      </ul>
    </Card>
  </div>
);
