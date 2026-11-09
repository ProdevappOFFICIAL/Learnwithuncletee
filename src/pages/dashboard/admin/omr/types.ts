export type OmrOption = 'A' | 'B' | 'C' | 'D';

export interface OmrSubject {
  id?: string;
  name: string;
  order?: number;
  questionCount: number;
  options: string[];
  answers: Array<string | null>;
}

export interface OmrKeySummary {
  id: string;
  title: string;
  session?: string | null;
  instructions?: string | null;
  isActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
  subjects: OmrSubject[];
}

export type OmrQuestionFlag =
  | 'ok'
  | 'blank'
  | 'multiple'
  | 'unsure'
  | 'low'
  | 'ai-corrected'
  | 'ai-conflict';

export interface OmrQuestionReading {
  question: number;
  detected: string | null;
  fills: Record<string, number>;
  flag: OmrQuestionFlag;
  ai?: {
    option: string | null;
    confidence: 'high' | 'medium' | 'low';
    reason?: string;
  } | null;
}

export interface OmrAiMetadata {
  enabled: boolean;
  model?: string | null;
  student?: {
    values: Record<string, string | boolean | null>;
    confidence: Record<string, 'high' | 'medium' | 'low'>;
  } | null;
  subjectNames?: string[];
  fixes?: Array<{
    subjectIndex: number;
    question: number;
    option: string | null;
    confidence: 'high' | 'medium' | 'low';
    reason?: string;
  }>;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  warnings?: string[];
}

export interface OmrSubjectReading {
  name: string;
  order: number;
  questions: OmrQuestionReading[];
}

export interface OmrDetection {
  rowCount: number;
  rowPitch: number;
  optionPitch: number;
  rowCenters: number[];
  columns: Array<{ x: number; count: number }>;
  warnings: string[];
  subjects: OmrSubjectReading[];
  ai?: OmrAiMetadata | null;
}

export interface OmrSubjectScore {
  subject: string;
  correct: number;
  answered: number;
  total: number;
  percentage: number;
}

export interface OmrScores {
  subjects: OmrSubjectScore[];
  totalScore: number;
  totalQuestions: number;
  percentage: number;
}

export interface OmrScanSummary {
  id: string;
  answerKeyId: string;
  answerKeyTitle?: string | null;
  status: 'DRAFT' | 'CONFIRMED' | 'FAILED';
  perspective: string;
  documentRatio?: number | null;
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  studentName?: string | null;
  studentEmail?: string | null;
  university?: string | null;
  firstChoice?: string | null;
  guardianPhone?: string | null;
  personalNos?: string | null;
  isAlumni?: boolean | null;
  scores?: OmrScores | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
}

export interface OmrScanDetail extends OmrScanSummary {
  answers: Array<Array<string | null>>;
  detection?: OmrDetection | null;
  image?: string | null;
  preview?: string | null;
  header?: string | null;
  answerKey?: {
    id: string;
    title: string;
    subjects: OmrSubject[];
  } | null;
}

export interface OmrScanList {
  rows: OmrScanSummary[];
  total: number;
  page: number;
  limit: number;
}

export const OMR_OPTIONS = ['A', 'B', 'C', 'D'];

export const DEFAULT_SUBJECT_NAMES = ['Use of English', 'Physics', 'Chemistry', 'Bio/Maths'];

export const emptyAnswers = (count: number): Array<string | null> =>
  Array.from({ length: count }, () => null);

export const defaultSubjects = (questionCount = 40): OmrSubject[] =>
  DEFAULT_SUBJECT_NAMES.map((name) => ({
    name,
    questionCount,
    options: [...OMR_OPTIONS],
    answers: emptyAnswers(questionCount),
  }));

export const cloneSubjects = (subjects: OmrSubject[]): OmrSubject[] =>
  subjects.map((subject) => ({
    ...subject,
    options: [...subject.options],
    answers: [...subject.answers],
  }));

export const scoreTone = (percentage: number): 'emerald' | 'amber' | 'rose' =>
  percentage >= 50 ? 'emerald' : percentage >= 30 ? 'amber' : 'rose';

export const flagLabel: Record<OmrQuestionFlag, string> = {
  ok: 'Read',
  blank: 'Blank',
  multiple: 'Multiple marks',
  unsure: 'Uncertain',
  low: 'Light shading',
  'ai-corrected': 'AI checked',
  'ai-conflict': 'AI conflict',
};

export const flagTone: Record<OmrQuestionFlag, string> = {
  ok: 'text-emerald-700',
  blank: 'text-muted',
  multiple: 'text-rose-700',
  unsure: 'text-amber-700',
  low: 'text-amber-700',
  'ai-corrected': 'text-sky-700',
  'ai-conflict': 'text-rose-700',
};
