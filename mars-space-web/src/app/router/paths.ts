/**
 * Single source of truth for application URLs (spec §5). Never write a route
 * string inline. Functions build parameterised paths.
 */
export const paths = {
  home: '/',
  courses: '/courses',
  course: (slug: string) => `/courses/${slug}`,
  teachers: '/teachers',
  teacher: (slug: string) => `/teachers/${slug}`,
  about: '/about',
  news: '/news',
  newsDetail: (slug: string) => `/news/${slug}`,
  contact: '/contact',

  admin: {
    root: '/admin',
    login: '/admin/login',
    dashboard: '/admin',
    courses: '/admin/courses',
    courseNew: '/admin/courses/new',
    courseEdit: (id: string) => `/admin/courses/${id}/edit`,
    categories: '/admin/categories',
    teachers: '/admin/teachers',
    groups: '/admin/groups',
    students: '/admin/students',
    leads: '/admin/leads',
    news: '/admin/news',
    newsNew: '/admin/news/new',
    newsEdit: (id: string) => `/admin/news/${id}/edit`,
    testimonials: '/admin/testimonials',
    messages: '/admin/messages',
    settings: '/admin/settings',
    users: '/admin/users',
  },

  dev: {
    ui: '/dev/ui',
  },
} as const;
