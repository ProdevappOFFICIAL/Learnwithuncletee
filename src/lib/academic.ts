import { useQuery } from '@tanstack/react-query';
import { apiGet } from './api';
import { LIST_GC, LIST_STALE } from './pagedQuery';

export const ACADEMIC_TERMS = ['First Term', 'Second Term', 'Third Term'] as const;
export type AcademicTerm = (typeof ACADEMIC_TERMS)[number];

export interface TermDateRange {
  from: string;
  to: string;
}

/** A pupil at or above a boundary gets that grade. */
export interface GradingScale {
  a: number;
  b: number;
  c: number;
  d: number;
  f: number;
}

export interface AcademicSettings {
  session: string;
  term: AcademicTerm;
  termDates: Record<AcademicTerm, TermDateRange>;
  grading: GradingScale;
  sessionOptions: string[];
}

export const ACADEMIC_KEY = ['academic-settings'] as const;

/** Current session/term, term dates and grading bands from Settings. */
export const useAcademicSettings = () =>
  useQuery({
    queryKey: ACADEMIC_KEY,
    queryFn: () => apiGet<AcademicSettings>('/settings/academic'),
    staleTime: LIST_STALE,
    gcTime: LIST_GC,
  });

export const gradeBandFor = (score: number, grading: GradingScale) => {
  if (score >= grading.a) return { grade: 'A', remark: 'Excellent' };
  if (score >= grading.b) return { grade: 'B', remark: 'Very good' };
  if (score >= grading.c) return { grade: 'C', remark: 'Good' };
  if (score >= grading.d) return { grade: 'D', remark: 'Pass' };
  return { grade: 'F', remark: 'Fail' };
};

/** Human summary used in reports/legacy settings. */
export const gradingSummary = (grading: GradingScale) =>
  `A ≥ ${grading.a} · B ≥ ${grading.b} · C ≥ ${grading.c} · D ≥ ${grading.d} · F < ${grading.d}`;

export const termRangeOf = (settings: AcademicSettings | undefined, term: string | null | undefined): TermDateRange | null => {
  if (!settings) return null;
  const match = ACADEMIC_TERMS.find((item) => item.toLowerCase() === String(term ?? '').toLowerCase());
  return settings.termDates[match ?? settings.term] ?? null;
};
