import { Video } from 'lucide-react';
import { BannerCard, Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import type { LessonData } from '@/data/dashboard';

export const StudentVirtualClassPage = () => {
  const live = useResource<LessonData[]>('/virtual-lessons/live');
  const all = useResource<LessonData[]>('/virtual-lessons', { upcoming: '1' });

  const liveLesson = live.data?.[0];
  const lessons = all.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Virtual class"
        title="Virtual classroom"
        text="Join live lessons, watch recordings and download lesson notes."
      />

      {liveLesson && (
        <BannerCard
          eyebrow={`Live now · ${liveLesson.subject}`}
          title={`${liveLesson.topic} with ${liveLesson.teacher?.user_name ?? 'your teacher'}`}
          text={`${new Date(liveLesson.startsAt).toLocaleString()} · ${liveLesson.durationMins} mins · ${liveLesson.className}. Join with your full name.`}
          image={liveLesson.coverUrl ?? '/school.JPG'}
          action={
            <a href={liveLesson.joinUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded bg-lime-accent px-5 py-2.5 text-sm font-bold text-brand-900">
              <Video size={16} aria-hidden="true" /> Join now
            </a>
          }
        />
      )}

      {all.loading ? (
        <LoadingSkeleton rows={4} />
      ) : all.error || !all.data ? (
        <ErrorState message={all.error ?? 'No data'} onRetry={all.reload} />
      ) : (
        <Card>
          <CardHead title="Scheduled classes" sub="Upcoming · Africa/Lagos" />
          {lessons.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No classes scheduled yet." /></div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {lessons.map((v) => (
                <article key={v.id} className="flex flex-col overflow-hidden border border-line bg-white">
                  <div
                    className="flex h-32 items-end bg-brand-900 p-4"
                    style={{ backgroundImage: `linear-gradient(0deg, rgba(4,46,26,.85), rgba(4,58,33,.2)), url(${v.coverUrl ?? '/school.JPG'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    <Pill tone={v.status === 'Live' ? 'emerald' : 'ink'}>{v.status}</Pill>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">{v.subject} · {v.teacher?.user_name ?? ''}</p>
                    <h4 className="mt-1 font-display text-base font-extrabold">{v.topic}</h4>
                    <p className="mt-1 text-xs text-muted">{new Date(v.startsAt).toLocaleString()} · {v.durationMins} mins</p>
                    <div className="mt-4 flex gap-2">
                      <a href={v.joinUrl} target="_blank" rel="noreferrer" className="flex-1 rounded bg-brand-500 px-3 py-2.5 text-center text-xs font-bold text-white hover:bg-brand-700">
                        {v.status === 'Live' ? 'Join class' : 'Open link'}
                      </a>
                      {v.notesUrl && <a href={v.notesUrl} target="_blank" rel="noreferrer" className="rounded border border-line px-3 py-2.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Notes</a>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      )}

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
};
