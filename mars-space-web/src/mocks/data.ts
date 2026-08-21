import type { Category } from '@/entities/category/types';
import type { Course } from '@/entities/course/types';
import type { Teacher } from '@/entities/teacher/types';
import type { UpcomingGroup } from '@/entities/group/types';
import type { Post } from '@/entities/post/types';
import type { Testimonial } from '@/entities/testimonial/types';
import type { SettingsBundle } from '@/shared/types/settings.types';
import type { AuthUser } from '@/store/auth.store';

const now = '2026-08-01T09:00:00.000Z';

function price(amount: number, discount?: number): Course['price'] {
  return {
    amount,
    discountAmount: discount ?? null,
    effectiveAmount: discount ?? amount,
    discountPercent: discount ? Math.round((1 - discount / amount) * 100) : null,
    currency: 'UZS',
  };
}

export const categories: Category[] = [
  {
    id: 'cat_frontend',
    slug: 'frontend',
    name: { uz: 'Frontend', ru: 'Frontend', en: 'Frontend' },
    description: {
      uz: 'Zamonaviy veb interfeyslar.',
      ru: 'Современные веб-интерфейсы.',
      en: 'Modern web interfaces.',
    },
    iconKey: 'code',
    colorHex: '#C1440E',
    sortOrder: 1,
    isActive: true,
    courseCount: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat_backend',
    slug: 'backend',
    name: { uz: 'Backend', ru: 'Backend', en: 'Backend' },
    description: {
      uz: 'Server va maʼlumotlar bazasi.',
      ru: 'Серверы и базы данных.',
      en: 'Servers and databases.',
    },
    iconKey: 'server',
    colorHex: '#E8A33D',
    sortOrder: 2,
    isActive: true,
    courseCount: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat_design',
    slug: 'design',
    name: { uz: 'Dizayn', ru: 'Дизайн', en: 'Design' },
    description: {
      uz: 'UI/UX va mahsulot dizayni.',
      ru: 'UI/UX и продуктовый дизайн.',
      en: 'UI/UX and product design.',
    },
    iconKey: 'palette',
    colorHex: '#3FB950',
    sortOrder: 3,
    isActive: true,
    courseCount: 1,
    createdAt: now,
    updatedAt: now,
  },
];

const teacherSummaries = {
  aziz: {
    id: 'tch_aziz',
    slug: 'aziz-karimov',
    fullName: 'Aziz Karimov',
    position: { uz: 'Senior Frontend', ru: 'Senior Frontend', en: 'Senior Frontend' },
    photoUrl: null,
  },
  dilnoza: {
    id: 'tch_dilnoza',
    slug: 'dilnoza-yusupova',
    fullName: 'Dilnoza Yusupova',
    position: { uz: 'Backend muhandis', ru: 'Backend инженер', en: 'Backend engineer' },
    photoUrl: null,
  },
};

const categorySummaries = {
  frontend: {
    id: 'cat_frontend',
    slug: 'frontend',
    name: categories[0]!.name,
    colorHex: '#C1440E',
    iconKey: 'code',
  },
  backend: {
    id: 'cat_backend',
    slug: 'backend',
    name: categories[1]!.name,
    colorHex: '#E8A33D',
    iconKey: 'server',
  },
  design: {
    id: 'cat_design',
    slug: 'design',
    name: categories[2]!.name,
    colorHex: '#3FB950',
    iconKey: 'palette',
  },
};

export const courses: Course[] = [
  {
    id: 'crs_frontend',
    slug: 'frontend-development',
    title: {
      uz: 'Frontend dasturlash',
      ru: 'Frontend разработка',
      en: 'Frontend Development',
    },
    shortDescription: {
      uz: 'React va TypeScript bilan zamonaviy interfeyslar.',
      ru: 'Современные интерфейсы на React и TypeScript.',
      en: 'Modern interfaces with React and TypeScript.',
    },
    description: {
      uz: '<p>HTML, CSS, JavaScript, React va TypeScript. Amaliy loyihalar bilan portfolio.</p>',
      ru: '<p>HTML, CSS, JavaScript, React и TypeScript. Портфолио на реальных проектах.</p>',
      en: '<p>HTML, CSS, JavaScript, React and TypeScript. A portfolio built on real projects.</p>',
    },
    outcomes: {
      uz: ['React ilovalar yaratish', 'TypeScript bilan ishlash', 'API bilan integratsiya'],
      ru: ['Создавать приложения на React', 'Работать с TypeScript', 'Интеграция с API'],
      en: ['Build React apps', 'Work with TypeScript', 'Integrate with APIs'],
    },
    requirements: {
      uz: ['Kompyuterda ishlash koʻnikmasi', 'Ingliz tili boshlangʻich'],
      ru: ['Базовые навыки работы с ПК', 'Английский на базовом уровне'],
      en: ['Basic computer skills', 'Basic English'],
    },
    syllabus: [
      {
        order: 1,
        title: { uz: 'Asoslar', ru: 'Основы', en: 'Foundations' },
        durationWeeks: 4,
        topics: {
          uz: ['HTML', 'CSS', 'Flexbox & Grid'],
          ru: ['HTML', 'CSS', 'Flexbox и Grid'],
          en: ['HTML', 'CSS', 'Flexbox & Grid'],
        },
      },
      {
        order: 2,
        title: { uz: 'React', ru: 'React', en: 'React' },
        durationWeeks: 8,
        topics: {
          uz: ['Komponentlar', 'Holat boshqaruvi', 'Router'],
          ru: ['Компоненты', 'Управление состоянием', 'Роутер'],
          en: ['Components', 'State management', 'Router'],
        },
      },
    ],
    categoryId: 'cat_frontend',
    category: categorySummaries.frontend,
    level: 'BEGINNER',
    format: 'OFFLINE',
    durationMonths: 6,
    lessonsPerWeek: 3,
    lessonMinutes: 90,
    totalLessons: 78,
    price: price(1_800_000, 1_500_000),
    coverImageUrl: null,
    promoVideoUrl: null,
    metaTitle: null,
    metaDescription: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
    teachers: [teacherSummaries.aziz],
    groups: [
      {
        id: 'grp_fs12',
        name: 'MS-FS12',
        startDate: '2026-09-02T00:00:00.000Z',
        weekDays: ['MON', 'WED', 'FRI'],
        startTime: '18:00',
        endTime: '19:30',
        status: 'FORMING',
        capacity: 15,
        freeSeats: 3,
      },
    ],
    testimonials: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'crs_backend',
    slug: 'backend-development',
    title: { uz: 'Backend dasturlash', ru: 'Backend разработка', en: 'Backend Development' },
    shortDescription: {
      uz: 'Node.js, NestJS va PostgreSQL.',
      ru: 'Node.js, NestJS и PostgreSQL.',
      en: 'Node.js, NestJS and PostgreSQL.',
    },
    description: {
      uz: '<p>Server tomoni dasturlash, API va maʼlumotlar bazasi.</p>',
      ru: '<p>Серверная разработка, API и базы данных.</p>',
      en: '<p>Server-side development, APIs and databases.</p>',
    },
    outcomes: null,
    requirements: null,
    syllabus: null,
    categoryId: 'cat_backend',
    category: categorySummaries.backend,
    level: 'INTERMEDIATE',
    format: 'HYBRID',
    durationMonths: 7,
    lessonsPerWeek: 3,
    lessonMinutes: 90,
    totalLessons: 91,
    price: price(2_000_000),
    coverImageUrl: null,
    promoVideoUrl: null,
    metaTitle: null,
    metaDescription: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 2,
    teachers: [teacherSummaries.dilnoza],
    groups: [
      {
        id: 'grp_be07',
        name: 'MS-BE07',
        startDate: '2026-09-09T00:00:00.000Z',
        weekDays: ['TUE', 'THU', 'SAT'],
        startTime: '19:00',
        endTime: '20:30',
        status: 'FORMING',
        capacity: 12,
        freeSeats: 0,
      },
    ],
    testimonials: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'crs_uiux',
    slug: 'ui-ux-design',
    title: { uz: 'UI/UX dizayn', ru: 'UI/UX дизайн', en: 'UI/UX Design' },
    shortDescription: {
      uz: 'Figma bilan mahsulot dizayni.',
      ru: 'Продуктовый дизайн в Figma.',
      en: 'Product design with Figma.',
    },
    description: {
      uz: '<p>Foydalanuvchi tajribasi va interfeys dizayni.</p>',
      ru: '<p>Пользовательский опыт и дизайн интерфейсов.</p>',
      en: '<p>User experience and interface design.</p>',
    },
    outcomes: null,
    requirements: null,
    syllabus: null,
    categoryId: 'cat_design',
    category: categorySummaries.design,
    level: 'BEGINNER',
    format: 'ONLINE',
    durationMonths: 4,
    lessonsPerWeek: 2,
    lessonMinutes: 90,
    totalLessons: 32,
    price: price(1_200_000),
    coverImageUrl: null,
    promoVideoUrl: null,
    metaTitle: null,
    metaDescription: null,
    isFeatured: false,
    isPublished: true,
    sortOrder: 3,
    teachers: [teacherSummaries.aziz],
    groups: [],
    testimonials: [],
    createdAt: now,
    updatedAt: now,
  },
];

export const teachers: Teacher[] = [
  {
    id: 'tch_aziz',
    slug: 'aziz-karimov',
    fullName: 'Aziz Karimov',
    position: { uz: 'Senior Frontend', ru: 'Senior Frontend', en: 'Senior Frontend' },
    bio: {
      uz: '8 yillik tajriba. React va TypeScript boʻyicha mentor.',
      ru: '8 лет опыта. Ментор по React и TypeScript.',
      en: '8 years of experience. Mentor in React and TypeScript.',
    },
    photoUrl: null,
    experienceYears: 8,
    skills: ['React', 'TypeScript', 'Next.js'],
    socials: { telegram: 'https://t.me/aziz', github: 'https://github.com/aziz' },
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'tch_dilnoza',
    slug: 'dilnoza-yusupova',
    fullName: 'Dilnoza Yusupova',
    position: { uz: 'Backend muhandis', ru: 'Backend инженер', en: 'Backend engineer' },
    bio: {
      uz: 'NestJS va PostgreSQL boʻyicha amaliyotchi.',
      ru: 'Практик по NestJS и PostgreSQL.',
      en: 'Practitioner in NestJS and PostgreSQL.',
    },
    photoUrl: null,
    experienceYears: 6,
    skills: ['Node.js', 'NestJS', 'PostgreSQL'],
    socials: { linkedin: 'https://linkedin.com/in/dilnoza' },
    sortOrder: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const upcomingGroups: UpcomingGroup[] = [
  {
    id: 'grp_fs12',
    name: 'MS-FS12',
    courseId: 'crs_frontend',
    course: { id: 'crs_frontend', slug: 'frontend-development', title: courses[0]!.title },
    teacher: {
      id: 'tch_aziz',
      slug: 'aziz-karimov',
      fullName: 'Aziz Karimov',
      photoUrl: null,
    },
    startDate: '2026-09-02T00:00:00.000Z',
    endDate: null,
    weekDays: ['MON', 'WED', 'FRI'],
    startTime: '18:00',
    endTime: '19:30',
    roomName: 'A-1',
    capacity: 15,
    activeStudentsCount: 12,
    freeSeats: 3,
    status: 'FORMING',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'grp_be07',
    name: 'MS-BE07',
    courseId: 'crs_backend',
    course: { id: 'crs_backend', slug: 'backend-development', title: courses[1]!.title },
    teacher: {
      id: 'tch_dilnoza',
      slug: 'dilnoza-yusupova',
      fullName: 'Dilnoza Yusupova',
      photoUrl: null,
    },
    startDate: '2026-09-09T00:00:00.000Z',
    endDate: null,
    weekDays: ['TUE', 'THU', 'SAT'],
    startTime: '19:00',
    endTime: '20:30',
    roomName: 'B-2',
    capacity: 12,
    activeStudentsCount: 12,
    freeSeats: 0,
    status: 'FORMING',
    createdAt: now,
    updatedAt: now,
  },
];

export const posts: Post[] = [
  {
    id: 'post_open',
    slug: 'kuzgi-qabul-boshlandi',
    title: {
      uz: 'Kuzgi qabul boshlandi',
      ru: 'Осенний набор открыт',
      en: 'Autumn intake is open',
    },
    excerpt: {
      uz: 'Yangi guruhlarga yozilish davom etmoqda.',
      ru: 'Идёт запись в новые группы.',
      en: 'Enrolment for new groups is underway.',
    },
    content: {
      uz: '<p>Frontend va Backend guruhlariga joylar cheklangan.</p>',
      ru: '<p>Места в группах Frontend и Backend ограничены.</p>',
      en: '<p>Seats in the Frontend and Backend groups are limited.</p>',
    },
    coverImageUrl: null,
    tags: ['qabul', 'yangiliklar'],
    author: { id: 'usr_admin', fullName: 'Mars Space', avatarUrl: null },
    readMinutes: 3,
    viewCount: 128,
    metaTitle: null,
    metaDescription: null,
    isPublished: true,
    publishedAt: '2026-08-05T09:00:00.000Z',
    createdAt: now,
    updatedAt: now,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: 'tst_1',
    authorName: 'Jasur R.',
    authorRole: { uz: 'Frontend dasturchi', ru: 'Frontend разработчик', en: 'Frontend developer' },
    avatarUrl: null,
    courseId: 'crs_frontend',
    rating: 5,
    content: {
      uz: 'Kurs juda amaliy edi, ishga joylashdim.',
      ru: 'Курс очень практичный, я устроился на работу.',
      en: 'The course was very practical, I got a job.',
    },
    videoUrl: null,
    isPublished: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
];

export const settings: SettingsBundle = {
  contacts: {
    phone: '+998901234567',
    email: 'info@marsspace.uz',
    address: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
    workingHours: { uz: 'Du–Sha 9:00–19:00', ru: 'Пн–Сб 9:00–19:00', en: 'Mon–Sat 9:00–19:00' },
  },
  socials: {
    telegram: 'https://t.me/marsspace',
    instagram: 'https://instagram.com/marsspace',
  },
  hero_stats: [
    { key: 'graduates', value: '1240', label: { uz: 'Bitiruvchi', ru: 'Выпускников', en: 'Graduates' } },
    { key: 'courses', value: '18', label: { uz: 'Kurs', ru: 'Курсов', en: 'Courses' } },
    { key: 'teachers', value: '24', label: { uz: 'Ustoz', ru: 'Преподавателей', en: 'Teachers' } },
    { key: 'employment', value: '87%', label: { uz: 'Ishga joylashish', ru: 'Трудоустройство', en: 'Employment' } },
  ],
  seo_defaults: {
    title: { uz: 'Mars Space', ru: 'Mars Space', en: 'Mars Space' },
    description: {
      uz: 'Toshkentdagi IT oʻquv markazi.',
      ru: 'IT учебный центр в Ташкенте.',
      en: 'IT learning centre in Tashkent.',
    },
  },
};

export const mockUser: AuthUser = {
  id: 'usr_admin',
  fullName: 'Admin',
  email: 'admin@marsspace.uz',
  role: 'SUPER_ADMIN',
  avatarUrl: null,
};

// ── Admin-only mutable seed data (mock mode) ────────────────────────

interface AdminLead {
  id: string;
  fullName: string;
  phone: string;
  courseId: string | null;
  course: { id: string; slug: string; title: (typeof courses)[number]['title'] } | null;
  message: string | null;
  source: string;
  status: string;
  assignedToId: string | null;
  assignedTo: { id: string; fullName: string; avatarUrl: string | null } | null;
  adminNote: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  pageUrl: string | null;
  contactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const adminLeads: AdminLead[] = [
  {
    id: 'lead_1',
    fullName: 'Sardor Aliyev',
    phone: '+998901112233',
    courseId: 'crs_frontend',
    course: { id: 'crs_frontend', slug: 'frontend-development', title: courses[0]!.title },
    message: 'Frontend kursiga qiziqaman',
    source: 'WEBSITE_FORM',
    status: 'NEW',
    assignedToId: null,
    assignedTo: null,
    adminNote: null,
    utmSource: 'instagram',
    utmMedium: 'social',
    utmCampaign: 'autumn',
    pageUrl: '/courses/frontend-development',
    contactedAt: null,
    createdAt: '2026-08-18T10:00:00.000Z',
    updatedAt: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 'lead_2',
    fullName: 'Malika Yusupova',
    phone: '+998907778899',
    courseId: 'crs_backend',
    course: { id: 'crs_backend', slug: 'backend-development', title: courses[1]!.title },
    message: null,
    source: 'HERO_FORM',
    status: 'IN_PROGRESS',
    assignedToId: 'usr_admin',
    assignedTo: { id: 'usr_admin', fullName: 'Admin', avatarUrl: null },
    adminNote: 'Ertaga qo‘ng‘iroq qilish',
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    pageUrl: '/',
    contactedAt: null,
    createdAt: '2026-08-17T14:30:00.000Z',
    updatedAt: '2026-08-17T14:30:00.000Z',
  },
  {
    id: 'lead_3',
    fullName: 'Bekzod Karimov',
    phone: '+998933334455',
    courseId: null,
    course: null,
    message: null,
    source: 'TELEGRAM',
    status: 'CONTACTED',
    assignedToId: 'usr_admin',
    assignedTo: { id: 'usr_admin', fullName: 'Admin', avatarUrl: null },
    adminNote: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    pageUrl: null,
    contactedAt: '2026-08-16T09:00:00.000Z',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-08-16T09:00:00.000Z',
  },
];

export const adminUsers: AuthUser[] = [
  mockUser,
  {
    id: 'usr_manager',
    fullName: 'Nodira Manager',
    email: 'manager@marsspace.uz',
    role: 'MANAGER',
    avatarUrl: null,
  },
];

export const adminMessages = [
  {
    id: 'msg_1',
    fullName: 'Jasur',
    email: 'jasur@example.com',
    phone: '+998901234567',
    subject: 'Kurs narxi',
    message: 'Frontend kurs narxi qancha?',
    isRead: false,
    createdAt: '2026-08-18T08:00:00.000Z',
  },
];

export const adminStudents = [
  {
    id: 'std_1',
    fullName: 'Aziza Rahimova',
    phone: '+998901239988',
    email: null,
    birthDate: null,
    groupId: 'grp_fs12',
    group: { id: 'grp_fs12', name: 'MS-FS12' },
    status: 'ACTIVE',
    note: null,
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
  },
];
