export const ROUTES = {
  home: '/',
  about: '/about',
  academics: '/academics',
  admissions: '/admissions',
  studentLife: '/student-life',
  services: '/services',
  news: '/news',
  gallery: '/gallery',
  contact: '/contact',
  login: '/login',
  notFound: '*',
} as const;

export type AppRouteKey = keyof typeof ROUTES;
