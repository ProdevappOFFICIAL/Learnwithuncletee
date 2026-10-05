import {
  BookOpenCheck,
  ClipboardList,
  Cog,
  FileBarChart2,
  FileQuestion,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  MapPin,
  Newspaper,
  Rocket,
  ScrollText,
  Settings,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import { ROUTES } from "@/routes/paths";

export type DashboardRole = "student" | "teacher" | "admin";

export interface DashboardNavItem {
  /** Route path. Omitted for pure toggle groups that only expand/collapse. */
  to?: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  /** Permission key required to see this item. Undefined = visible to the role. */
  permission?: string;
  /** Nested children — rendered as a collapsible subgroup. */
  children?: DashboardNavItem[];
}

export const studentNav: DashboardNavItem[] = [
  { to: ROUTES.studentDashboard, label: "Dashboard", icon: LayoutDashboard },
  /* {
    to: ROUTES.studentFees,
    label: "Fees",
    icon: Wallet,
    badge: "Due",
    permission: "fees.read",
  },*/
  {
    to: ROUTES.studentResults,
    label: "Results",
    icon: FileBarChart2,
    permission: "results.read",
  },
  {
    to: ROUTES.studentAssignments,
    label: "Assignments",
    icon: ClipboardList,
    badge: "",
    permission: "assignments.read",
  },
  {
    to: ROUTES.studentVirtualClass,
    label: "Virtual Class",
    icon: Video,
    permission: "virtual.read",
  },
];

export const teacherNav: DashboardNavItem[] = [
  { to: ROUTES.teacherDashboard, label: "Dashboard", icon: LayoutDashboard },

  {
    to: ROUTES.teacherAttendance,
    label: "Attendance",
    icon: MapPin,
    permission: "attendance.write",
  },

  {
    to: ROUTES.teacherClasses,
    label: "Assigned Courses",
    icon: Users,
    permission: "students.read",
    children: [
      {
        to: ROUTES.teacherAssignments,
        label: "Assignments",
        icon: BookOpenCheck,
        badge: "",
        permission: "assignments.read",
      },
    ],
  },
  /* {
        to: ROUTES.teacherResults,
        label: "Results",
        icon: GraduationCap,

        permission: "results.read",
      },*/
];

export const adminNav: DashboardNavItem[] = [
  { to: ROUTES.adminDashboard, label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Members",
    icon: Users,
    to: ROUTES.adminMembers,
    children: [
      {
        to: ROUTES.adminStudents,
        label: "Students",
        icon: Users,
        permission: "students.read",
      },
      {
        to: ROUTES.adminTeachers,
        label: "Teachers",
        icon: UserCog,
        permission: "teachers.read",
      },
      // The add-student form + approvals queue live on the Students page.
      //    { to: ROUTES.adminStudents, label: 'Add Member', icon: UserPlus, permission: 'students.write' },
    ],
  },
  {
    to: ROUTES.adminAdmissions,
    label: "Admissions",
    icon: ClipboardList,
    badge: "24",
    permission: "admissions.read",
  },
  {
    to: ROUTES.adminAttendance,
    label: "Attendance",
    icon: MapPin,
    permission: "attendance.read",
  },
  /* {
    to: ROUTES.adminFees,
    label: "Fees & Payments",
    icon: CreditCard,
    permission: "fees.read",
  },
  */

  {
    to: ROUTES.adminAssignments,
    label: "Assignments",
    icon: BookOpenCheck,
    permission: "assignments.read",
  },
  {
    to: ROUTES.adminVirtualClass,
    label: "Virtual Classes",
    icon: Video,
    permission: "virtual.read",
  },
  {
    to: ROUTES.adminNews,
    label: "News & Events",
    icon: Newspaper,
    permission: "news.read",
  },
  {
    to: ROUTES.adminResults,
    label: "Results",
    icon: FileBarChart2,
    permission: "results.read",
  },
  {
    label: "Exam & Test",
    icon: GraduationCap,
    to: ROUTES.adminExams,
    children: [
      {
        to: ROUTES.adminExams,
        label: "Classes",
        icon: Users,
        permission: "results.read",
        children: [
          {
            to: ROUTES.adminAllExams,
            label: "All Exams",
            icon: FileText,
            permission: "results.read",
          },
          {
            to: ROUTES.adminAllSubjects,
            label: "All Subjects",
            icon: BookOpenCheck,
            permission: "results.read",
          },
          {
            to: ROUTES.adminAllQuestions,
            label: "All Questions",
            icon: FileQuestion,
            permission: "results.read",
          },
          {
            to: ROUTES.adminCombinations,
            label: "All Combinations",
            icon: Layers,
            permission: "results.read",
          },
          {
            to: ROUTES.adminDeployments,
            label: "All Deployments",
            icon: Rocket,
            permission: "results.read",
          },
          {
            to: ROUTES.adminExamResults,
            label: "All Results",
            icon: FileBarChart2,
            permission: "results.read",
          },
        ],
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    to: ROUTES.adminSettings,
    children: [
      {
        to: ROUTES.adminSettings,
        label: "General",
        icon: Cog,
        permission: "settings.read",
      },
      {
        to: ROUTES.adminAuditLog,
        label: "Audit Log",
        icon: ScrollText,
        permission: "settings.read",
      },
      /*  {
        label: "Website Management",
        icon: Globe,
        to: ROUTES.adminWebsite,
        children: [
          {
            to: "/dashboard/admin/website/banner",
            label: "Banner Image",
            icon: ImageIcon,
            permission: "settings.read",
          },
          {
            to: "/dashboard/admin/website/information",
            label: "Information",
            icon: Info,
            permission: "settings.read",
          },
          {
            label: "Pages",
            icon: LayoutTemplate,
            to: ROUTES.adminWebsitePages,
            children: [
              {
                to: "/dashboard/admin/website/home",
                label: "Home Page",
                icon: Home,
                permission: "settings.read",
              },
              {
                to: "/dashboard/admin/website/about",
                label: "About Page",
                icon: FileText,
                permission: "settings.read",
              },
              {
                to: "/dashboard/admin/website/gallery",
                label: "Gallery Page",
                icon: ImageIcon,
                permission: "settings.read",
              },
              {
                to: "/dashboard/admin/website/other",
                label: "Other Pages",
                icon: FileText,
                permission: "settings.read",
              },
            ],
          },
        ],
      },

      */
    ],
  },
];

export const roleMeta: Record<
  DashboardRole,
  { title: string; subtitle: string }
> = {
  student: { title: "Student Portal", subtitle: "Learn · Grow · Excel" },
  teacher: { title: "Teacher Portal", subtitle: "Teach · Mentor · Inspire" },
  admin: { title: "Admin Portal", subtitle: "Manage the whole school" },
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
  status: "UNPAID" | "PART_PAID" | "PAID" | "OVERDUE";
  dueDate?: string;
  payments?: Array<{
    id: string;
    amountKobo: number;
    method: string;
    reference: string;
    status: string;
    createdAt: string;
  }>;
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

export interface ResultDocData {
  id: string;
  title: string;
  className: string;
  session: string;
  term: string;
  subject?: string | null;
  studentId?: string | null;
  student?: { user_name: string } | null;
  fileUrl: string;
  createdAt: string;
  uploader?: { user_name: string };
}

/** Grade (class) options for result filters and entry forms. */
export const CLASS_OPTIONS = [
  "Creche",
  "KG 1",
  "KG 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JSS 1 Gold",
  "JSS 2 Diamond",
  "JSS 3 Emerald",
  "SS 1",
  "SS 2",
  "SS 3",
];

/** Term options — First / Second / Third. */
export const TERM_OPTIONS = ["First Term", "Second Term", "Third Term"];

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
  submission?: {
    id: string;
    status: string;
    score?: number | null;
    feedback?: string | null;
    fileUrl?: string | null;
  } | null;
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
  updatedAt?: string;
}

export interface StudentRow {
  id: string;
  user_name: string;
  user_email: string;
  active: boolean;
  img?: string | null;
  classId?: string | null;
  student?: {
    studentCode: string;
    className: string;
    guardianName?: string;
    guardianPhone?: string;
    combinationId?: string | null;
    combination?: { id: string; name: string } | null;
  } | null;
  balanceKobo?: number;
  average?: number | null;
}

export interface StaffRow {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  active: boolean;
  teacher?: {
    staffCode: string;
    department?: string;
    subjects: string[];
  } | null;
}

export interface ClassItem {
  id: string;
  name: string;
}

export interface CombinationItem {
  id: string;
  name: string;
  subjects: Array<{
    subject: { id: string; name: string; code?: string | null };
  }>;
  _count?: { students: number };
}

export interface ExamItem {
  id: string;
  exam_name: string;
  minutes: number;
  visible?: boolean;
  classId: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string | null;
}

export interface CourseAssignmentItem {
  id: string;
  teacherId: string;
  examId?: string | null;
  subjectId?: string | null;
  classId?: string | null;
  teacher?: { user_name: string };
  exam?: { exam_name: string } | null;
  subject?: { name: string } | null;
  class?: { name: string } | null;
}

export interface ExamDeploymentItem {
  id: string;
  code: string;
  mode: "ONLINE" | "OFFLINE";
  status: "DRAFT" | "LIVE" | "ENDED";
  createdAt: string;
  exam?: { id: string; exam_name: string; minutes: number } | null;
}
