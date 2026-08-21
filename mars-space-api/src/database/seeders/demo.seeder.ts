import {
  GroupStatus,
  LeadSource,
  LeadStatus,
  Prisma,
  PrismaClient,
  StudentStatus,
  WeekDay,
} from '@prisma/client';
import { SeededAccounts } from './admin.seeder';
import { SeededCatalog } from './catalog.seeder';

export interface SeededDemo {
  groups: number;
  students: number;
  leads: number;
  posts: number;
  testimonials: number;
}

type L = { uz: string; ru: string; en: string };
const text = (uz: string, ru: string, en: string): L => ({ uz, ru, en });
const json = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

/** Days offset from today, so the seeded data stays plausible whenever it runs. */
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Groups, students, leads, posts, testimonials and the settings bundle (§9).
 *
 * Leads are spread across the last 60 days so the dashboard trend chart of
 * §6.3 has something meaningful to draw.
 */
export async function seedDemo(
  prisma: PrismaClient,
  accounts: SeededAccounts,
  catalog: SeededCatalog,
): Promise<SeededDemo> {
  const groupIdByName: Record<string, string> = {};

  for (const group of GROUPS) {
    const courseId = catalog.courseIdBySlug[group.courseSlug];
    if (!courseId) {
      throw new Error(`Group "${group.name}" references unknown course "${group.courseSlug}"`);
    }

    const teacher = await prisma.teacher.findUnique({ where: { slug: group.teacherSlug } });

    const payload = {
      courseId,
      teacherId: teacher?.id ?? null,
      startDate: daysFromNow(group.startsInDays),
      endDate: daysFromNow(group.startsInDays + group.durationDays),
      weekDays: [...group.weekDays],
      startTime: group.startTime,
      endTime: group.endTime,
      roomName: group.roomName,
      capacity: group.capacity,
      status: group.status,
    };

    const row = await prisma.group.upsert({
      where: { name: group.name },
      update: payload,
      create: { name: group.name, ...payload },
    });
    groupIdByName[group.name] = row.id;
  }

  // Students have no natural unique key, so the seeder keys them on phone and
  // only creates what is missing — that is what makes a second run a no-op.
  let studentCount = 0;
  for (const student of STUDENTS) {
    const groupId = groupIdByName[student.groupName];
    const existing = await prisma.student.findFirst({ where: { phone: student.phone } });

    if (existing) {
      studentCount += 1;
      continue;
    }

    await prisma.student.create({
      data: {
        fullName: student.fullName,
        phone: student.phone,
        email: student.email,
        groupId: groupId ?? null,
        status: student.status,
        enrolledAt: daysFromNow(-student.enrolledDaysAgo),
      },
    });
    studentCount += 1;
  }

  let leadCount = 0;
  for (const lead of LEADS) {
    const courseId = lead.courseSlug ? catalog.courseIdBySlug[lead.courseSlug] : null;
    const existing = await prisma.lead.findFirst({
      where: { phone: lead.phone, fullName: lead.fullName },
    });

    if (existing) {
      leadCount += 1;
      continue;
    }

    const createdAt = daysFromNow(-lead.daysAgo);

    await prisma.lead.create({
      data: {
        fullName: lead.fullName,
        phone: lead.phone,
        courseId: courseId ?? null,
        message: lead.message,
        source: lead.source,
        status: lead.status,
        assignedToId: lead.assigned ? accounts.managerId : null,
        adminNote: lead.adminNote,
        utmSource: lead.utmSource,
        pageUrl: lead.courseSlug
          ? `https://marsspace.uz/courses/${lead.courseSlug}`
          : 'https://marsspace.uz/',
        contactedAt: lead.status === LeadStatus.NEW ? null : daysFromNow(-lead.daysAgo + 1),
        createdAt,
        updatedAt: createdAt,
      },
    });
    leadCount += 1;
  }

  for (const post of POSTS) {
    const payload = {
      title: json(post.title),
      excerpt: json(post.excerpt),
      content: json(post.content),
      tags: [...post.tags],
      authorId: accounts.superAdminId,
      readMinutes: post.readMinutes,
      metaTitle: json(post.title),
      metaDescription: json(post.excerpt),
      isPublished: true,
      publishedAt: daysFromNow(-post.daysAgo),
    };

    await prisma.post.upsert({
      where: { slug: post.slug },
      update: payload,
      create: { slug: post.slug, ...payload },
    });
  }

  let testimonialCount = 0;
  for (const testimonial of TESTIMONIALS) {
    const courseId = catalog.courseIdBySlug[testimonial.courseSlug] ?? null;
    const existing = await prisma.testimonial.findFirst({
      where: { authorName: testimonial.authorName, courseId },
    });

    if (!existing) {
      await prisma.testimonial.create({
        data: {
          authorName: testimonial.authorName,
          authorRole: json(testimonial.authorRole),
          courseId,
          rating: testimonial.rating,
          content: json(testimonial.content),
          isPublished: true,
          sortOrder: testimonial.sortOrder,
        },
      });
    }
    testimonialCount += 1;
  }

  for (const message of CONTACT_MESSAGES) {
    const existing = await prisma.contactMessage.findFirst({
      where: { phone: message.phone, subject: message.subject },
    });
    if (!existing) {
      await prisma.contactMessage.create({
        data: {
          fullName: message.fullName,
          phone: message.phone,
          email: message.email,
          subject: message.subject,
          message: message.message,
          isRead: message.isRead,
          createdAt: daysFromNow(-message.daysAgo),
        },
      });
    }
  }

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: json(value) },
      create: { key, value: json(value) },
    });
  }

  return {
    groups: Object.keys(groupIdByName).length,
    students: studentCount,
    leads: leadCount,
    posts: POSTS.length,
    testimonials: testimonialCount,
  };
}

// ── Groups ───────────────────────────────────────────────────

const GROUPS = [
  {
    name: 'FS-2026-01',
    courseSlug: 'frontend-react',
    teacherSlug: 'jasur-yuldashev',
    startsInDays: -45,
    durationDays: 180,
    weekDays: [WeekDay.MON, WeekDay.WED, WeekDay.FRI],
    startTime: '18:00',
    endTime: '19:30',
    roomName: 'Mars-1',
    capacity: 15,
    status: GroupStatus.ACTIVE,
  },
  {
    name: 'BE-2026-01',
    courseSlug: 'backend-nodejs',
    teacherSlug: 'dilnoza-karimova',
    startsInDays: -30,
    durationDays: 180,
    weekDays: [WeekDay.TUE, WeekDay.THU, WeekDay.SAT],
    startTime: '19:00',
    endTime: '20:30',
    roomName: 'Mars-2',
    capacity: 14,
    status: GroupStatus.ACTIVE,
  },
  {
    name: 'FL-2026-01',
    courseSlug: 'flutter-mobile',
    teacherSlug: 'sardor-tursunov',
    startsInDays: -20,
    durationDays: 150,
    weekDays: [WeekDay.MON, WeekDay.WED, WeekDay.FRI],
    startTime: '16:00',
    endTime: '17:30',
    roomName: 'Mars-3',
    capacity: 12,
    status: GroupStatus.ACTIVE,
  },
  {
    name: 'UX-2026-02',
    courseSlug: 'ui-ux-figma',
    teacherSlug: 'malika-abdullayeva',
    startsInDays: 14,
    durationDays: 120,
    weekDays: [WeekDay.TUE, WeekDay.SAT],
    startTime: '14:00',
    endTime: '15:30',
    roomName: 'Mars-4',
    capacity: 16,
    status: GroupStatus.FORMING,
  },
  {
    name: 'FS-2026-02',
    courseSlug: 'frontend-react',
    teacherSlug: 'jasur-yuldashev',
    startsInDays: 21,
    durationDays: 180,
    weekDays: [WeekDay.TUE, WeekDay.THU, WeekDay.SAT],
    startTime: '18:00',
    endTime: '19:30',
    roomName: 'Mars-1',
    capacity: 15,
    status: GroupStatus.FORMING,
  },
  {
    name: 'KS-2026-03',
    courseSlug: 'kompyuter-savodxonligi',
    teacherSlug: 'nodira-ismoilova',
    startsInDays: 7,
    durationDays: 90,
    weekDays: [WeekDay.MON, WeekDay.THU],
    startTime: '10:00',
    endTime: '11:00',
    roomName: 'Mars-5',
    capacity: 20,
    status: GroupStatus.FORMING,
  },
] as const;

// ── Students ─────────────────────────────────────────────────

const STUDENTS = [
  {
    fullName: 'Abror Qodirov',
    phone: '+998901110001',
    email: 'abror.q@gmail.com',
    groupName: 'FS-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 45,
  },
  {
    fullName: 'Zilola Ergasheva',
    phone: '+998901110002',
    email: 'zilola.e@gmail.com',
    groupName: 'FS-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 44,
  },
  {
    fullName: 'Islom Nazarov',
    phone: '+998901110003',
    email: null,
    groupName: 'FS-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 43,
  },
  {
    fullName: 'Madina Yusupova',
    phone: '+998901110004',
    email: 'madina.y@gmail.com',
    groupName: 'FS-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 42,
  },
  {
    fullName: 'Shohruh Aliyev',
    phone: '+998901110005',
    email: null,
    groupName: 'FS-2026-01',
    status: StudentStatus.FROZEN,
    enrolledDaysAgo: 40,
  },
  {
    fullName: 'Gulnora Sattorova',
    phone: '+998901110006',
    email: 'gulnora.s@gmail.com',
    groupName: 'FS-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 38,
  },
  {
    fullName: 'Javohir Toshpo‘latov',
    phone: '+998901110007',
    email: null,
    groupName: 'BE-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 30,
  },
  {
    fullName: 'Kamola Rustamova',
    phone: '+998901110008',
    email: 'kamola.r@gmail.com',
    groupName: 'BE-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 30,
  },
  {
    fullName: 'Otabek Xolmatov',
    phone: '+998901110009',
    email: null,
    groupName: 'BE-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 29,
  },
  {
    fullName: 'Sevara Nurmatova',
    phone: '+998901110010',
    email: 'sevara.n@gmail.com',
    groupName: 'BE-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 28,
  },
  {
    fullName: 'Doniyor Ismoilov',
    phone: '+998901110011',
    email: null,
    groupName: 'BE-2026-01',
    status: StudentStatus.DROPPED,
    enrolledDaysAgo: 27,
  },
  {
    fullName: 'Nilufar Sharipova',
    phone: '+998901110012',
    email: 'nilufar.s@gmail.com',
    groupName: 'BE-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 25,
  },
  {
    fullName: 'Farrux Bekmurodov',
    phone: '+998901110013',
    email: null,
    groupName: 'FL-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 20,
  },
  {
    fullName: 'Ozoda Tursunova',
    phone: '+998901110014',
    email: 'ozoda.t@gmail.com',
    groupName: 'FL-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 20,
  },
  {
    fullName: 'Rustam Jalilov',
    phone: '+998901110015',
    email: null,
    groupName: 'FL-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 19,
  },
  {
    fullName: 'Dilfuza Ahmedova',
    phone: '+998901110016',
    email: 'dilfuza.a@gmail.com',
    groupName: 'FL-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 18,
  },
  {
    fullName: 'Aziz Mirzayev',
    phone: '+998901110017',
    email: null,
    groupName: 'FL-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 17,
  },
  {
    fullName: 'Shahzoda Umarova',
    phone: '+998901110018',
    email: 'shahzoda.u@gmail.com',
    groupName: 'FS-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 35,
  },
  {
    fullName: 'Bobur Saidov',
    phone: '+998901110019',
    email: null,
    groupName: 'BE-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 24,
  },
  {
    fullName: 'Lola Xamidova',
    phone: '+998901110020',
    email: 'lola.x@gmail.com',
    groupName: 'FL-2026-01',
    status: StudentStatus.ACTIVE,
    enrolledDaysAgo: 16,
  },
] as const;

// ── Leads ────────────────────────────────────────────────────

const LEADS = [
  {
    fullName: 'Ulug‘bek Ismatullayev',
    phone: '+998902220001',
    courseSlug: 'frontend-react',
    message: 'Kurs narxi va boshlanish sanasi qiziqtiryapti',
    source: LeadSource.COURSE_PAGE,
    status: LeadStatus.NEW,
    assigned: false,
    adminNote: null,
    utmSource: 'instagram',
    daysAgo: 1,
  },
  {
    fullName: 'Marjona Qosimova',
    phone: '+998902220002',
    courseSlug: 'ui-ux-figma',
    message: 'Kechki guruh bormi?',
    source: LeadSource.COURSE_PAGE,
    status: LeadStatus.NEW,
    assigned: false,
    adminNote: null,
    utmSource: 'google',
    daysAgo: 2,
  },
  {
    fullName: 'Sanjar Ergashev',
    phone: '+998902220003',
    courseSlug: 'backend-nodejs',
    message: null,
    source: LeadSource.HERO_FORM,
    status: LeadStatus.NEW,
    assigned: true,
    adminNote: null,
    utmSource: null,
    daysAgo: 2,
  },
  {
    fullName: 'Feruza Normatova',
    phone: '+998902220004',
    courseSlug: 'frontend-react',
    message: 'Onlayn o‘qish imkoniyati bormi?',
    source: LeadSource.WEBSITE_FORM,
    status: LeadStatus.IN_PROGRESS,
    assigned: true,
    adminNote: 'Qayta qo‘ng‘iroq qilish kerak',
    utmSource: 'telegram',
    daysAgo: 4,
  },
  {
    fullName: 'Alisher Hakimov',
    phone: '+998902220005',
    courseSlug: 'devops-asoslari',
    message: null,
    source: LeadSource.TELEGRAM,
    status: LeadStatus.IN_PROGRESS,
    assigned: true,
    adminNote: null,
    utmSource: 'telegram',
    daysAgo: 5,
  },
  {
    fullName: 'Nozima Rasulova',
    phone: '+998902220006',
    courseSlug: 'kompyuter-savodxonligi',
    message: 'Onam uchun so‘rayapman',
    source: LeadSource.PHONE,
    status: LeadStatus.CONTACTED,
    assigned: true,
    adminNote: 'Ertalabki guruh taklif qilindi',
    utmSource: null,
    daysAgo: 6,
  },
  {
    fullName: 'Jahongir Yoqubov',
    phone: '+998902220007',
    courseSlug: 'fullstack-javascript',
    message: null,
    source: LeadSource.INSTAGRAM,
    status: LeadStatus.CONTACTED,
    assigned: true,
    adminNote: null,
    utmSource: 'instagram',
    daysAgo: 8,
  },
  {
    fullName: 'Kamila Azimova',
    phone: '+998902220008',
    courseSlug: 'ui-ux-figma',
    message: 'To‘lovni bo‘lib to‘lash mumkinmi?',
    source: LeadSource.COURSE_PAGE,
    status: LeadStatus.CONTACTED,
    assigned: true,
    adminNote: 'Bo‘lib to‘lash tushuntirildi',
    utmSource: null,
    daysAgo: 9,
  },
  {
    fullName: 'Temur Rashidov',
    phone: '+998902220009',
    courseSlug: 'flutter-mobile',
    message: null,
    source: LeadSource.WALK_IN,
    status: LeadStatus.ENROLLED,
    assigned: true,
    adminNote: 'FL-2026-01 guruhiga qo‘shildi',
    utmSource: null,
    daysAgo: 18,
  },
  {
    fullName: 'Zarina Mahmudova',
    phone: '+998902220010',
    courseSlug: 'frontend-react',
    message: null,
    source: LeadSource.WEBSITE_FORM,
    status: LeadStatus.ENROLLED,
    assigned: true,
    adminNote: null,
    utmSource: 'google',
    daysAgo: 40,
  },
  {
    fullName: 'Sherzod Yusupov',
    phone: '+998902220011',
    courseSlug: 'backend-nodejs',
    message: null,
    source: LeadSource.COURSE_PAGE,
    status: LeadStatus.ENROLLED,
    assigned: true,
    adminNote: null,
    utmSource: null,
    daysAgo: 29,
  },
  {
    fullName: 'Malika Odilova',
    phone: '+998902220012',
    courseSlug: 'flutter-mobile',
    message: 'Ish bilan birga o‘qib bo‘ladimi?',
    source: LeadSource.HERO_FORM,
    status: LeadStatus.REJECTED,
    assigned: true,
    adminNote: 'Vaqti mos kelmadi',
    utmSource: null,
    daysAgo: 12,
  },
  {
    fullName: 'Diyor Salimov',
    phone: '+998902220013',
    courseSlug: null,
    message: 'Qaysi kurs menga mos kelishini bilmoqchiman',
    source: LeadSource.WEBSITE_FORM,
    status: LeadStatus.IN_PROGRESS,
    assigned: false,
    adminNote: null,
    utmSource: null,
    daysAgo: 3,
  },
  {
    fullName: 'Umida Tolibova',
    phone: '+998902220014',
    courseSlug: 'ui-ux-figma',
    message: null,
    source: LeadSource.INSTAGRAM,
    status: LeadStatus.NEW,
    assigned: false,
    adminNote: null,
    utmSource: 'instagram',
    daysAgo: 1,
  },
  {
    fullName: 'Ravshan Karimov',
    phone: '+998902220015',
    courseSlug: 'fullstack-javascript',
    message: null,
    source: LeadSource.COURSE_PAGE,
    status: LeadStatus.CONTACTED,
    assigned: true,
    adminNote: null,
    utmSource: 'google',
    daysAgo: 14,
  },
  {
    fullName: 'Shohsanam Isroilova',
    phone: '+998902220016',
    courseSlug: 'kompyuter-savodxonligi',
    message: null,
    source: LeadSource.PHONE,
    status: LeadStatus.ENROLLED,
    assigned: true,
    adminNote: null,
    utmSource: null,
    daysAgo: 22,
  },
  {
    fullName: 'Bekzod Norqulov',
    phone: '+998902220017',
    courseSlug: 'backend-nodejs',
    message: 'Diplom beriladimi?',
    source: LeadSource.WEBSITE_FORM,
    status: LeadStatus.CONTACTED,
    assigned: true,
    adminNote: 'Sertifikat haqida tushuntirildi',
    utmSource: null,
    daysAgo: 16,
  },
  {
    fullName: 'Gulbahor Aminova',
    phone: '+998902220018',
    courseSlug: 'frontend-react',
    message: null,
    source: LeadSource.TELEGRAM,
    status: LeadStatus.REJECTED,
    assigned: true,
    adminNote: 'Boshqa markazni tanladi',
    utmSource: 'telegram',
    daysAgo: 25,
  },
  {
    fullName: 'Muhammadali Rahimov',
    phone: '+998902220019',
    courseSlug: 'react-native-mobile',
    message: null,
    source: LeadSource.COURSE_PAGE,
    status: LeadStatus.NEW,
    assigned: false,
    adminNote: null,
    utmSource: null,
    daysAgo: 7,
  },
  {
    fullName: 'Yulduz Qurbonova',
    phone: '+998902220020',
    courseSlug: 'ui-ux-figma',
    message: null,
    source: LeadSource.HERO_FORM,
    status: LeadStatus.IN_PROGRESS,
    assigned: true,
    adminNote: null,
    utmSource: 'instagram',
    daysAgo: 10,
  },
  {
    fullName: 'Asadbek Xudoyberdiyev',
    phone: '+998902220021',
    courseSlug: 'frontend-react',
    message: null,
    source: LeadSource.WEBSITE_FORM,
    status: LeadStatus.ENROLLED,
    assigned: true,
    adminNote: null,
    utmSource: null,
    daysAgo: 44,
  },
  {
    fullName: 'Nargiza Sobirova',
    phone: '+998902220022',
    courseSlug: 'kompyuter-savodxonligi',
    message: null,
    source: LeadSource.WALK_IN,
    status: LeadStatus.CONTACTED,
    assigned: true,
    adminNote: null,
    utmSource: null,
    daysAgo: 33,
  },
  {
    fullName: 'Ibrohim Tursunboyev',
    phone: '+998902220023',
    courseSlug: 'backend-nodejs',
    message: 'Portfolio uchun loyihalar bormi?',
    source: LeadSource.COURSE_PAGE,
    status: LeadStatus.CONTACTED,
    assigned: true,
    adminNote: null,
    utmSource: 'google',
    daysAgo: 38,
  },
  {
    fullName: 'Sabina Yusufova',
    phone: '+998902220024',
    courseSlug: 'flutter-mobile',
    message: null,
    source: LeadSource.INSTAGRAM,
    status: LeadStatus.REJECTED,
    assigned: true,
    adminNote: 'Narx mos kelmadi',
    utmSource: 'instagram',
    daysAgo: 50,
  },
  {
    fullName: 'Ozodbek Nazarov',
    phone: '+998902220025',
    courseSlug: 'fullstack-javascript',
    message: null,
    source: LeadSource.OTHER,
    status: LeadStatus.NEW,
    assigned: false,
    adminNote: null,
    utmSource: null,
    daysAgo: 57,
  },
] as const;

// ── Posts ────────────────────────────────────────────────────

const POSTS = [
  {
    slug: 'frontend-dasturchi-bolish-yol-xaritasi',
    title: text(
      'Frontend dasturchi bo‘lish: 2026 yil yo‘l xaritasi',
      'Как стать frontend-разработчиком: дорожная карта 2026',
      'Becoming a frontend developer: the 2026 roadmap',
    ),
    excerpt: text(
      'Noldan boshlab birinchi ishgacha bo‘lgan yo‘lni bosqichma-bosqich ko‘rib chiqamiz.',
      'Разбираем путь от нуля до первой работы шаг за шагом.',
      'A step-by-step look at the path from zero to a first job.',
    ),
    content: text(
      '<h2>Nimadan boshlash kerak</h2><p>Ko‘pchilik darhol framework o‘rganishga oshiqadi. Amalda esa HTML va CSS ni yaxshi bilmasdan React bilan ishlash og‘riqli bo‘ladi.</p><h2>Bosqichlar</h2><ul><li>HTML va CSS — 1-2 oy</li><li>JavaScript — 3 oy</li><li>React — 2-3 oy</li><li>Portfolio va ish qidirish — 2 oy</li></ul><p>Har bosqichda kamida bitta loyiha qiling. Kod yozmasdan video ko‘rish natija bermaydi.</p>',
      '<h2>С чего начать</h2><p>Многие спешат сразу к фреймворкам. На практике работать с React без крепкого знания HTML и CSS больно.</p><h2>Этапы</h2><ul><li>HTML и CSS — 1-2 месяца</li><li>JavaScript — 3 месяца</li><li>React — 2-3 месяца</li><li>Портфолио и поиск работы — 2 месяца</li></ul><p>На каждом этапе делайте хотя бы один проект. Просмотр видео без кода не даёт результата.</p>',
      '<h2>Where to start</h2><p>Most people rush straight to a framework. In practice, React without solid HTML and CSS is painful.</p><h2>The stages</h2><ul><li>HTML and CSS — 1-2 months</li><li>JavaScript — 3 months</li><li>React — 2-3 months</li><li>Portfolio and job search — 2 months</li></ul><p>Build at least one project per stage. Watching videos without writing code does not work.</p>',
    ),
    tags: ['frontend', 'roadmap', 'karyera'],
    readMinutes: 6,
    daysAgo: 3,
  },
  {
    slug: 'mars-space-yangi-oquv-yili',
    title: text(
      'Mars Space: yangi o‘quv yili boshlandi',
      'Mars Space: начался новый учебный год',
      'Mars Space: the new academic year has started',
    ),
    excerpt: text(
      'Yangi guruhlar, yangi o‘qituvchilar va yangilangan dasturlar haqida.',
      'О новых группах, преподавателях и обновлённых программах.',
      'New groups, new teachers and refreshed programmes.',
    ),
    content: text(
      '<p>Ushbu mavsumda beshta yo‘nalish bo‘yicha yangi guruhlar ochilmoqda. Frontend va Backend dasturlari to‘liq yangilandi.</p><p>Har bir kursda amaliy loyihalar soni oshirildi va portfolio bilan ishlash alohida modulga ajratildi.</p>',
      '<p>В этом сезоне открываются новые группы по пяти направлениям. Программы Frontend и Backend полностью обновлены.</p><p>В каждом курсе увеличено число практических проектов, а работа над портфолио вынесена в отдельный модуль.</p>',
      '<p>This season we open new groups across five tracks, with the Frontend and Backend programmes fully refreshed.</p><p>Every course now has more hands-on projects, and portfolio work has its own module.</p>',
    ),
    tags: ['yangiliklar', 'mars-space'],
    readMinutes: 3,
    daysAgo: 10,
  },
  {
    slug: 'nega-backend-organish-arziydi',
    title: text(
      'Nega backend o‘rganish arziydi',
      'Почему стоит учить backend',
      'Why backend is worth learning',
    ),
    excerpt: text(
      'Bozorda talab, maosh darajasi va ishga kirish imkoniyatlari haqida ochiq suhbat.',
      'Честный разговор о спросе, зарплатах и шансах трудоустройства.',
      'An honest look at demand, salaries and hiring prospects.',
    ),
    content: text(
      '<p>Backend dasturchilar bozorda doim taqchil. Sabab oddiy: server tomonidagi xatolar qimmatga tushadi, shuning uchun tajribali mutaxassis qadrlanadi.</p><p>Boshlang‘ich daraja uchun ham talab mavjud, ammo ma’lumotlar bazasi va API bo‘yicha mustahkam bilim talab qilinadi.</p>',
      '<p>Backend-разработчиков на рынке стабильно не хватает. Причина проста: ошибки на сервере дорого стоят, поэтому опытный специалист ценится.</p><p>Спрос есть и на junior-уровне, но требуется крепкое понимание баз данных и API.</p>',
      '<p>Backend developers are consistently in short supply: server-side mistakes are expensive, so experience is valued.</p><p>There is junior demand too, but it comes with a real expectation of database and API fluency.</p>',
    ),
    tags: ['backend', 'karyera'],
    readMinutes: 5,
    daysAgo: 18,
  },
  {
    slug: 'portfolio-qanday-tayyorlanadi',
    title: text(
      'Portfolio qanday tayyorlanadi',
      'Как собрать портфолио',
      'How to build a portfolio',
    ),
    excerpt: text(
      'Ish beruvchi portfolioda nimaga qaraydi va qanday loyihalar e’tiborni tortadi.',
      'На что смотрит работодатель в портфолио и какие проекты привлекают внимание.',
      'What employers actually look for, and which projects get attention.',
    ),
    content: text(
      '<p>Uchta yaxshi loyiha o‘nta yarim tayyor loyihadan afzal. Har bir loyiha uchun README yozing va nima uchun shunday qaror qabul qilganingizni tushuntiring.</p><p>Jonli demo havolasi bo‘lishi shart — ish beruvchi kodni ochishdan oldin natijani ko‘rmoqchi bo‘ladi.</p>',
      '<p>Три хороших проекта лучше десяти незаконченных. Для каждого напишите README и объясните принятые решения.</p><p>Живая демо-ссылка обязательна — работодатель хочет увидеть результат до того, как откроет код.</p>',
      '<p>Three good projects beat ten half-finished ones. Write a README for each and explain the decisions you made.</p><p>A live demo link is mandatory — employers want to see the result before they open the code.</p>',
    ),
    tags: ['portfolio', 'karyera'],
    readMinutes: 4,
    daysAgo: 26,
  },
  {
    slug: 'ui-ux-dizayner-kunlik-ishi',
    title: text(
      'UI/UX dizaynerning kunlik ishi',
      'Будни UI/UX дизайнера',
      'A day in the life of a UI/UX designer',
    ),
    excerpt: text(
      'Dizayner kuni faqat Figma bilan o‘tmaydi — tadqiqot, muloqot va iteratsiya.',
      'День дизайнера — это не только Figma: исследование, коммуникация и итерации.',
      'A designer’s day is not only Figma: research, communication and iteration.',
    ),
    content: text(
      '<p>Kunning katta qismi suhbatlar bilan o‘tadi: mahsulot menejeri, dasturchi va foydalanuvchi bilan. Figma esa fikrni qog‘ozga tushirish vositasi.</p><p>Yaxshi dizayner nafaqat chizadi, balki nima uchun shunday qilganini asoslay oladi.</p>',
      '<p>Большая часть дня уходит на разговоры: с продакт-менеджером, разработчиком и пользователем. Figma — лишь инструмент фиксации мысли.</p><p>Хороший дизайнер не только рисует, но и обосновывает свои решения.</p>',
      '<p>Most of the day goes to conversations — with the product manager, the developer and the user. Figma is just where the thinking lands.</p><p>A good designer does not only draw; they can defend the decision.</p>',
    ),
    tags: ['dizayn', 'ux'],
    readMinutes: 4,
    daysAgo: 34,
  },
  {
    slug: 'oquvchilarimiz-muvaffaqiyati',
    title: text('O‘quvchilarimiz muvaffaqiyati', 'Успехи наших студентов', 'Our students’ results'),
    excerpt: text(
      'O‘tgan yilda bitiruvchilarimizning 68 foizi olti oy ichida ishga joylashdi.',
      'В прошлом году 68% выпускников трудоустроились в течение шести месяцев.',
      'Last year 68% of our graduates found work within six months.',
    ),
    content: text(
      '<p>Raqamlar ortida aniq odamlar turadi. Ushbu maqolada uchta bitiruvchimizning yo‘lini ularning o‘z so‘zlari bilan keltiramiz.</p><p>Umumiy xulosa oddiy: muntazam amaliyot va jamoada ishlash tajribasi hal qiluvchi omil bo‘lgan.</p>',
      '<p>За цифрами стоят конкретные люди. В этой статье — путь трёх наших выпускников их собственными словами.</p><p>Общий вывод прост: решающими стали регулярная практика и опыт работы в команде.</p>',
      '<p>Behind the numbers are specific people. Here are three graduates telling their own story.</p><p>The common thread is simple: consistent practice and real team experience made the difference.</p>',
    ),
    tags: ['mars-space', 'natijalar'],
    readMinutes: 5,
    daysAgo: 47,
  },
] as const;

// ── Testimonials ─────────────────────────────────────────────

const TESTIMONIALS = [
  {
    authorName: 'Zarina Mahmudova',
    authorRole: text(
      'Frontend developer, Uzum',
      'Frontend разработчик, Uzum',
      'Frontend developer at Uzum',
    ),
    courseSlug: 'frontend-react',
    rating: 5,
    content: text(
      'Kursdan keyin uch oy ichida ishga joylashdim. Eng qimmatlisi — amaliy loyihalar va ustozning fikr-mulohazasi.',
      'Через три месяца после курса вышла на работу. Самое ценное — практические проекты и обратная связь от преподавателя.',
      'I was hired three months after the course. The projects and the instructor feedback were what mattered.',
    ),
    sortOrder: 1,
  },
  {
    authorName: 'Sherzod Yusupov',
    authorRole: text(
      'Backend developer, Payme',
      'Backend разработчик, Payme',
      'Backend developer at Payme',
    ),
    courseSlug: 'backend-nodejs',
    rating: 5,
    content: text(
      'Ma’lumotlar bazasi va API loyihalash bo‘yicha bilimlarim shu yerda shakllandi. Docker moduli ishda darhol asqotdi.',
      'Знания по проектированию баз данных и API сформировались именно здесь. Модуль по Docker пригодился сразу на работе.',
      'This is where my database and API design skills came from. The Docker module paid off immediately at work.',
    ),
    sortOrder: 2,
  },
  {
    authorName: 'Temur Rashidov',
    authorRole: text('Flutter developer', 'Flutter разработчик', 'Flutter developer'),
    courseSlug: 'flutter-mobile',
    rating: 5,
    content: text(
      'Birinchi ilovamni kurs davomida Play Market ga chiqardim. Ustoz har bir savolga sabr bilan javob berdi.',
      'Первое приложение опубликовал в Play Market ещё во время курса. Преподаватель терпеливо отвечал на каждый вопрос.',
      'I published my first app to the Play Market during the course itself. The teacher answered every question patiently.',
    ),
    sortOrder: 3,
  },
  {
    authorName: 'Kamila Azimova',
    authorRole: text(
      'Product designer, Freelance',
      'Продуктовый дизайнер, фриланс',
      'Product designer, freelance',
    ),
    courseSlug: 'ui-ux-figma',
    rating: 5,
    content: text(
      'Kursdan keyin frilansda birinchi mijozimni topdim. Portfolio moduli aynan shunga tayyorladi.',
      'После курса нашла первого клиента на фрилансе. Модуль по портфолио подготовил именно к этому.',
      'I found my first freelance client after the course; the portfolio module prepared me for exactly that.',
    ),
    sortOrder: 4,
  },
  {
    authorName: 'Shohsanam Isroilova',
    authorRole: text('Buxgalter', 'Бухгалтер', 'Accountant'),
    courseSlug: 'kompyuter-savodxonligi',
    rating: 5,
    content: text(
      'Ellik yoshda kompyuterni o‘rgandim. Endi hisobotlarni o‘zim Excel da tayyorlayman.',
      'В пятьдесят лет освоила компьютер. Теперь сама готовлю отчёты в Excel.',
      'I learned computers at fifty. Now I prepare my own reports in Excel.',
    ),
    sortOrder: 5,
  },
  {
    authorName: 'Asadbek Xudoyberdiyev',
    authorRole: text(
      'Junior Frontend developer',
      'Junior Frontend разработчик',
      'Junior Frontend developer',
    ),
    courseSlug: 'frontend-react',
    rating: 4,
    content: text(
      'Dastur zich, lekin ustozlar qo‘llab-quvvatlaydi. Uy vazifalarini o‘z vaqtida qilish muhim.',
      'Программа плотная, но преподаватели поддерживают. Важно делать домашние задания вовремя.',
      'The programme is dense but the teachers support you. Doing the homework on time matters.',
    ),
    sortOrder: 6,
  },
  {
    authorName: 'Ravshan Karimov',
    authorRole: text('Full Stack developer', 'Full Stack разработчик', 'Full Stack developer'),
    courseSlug: 'fullstack-javascript',
    rating: 5,
    content: text(
      'Jamoaviy loyiha real ish jarayoniga eng yaqin tajriba bo‘ldi. Code review madaniyatini shu yerda o‘rgandim.',
      'Командный проект оказался ближе всего к реальной работе. Культуру code review освоил именно здесь.',
      'The team project was the closest thing to real work; code review culture is something I learned here.',
    ),
    sortOrder: 7,
  },
  {
    authorName: 'Ozoda Tursunova',
    authorRole: text('Mobile developer', 'Мобильный разработчик', 'Mobile developer'),
    courseSlug: 'flutter-mobile',
    rating: 5,
    content: text(
      'Guruhda atigi o‘n ikki kishi bo‘lgani uchun har birimizga vaqt yetdi.',
      'В группе было всего двенадцать человек, поэтому времени хватало каждому.',
      'There were only twelve of us in the group, so everyone got attention.',
    ),
    sortOrder: 8,
  },
] as const;

// ── Contact messages ─────────────────────────────────────────

const CONTACT_MESSAGES = [
  {
    fullName: 'Hasan Aliyev',
    phone: '+998903330001',
    email: 'hasan@gmail.com',
    subject: 'Hamkorlik taklifi',
    message: 'Kompaniyamiz xodimlari uchun korporativ kurs tashkil qilish mumkinmi?',
    isRead: false,
    daysAgo: 1,
  },
  {
    fullName: 'Zulfiya Nazarova',
    phone: '+998903330002',
    email: null,
    subject: 'Ish o‘rni',
    message: 'Frontend o‘qituvchisi vakansiyasi bormi?',
    isRead: false,
    daysAgo: 3,
  },
  {
    fullName: 'Otabek Yusupov',
    phone: '+998903330003',
    email: 'otabek@mail.ru',
    subject: 'Sertifikat',
    message: 'Bitiruv sertifikati xalqaro tan olinadimi?',
    isRead: true,
    daysAgo: 9,
  },
  {
    fullName: 'Nigora Salimova',
    phone: '+998903330004',
    email: null,
    subject: 'Dars jadvali',
    message: 'Shanba kunlari dars bo‘ladimi?',
    isRead: true,
    daysAgo: 15,
  },
] as const;

// ── Settings bundle ──────────────────────────────────────────

const SETTINGS = {
  contacts: {
    phones: ['+998 71 200 30 40', '+998 90 123 45 67'],
    email: 'info@marsspace.uz',
    address: text(
      'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko‘chasi 12',
      'г. Ташкент, Чиланзарский район, проспект Бунёдкор 12',
      '12 Bunyodkor Avenue, Chilanzar district, Tashkent',
    ),
    workingHours: text(
      'Dushanba–Shanba, 09:00–20:00',
      'Понедельник–Суббота, 09:00–20:00',
      'Monday–Saturday, 09:00–20:00',
    ),
    mapUrl: 'https://yandex.uz/maps/-/CDbXqL',
  },
  socials: {
    telegram: 'https://t.me/marsspace_uz',
    instagram: 'https://instagram.com/marsspace.uz',
    youtube: 'https://youtube.com/@marsspace',
    facebook: 'https://facebook.com/marsspace.uz',
  },
  hero_stats: [
    { key: 'students', value: 1200, label: text('Bitiruvchi', 'Выпускников', 'Graduates') },
    { key: 'courses', value: 8, label: text('Kurs yo‘nalishi', 'Направлений', 'Courses') },
    { key: 'teachers', value: 6, label: text('Ustoz', 'Преподавателей', 'Teachers') },
    {
      key: 'employment',
      value: 68,
      label: text('Ishga joylashish, %', 'Трудоустройство, %', 'Employment, %'),
    },
  ],
  seo_defaults: {
    title: text(
      'Mars Space — Toshkentdagi IT o‘quv markazi',
      'Mars Space — IT учебный центр в Ташкенте',
      'Mars Space — IT training centre in Tashkent',
    ),
    description: text(
      'Frontend, Backend, Mobil dasturlash va UI/UX dizayn kurslari. Amaliy loyihalar, kichik guruhlar, ishga joylashishda yordam.',
      'Курсы Frontend, Backend, мобильной разработки и UI/UX дизайна. Практические проекты, малые группы, помощь с трудоустройством.',
      'Frontend, Backend, mobile and UI/UX design courses. Hands-on projects, small groups, hiring support.',
    ),
    ogImage: 'https://marsspace.uz/og-image.jpg',
  },
} as const;
