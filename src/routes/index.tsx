import { createBrowserRouter } from 'react-router-dom';
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
  { path: ROUTES.notFound, element: <NotFoundPage /> },
]);
