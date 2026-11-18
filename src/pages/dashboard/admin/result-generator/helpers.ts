import { REPORT_CARD_VARIANTS, type ReportSubject } from '@/components/ui/ReportCard';
import type { StudentRow } from '@/data/dashboard';
import type {
  GeneratedReportCard,
  GeneratedSubject,
  ReportCardDraft,
  ReportVariant,
  SourceSubject,
} from './types';

export const VARIANT_LABELS: Record<ReportVariant, string> = {
  junior: 'Junior Section',
  'senior-science': 'Senior Science Section',
  'senior-commerce': 'Senior Commercial Section',
  'senior-art': 'Senior Art Section',
};

export const VARIANT_SHORT: Record<ReportVariant, string> = {
  junior: 'Junior',
  'senior-science': 'Science',
  'senior-commerce': 'Commercial',
  'senior-art': 'Art',
};

export const detectVariant = (
  combinationName?: string | null,
  className?: string | null,
): ReportVariant => {
  const source = `${combinationName ?? ''} ${className ?? ''}`.toUpperCase();
  if (source.includes('SCIENCE')) return 'senior-science';
  if (source.includes('COMMERCE') || source.includes('COMMERCIAL')) return 'senior-commerce';
  if (/\bART(S)?\b/.test(source)) return 'senior-art';
  if (/\bJSS\b|\bJS\b|\bJUNIOR\b|\bGSS\b/.test(source)) return 'junior';
  return 'junior';
};

export const presetSubjects = (variant: ReportVariant): GeneratedSubject[] => {
  const preset = REPORT_CARD_VARIANTS.find((item) => item.id === variant) ?? REPORT_CARD_VARIANTS[0];
  return preset.subjects.map((subject, index) => ({
    position: index,
    lines: [...subject.lines],
    sourceSubjectId: null,
    sourceSubjectName: null,
    cbt1: null,
    cbt2: null,
    exam: null,
    lastCum: null,
    overall: null,
  }));
};

export const currentSession = () => {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() + 1 >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

export const currentTerm = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 9 && month <= 12) return 'First Term';
  if (month >= 1 && month <= 3) return 'Second Term';
  return 'Third Term';
};

/** Saturday and Sunday are excluded from the school-day count on the server. */
export const termDateRange = (term: string, session: string) => {
  const startYear = Number(session.split('/')[0]);
  const year = Number.isFinite(startYear) ? startYear : new Date().getFullYear();
  if (/first/i.test(term)) return { from: `${year}-09-01`, to: `${year}-12-20` };
  if (/second/i.test(term)) return { from: `${year + 1}-01-05`, to: `${year + 1}-03-31` };
  return { from: `${year + 1}-04-20`, to: `${year + 1}-07-31` };
};

export const blankDraft = (
  studentId: string,
  variant: ReportVariant,
  session: string,
  term: string,
  student?: StudentRow | null,
): ReportCardDraft => {
  const profile = student?.student;
  const range = termDateRange(term, session);
  return {
    studentId,
    studentEmail: student?.user_email ?? '',
    combinationName: profile?.combination?.name ?? '',
    variant,
    session,
    term,
    studentName: student?.user_name ?? '',
    admissionNumber: profile?.studentCode ?? '',
    className: profile?.className ?? '',
    photoUrl: profile?.photoUrl ?? student?.img ?? '',
    attendanceFrom: range.from,
    attendanceTo: range.to,
    affectivePuntuality: '',
    affectiveRespect: '',
    psychomotorHandwriting: '',
    psychomotorRecreation: '',
    classTeacherRemark: '',
    principalComment: '',
    newsLetter: '',
    nextTermBegins: '',
    subjects: presetSubjects(variant),
  };
};

export const cardToDraft = (card: GeneratedReportCard): ReportCardDraft => {
  const subjects = card.subjects.length
    ? card.subjects.map((subject) => ({ ...subject, lines: [...subject.lines] }))
    : presetSubjects(card.variant);
  return {
    studentId: card.studentId,
    studentEmail: card.student?.user_email ?? '',
    combinationName: card.student?.combinationName ?? '',
    variant: card.variant,
    session: card.session,
    term: card.term,
    studentName: card.studentName,
    admissionNumber: card.admissionNumber,
    className: card.className,
    photoUrl: card.photoUrl,
    present: card.present ?? undefined,
    absent: card.absent ?? undefined,
    totalSchoolDays: card.totalSchoolDays ?? undefined,
    attendanceFrom: card.attendanceFrom ?? undefined,
    attendanceTo: card.attendanceTo ?? undefined,
    affectivePuntuality: card.affective.puntuality,
    affectiveRespect: card.affective.respect,
    psychomotorHandwriting: card.psychomotor.handwriting,
    psychomotorRecreation: card.psychomotor.recreation,
    classTeacherRemark: card.classTeacherRemark,
    principalComment: card.principalComment,
    newsLetter: card.newsLetter,
    nextTermBegins: card.nextTermBegins,
    subjects: subjects.map((subject) => recalcSubject(subject, {})),
  };
};

export const draftPayload = (draft: ReportCardDraft) => ({
  studentId: draft.studentId,
  variant: draft.variant,
  session: draft.session,
  term: draft.term,
  studentName: draft.studentName,
  admissionNumber: draft.admissionNumber,
  className: draft.className,
  photoUrl: draft.photoUrl,
  present: draft.present ?? null,
  absent: draft.absent ?? null,
  totalSchoolDays: draft.totalSchoolDays ?? null,
  attendanceFrom: draft.attendanceFrom ?? null,
  attendanceTo: draft.attendanceTo ?? null,
  affective: {
    puntuality: draft.affectivePuntuality,
    respect: draft.affectiveRespect,
  },
  psychomotor: {
    handwriting: draft.psychomotorHandwriting,
    recreation: draft.psychomotorRecreation,
  },
  classTeacherRemark: draft.classTeacherRemark,
  principalComment: draft.principalComment,
  newsLetter: draft.newsLetter,
  nextTermBegins: draft.nextTermBegins,
  subjects: draft.subjects.map((subject, index) => ({
    position: index,
    lines: subject.lines,
    sourceSubjectId: subject.sourceSubjectId ?? null,
    sourceSubjectName: subject.sourceSubjectName ?? null,
    cbt1: subject.cbt1 ?? null,
    cbt2: subject.cbt2 ?? null,
    exam: subject.exam ?? null,
    lastCum: subject.lastCum ?? null,
  })),
});

export const draftToReportSubjects = (draft: ReportCardDraft): ReportSubject[] =>
  draft.subjects.map((subject) => ({
    lines: subject.lines,
    cbt1: subject.cbt1 ?? undefined,
    cbt2: subject.cbt2 ?? undefined,
    exam: subject.exam ?? undefined,
    lastCum: subject.lastCum ?? undefined,
    overall: subject.overall ?? undefined,
  }));

export const recalcSubject = (
  subject: GeneratedSubject,
  patch: Partial<GeneratedSubject>,
): GeneratedSubject => {
  const next = { ...subject, ...patch };
  const cbt1 = next.cbt1;
  const cbt2 = next.cbt2;
  const exam = next.exam;
  const cTotal = cbt1 != null && cbt2 != null ? cbt1 + cbt2 : null;
  const total = cTotal != null && exam != null ? cTotal + exam : null;
  // First term (and any row without a previous cumulative) uses Total as
  // Overall. Once Last Cum. exists, Overall is the average of the two.
  next.overall = total != null ? (next.lastCum != null ? Math.round((total + next.lastCum) / 2) : total) : null;
  return next;
};

export const previousTermOf = (term: string) => {
  if (/second/i.test(term)) return 'First Term';
  if (/third/i.test(term)) return 'Second Term';
  return null;
};

/**
 * Fill Last Cum. from the previous term's Overall Total. First term always
 * starts with a dash. When `onlyBlank` is true (an already-saved card), any
 * value the user has typed is preserved.
 */
export const applyPreviousTermScores = (
  draft: ReportCardDraft,
  previousCard: GeneratedReportCard | null,
  onlyBlank = false,
): ReportCardDraft => {
  const previousSubjects = previousCard?.subjects ?? [];
  const firstTerm = /first/i.test(draft.term);
  return {
    ...draft,
    subjects: draft.subjects.map((subject, index) => {
      if (firstTerm) {
        return recalcSubject(subject, onlyBlank ? {} : { lastCum: null });
      }
      const previous =
        previousSubjects.find(
          (item) => item.lines.join(' ').toLowerCase() === subject.lines.join(' ').toLowerCase(),
        ) ?? previousSubjects[index];
      const previousOverall = previous?.overall ?? null;
      const lastCum =
        onlyBlank && subject.lastCum != null
          ? subject.lastCum
          : previousOverall;
      return recalcSubject(subject, { lastCum });
    }),
  };
};

export const cTotalOf = (subject: GeneratedSubject) =>
  subject.cbt1 != null && subject.cbt2 != null ? subject.cbt1 + subject.cbt2 : null;

export const totalOf = (subject: GeneratedSubject) => {
  const cTotal = cTotalOf(subject);
  return cTotal != null && subject.exam != null ? cTotal + subject.exam : null;
};

const normalizeWords = (value: string) =>
  value
    .toUpperCase()
    .replace(/^\s*\d+[.)]?\s*/, '')
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\b(F|FURTHER|MATHS|MATHEMATICS)\b/g, ' MATHEMATICS ')
    .replace(/\b(ST|SAINT)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const SUBJECT_ALIASES: Array<[RegExp, string]> = [
  [/CHRISTAIN|CHRISTIAN|C R S|CRS|RELIGIOUS/, 'RELIGIOUS STUDIES'],
  [/CULTURAL.*CREATIVE|C C A|CCA/, 'CULTURAL CREATIVE ARTS'],
  [/DIGITAL|TECHNOLOGY|TECHNOLOGIES|COMPUTER|ICT/, 'DIGITAL TECHNOLOGIES'],
  [/PHYSICAL.*HEALTH|P H E|PHE/, 'PHYSICAL HEALTH EDUCATION'],
  [/SOCIAL.*CITIZEN|CIVIC/, 'CIVIC EDUCATION'],
  [/INTERMEDIATE SCIENCE|BASIC SCIENCE/, 'BASIC SCIENCE'],
  [/ACCOUNTING|ACCOUNT/, 'ACCOUNTING'],
  [/COMMERCE|COMMERCIAL/, 'COMMERCE'],
  [/LITERATURE|LITERARY/, 'LITERATURE'],
  [/AGRICULTURE|AGRIC/, 'AGRICULTURE'],
  [/ECONOMICS|ECONOMIC/, 'ECONOMICS'],
  [/GOVERNMENT|GOVT/, 'GOVERNMENT'],
  [/GEOGRAPHY|GEO/, 'GEOGRAPHY'],
  [/BUSINESS/, 'BUSINESS STUDIES'],
  [/HISTORY/, 'HISTORY'],
  [/YORUBA/, 'YORUBA'],
  [/FRENCH/, 'FRENCH'],
  [/TRADE/, 'TRADE'],
  [/ENGLISH/, 'ENGLISH'],
  [/MATH/, 'MATHEMATICS'],
  [/PHYSICS/, 'PHYSICS'],
  [/CHEMISTRY/, 'CHEMISTRY'],
  [/BIOLOGY/, 'BIOLOGY'],
  [/MARKETING/, 'MARKETING'],
];

const aliasOf = (value: string) => {
  const normalized = normalizeWords(value);
  for (const [pattern, alias] of SUBJECT_ALIASES) {
    if (pattern.test(normalized)) return alias;
  }
  return normalized;
};

export const subjectMatches = (reportLines: string[], sourceName: string) => {
  const report = aliasOf(reportLines.join(' '));
  const source = aliasOf(sourceName);
  if (!report || !source) return 0;
  if (report === source || report.includes(source) || source.includes(report)) return 100;
  const reportWords = new Set(report.split(' ').filter((word) => word.length > 2));
  const sourceWords = new Set(source.split(' ').filter((word) => word.length > 2));
  let overlap = 0;
  for (const word of reportWords) if (sourceWords.has(word)) overlap += 1;
  return overlap * 20;
};

export const bestSubjectMatch = (subject: GeneratedSubject, sources: SourceSubject[]) => {
  let best: { source: SourceSubject; score: number } | null = null;
  for (const source of sources) {
    const score = subjectMatches(subject.lines, source.name);
    if (!best || score > best.score) best = { source, score };
  }
  return best && best.score >= 20 ? best.source : null;
};

export const sourcePercentage = (source: SourceSubject) => {
  if (source.percentage != null) return source.percentage;
  if (source.correct != null && source.total != null && source.total > 0) {
    return (source.correct / source.total) * 100;
  }
  return null;
};

export const mappedScore = (
  source: SourceSubject,
  component: 'cbt1' | 'cbt2' | 'exam' | 'lastCum',
) => {
  if (component === 'cbt1' && source.cbt1 != null) return source.cbt1;
  if (component === 'cbt2' && source.cbt2 != null) return source.cbt2;
  if (component === 'exam' && source.exam != null) return source.exam;
  if (component === 'lastCum' && source.lastCum != null) return source.lastCum;
  const percentage = sourcePercentage(source);
  if (percentage == null) return null;
  if (component === 'cbt1' || component === 'cbt2') return Math.round((percentage / 100) * 20);
  if (component === 'exam') return Math.round((percentage / 100) * 60);
  return Math.round(percentage);
};

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part.replace('.', '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

export const clampNumber = (value: string, max: number) => {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(max, parsed));
};
