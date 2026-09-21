export const ROUTES = {
  home: '/',
  students: '/students',
  parents: '/parents',
  teachers: '/teachers',
  resources: '/resources',
  notFound: '*',
} as const;

export type AppRouteKey = keyof typeof ROUTES;
