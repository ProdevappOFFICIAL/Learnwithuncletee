import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, History, Search, Upload, UserRound } from 'lucide-react';
import type { ClassItem, StudentRow } from '@/data/dashboard';
import { detectVariant, initialsOf, VARIANT_SHORT } from './helpers';
import type { ImportedStudentRow, ReportCardImportSummary } from './types';

interface AdminResultGeneratorLeftPanelProps {
  open: boolean;
  onToggle: () => void;
  mode: 'live' | 'import';
  onModeChange: (mode: 'live' | 'import') => void;
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  classFilter: string;
  onClassFilterChange: (value: string) => void;
  classes: ClassItem[];
  students: StudentRow[];
  studentsLoading: boolean;
  selectedStudentId: string;
  onSelectStudent: (student: StudentRow) => void;
  imports: ReportCardImportSummary[];
  importsLoading: boolean;
  selectedImportId: string;
  onSelectImport: (id: string) => void;
  importRows: ImportedStudentRow[];
  importRowsLoading: boolean;
  selectedImportKey: string;
  onSelectImportRow: (row: ImportedStudentRow) => void;
  onOpenImport: () => void;
}

export const AdminResultGeneratorLeftPanel = ({
  open,
  onToggle,
  mode,
  onModeChange,
  search,
  onSearchChange,
  onSearch,
  classFilter,
  onClassFilterChange,
  classes,
  students,
  studentsLoading,
  selectedStudentId,
  onSelectStudent,
  imports,
  importsLoading,
  selectedImportId,
  onSelectImport,
  importRows,
  importRowsLoading,
  selectedImportKey,
  onSelectImportRow,
  onOpenImport,
}: AdminResultGeneratorLeftPanelProps) => {
  const selectedImport = useMemo(
    () => imports.find((item) => item.id === selectedImportId) ?? null,
    [imports, selectedImportId],
  );

  if (!open) {
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border border-line bg-white py-3 print:hidden">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open source panel"
          title="Open source panel"
          className="flex h-9 w-9 items-center justify-center rounded bg-brand-50 text-brand-800 hover:bg-brand-100"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <UserRound size={18} className="text-muted" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Pupils</span>
      </aside>
    );
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border border-line bg-white lg:w-[300px] print:hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">Sources</p>
          <p className="font-display text-sm font-extrabold text-ink">Pupils &amp; imports</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse source panel"
          className="rounded border border-line p-1.5 text-muted hover:border-brand-300 hover:text-ink"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 border-b border-line p-2" role="tablist" aria-label="Result source">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'live'}
          onClick={() => onModeChange('live')}
          className={`min-h-9 rounded px-2 text-xs font-bold ${
            mode === 'live' ? 'bg-brand-900 text-white' : 'text-muted hover:bg-cream hover:text-ink'
          }`}
        >
          Live results
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'import'}
          onClick={() => onModeChange('import')}
          className={`min-h-9 rounded px-2 text-xs font-bold ${
            mode === 'import' ? 'bg-brand-900 text-white' : 'text-muted hover:bg-cream hover:text-ink'
          }`}
        >
          Imported Excel
        </button>
      </div>

      {mode === 'live' ? (
        <>
          <form
            className="space-y-2 border-b border-line px-3 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch();
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={14} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search name or email..."
                aria-label="Search pupils"
                className="min-h-9 w-full rounded border border-line bg-white pl-8 pr-2 text-xs outline-none focus:border-brand-500"
              />
            </div>
            <select
              value={classFilter}
              onChange={(event) => onClassFilterChange(event.target.value)}
              aria-label="Filter by class"
              className="min-h-9 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
            >
              <option value="">All classes</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="min-h-9 w-full rounded bg-brand-500 px-3 text-xs font-bold text-white hover:bg-brand-700"
            >
              Find pupils
            </button>
          </form>

          <div className="scroll-db max-h-[520px] flex-1 overflow-y-auto">
            {studentsLoading ? (
              <p className="px-4 py-5 text-xs text-muted">Loading pupils...</p>
            ) : students.length === 0 ? (
              <p className="px-4 py-5 text-xs text-muted">
                No pupils match this search. Try another name or class.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {students.map((student) => {
                  const variant = detectVariant(
                    student.student?.combination?.name,
                    student.student?.className,
                  );
                  const active = student.id === selectedStudentId;
                  return (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => onSelectStudent(student)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                          active ? 'bg-brand-50' : 'hover:bg-cream'
                        }`}
                      >
                        {student.student?.photoUrl || student.img ? (
                          <img
                            src={student.student?.photoUrl || student.img || ''}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full border border-line object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[10px] font-extrabold text-lime-accent">
                            {initialsOf(student.user_name)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-ink">{student.user_name}</span>
                          <span className="block truncate text-[11px] text-muted">
                            {student.student?.className || 'No class'}
                            {student.student?.combination?.name
                              ? ` · ${student.student.combination.name}`
                              : ''}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-700">
                          {VARIANT_SHORT[variant]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2 border-b border-line px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">
                Import history
              </span>
              <button
                type="button"
                onClick={onOpenImport}
                className="inline-flex min-h-8 items-center gap-1 rounded border border-line px-2 text-[10px] font-bold hover:border-brand-500 hover:text-brand-700"
              >
                <Upload size={11} aria-hidden="true" /> Import
              </button>
            </div>
            {importsLoading ? (
              <p className="text-xs text-muted">Loading imports...</p>
            ) : imports.length === 0 ? (
              <div className="border border-dashed border-line bg-cream px-3 py-4 text-xs text-muted">
                <History size={16} className="mb-1 text-brand-700" aria-hidden="true" />
                No Excel file has been imported yet. Export results from Online or Offline Results, then import the same file here.
              </div>
            ) : (
              <select
                value={selectedImportId}
                onChange={(event) => onSelectImport(event.target.value)}
                aria-label="Select imported workbook"
                className="min-h-9 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
              >
                <option value="">Select an import...</option>
                {imports.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fileName} · {item.studentCount} pupil(s)
                  </option>
                ))}
              </select>
            )}
            {selectedImport && (
              <p className="text-[10px] leading-4 text-muted">
                {selectedImport.rowCount} source row(s), {selectedImport.studentCount} pupil row(s).{' '}
                {selectedImport.source === 'GENERIC' ? 'Generic workbook parsing.' : 'Results export parsing.'}
              </p>
            )}
            {selectedImport?.warnings && selectedImport.warnings.length > 0 && (
              <p className="border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-900">
                {selectedImport.warnings.length} unmatched pupil row(s). Open the import to review.
              </p>
            )}
          </div>

          <div className="scroll-db max-h-[520px] flex-1 overflow-y-auto">
            {importRowsLoading ? (
              <p className="px-4 py-5 text-xs text-muted">Loading imported rows...</p>
            ) : !selectedImportId ? (
              <p className="px-4 py-5 text-xs text-muted">Select an import to see its pupil rows.</p>
            ) : importRows.length === 0 ? (
              <p className="px-4 py-5 text-xs text-muted">This import has no rows.</p>
            ) : (
              <ul className="divide-y divide-line">
                {importRows.map((row) => {
                  const active = row.key === selectedImportKey;
                  const name = row.matchedStudentName || row.userName || row.userEmail || 'Unnamed row';
                  const matched = Boolean(row.matchedStudentId);
                  return (
                    <li key={row.key}>
                      <button
                        type="button"
                        onClick={() => onSelectImportRow(row)}
                        className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                          active ? 'bg-brand-50' : 'hover:bg-cream'
                        }`}
                      >
                        {row.matchedPhotoUrl ? (
                          <img
                            src={row.matchedPhotoUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full border border-line object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[10px] font-extrabold text-lime-accent">
                            {initialsOf(name)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-ink">{name}</span>
                          <span className="block truncate text-[11px] text-muted">
                            {row.matchedClassName || row.className || 'No class'}
                            {row.examName ? ` · ${row.examName}` : ''}
                          </span>
                          <span className="mt-1 block text-[10px] text-muted">
                            {row.subjects.length} subject row(s)
                            {row.overallScore != null ? ` · overall ${Math.round(row.overallScore)}%` : ''}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            matched ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {matched ? 'Matched' : 'Unmatched'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
