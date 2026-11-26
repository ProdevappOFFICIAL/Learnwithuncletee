export type ReportVariant = 'junior' | 'senior-science' | 'senior-commerce' | 'senior-art';

export interface GeneratedSubject {
  id?: string;
  position: number;
  lines: string[];
  sourceSubjectId?: string | null;
  sourceSubjectName?: string | null;
  cbt1?: number | null;
  cbt2?: number | null;
  exam?: number | null;
  lastCum?: number | null;
  overall?: number | null;
}

export interface GeneratedReportCard {
  id: string;
  studentId: string;
  variant: ReportVariant;
  status: 'draft' | 'final';
  session: string;
  term: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  photoUrl: string;
  student: {
    id: string;
    user_name: string;
    user_email: string;
    classId?: string | null;
    className: string;
    admissionNumber: string;
    photoUrl: string;
    combinationId?: string | null;
    combinationName: string;
  } | null;
  present?: number | null;
  absent?: number | null;
  totalSchoolDays?: number | null;
  attendanceFrom?: string | null;
  attendanceTo?: string | null;
  affective: { puntuality: string; respect: string };
  psychomotor: { handwriting: string; recreation: string };
  classTeacherRemark: string;
  principalComment: string;
  newsLetter: string;
  nextTermBegins: string;
  subjects: GeneratedSubject[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportCardDraft {
  studentId: string;
  studentEmail: string;
  combinationName: string;
  variant: ReportVariant;
  session: string;
  term: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  photoUrl: string;
  present?: number;
  absent?: number;
  totalSchoolDays?: number;
  attendanceFrom?: string;
  attendanceTo?: string;
  affectivePuntuality: string;
  affectiveRespect: string;
  psychomotorHandwriting: string;
  psychomotorRecreation: string;
  classTeacherRemark: string;
  principalComment: string;
  newsLetter: string;
  nextTermBegins: string;
  subjects: GeneratedSubject[];
}

export interface SourceSubject {
  id?: string;
  name: string;
  correct?: number;
  total?: number;
  percentage?: number;
  cbt1?: number;
  cbt2?: number;
  exam?: number;
  lastCum?: number;
  overall?: number;
}

export interface SourceResult {
  key: string;
  origin: 'ONLINE' | 'OFFLINE' | 'IMPORT';
  examName: string;
  date?: string;
  overallScore?: number;
  subjects: SourceSubject[];
}

export interface ImportedStudentRow {
  key: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  className?: string;
  examName?: string;
  overallScore?: number;
  resultId?: string;
  subjects: SourceSubject[];
  matchedStudentId?: string;
  matchedStudentName?: string;
  matchedClassName?: string;
  matchedAdmissionNumber?: string;
  matchedPhotoUrl?: string;
  matchedCombinationName?: string;
}

export interface ReportCardImportSummary {
  id: string;
  fileName: string;
  source: string;
  rowCount: number;
  studentCount: number;
  warnings?: string[];
  createdAt: string;
}

export interface ReportCardImportDetail extends ReportCardImportSummary {
  rows: ImportedStudentRow[];
  warnings: string[];
}

export interface AttendanceSummary {
  from: string;
  to: string;
  totalSchoolDays: number;
  present: number;
  absent: number;
  presentDates: string[];
  weekendsExcluded: boolean;
}

export interface PrincipalStudentRow {
  studentId: string;
  user_name: string;
  user_email: string;
  photoUrl: string;
  admissionNumber: string;
  className: string;
  classId?: string | null;
  combinationName: string;
  variant: ReportVariant;
  card: {
    id: string;
    principalComment?: string;
    classTeacherRemark?: string;
    updatedAt: string;
  } | null;
}

export interface PrincipalStudentList {
  session: string;
  term: string;
  classId?: string;
  classes?: Array<{ id: string; name: string }>;
  rows: PrincipalStudentRow[];
}

export interface MyStatusSummary {
  role: string;
  teacherTypeStatus: string | null;
  isPrincipal: boolean;
  isClassTeacher: boolean;
  classTeacherClasses: Array<{ id: string; name: string }>;
  canManagePrincipalComments: boolean;
  canManageClassTeacherComments: boolean;
  statuses: Array<{
    id: string;
    name: string;
    scope: string;
    class?: { id: string; name: string } | null;
  }>;
}

export type ReportField =
  | 'studentName'
  | 'admissionNumber'
  | 'className'
  | 'photo'
  | 'attendance'
  | 'affective.puntuality'
  | 'affective.respect'
  | 'psychomotor.handwriting'
  | 'psychomotor.recreation'
  | 'classTeacherRemark'
  | 'principalComment'
  | 'newsLetter'
  | `subject.${number}.label`
  | `subject.${number}.cbt1`
  | `subject.${number}.cbt2`
  | `subject.${number}.exam`
  | `subject.${number}.ctotal`
  | `subject.${number}.total`
  | `subject.${number}.lastCum`
  | `subject.${number}.overall`;

export const parseSubjectField = (
  field: ReportField | null,
): { index: number; part: 'label' | 'cbt1' | 'cbt2' | 'exam' | 'ctotal' | 'total' | 'lastCum' | 'overall' } | null => {
  if (!field || !field.startsWith('subject.')) return null;
  const [, indexValue, part] = field.split('.');
  const index = Number(indexValue);
  if (!Number.isInteger(index) || index < 0) return null;
  return {
    index,
    part: part as 'label' | 'cbt1' | 'cbt2' | 'exam' | 'ctotal' | 'total' | 'lastCum' | 'overall',
  };
};
