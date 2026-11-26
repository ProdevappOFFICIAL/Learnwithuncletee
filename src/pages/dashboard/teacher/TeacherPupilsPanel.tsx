import { Search, UserRound, X } from 'lucide-react';
import type { StudentRow } from '@/data/dashboard';
import type { ClassItem } from '@/data/dashboard';
import { detectVariant, initialsOf, VARIANT_SHORT } from '@/pages/dashboard/admin/result-generator/helpers';

interface TeacherPupilsPanelProps {
  open: boolean;
  onToggle: () => void;
  title?: string;
  hint?: string;
  search: string;
  onSearchChange: (value: string) => void;
  classFilter: string;
  onClassFilterChange: (value: string) => void;
  classes: ClassItem[];
  pupils: StudentRow[];
  loading: boolean;
  selectedStudentId: string;
  onSelectStudent: (student: StudentRow) => void;
}

export const TeacherPupilsPanel = ({
  open,
  onToggle,
  title = 'Assigned classes',
  hint = 'You only see pupils in classes assigned to you. Scores outside your assignment stay locked.',
  search,
  onSearchChange,
  classFilter,
  onClassFilterChange,
  classes,
  pupils,
  loading,
  selectedStudentId,
  onSelectStudent,
}: TeacherPupilsPanelProps) => {
  if (!open) return null;

  return (
    <aside className="flex h-full w-full flex-col border border-line bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-4 py-3 xl:static">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">Pupils</p>
          <p className="font-display text-sm font-extrabold text-ink">{title}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close pupil panel"
          className="rounded border border-line p-1.5 text-muted hover:border-brand-300 hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-2 border-b border-line p-3">
        <label className="block">
          <span className="sr-only">Filter by class</span>
          <select
            value={classFilter}
            onChange={(event) => onClassFilterChange(event.target.value)}
            className="min-h-10 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
          >
            <option value="">All my classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </label>
        <label className="relative block">
          <span className="sr-only">Search pupils</span>
          <Search
            size={13}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search pupils..."
            className="min-h-10 w-full rounded border border-line bg-white pl-8 pr-2 text-xs outline-none focus:border-brand-500"
          />
        </label>
        <p className="text-[10px] leading-4 text-muted">{hint}</p>
      </div>

      <div className="scroll-db max-h-none flex-1 overflow-visible xl:max-h-[720px] xl:overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded bg-cream" />
            ))}
          </div>
        ) : pupils.length === 0 ? (
          <p className="p-4 text-xs text-muted">
            No pupils in your assigned classes yet. Ask an administrator to assign you to a class.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {pupils.map((pupil) => {
              const variant = detectVariant(
                pupil.student?.combination?.name,
                pupil.student?.className ?? pupil.class?.name,
              );
              const selected = pupil.id === selectedStudentId;
              return (
                <li key={pupil.id}>
                  <button
                    type="button"
                    onClick={() => onSelectStudent(pupil)}
                    className={`flex w-full items-center gap-2.5 px-3 py-3 text-left transition-colors ${
                      selected ? 'bg-brand-50' : 'hover:bg-cream'
                    }`}
                  >
                    {pupil.student?.photoUrl || pupil.img ? (
                      <img
                        src={pupil.student?.photoUrl || pupil.img || ''}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-brand-100 text-[11px] font-extrabold text-brand-800">
                        {initialsOf(pupil.user_name)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-ink">{pupil.user_name}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted">
                        {pupil.student?.className ?? pupil.class?.name ?? 'No class'} ·{' '}
                        {VARIANT_SHORT[variant]}
                      </span>
                    </span>
                    <UserRound size={14} className="shrink-0 text-muted" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};
