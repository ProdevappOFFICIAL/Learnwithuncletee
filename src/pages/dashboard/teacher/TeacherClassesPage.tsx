import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { ArrowRight, BookOpen, ClipboardList, GraduationCap } from 'lucide-react';

interface CourseAssignment {
  id: string;
  subjectId?: string | null;
  classId?: string | null;
  examId?: string | null;
  subject?: { name: string } | null;
  class?: { name: string } | null;
  exam?: { id: string; exam_name: string } | null;
}

const toQuestionsLink = (a: CourseAssignment) => {
  const params = new URLSearchParams();
  if (a.subjectId) params.set('subjectId', a.subjectId);
  if (a.classId) params.set('classId', a.classId);
  if (a.examId) params.set('examId', a.examId);
  const qs = params.toString();
  return `/dashboard/teacher/courses/questions${qs ? `?${qs}` : ''}`;
};

export const TeacherClassesPage = () => {
  const { user } = useAuth();
  const [examFilter, setExamFilter] = useState('all');
  const { data, loading, error, reload } = useResource<CourseAssignment[]>(
    user ? '/course-assignments' : null,
    { teacherId: user?.id, limit: 100 },
  );

  const assignments = data ?? [];
  const examOptions = Array.from(
    new Map(assignments.filter((a) => a.examId && a.exam?.exam_name).map((a) => [a.examId as string, a.exam?.exam_name as string])).entries(),
  );
  const visible = examFilter === 'all' ? assignments : assignments.filter((a) => a.examId === examFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assigned Courses"
        title="Assigned Courses"
        text="Subjects and classes assigned to you. Select one to manage its questions."
      />

      <Card>
        <CardHead title="My courses" sub={`${visible.length} shown`} />
        <div className="border-b border-line px-5 py-4">
          <label className="block max-w-xs text-sm font-semibold">
            Filter by exam
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
            >
              <option value="all">All Exams</option>
              {examOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No assignments yet — an administrator hasn't assigned you to any subject/class combination yet." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((a) => (
              <li key={a.id}>
                <Link to={toQuestionsLink(a)} className="group flex items-center justify-between gap-4 px-5 py-4">
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand-50 text-brand-700 group-hover:bg-brand-500 group-hover:text-white">
                      <ClipboardList size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-extrabold group-hover:text-brand-700">
                        {a.subject?.name || 'Unknown subject'}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen size={11} aria-hidden="true" /> {a.subject?.name || 'N/A'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <GraduationCap size={11} aria-hidden="true" /> {a.class?.name || 'N/A'}
                        </span>
                        {a.exam?.exam_name && (
                          <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                            {a.exam.exam_name}
                          </span>
                        )}
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-brand-700" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
