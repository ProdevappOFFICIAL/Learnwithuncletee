import { REPORT_CARD_VARIANTS, type ReportSubject } from '@/components/ui/ReportCard';
import type { StudentRow } from '@/data/dashboard';
import type {
  GeneratedReportCard,
  GeneratedSubject,
  ReportCardDraft,
  ReportVariant,
  SourceResult,
  SourceSubject,
} from './types';

/** Canonical template subject -> extra acronyms/names added by staff. */
export type SubjectAliasMap = Record<string, string[]>;

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

/**
 * Build the printable rows from the pupil's actual result subjects for the
 * current session/term. Preset subject names are only a fallback when the
 * pupil has no result subjects yet.
 */
export const subjectsFromSources = (sources: SourceResult[]): GeneratedSubject[] => {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    for (const subject of source.subjects) {
      const name = String(subject.name ?? '').trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
  }
  names.sort((a, b) => a.localeCompare(b));
  return names.map((name, index) => ({
    position: index,
    lines: [`${index + 1}. ${name.toUpperCase()}`],
    sourceSubjectId: null,
    sourceSubjectName: name,
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
  aliases?: SubjectAliasMap,
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
          (item) => subjectMatches(subject.lines, item.lines.join(' '), aliases) >= 40,
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
    // Exam-engine subjects carry a class suffix (BUS1, CCA2, DIT1, …).
    // Strip it from code-like tokens so they resolve to their acronym.
    .replace(/\b([A-Z]{2,})[0-9]+\b/g, '$1')
    .replace(/\b(ST|SAINT)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Human-friendly storage form for a staff-added acronym (punctuation removed). */
export const normalizeSubjectAlias = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Canonical full-name aliases only. Acronyms (ENG, BUS, CHS, …) are NOT fixed
 * here: staff add them in the Subject Mapper and the saved map is used for
 * every auto-map.
 */
const SUBJECT_ALIASES: Array<[RegExp, string]> = [
  [/\bACCOUNT(?:ING)?\b/, 'ACCOUNTING'],
  [/\bAGRICULTURE\b/, 'AGRICULTURE'],
  [/\bBIOLOGY\b/, 'BIOLOGY'],
  [/\bBUSINESS(?:\s+STUDIES)?\b/, 'BUSINESS STUDIES'],
  [/\bCHEMISTRY\b/, 'CHEMISTRY'],
  [
    /\bCHRIST(?:AIN|IAN).*RELIGIOUS.*\b|\bRELIGIOUS(?:\s+STUDIES)?\b/,
    'CHRISTIAN RELIGIOUS STUDIES',
  ],
  [/\bCIVIC(?:\s+EDUCATION)?\b/, 'CIVIC EDUCATION'],
  [/\bCOMMERCE\b|\bCOMMERCIAL\b/, 'COMMERCE'],
  [/\bCULTURAL.*CREATIVE.*\b/, 'CULTURAL AND CREATIVE ARTS'],
  [/\bDIGITAL.*TECHNOLOG(?:Y|IES)\b/, 'DIGITAL TECHNOLOGIES'],
  [/\bECONOMIC(?:S)?\b/, 'ECONOMICS'],
  [/\bENGLISH\b/, 'ENGLISH'],
  [/\bFRENCH(?:\s+LANGUAGE)?\b/, 'FRENCH LANGUAGE'],
  [/\bGEOGRAPHY\b/, 'GEOGRAPHY'],
  [/\bGOVERNMENT\b/, 'GOVERNMENT'],
  [/\bHISTORY\b/, 'HISTORY'],
  [/\bINTERMEDIATE.*SCIENCE\b|\bBASIC.*SCIENCE\b/, 'INTERMEDIATE SCIENCE'],
  [/\bLITERATURE\b|\bLITERARY\b/, 'LITERATURE'],
  [/\bMARKETING\b/, 'MARKETING'],
  [/\bMATHEMATICS\b|\bMATHS\b/, 'MATHEMATICS'],
  [/\bPHYSICAL.*HEALTH.*\b/, 'PHYSICAL AND HEALTH EDUCATION'],
  [/\bPHYSICS\b/, 'PHYSICS'],
  [/\bSOCIAL.*CITIZEN.*\b/, 'SOCIAL AND CITIZENSHIP STUDIES'],
  [/\bTRADE\b/, 'TRADE'],
  [/\bYORUBA(?:\s+LANGUAGE)?\b/, 'YORUBA LANGUAGE'],
];

const aliasOf = (value: string, aliases?: SubjectAliasMap) => {
  const normalized = normalizeWords(value);

  // Staff-added mappings take precedence: e.g. EGS/EAG -> ENGLISH.
  for (const [canonical, aliasList] of Object.entries(aliases ?? {})) {
    const canonicalNormalized = normalizeWords(canonical);
    if (!canonicalNormalized) continue;
    if (normalized === canonicalNormalized) return canonicalNormalized;
    if (
      (aliasList ?? []).some((alias) => {
        const aliasNormalized = normalizeWords(alias);
        return (
          aliasNormalized &&
          (normalized === aliasNormalized || normalized.startsWith(`${aliasNormalized} `))
        );
      })
    ) {
      return canonicalNormalized;
    }
  }

  // Further mathematics is a separate subject from plain mathematics. Check
  // this before the generic MATHEMATICS alias so "FURTHER MATHS", "F/MATHS"
  // and "MTH1" do not collapse into "MATHEMATICS".
  if (
    /\bFURTHER\b/.test(normalized) ||
    /\bF\s*MAT(?:HS?|HEMATICS)?\b/.test(normalized)
  ) {
    return 'MATHEMATICS AND FURTHER MATHEMATICS';
  }

  for (const [pattern, alias] of SUBJECT_ALIASES) {
    if (pattern.test(normalized)) return alias;
  }
  return normalized;
};

export const canonicalSubjectName = (subjectLines: string[]) =>
  aliasOf(subjectLines.join(' '));

/** Every canonical subject that appears in any report-card template. */
export const templateSubjectNames = () => {
  const names = new Set<string>();
  for (const variant of REPORT_CARD_VARIANTS) {
    for (const subject of variant.subjects) {
      const name = canonicalSubjectName(subject.lines);
      if (name) names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
};

/**
 * Words that appear in many subject names. They must not count as a subject
 * match on their own — e.g. "BUSINESS STUDIES" and "CHRISTIAN RELIGIOUS
 * STUDIES" only share "STUDIES" and are different subjects.
 */
const GENERIC_SUBJECT_WORDS = new Set([
  'AND',
  'THE',
  'OF',
  'FOR',
  'STUDIES',
  'STUDY',
  'EDUCATION',
  'LANGUAGE',
  'LANGUAGES',
  'ARTS',
  'ART',
  'SCIENCE',
  'TECHNOLOGY',
  'TECHNOLOGIES',
  'SUBJECT',
  'GENERAL',
]);

const meaningfulWords = (value: string) =>
  new Set(
    value
      .split(' ')
      .filter((word) => word.length > 2 && !GENERIC_SUBJECT_WORDS.has(word)),
  );

export const subjectMatches = (
  reportLines: string[],
  sourceName: string,
  aliases?: SubjectAliasMap,
) => {
  const report = aliasOf(reportLines.join(' '), aliases);
  const source = aliasOf(sourceName, aliases);
  if (!report || !source) return 0;
  if (report === source) return 100;
  // Plain Mathematics and Further Mathematics are separate subjects even
  // though one name contains the other.
  if (report.includes('FURTHER') !== source.includes('FURTHER')) return 0;
  // Longer, truncated names ("SOCIAL AND CITIZENSHI.") still match their
  // canonical form via the alias table, so a contains check is a safe fallback.
  if (report.includes(source) && source.length >= 4) return 90;
  if (source.includes(report) && report.length >= 4) return 90;
  const reportWords = meaningfulWords(report);
  const sourceWords = meaningfulWords(source);
  let overlap = 0;
  for (const word of reportWords) if (sourceWords.has(word)) overlap += 1;
  return overlap * 40;
};

export const bestSubjectMatch = (
  subject: GeneratedSubject,
  sources: SourceSubject[],
  aliases?: SubjectAliasMap,
) => {
  let best: { source: SourceSubject; score: number } | null = null;
  for (const source of sources) {
    const score = subjectMatches(subject.lines, source.name, aliases);
    if (!best || score > best.score) best = { source, score };
  }
  return best && best.score >= 40 ? best.source : null;
};

/**
 * Keep the template's printed subject rows. Saved-card scores are copied into
 * the matching template row through the subject mapper, so an acronym row from
 * an older auto-map can never replace the template format.
 */
export const templateDraftSubjects = (
  variant: ReportVariant,
  savedSubjects: GeneratedSubject[],
  aliases?: SubjectAliasMap,
): GeneratedSubject[] => {
  const template = presetSubjects(variant);
  const used = new Set<number>();
  return template.map((row) => {
    let bestIndex = -1;
    let bestScore = 0;
    savedSubjects.forEach((saved, index) => {
      if (used.has(index)) return;
      const score = subjectMatches(row.lines, saved.lines.join(' '), aliases);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    if (bestIndex < 0 || bestScore < 40) return row;
    used.add(bestIndex);
    const saved = savedSubjects[bestIndex];
    return recalcSubject(row, {
      cbt1: saved.cbt1 ?? null,
      cbt2: saved.cbt2 ?? null,
      exam: saved.exam ?? null,
      lastCum: saved.lastCum ?? null,
      sourceSubjectId: saved.sourceSubjectId ?? null,
      sourceSubjectName: saved.sourceSubjectName ?? null,
    });
  });
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

export type ScoreColumn = 'cbt1' | 'cbt2' | 'exam' | 'lastCum';

/**
 * The school names its assessments e.g. "JSS1 CBT 1", "JSS1 CBT 2",
 * "JSS1 EXAM" or "COMPUTER BASED TEST 2". Translate the name into the
 * report-card column it belongs to.
 */
export const columnForExamName = (name: string): ScoreColumn | null => {
  const value = String(name ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
  if (
    /\b(?:CBT|COMPUTER\s+BASED\s+TEST)\s*0?1\b/.test(value) ||
    /\b(?:FIRST|1ST)\s+(?:CBT|TEST)\b/.test(value)
  ) {
    return 'cbt1';
  }
  if (
    /\b(?:CBT|COMPUTER\s+BASED\s+TEST)\s*0?2\b/.test(value) ||
    /\b(?:SECOND|2ND)\s+(?:CBT|TEST)\b/.test(value)
  ) {
    return 'cbt2';
  }
  if (/\bLAST\s+CUM(?:ULATIVE)?\b/.test(value)) return 'lastCum';
  if (/\b(?:EXAM|EXAMINATION)\b/.test(value)) return 'exam';
  return null;
};

/**
 * Fill CBT 1, CBT 2, Exam and Last Cum. columns from the pupil's result
 * sources. The newest source wins when two exams map to the same column.
 * `onlyBlank` preserves values already saved on an existing report card.
 */
export const autoMapSources = (
  draft: ReportCardDraft,
  sources: SourceResult[],
  options: { onlyBlank?: boolean; aliases?: SubjectAliasMap } = {},
) => {
  const byColumn = new Map<ScoreColumn, SourceResult>();
  for (const source of sources) {
    const column = columnForExamName(source.examName);
    if (column && !byColumn.has(column)) byColumn.set(column, source);
  }
  if (!byColumn.size) {
    return { draft, mapped: 0, sourcesUsed: [] as string[], columns: [] as ScoreColumn[] };
  }

  const used = new Set<string>();
  let mapped = 0;
  const subjects = draft.subjects.map((subject) => {
    let next = subject;
    for (const column of ['cbt1', 'cbt2', 'exam', 'lastCum'] as ScoreColumn[]) {
      const source = byColumn.get(column);
      if (!source) continue;
      if (options.onlyBlank && next[column] != null) continue;
      const match = bestSubjectMatch(next, source.subjects, options.aliases);
      if (!match) continue;
      const value = mappedScore(match, column);
      if (value == null) continue;
      next = recalcSubject(
        {
          ...next,
          sourceSubjectId: match.id ?? next.sourceSubjectId,
          sourceSubjectName: match.name ?? next.sourceSubjectName,
        },
        { [column]: value } as Partial<GeneratedSubject>,
      );
      mapped += 1;
      used.add(source.examName);
    }
    return next;
  });

  return {
    draft: { ...draft, subjects },
    mapped,
    sourcesUsed: [...used],
    columns: [...byColumn.keys()],
  };
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
