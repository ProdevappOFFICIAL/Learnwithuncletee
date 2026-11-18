export type ExamDatabaseMode = 'COPY' | 'MOVE';

export interface ExamDatabaseRow {
  id: string;
  name: string;
  description?: string | null;
  classCount: number;
  examCount: number;
  subjectCount: number;
  questionCount: number;
  resultCount: number;
  attemptCount: number;
  sizeBytes: number;
  lastMode?: ExamDatabaseMode | string | null;
  lastExportedAt?: string | null;
  lastImportedAt?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamDatabaseSnapshotSummary {
  id: string;
  classId: string;
  className: string;
  mode: ExamDatabaseMode | string;
  exportedAt: string;
  summary: {
    exams: number;
    subjects: number;
    questions: number;
    results: number;
    attempts: number;
  };
}

export interface ExamDatabaseDetail extends ExamDatabaseRow {
  snapshots: ExamDatabaseSnapshotSummary[];
}

export interface SnapshotSubject {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
}

export interface SnapshotQuestion {
  id: string;
  type?: string;
  question: string;
  correct_answer: string;
  incorrect_answers?: string[];
  explanation?: string | null;
  custom?: unknown;
  img?: string | null;
  question_file?: string | null;
  author?: string | null;
  subjectId: string;
}

export interface SnapshotAttempt {
  id?: string;
  visited?: boolean;
  attempted?: boolean;
  options?: string[];
  userOption?: number | null;
  userTextAnswer?: string | null;
  questionId: string;
}

export interface SnapshotResult {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  overallScore: number;
  subjectScores?: Record<string, unknown>;
  attempted_questions: number;
  total_questions: number;
  date: string;
  submitted?: boolean;
  deploymentId?: string | null;
  attempts?: SnapshotAttempt[];
}

export interface SnapshotExam {
  id: string;
  exam_name: string;
  minutes: number;
  visible?: boolean;
  combination?: { id: string; name: string } | null;
  subjectIds: string[];
  questions: SnapshotQuestion[];
  onlineResults: SnapshotResult[];
  offlineResults: SnapshotResult[];
}

export interface ExamDatabaseSnapshot {
  version?: number;
  id: string;
  class: { id: string; name: string };
  mode: ExamDatabaseMode | string;
  exportedAt: string;
  subjects: SnapshotSubject[];
  exams: SnapshotExam[];
  summary: {
    exams: number;
    subjects: number;
    questions: number;
    results: number;
    attempts: number;
  };
}

export interface ExamDatabaseFullDetail extends ExamDatabaseRow {
  snapshots: ExamDatabaseSnapshot[];
}

export interface ExamDatabaseOverview {
  databases: number;
  classes: number;
  exams: number;
  subjects: number;
  questions: number;
  results: number;
  attempts: number;
  sizeBytes: number;
}

export interface ClassExportResult {
  database: {
    id: string;
    name: string;
    classCount: number;
    examCount: number;
    questionCount: number;
    resultCount: number;
    sizeBytes: number;
  };
  snapshot: ExamDatabaseSnapshotSummary;
  deletedExams: number;
}

export interface DatabaseImportResult {
  databaseId: string;
  snapshots: number;
  classes: number;
  classesCreated: number;
  exams: number;
  questions: number;
  results: number;
  attempts: number;
  skippedQuestions: number;
  skippedResults: number;
  skippedAttempts: number;
  skippedCombinationLinks: number;
  missingStudentEmails: string[];
  warnings: string[];
}
