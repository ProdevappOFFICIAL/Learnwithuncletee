import {
  Bell,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
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
}

export const studentNav: DashboardNavItem[] = [
  { to: ROUTES.studentDashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.studentFees, label: 'Fees', icon: Wallet, badge: 'Due' },
  { to: ROUTES.studentResults, label: 'Results', icon: FileBarChart2 },
  { to: ROUTES.studentAssignments, label: 'Assignments', icon: ClipboardList, badge: '3' },
  { to: ROUTES.studentVirtualClass, label: 'Virtual Class', icon: Video },
];

export const teacherNav: DashboardNavItem[] = [
  { to: ROUTES.teacherDashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.teacherAssignments, label: 'Assignments', icon: BookOpenCheck, badge: '12' },
  { to: ROUTES.teacherResults, label: 'Results', icon: GraduationCap },
  { to: ROUTES.teacherClasses, label: 'My Classes', icon: Users },
];

export const adminNav: DashboardNavItem[] = [
  { to: ROUTES.adminDashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.adminStudents, label: 'Students', icon: Users },
  { to: ROUTES.adminTeachers, label: 'Teachers & Staff', icon: UserCog },
  { to: ROUTES.adminAdmissions, label: 'Admissions', icon: ClipboardList, badge: '24' },
  { to: ROUTES.adminFees, label: 'Fees & Payments', icon: CreditCard },
  { to: ROUTES.adminResults, label: 'Results', icon: FileBarChart2 },
  { to: ROUTES.adminAssignments, label: 'Assignments', icon: BookOpenCheck },
  { to: ROUTES.adminVirtualClass, label: 'Virtual Classes', icon: Video },
  { to: ROUTES.adminNews, label: 'News & Events', icon: Newspaper },
  { to: ROUTES.adminSettings, label: 'Settings', icon: Settings },
];

export const roleMeta: Record<DashboardRole, { title: string; subtitle: string; initials: string; name: string; detail: string }> = {
  student: {
    title: 'Student Portal',
    subtitle: 'Learn · Grow · Excel',
    initials: 'DE',
    name: 'Daniel E.',
    detail: 'JSS 2 · Diamond · ID LWU/2024/0312',
  },
  teacher: {
    title: 'Teacher Portal',
    subtitle: 'Teach · Mentor · Inspire',
    initials: 'MB',
    name: 'Mr. Balogun',
    detail: 'Mathematics · JSS 1–3 · Staff LWU/T/014',
  },
  admin: {
    title: 'Admin Portal',
    subtitle: 'Manage the whole school',
    initials: 'AO',
    name: 'Mrs. Adaeze O.',
    detail: 'Administrator · Central Admin',
  },
};

/* ---------- Mock data (replace with API data when backend is ready) ---------- */

export const studentOverview = {
  stats: [
    { id: 'gpa', label: 'Term Average', value: '87.4%', hint: '+2.1% vs last term' },
    { id: 'attendance', label: 'Attendance', value: '96%', hint: '144 of 150 days' },
    { id: 'assignments', label: 'Pending Assignments', value: '3', hint: '2 due this week' },
    { id: 'fees', label: 'Fee Balance', value: '₦45,000', hint: 'Due 14 Oct' },
  ],
  timetable: [
    { time: '08:00 – 08:40', subject: 'Mathematics', teacher: 'Mr. Balogun', room: 'JSS 2 Diamond' },
    { time: '08:40 – 09:20', subject: 'English Language', teacher: 'Mrs. Okoye', room: 'JSS 2 Diamond' },
    { time: '10:00 – 10:40', subject: 'Basic Science', teacher: 'Miss Ibrahim', room: 'Science Lab 1' },
    { time: '11:20 – 12:00', subject: 'ICT', teacher: 'Mr. Eze', room: 'ICT Centre' },
  ],
};

export const studentFees = [
  { id: 'F-2026-T1', term: 'First Term 2026/27', amount: '₦185,000', paid: '₦140,000', balance: '₦45,000', status: 'Part paid', due: '14 Oct 2026' },
  { id: 'F-2025-T3', term: 'Third Term 2025/26', amount: '₦175,000', paid: '₦175,000', balance: '₦0', status: 'Paid', due: 'Paid 02 May 2026' },
  { id: 'F-2025-T2', term: 'Second Term 2025/26', amount: '₦175,000', paid: '₦175,000', balance: '₦0', status: 'Paid', due: 'Paid 20 Jan 2026' },
];

export const studentResults = [
  { subject: 'Mathematics', ca: 28, exam: 62, total: 90, grade: 'A', remark: 'Excellent' },
  { subject: 'English Language', ca: 26, exam: 60, total: 86, grade: 'A', remark: 'Excellent' },
  { subject: 'Basic Science', ca: 25, exam: 58, total: 83, grade: 'B', remark: 'Very good' },
  { subject: 'Social Studies', ca: 24, exam: 55, total: 79, grade: 'B', remark: 'Very good' },
  { subject: 'ICT', ca: 27, exam: 61, total: 88, grade: 'A', remark: 'Excellent' },
  { subject: 'Civic Education', ca: 23, exam: 52, total: 75, grade: 'C', remark: 'Good' },
];

export const studentAssignments = [
  { id: 'A1', subject: 'Mathematics', title: 'Quadratic equations — exercise 4a', due: 'Fri, 09 Oct', status: 'Pending', teacher: 'Mr. Balogun' },
  { id: 'A2', subject: 'English Language', title: 'Comprehension passage + summary', due: 'Mon, 12 Oct', status: 'Pending', teacher: 'Mrs. Okoye' },
  { id: 'A3', subject: 'Basic Science', title: 'Lab report: simple circuits', due: 'Wed, 07 Oct', status: 'Submitted', teacher: 'Miss Ibrahim' },
  { id: 'A4', subject: 'ICT', title: 'Word processing practical', due: 'Submitted 28 Sep', status: 'Graded · 18/20', teacher: 'Mr. Eze' },
];

export const virtualClasses = [
  { id: 'V1', subject: 'Mathematics', topic: 'Quadratic equations revision', teacher: 'Mr. Balogun', time: 'Today · 4:00 PM', duration: '45 mins', status: 'Join now', image: '/school.JPG' },
  { id: 'V2', subject: 'English Language', topic: 'Essay writing clinic', teacher: 'Mrs. Okoye', time: 'Tomorrow · 10:00 AM', duration: '60 mins', status: 'Scheduled', image: '/academics.jpeg' },
  { id: 'V3', subject: 'ICT', topic: 'Spreadsheets practical', teacher: 'Mr. Eze', time: 'Fri · 2:00 PM', duration: '50 mins', status: 'Scheduled', image: '/img_1.jpeg' },
];

export const teacherOverview = {
  stats: [
    { id: 'classes', label: 'My Classes', value: '4', hint: 'JSS 1–3 · 128 pupils' },
    { id: 'tograde', label: 'To Grade', value: '12', hint: '2 assignments pending' },
    { id: 'avg', label: 'Class Average', value: '81%', hint: 'Mathematics · JSS 2' },
    { id: 'next', label: 'Next Live Class', value: 'Today 4pm', hint: 'Quadratic revision' },
  ],
  submissions: [
    { pupil: 'Daniel E.', class: 'JSS 2 Diamond', assignment: 'Quadratic equations — ex 4a', time: '2h ago', status: 'Needs grading' },
    { pupil: 'Sarah A.', class: 'JSS 2 Diamond', assignment: 'Quadratic equations — ex 4a', time: '5h ago', status: 'Needs grading' },
    { pupil: 'Michael O.', class: 'JSS 1 Gold', assignment: 'Number bases worksheet', time: 'Yesterday', status: 'Graded · 17/20' },
    { pupil: 'Grace N.', class: 'JSS 3 Emerald', assignment: 'Simultaneous equations', time: 'Yesterday', status: 'Graded · 19/20' },
  ],
};

export const adminOverview = {
  stats: [
    { id: 'students', label: 'Students', value: '1,200+', hint: '+48 this term' },
    { id: 'teachers', label: 'Teachers & Staff', value: '85+', hint: '6 new hires' },
    { id: 'fees', label: 'Fees Collected', value: '₦48.2M', hint: '78% of expected' },
    { id: 'admissions', label: 'Pending Admissions', value: '24', hint: '5 interviews today' },
  ],
};

export const dashboardIcons = { Bell, CalendarDays, Megaphone };
