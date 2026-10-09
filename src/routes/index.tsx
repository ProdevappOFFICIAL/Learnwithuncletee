import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from './paths';
import { RequireAuth, RequireRole } from './guards';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { AcademicsPage } from '@/pages/AcademicsPage';
import { AdmissionsPage } from '@/pages/AdmissionsPage';
import { StudentLifePage } from '@/pages/StudentLifePage';
import { ServicesPage } from '@/pages/ServicesPage';
import { NewsPage } from '@/pages/NewsPage';
import { NewsDetailPage } from '@/pages/NewsDetailPage';
import { GalleryPage } from '@/pages/GalleryPage';
import { ContactPage } from '@/pages/ContactPage';
import { LoginPage } from '@/pages/LoginPage';
import { ConnectDesktopPage } from '@/pages/ConnectDesktopPage';
import { ExaminationPage } from '@/pages/ExaminationPage';
import { ExamRoomPage } from '@/pages/ExamRoomPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { adminNav, studentNav, teacherNav } from '@/data/dashboard';
import { DashboardIndexPage } from '@/pages/dashboard/DashboardIndexPage';
import { StudentDashboardPage } from '@/pages/dashboard/student/StudentDashboardPage';
import { StudentFeesPage } from '@/pages/dashboard/student/StudentFeesPage';
import { StudentResultsPage } from '@/pages/dashboard/student/StudentResultsPage';
import { StudentAssignmentsPage } from '@/pages/dashboard/student/StudentAssignmentsPage';
import { StudentVirtualClassPage } from '@/pages/dashboard/student/StudentVirtualClassPage';
import { StudentConductPage } from '@/pages/dashboard/student/StudentConductPage';
import { TeacherDashboardPage } from '@/pages/dashboard/teacher/TeacherDashboardPage';
import { TeacherAttendancePage } from '@/pages/dashboard/teacher/TeacherAttendancePage';
import { TeacherAssignmentsPage } from '@/pages/dashboard/teacher/TeacherAssignmentsPage';
import { TeacherResultsPage } from '@/pages/dashboard/teacher/TeacherResultsPage';
import { TeacherClassesPage } from '@/pages/dashboard/teacher/TeacherClassesPage';
import { TeacherCourseQuestionsPage } from '@/pages/dashboard/teacher/TeacherCourseQuestionsPage';
import { AdminDashboardPage } from '@/pages/dashboard/admin/AdminDashboardPage';
import { AdminStudentsPage } from '@/pages/dashboard/admin/AdminStudentsPage';
import { AdminTeachersPage } from '@/pages/dashboard/admin/AdminTeachersPage';
import { AdminAdmissionsPage } from '@/pages/dashboard/admin/AdminAdmissionsPage';
import { AdminAttendancePage } from '@/pages/dashboard/admin/AdminAttendancePage';
import { AdminFeesPage } from '@/pages/dashboard/admin/AdminFeesPage';
import { AdminResultsPage } from '@/pages/dashboard/admin/AdminResultsPage';
import { AdminAssignmentsPage } from '@/pages/dashboard/admin/AdminAssignmentsPage';
import { AdminVirtualClassPage } from '@/pages/dashboard/admin/AdminVirtualClassPage';
import { AdminNewsPage } from '@/pages/dashboard/admin/AdminNewsPage';
import { AdminNewsPreviewPage } from '@/pages/dashboard/admin/AdminNewsPreviewPage';
import { AdminFormsPage } from '@/pages/dashboard/admin/AdminFormsPage';
import { AdminFormPreviewPage } from '@/pages/dashboard/admin/AdminFormPreviewPage';
import { FormResponsesPage } from '@/pages/dashboard/admin/FormResponsesPage';
import { FormPage } from '@/pages/FormPage';
import { AdminMembersPage } from '@/pages/dashboard/admin/AdminMembersPage';
import { AdminWebsitePage } from '@/pages/dashboard/admin/AdminWebsitePage';
import { AdminWebsitePagesPage } from '@/pages/dashboard/admin/AdminWebsitePagesPage';
import { ExamClassesPage } from '@/pages/dashboard/admin/ExamClassesPage';
import { AllExamsPage } from '@/pages/dashboard/admin/AllExamsPage';
import { AllSubjectsPage } from '@/pages/dashboard/admin/AllSubjectsPage';
import { AllQuestionsPage } from '@/pages/dashboard/admin/AllQuestionsPage';
import { AdminCombinationPage } from '@/pages/dashboard/admin/AdminCombinationPage';
import { DeploymentsPage } from '@/pages/dashboard/admin/DeploymentsPage';
import { ClassExamsPage } from '@/pages/dashboard/admin/ClassExamsPage';
import { ExamSubjectsPage } from '@/pages/dashboard/admin/ExamSubjectsPage';
import { SubjectQuestionsPage } from '@/pages/dashboard/admin/SubjectQuestionsPage';
import { ExamTestResultsPage } from '@/pages/dashboard/admin/ExamTestResultsPage';
import { WebsiteSectionPage } from '@/pages/dashboard/admin/AdminSectionPage';
import { AdminSettingsPage } from '@/pages/dashboard/admin/AdminSettingsPage';
import { AdminAuditLogPage } from '@/pages/dashboard/admin/AdminAuditLogPage';

export const router = createBrowserRouter([
  { path: ROUTES.home, element: <HomePage /> },
  { path: ROUTES.about, element: <AboutPage /> },
  { path: ROUTES.academics, element: <AcademicsPage /> },
  { path: ROUTES.admissions, element: <AdmissionsPage /> },
  { path: ROUTES.studentLife, element: <StudentLifePage /> },
  { path: ROUTES.services, element: <ServicesPage /> },
  { path: ROUTES.news, element: <NewsPage /> },
  { path: ROUTES.newsDetail, element: <NewsDetailPage /> },
  { path: ROUTES.gallery, element: <GalleryPage /> },
  { path: ROUTES.contact, element: <ContactPage /> },
  { path: ROUTES.login, element: <LoginPage /> },
  {
    path: ROUTES.connectDesktop,
    element: <RequireAuth />,
    children: [{ index: true, element: <ConnectDesktopPage /> }],
  },
  { path: ROUTES.examination, element: <ExaminationPage /> },
  { path: ROUTES.examinationRoom, element: <ExamRoomPage /> },
  { path: ROUTES.formPublic, element: <FormPage /> },
  { path: ROUTES.dashboard, element: <DashboardIndexPage /> },
  {
    path: ROUTES.studentDashboard,
    element: <RequireAuth />,
    children: [
      {
        element: (
          <RequireRole allow={['STUDENT', 'PARENT']}>
            <DashboardLayout role="student" nav={studentNav} />
          </RequireRole>
        ),
        children: [
          { index: true, element: <StudentDashboardPage /> },
          { path: 'fees', element: <StudentFeesPage /> },
          { path: 'results', element: <StudentResultsPage /> },
          { path: 'assignments', element: <StudentAssignmentsPage /> },
          { path: 'virtual-class', element: <StudentVirtualClassPage /> },
          { path: 'conduct', element: <StudentConductPage /> },
        ],
      },
    ],
  },
  {
    path: ROUTES.teacherDashboard,
    element: <RequireAuth />,
    children: [
      {
        element: (
          <RequireRole allow={['TEACHER']}>
            <DashboardLayout role="teacher" nav={teacherNav} />
          </RequireRole>
        ),
        children: [
          { index: true, element: <TeacherDashboardPage /> },
          { path: 'attendance', element: <TeacherAttendancePage /> },
          { path: 'attendance', element: <TeacherAttendancePage /> },
          { path: 'assignments', element: <TeacherAssignmentsPage /> },
          { path: 'results', element: <TeacherResultsPage /> },
          { path: 'classes', element: <TeacherClassesPage /> },
          { path: 'courses/questions', element: <TeacherCourseQuestionsPage /> },
        ],
      },
    ],
  },
  {
    path: ROUTES.adminDashboard,
    element: <RequireAuth />,
    children: [
      {
        element: (
          <RequireRole allow={['ADMIN', 'OWNER']}>
            <DashboardLayout role="admin" nav={adminNav} />
          </RequireRole>
        ),
        children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'members', element: <AdminMembersPage /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'teachers', element: <AdminTeachersPage /> },
      { path: 'admissions', element: <AdminAdmissionsPage /> },
      { path: 'attendance', element: <AdminAttendancePage /> },
      { path: 'attendance', element: <AdminAttendancePage /> },
      { path: 'fees', element: <AdminFeesPage /> },
      { path: 'results', element: <AdminResultsPage /> },
      { path: 'assignments', element: <AdminAssignmentsPage /> },
      { path: 'virtual-class', element: <AdminVirtualClassPage /> },
      { path: 'news', element: <AdminNewsPage /> },
  { path: 'news/preview', element: <AdminNewsPreviewPage /> },
  { path: 'forms', element: <AdminFormsPage /> },
  { path: 'forms/preview', element: <AdminFormPreviewPage /> },
  { path: 'forms/responses', element: <FormResponsesPage /> },
  { path: 'exams', element: <ExamClassesPage /> },
  { path: 'exams/all', element: <AllExamsPage /> },
  { path: 'exams/subjects', element: <AllSubjectsPage /> },
  { path: 'exams/questions', element: <AllQuestionsPage /> },
  { path: 'exams/combinations', element: <AdminCombinationPage /> },
  { path: 'exams/deployments', element: <DeploymentsPage /> },
  { path: 'exams/results', element: <ExamTestResultsPage /> },
  { path: 'exams/:classId', element: <ClassExamsPage /> },
  { path: 'exams/:classId/:examId', element: <ExamSubjectsPage /> },
  { path: 'exams/:classId/:examId/:subjectId', element: <SubjectQuestionsPage /> },
  { path: 'website', element: <AdminWebsitePage /> },
  { path: 'website/pages', element: <AdminWebsitePagesPage /> },
  { path: 'website/:section', element: <WebsiteSectionPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'audit-log', element: <AdminAuditLogPage /> },
        ],
      },
    ],
  },
  // Back-compat alias: /admin/student -> /dashboard/student
  { path: '/admin/student/*', element: <Navigate to={ROUTES.studentDashboard} replace /> },
  { path: ROUTES.notFound, element: <NotFoundPage /> },
]);
