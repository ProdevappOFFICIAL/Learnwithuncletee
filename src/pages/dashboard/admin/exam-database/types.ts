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
