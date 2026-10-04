export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: string;
  user_name: string;
  user_email: string;
  role: UserRole;
  active: boolean;
  workspaceId: string;
  classId: string | null;
  img: string | null;
  createdAt: string;
  hasSubscription?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  _count?: {
    users: number;
    exams: number;
    subjects: number;
    classes: number;
    questions: number;
    teachers: number;
  };
}

export interface Class {
  id: string;
  name: string;
  workspaceId: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  workspaceId: string;
  classes?: Class[];
  _count?: {
    questions: number;
  };
}

export interface Exam {
  id: string;
  exam_name: string;
  minutes: number;
  workspaceId: string;
  classId: string;
  visible: boolean;
}

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  explanation: string | null;
  img: string | null;
  examId: string;
  subjectId: string;
  classId: string;
  author?: string | null;
}

export interface SubjectScore {
  correct: number;
  total: number;
}

export interface QuestionAttempt {
  questionId: string;
  userOption?: number;
  userTextAnswer?: string;
  options?: string[];
}

export interface Result {
  id: string;
  overallScore: number;
  subjectScores: Record<string, SubjectScore>;
  questionAttempts: QuestionAttempt[];
  attempted_questions: number;
  total_questions: number;
  date: string;
  userId: string;
  examId: string;
  exam?: Exam;
  subject?: Subject;
  user?: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string | null;
  action: string;
  description: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  user?: {
    user_name: string | null;
    role: string | null;
  } | null;
}

export interface QuestionBankItem {
  id: string;
  type: QuestionType;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  explanation: string | null;
  img: string | null;
  author: string | null;
  examName: string | null;
  subjectName: string | null;
  className: string | null;
  sourceExamId: string | null;
  sourceSubjectId: string | null;
  sourceClassId: string | null;
  workspaceId: string;
  exportedAt: string;
}

export interface StudentBankItem {
  id: string;
  user_name: string;
  user_email: string;
  img: string | null;
  className: string | null;
  sourceClassId: string | null;
  workspaceId: string;
  exportedAt: string;
}

export interface ResultBankItem {
  id: string;
  userName: string | null;
  userEmail: string | null;
  examName: string | null;
  overallScore: number;
  subjectScores: Record<string, SubjectScore>;
  attempted_questions: number;
  total_questions: number;
  date: string;
  sourceUserId: string | null;
  sourceExamId: string | null;
  workspaceId: string;
  exportedAt: string;
}

export interface BankImportResult<T> {
  imported: T[];
  failed: { id: string; error: string }[];
}

