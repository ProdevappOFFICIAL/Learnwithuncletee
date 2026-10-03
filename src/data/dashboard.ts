import {
  BookOpenCheck,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  GraduationCap,
  LayoutDashboard,
  Newspaper,
  Settings,
  UserCog,
  Users,
  Video,
  Wallet,
} from 'lucide-react';
import { ROUTES } from '@/routes/paths';

export type DashboardRole = 'student' | 'teacher' | 'admin';

export interface DashboardNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  /** Permission key required to see this item. Undefined = visible to the role. */
  permission?: string;
}

export const studentNav: DashboardNavItem[] = [
  { to: ROUTES.studentDashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.studentFees, label: 'Fees', icon: Wallet, badge: 'Due', permission: 'fees.read' },
  { to: ROUTES.studentResults, label: 'Results', icon: FileBarChart2, permission: 'results.read' },
  { to: ROUTES.studentAssignments, label: 'Assignments', icon: ClipboardList, badge: '3', permission: 'assignments.read' },
  { to: ROUTES.studentVirtualClass, label: 'Virtual Class', icon: Video, permission: 'virtual.read' },
];

export const teacherNav: DashboardNavItem[] = [
  { to: ROUTES.teacherDashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.teacherAssignments, label: 'Assignments', icon: BookOpenCheck, badge: '12', permission: 'assignments.read' },
  { to: ROUTES.teacherResults, label: 'Results', icon: GraduationCap, permission: 'results.read' },
  { to: ROUTES.teacherClasses, label: 'My Classes', icon: Users, permission: 'students.read' },
];

export const adminNav: DashboardNavItem[] = [
  { to: ROUTES.adminDashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.adminStudents, label: 'Students', icon: Users, permission: 'students.read' },
  { to: ROUTES.adminTeachers, label: 'Teachers & Staff', icon: UserCog, permission: 'teachers.read' },
  { to: ROUTES.adminAdmissions, label: 'Admissions', icon: ClipboardList, badge: '24', permission: 'admissions.read' },
  { to: ROUTES.adminFees, label: 'Fees & Payments', icon: CreditCard, permission: 'fees.read' },
  { to: ROUTES.adminResults, label: 'Results', icon: FileBarChart2, permission: 'results.read' },
  { to: ROUTES.adminAssignments, label: 'Assignments', icon: BookOpenCheck, permission: 'assignments.read' },
  { to: ROUTES.adminVirtualClass, label: 'Virtual Classes', icon: Video, permission: 'virtual.read' },
  { to: ROUTES.adminNews, label: 'News & Events', icon: Newspaper, permission: 'news.read' },
  { to: ROUTES.adminSettings, label: 'Settings', icon: Settings, permission: 'settings.read' },
];

export const roleMeta: Record<DashboardRole, { title: string; subtitle: string }> = {
  student: { title: 'Student Portal', subtitle: 'Learn · Grow · Excel' },
  teacher: { title: 'Teacher Portal', subtitle: 'Teach · Mentor · Inspire' },
  admin: { title: 'Admin Portal', subtitle: 'Manage the whole school' },
};

/* ── API response shapes (mirror the backend; no mock data lives here) ── */

export interface StatTileData {
  id: string;
  label: string;
  value: string;
  hint?: string;
}

export interface InvoiceData {
  id: string;
  invoiceNo: string;
  term: string;
  amountKobo: number;
  paidKobo: number;
  status: 'UNPAID' | 'PART_PAID' | 'PAID' | 'OVERDUE';
  dueDate?: string;
  payments?: Array<{ id: string; amountKobo: number; method: string; reference: string; status: string; createdAt: string }>;
}

export interface GradeData {
  id: string;
  subject: string;
  className: string;
  session: string;
  term: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark?: string | null;
  published: boolean;
}

/** Grade (class) options for result filters and entry forms. */
export const CLASS_OPTIONS = [
  'Creche',
  'KG 1',
  'KG 2',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'JSS 1 Gold',
  'JSS 2 Diamond',
  'JSS 3 Emerald',
  'SS 1',
  'SS 2',
  'SS 3',
];

/** Term options — First / Second / Third. */
export const TERM_OPTIONS = ['First Term', 'Second Term', 'Third Term'];

/** Session (academic year) options centred on the current year, e.g. 2025/2026. */
export const sessionOptions = () => {
  const cy = new Date().getFullYear();
  const years: string[] = [];
  for (let y = cy - 3; y <= cy + 1; y++) years.push(`${y}/${y + 1}`);
  return years.reverse();
};

export interface HomeworkData {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueAt: string;
  instructions?: string | null;
  attachmentUrl?: string | null;
  maxScore: number;
  teacher?: { user_name: string };
  submission?: { id: string; status: string; score?: number | null; feedback?: string | null; fileUrl?: string | null } | null;
}

export interface LessonData {
  id: string;
  topic: string;
  subject: string;
  className: string;
  startsAt: string;
  durationMins: number;
  joinUrl: string;
  notesUrl?: string | null;
  recordingUrl?: string | null;
  coverUrl?: string | null;
  status: string;
  teacher?: { user_name: string };
}

export interface NoticeData {
  id: string;
  title: string;
  description?: string | null;
  body: string;
  category: string;
  audience: string;
  coverUrl?: string | null;
  isPublished: boolean;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
}

export interface StudentRow {
  id: string;
  user_name: string;
  user_email: string;
  active: boolean;
  img?: string | null;
  studentProfile?: { studentCode: string; className: string; guardianName?: string; guardianPhone?: string } | null;
  balanceKobo?: number;
  average?: number | null;
}

export interface StaffRow {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  active: boolean;
  teacherProfile?: { staffCode: string; department?: string; subjects: string[] } | null;
}
