import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from './paths';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { AcademicsPage } from '@/pages/AcademicsPage';
import { AdmissionsPage } from '@/pages/AdmissionsPage';
import { StudentLifePage } from '@/pages/StudentLifePage';
import { ServicesPage } from '@/pages/ServicesPage';
import { NewsPage } from '@/pages/NewsPage';
import { GalleryPage } from '@/pages/GalleryPage';
import { ContactPage } from '@/pages/ContactPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { adminNav, studentNav, teacherNav } from '@/data/dashboard';
import { DashboardIndexPage } from '@/pages/dashboard/DashboardIndexPage';
import { StudentDashboardPage } from '@/pages/dashboard/student/StudentDashboardPage';
import { StudentFeesPage } from '@/pages/dashboard/student/StudentFeesPage';
import { StudentResultsPage } from '@/pages/dashboard/student/StudentResultsPage';
import { StudentAssignmentsPage } from '@/pages/dashboard/student/StudentAssignmentsPage';
import { StudentVirtualClassPage } from '@/pages/dashboard/student/StudentVirtualClassPage';
import { TeacherDashboardPage } from '@/pages/dashboard/teacher/TeacherDashboardPage';
import { TeacherAssignmentsPage } from '@/pages/dashboard/teacher/TeacherAssignmentsPage';
import { TeacherResultsPage } from '@/pages/dashboard/teacher/TeacherResultsPage';
import { TeacherClassesPage } from '@/pages/dashboard/teacher/TeacherClassesPage';
import { AdminDashboardPage } from '@/pages/dashboard/admin/AdminDashboardPage';
import { AdminStudentsPage } from '@/pages/dashboard/admin/AdminStudentsPage';
import { AdminTeachersPage } from '@/pages/dashboard/admin/AdminTeachersPage';
import { AdminAdmissionsPage } from '@/pages/dashboard/admin/AdminAdmissionsPage';
import { AdminFeesPage } from '@/pages/dashboard/admin/AdminFeesPage';
import { AdminResultsPage } from '@/pages/dashboard/admin/AdminResultsPage';
import { AdminAssignmentsPage } from '@/pages/dashboard/admin/AdminAssignmentsPage';
import { AdminVirtualClassPage } from '@/pages/dashboard/admin/AdminVirtualClassPage';
import { AdminNewsPage } from '@/pages/dashboard/admin/AdminNewsPage';
import { AdminSettingsPage } from '@/pages/dashboard/admin/AdminSettingsPage';

export const router = createBrowserRouter([
  { path: ROUTES.home, element: <HomePage /> },
  { path: ROUTES.about, element: <AboutPage /> },
  { path: ROUTES.academics, element: <AcademicsPage /> },
  { path: ROUTES.admissions, element: <AdmissionsPage /> },
  { path: ROUTES.studentLife, element: <StudentLifePage /> },
  { path: ROUTES.services, element: <ServicesPage /> },
  { path: ROUTES.news, element: <NewsPage /> },
  { path: ROUTES.gallery, element: <GalleryPage /> },
  { path: ROUTES.contact, element: <ContactPage /> },
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.dashboard, element: <DashboardIndexPage /> },
  {
    path: ROUTES.studentDashboard,
    element: <DashboardLayout role="student" nav={studentNav} />,
    children: [
      { index: true, element: <StudentDashboardPage /> },
      { path: 'fees', element: <StudentFeesPage /> },
      { path: 'results', element: <StudentResultsPage /> },
      { path: 'assignments', element: <StudentAssignmentsPage /> },
      { path: 'virtual-class', element: <StudentVirtualClassPage /> },
    ],
  },
  {
    path: ROUTES.teacherDashboard,
    element: <DashboardLayout role="teacher" nav={teacherNav} />,
    children: [
      { index: true, element: <TeacherDashboardPage /> },
      { path: 'assignments', element: <TeacherAssignmentsPage /> },
      { path: 'results', element: <TeacherResultsPage /> },
      { path: 'classes', element: <TeacherClassesPage /> },
    ],
  },
  {
    path: ROUTES.adminDashboard,
    element: <DashboardLayout role="admin" nav={adminNav} />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'teachers', element: <AdminTeachersPage /> },
      { path: 'admissions', element: <AdminAdmissionsPage /> },
      { path: 'fees', element: <AdminFeesPage /> },
      { path: 'results', element: <AdminResultsPage /> },
      { path: 'assignments', element: <AdminAssignmentsPage /> },
      { path: 'virtual-class', element: <AdminVirtualClassPage /> },
      { path: 'news', element: <AdminNewsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },
  // Back-compat alias: /admin/student -> /dashboard/student
  { path: '/admin/student/*', element: <Navigate to={ROUTES.studentDashboard} replace /> },
  { path: ROUTES.notFound, element: <NotFoundPage /> },
]);
