import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './paths';
import { HomePage } from '@/pages/HomePage';
import { StudentsPage } from '@/pages/StudentsPage';
import { ParentsPage } from '@/pages/ParentsPage';
import { TeachersPage } from '@/pages/TeachersPage';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: ROUTES.home, element: <HomePage /> },
  { path: ROUTES.students, element: <StudentsPage /> },
  { path: ROUTES.parents, element: <ParentsPage /> },
  { path: ROUTES.teachers, element: <TeachersPage /> },
  { path: ROUTES.resources, element: <ResourcesPage /> },
  { path: ROUTES.notFound, element: <NotFoundPage /> },
]);
