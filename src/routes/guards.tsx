import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ROUTES } from './paths';
import { useAuth } from '@/context/AuthContext';

const homeForRole = (role: string) =>
  role === 'STUDENT' || role === 'PARENT'
    ? ROUTES.studentDashboard
    : role === 'TEACHER'
      ? ROUTES.teacherDashboard
      : ROUTES.adminDashboard;

/**
 * Blocks guests from protected areas. While the session is being resolved,
 * nothing renders (no login-page flash, no leaked dashboard frame).
 * An expired/dead session lands on /login — i.e. "please sign in again".
 */
export const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

/**
 * Blocks cross-role access (e.g. a teacher opening /dashboard/admin/*).
 * Users without one of `allow` are sent to their own home.
 *
 * When wrapping a layout component (e.g. DashboardLayout), pass it as
 * `children` — it will be rendered directly. DashboardLayout itself contains
 * the <Outlet /> that mounts the active child route page.
 *
 * Without children (plain guard usage), falls back to <Outlet />.
 */
export const RequireRole = ({ allow, children }: { allow: string[]; children?: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (!allow.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
};
