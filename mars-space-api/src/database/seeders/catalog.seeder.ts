import { CourseFormat, CourseLevel, Prisma, PrismaClient } from '@prisma/client';

export interface SeededCatalog {
  categoryIds: string[];
  courseIds: string[];
  teacherIds: string[];
  /** Slug → id, so the demo seeder can attach groups to a known course. */
  courseIdBySlug: Record<string, string>;
}

type L = { uz: string; ru: string; en: string };
type LL = { uz: string[]; ru: string[]; en: string[] };

const text = (uz: string, ru: string, en: string): L => ({ uz, ru, en });
const list = (uz: string[], ru: string[], en: string[]): LL => ({ uz, ru, en });

interface SyllabusModuleSeed {
  order: number;
  title: L;
  durationWeeks: number;
  topics: LL;
}

/**
 * Categories, teachers and the course catalogue (§9).
 *
 * Everything is upserted on its slug so the seeder can run against a database
 * that already holds content without duplicating it.
 */
export async function seedCatalog(prisma: PrismaClient): Promise<SeededCatalog> {
  const categoryIdBySlug: Record<string, string> = {};

  for (const category of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name as unknown as Prisma.InputJsonValue,
        description: category.description as unknown as Prisma.InputJsonValue,
        iconKey: category.iconKey,
        colorHex: category.colorHex,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        slug: category.slug,
        name: category.name as unknown as Prisma.InputJsonValue,
        description: category.description as unknown as Prisma.InputJsonValue,
        iconKey: category.iconKey,
        colorHex: category.colorHex,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
    categoryIdBySlug[category.slug] = row.id;
  }

  const teacherIdBySlug: Record<string, string> = {};

  for (const teacher of TEACHERS) {
    const row = await prisma.teacher.upsert({
      where: { slug: teacher.slug },
      update: {
        fullName: teacher.fullName,
        position: teacher.position as unknown as Prisma.InputJsonValue,
        bio: teacher.bio as unknown as Prisma.InputJsonValue,
        photoUrl: teacher.photoUrl,
        experienceYears: teacher.experienceYears,
        skills: [...teacher.skills],
        socials: teacher.socials as unknown as Prisma.InputJsonValue,
        sortOrder: teacher.sortOrder,
        isActive: true,
      },
      create: {
        slug: teacher.slug,
        fullName: teacher.fullName,
        position: teacher.position as unknown as Prisma.InputJsonValue,
        bio: teacher.bio as unknown as Prisma.InputJsonValue,
        photoUrl: teacher.photoUrl,
        experienceYears: teacher.experienceYears,
        skills: [...teacher.skills],
        socials: teacher.socials as unknown as Prisma.InputJsonValue,
        sortOrder: teacher.sortOrder,
        isActive: true,
      },
    });
    teacherIdBySlug[teacher.slug] = row.id;
  }

  const courseIdBySlug: Record<string, string> = {};

  for (const course of COURSES) {
    const categoryId = categoryIdBySlug[course.categorySlug];
    if (!categoryId) {
      throw new Error(
        `Course "${course.slug}" references unknown category "${course.categorySlug}"`,
      );
    }

    const payload = {
      title: course.title as unknown as Prisma.InputJsonValue,
      shortDescription: course.shortDescription as unknown as Prisma.InputJsonValue,
      description: course.description as unknown as Prisma.InputJsonValue,
      outcomes: course.outcomes as unknown as Prisma.InputJsonValue,
      requirements: course.requirements as unknown as Prisma.InputJsonValue,
      syllabus: course.syllabus as unknown as Prisma.InputJsonValue,
      categoryId,
      level: course.level,
      format: course.format,
      durationMonths: course.durationMonths,
      lessonsPerWeek: course.lessonsPerWeek,
      lessonMinutes: course.lessonMinutes,
      price: new Prisma.Decimal(course.price),
      discountPrice: course.discountPrice ? new Prisma.Decimal(course.discountPrice) : null,
      currency: 'UZS',
      coverImageUrl: course.coverImageUrl,
      metaTitle: course.title as unknown as Prisma.InputJsonValue,
      metaDescription: course.shortDescription as unknown as Prisma.InputJsonValue,
      isFeatured: course.isFeatured,
      isPublished: course.isPublished,
      sortOrder: course.sortOrder,
    };

    const row = await prisma.course.upsert({
      where: { slug: course.slug },
      update: payload,
      create: { slug: course.slug, ...payload },
    });
    courseIdBySlug[course.slug] = row.id;

    // Re-link teachers from scratch: the join table has no other state, so a
    // clean replace is simpler than diffing and cannot drift.
    await prisma.courseTeacher.deleteMany({ where: { courseId: row.id } });
    await prisma.courseTeacher.createMany({
      data: course.teacherSlugs
        .map((slug) => teacherIdBySlug[slug])
        .filter((teacherId): teacherId is string => Boolean(teacherId))
        .map((teacherId) => ({ courseId: row.id, teacherId })),
      skipDuplicates: true,
    });
  }

  return {
    categoryIds: Object.values(categoryIdBySlug),
    courseIds: Object.values(courseIdBySlug),
    teacherIds: Object.values(teacherIdBySlug),
    courseIdBySlug,
  };
}

// ── Categories ───────────────────────────────────────────────

const CATEGORIES = [
  {
    slug: 'frontend',
    name: text('Frontend', 'Frontend', 'Frontend'),
    description: text(
      'Brauzerda ishlaydigan zamonaviy interfeyslar: HTML, CSS, JavaScript va React.',
      'Современные интерфейсы в браузере: HTML, CSS, JavaScript и React.',
      'Modern browser interfaces: HTML, CSS, JavaScript and React.',
    ),
    iconKey: 'layout',
    colorHex: '#3B82F6',
    sortOrder: 1,
  },
  {
    slug: 'backend',
    name: text('Backend', 'Backend', 'Backend'),
    description: text(
      'Server, ma’lumotlar bazasi va API — mahsulotning ko‘rinmas, lekin eng muhim qismi.',
      'Сервер, база данных и API — невидимая, но самая важная часть продукта.',
      'Servers, databases and APIs — the invisible half of every product.',
    ),
    iconKey: 'server',
    colorHex: '#10B981',
    sortOrder: 2,
  },
  {
    slug: 'mobile',
    name: text('Mobil dasturlash', 'Мобильная разработка', 'Mobile development'),
    description: text(
      'Android va iOS uchun ilovalar: Flutter va React Native.',
      'Приложения для Android и iOS: Flutter и React Native.',
      'Android and iOS apps with Flutter and React Native.',
    ),
    iconKey: 'smartphone',
    colorHex: '#8B5CF6',
    sortOrder: 3,
  },
  {
    slug: 'ui-ux-design',
    name: text('UI/UX Dizayn', 'UI/UX Дизайн', 'UI/UX Design'),
    description: text(
      'Foydalanuvchi tajribasi, interfeys dizayni va Figma bilan ishlash.',
      'Пользовательский опыт, дизайн интерфейсов и работа в Figma.',
      'User experience, interface design and working in Figma.',
    ),
    iconKey: 'palette',
    colorHex: '#F59E0B',
    sortOrder: 4,
  },
  {
    slug: 'foundation',
    name: text('Kompyuter savodxonligi', 'Компьютерная грамотность', 'Computer literacy'),
    description: text(
      'Noldan boshlaganlar uchun: kompyuter, internet va ofis dasturlari.',
      'Для начинающих с нуля: компьютер, интернет и офисные программы.',
      'For absolute beginners: computers, the internet and office software.',
    ),
    iconKey: 'graduation-cap',
    colorHex: '#EF4444',
    sortOrder: 5,
  },
] as const;

// ── Teachers ─────────────────────────────────────────────────

const TEACHERS = [
  {
    slug: 'jasur-yuldashev',
    fullName: 'Jasur Yuldashev',
    position: text(
      'Senior Frontend Developer',
      'Senior Frontend разработчик',
      'Senior Frontend Developer',
    ),
    bio: text(
      'Yetti yildan beri web interfeyslar quradi. Uch yil davomida xalqaro fintech mahsulotida React jamoasini boshqargan.',
      'Семь лет создаёт веб-интерфейсы. Три года руководил React-командой в международном финтех-продукте.',
      'Seven years of building web interfaces, three of them leading a React team on an international fintech product.',
    ),
    photoUrl: null,
    experienceYears: 7,
    skills: ['React', 'TypeScript', 'Next.js', 'Redux Toolkit', 'Tailwind CSS'],
    socials: { telegram: 'https://t.me/jasur_dev', github: 'https://github.com/jasur' },
    sortOrder: 1,
  },
  {
    slug: 'dilnoza-karimova',
    fullName: 'Dilnoza Karimova',
    position: text('Backend Engineer', 'Backend инженер', 'Backend Engineer'),
    bio: text(
      'Node.js va PostgreSQL bo‘yicha mutaxassis. Yuk ostida ishlaydigan API larni loyihalash tajribasiga ega.',
      'Специалист по Node.js и PostgreSQL. Проектирует API, работающие под нагрузкой.',
      'Node.js and PostgreSQL specialist who designs APIs that hold up under load.',
    ),
    photoUrl: null,
    experienceYears: 6,
    skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Prisma', 'Docker'],
    socials: { telegram: 'https://t.me/dilnoza_dev', linkedin: 'https://linkedin.com/in/dilnoza' },
    sortOrder: 2,
  },
  {
    slug: 'sardor-tursunov',
    fullName: 'Sardor Tursunov',
    position: text('Mobile Team Lead', 'Тимлид мобильной разработки', 'Mobile Team Lead'),
    bio: text(
      'Flutter bilan yigirmadan ortiq ilova chiqargan. O‘zbekistondagi eng yirik yetkazib berish ilovalaridan birida ishlaydi.',
      'Выпустил более двадцати приложений на Flutter. Работает над одним из крупнейших сервисов доставки в Узбекистане.',
      'Shipped more than twenty Flutter apps, currently on one of Uzbekistan’s largest delivery services.',
    ),
    photoUrl: null,
    experienceYears: 5,
    skills: ['Flutter', 'Dart', 'Firebase', 'REST API', 'Bloc'],
    socials: { telegram: 'https://t.me/sardor_flutter' },
    sortOrder: 3,
  },
  {
    slug: 'malika-abdullayeva',
    fullName: 'Malika Abdullayeva',
    position: text('Product Designer', 'Продуктовый дизайнер', 'Product Designer'),
    bio: text(
      'Bank va e-commerce mahsulotlari uchun interfeys dizayni. Foydalanuvchi tadqiqotiga alohida e’tibor qaratadi.',
      'Дизайн интерфейсов для банковских и e-commerce продуктов. Особое внимание уделяет исследованию пользователей.',
      'Interface design for banking and e-commerce products, with a strong focus on user research.',
    ),
    photoUrl: null,
    experienceYears: 6,
    skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping', 'Webflow'],
    socials: {
      telegram: 'https://t.me/malika_design',
      instagram: 'https://instagram.com/malika.design',
    },
    sortOrder: 4,
  },
  {
    slug: 'bekzod-rahmonov',
    fullName: 'Bekzod Rahmonov',
    position: text('DevOps Engineer', 'DevOps инженер', 'DevOps Engineer'),
    bio: text(
      'Infratuzilma va CI/CD bo‘yicha mutaxassis. Kubernetes klasterlarini noldan quradi va kuzatadi.',
      'Специалист по инфраструктуре и CI/CD. Строит и сопровождает кластеры Kubernetes с нуля.',
      'Infrastructure and CI/CD specialist who builds and runs Kubernetes clusters from scratch.',
    ),
    photoUrl: null,
    experienceYears: 8,
    skills: ['Docker', 'Kubernetes', 'GitHub Actions', 'Terraform', 'Linux'],
    socials: { github: 'https://github.com/bekzod' },
    sortOrder: 5,
  },
  {
    slug: 'nodira-ismoilova',
    fullName: 'Nodira Ismoilova',
    position: text('IT o‘qituvchisi', 'Преподаватель IT', 'IT Instructor'),
    bio: text(
      'Noldan boshlovchilar bilan ishlashga ixtisoslashgan. Ming nafardan ortiq o‘quvchini kompyuter savodxonligiga o‘rgatgan.',
      'Специализируется на работе с начинающими. Обучила компьютерной грамотности более тысячи учеников.',
      'Specialises in absolute beginners; has taught computer literacy to more than a thousand students.',
    ),
    photoUrl: null,
    experienceYears: 10,
    skills: ['Windows', 'Microsoft Office', 'Google Workspace', 'Internet xavfsizligi'],
    socials: { telegram: 'https://t.me/nodira_it' },
    sortOrder: 6,
  },
] as const;

// ── Syllabus helpers ─────────────────────────────────────────

function syllabus(...modules: SyllabusModuleSeed[]): SyllabusModuleSeed[] {
  return modules;
}

function module_(order: number, title: L, durationWeeks: number, topics: LL): SyllabusModuleSeed {
  return { order, title, durationWeeks, topics };
}

// ── Courses ──────────────────────────────────────────────────

const COURSES = [
  {
    slug: 'frontend-react',
    categorySlug: 'frontend',
    teacherSlugs: ['jasur-yuldashev', 'malika-abdullayeva'],
    title: text(
      'Frontend dasturlash (React)',
      'Frontend разработка (React)',
      'Frontend development (React)',
    ),
    shortDescription: text(
      'Noldan React dasturchisi bo‘ling va birinchi ishga joylashing.',
      'Станьте React-разработчиком с нуля и найдите первую работу.',
      'Become a React developer from scratch and land your first job.',
    ),
    description: text(
      '<p>Kurs HTML va CSS asoslaridan boshlanadi va React bilan to‘liq ishlaydigan ilova yaratish bilan yakunlanadi. Har bir modul amaliy loyiha bilan mustahkamlanadi.</p><p>Kurs oxirida sizda portfolioga qo‘yish uchun uchta tayyor loyiha bo‘ladi.</p>',
      '<p>Курс начинается с основ HTML и CSS и заканчивается полноценным приложением на React. Каждый модуль закрепляется практическим проектом.</p><p>К концу курса у вас будет три готовых проекта для портфолио.</p>',
      '<p>The course starts with HTML and CSS fundamentals and ends with a complete React application. Every module is reinforced with a hands-on project.</p><p>You finish with three portfolio-ready projects.</p>',
    ),
    outcomes: list(
      [
        'Semantik HTML va zamonaviy CSS yozish',
        'JavaScript ES6+ da erkin dasturlash',
        'React bilan komponentli interfeyslar qurish',
        'REST API bilan ishlash va holatni boshqarish',
        'Loyihani Git orqali jamoada olib borish',
      ],
      [
        'Писать семантичный HTML и современный CSS',
        'Свободно программировать на JavaScript ES6+',
        'Строить компонентные интерфейсы на React',
        'Работать с REST API и управлять состоянием',
        'Вести проект в команде через Git',
      ],
      [
        'Write semantic HTML and modern CSS',
        'Program comfortably in JavaScript ES6+',
        'Build component-driven interfaces with React',
        'Consume REST APIs and manage state',
        'Collaborate on a project through Git',
      ],
    ),
    requirements: list(
      ['Kompyuterda erkin ishlay olish', 'Ingliz tilini o‘qib tushunish (A2+)'],
      ['Уверенное владение компьютером', 'Чтение технических текстов на английском (A2+)'],
      ['Comfortable computer use', 'Reading technical English (A2+)'],
    ),
    syllabus: syllabus(
      module_(
        1,
        text('HTML va CSS asoslari', 'Основы HTML и CSS', 'HTML and CSS basics'),
        3,
        list(
          ['Semantik teglar', 'Box model', 'Flexbox', 'Grid', 'Responsive dizayn'],
          ['Семантические теги', 'Box model', 'Flexbox', 'Grid', 'Адаптивная вёрстка'],
          ['Semantic tags', 'Box model', 'Flexbox', 'Grid', 'Responsive design'],
        ),
      ),
      module_(
        2,
        text('JavaScript asoslari', 'Основы JavaScript', 'JavaScript fundamentals'),
        4,
        list(
          [
            'O‘zgaruvchilar va tiplar',
            'Funksiyalar',
            'Massiv metodlari',
            'DOM bilan ishlash',
            'Hodisalar',
          ],
          ['Переменные и типы', 'Функции', 'Методы массивов', 'Работа с DOM', 'События'],
          ['Variables and types', 'Functions', 'Array methods', 'Working with the DOM', 'Events'],
        ),
      ),
      module_(
        3,
        text('Zamonaviy JavaScript', 'Современный JavaScript', 'Modern JavaScript'),
        3,
        list(
          [
            'ES6+ sintaksis',
            'Promise va async/await',
            'Modullar',
            'Fetch API',
            'Xatolarni boshqarish',
          ],
          ['Синтаксис ES6+', 'Promise и async/await', 'Модули', 'Fetch API', 'Обработка ошибок'],
          ['ES6+ syntax', 'Promises and async/await', 'Modules', 'Fetch API', 'Error handling'],
        ),
      ),
      module_(
        4,
        text('React asoslari', 'Основы React', 'React fundamentals'),
        4,
        list(
          [
            'Komponentlar va props',
            'useState va useEffect',
            'Ro‘yxatlar va formalar',
            'Shartli render',
          ],
          ['Компоненты и props', 'useState и useEffect', 'Списки и формы', 'Условный рендеринг'],
          [
            'Components and props',
            'useState and useEffect',
            'Lists and forms',
            'Conditional rendering',
          ],
        ),
      ),
      module_(
        5,
        text('React ekotizimi', 'Экосистема React', 'The React ecosystem'),
        4,
        list(
          [
            'React Router',
            'Redux Toolkit',
            'React Query',
            'Custom hooklar',
            'Formik va validatsiya',
          ],
          ['React Router', 'Redux Toolkit', 'React Query', 'Кастомные хуки', 'Formik и валидация'],
          ['React Router', 'Redux Toolkit', 'React Query', 'Custom hooks', 'Formik and validation'],
        ),
      ),
      module_(
        6,
        text('TypeScript va sifat', 'TypeScript и качество', 'TypeScript and quality'),
        3,
        list(
          ['TypeScript asoslari', 'Komponentlarni tiplash', 'ESLint va Prettier', 'Testlar'],
          ['Основы TypeScript', 'Типизация компонентов', 'ESLint и Prettier', 'Тесты'],
          ['TypeScript basics', 'Typing components', 'ESLint and Prettier', 'Testing'],
        ),
      ),
      module_(
        7,
        text('Yakuniy loyiha', 'Финальный проект', 'Capstone project'),
        3,
        list(
          ['Loyiha rejasi', 'API integratsiyasi', 'Deploy', 'Portfolio va rezyume'],
          ['План проекта', 'Интеграция с API', 'Деплой', 'Портфолио и резюме'],
          ['Project planning', 'API integration', 'Deployment', 'Portfolio and CV'],
        ),
      ),
    ),
    level: CourseLevel.BEGINNER,
    format: CourseFormat.OFFLINE,
    durationMonths: 6,
    lessonsPerWeek: 3,
    lessonMinutes: 90,
    price: 1_800_000,
    discountPrice: 1_500_000,
    coverImageUrl: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
  },
  {
    slug: 'backend-nodejs',
    categorySlug: 'backend',
    teacherSlugs: ['dilnoza-karimova', 'bekzod-rahmonov'],
    title: text(
      'Backend dasturlash (Node.js)',
      'Backend разработка (Node.js)',
      'Backend development (Node.js)',
    ),
    shortDescription: text(
      'Server, ma’lumotlar bazasi va API — mahsulotning ichki qismini quring.',
      'Сервер, база данных и API — соберите внутреннюю часть продукта.',
      'Servers, databases and APIs — build the engine room of a product.',
    ),
    description: text(
      '<p>Node.js, NestJS va PostgreSQL yordamida ishlab chiqarishga tayyor API quramiz. Autentifikatsiya, ruxsatlar, testlar va Docker — barchasi amaliyotda.</p>',
      '<p>Собираем production-ready API на Node.js, NestJS и PostgreSQL. Аутентификация, права доступа, тесты и Docker — всё на практике.</p>',
      '<p>We build a production-ready API with Node.js, NestJS and PostgreSQL: authentication, authorisation, tests and Docker, all hands-on.</p>',
    ),
    outcomes: list(
      [
        'REST API loyihalash',
        'PostgreSQL bilan ishlash',
        'JWT autentifikatsiya',
        'Docker bilan deploy',
        'Testlar yozish',
      ],
      [
        'Проектировать REST API',
        'Работать с PostgreSQL',
        'Аутентификация через JWT',
        'Деплой через Docker',
        'Писать тесты',
      ],
      [
        'Design REST APIs',
        'Work with PostgreSQL',
        'JWT authentication',
        'Deploy with Docker',
        'Write tests',
      ],
    ),
    requirements: list(
      ['JavaScript asoslari', 'Terminal bilan ishlash tajribasi'],
      ['Основы JavaScript', 'Опыт работы с терминалом'],
      ['JavaScript fundamentals', 'Some terminal experience'],
    ),
    syllabus: syllabus(
      module_(
        1,
        text('Node.js asoslari', 'Основы Node.js', 'Node.js fundamentals'),
        3,
        list(
          ['Event loop', 'Modullar', 'npm', 'Fayl tizimi', 'Streams'],
          ['Event loop', 'Модули', 'npm', 'Файловая система', 'Streams'],
          ['Event loop', 'Modules', 'npm', 'File system', 'Streams'],
        ),
      ),
      module_(
        2,
        text('HTTP va Express', 'HTTP и Express', 'HTTP and Express'),
        3,
        list(
          ['HTTP protokoli', 'Routing', 'Middleware', 'Xatolarni boshqarish'],
          ['Протокол HTTP', 'Роутинг', 'Middleware', 'Обработка ошибок'],
          ['The HTTP protocol', 'Routing', 'Middleware', 'Error handling'],
        ),
      ),
      module_(
        3,
        text('PostgreSQL va Prisma', 'PostgreSQL и Prisma', 'PostgreSQL and Prisma'),
        4,
        list(
          ['SQL asoslari', 'Sxema loyihalash', 'Prisma ORM', 'Migratsiyalar', 'Indekslar'],
          ['Основы SQL', 'Проектирование схемы', 'Prisma ORM', 'Миграции', 'Индексы'],
          ['SQL basics', 'Schema design', 'Prisma ORM', 'Migrations', 'Indexes'],
        ),
      ),
      module_(
        4,
        text('NestJS arxitekturasi', 'Архитектура NestJS', 'NestJS architecture'),
        4,
        list(
          ['Modullar va DI', 'Controller va service', 'DTO va validatsiya', 'Guard va interceptor'],
          ['Модули и DI', 'Контроллеры и сервисы', 'DTO и валидация', 'Guard и interceptor'],
          [
            'Modules and DI',
            'Controllers and services',
            'DTOs and validation',
            'Guards and interceptors',
          ],
        ),
      ),
      module_(
        5,
        text('Autentifikatsiya', 'Аутентификация', 'Authentication'),
        3,
        list(
          ['Parol hashlash', 'JWT', 'Refresh token', 'Rollar va ruxsatlar'],
          ['Хеширование паролей', 'JWT', 'Refresh token', 'Роли и права'],
          ['Password hashing', 'JWT', 'Refresh tokens', 'Roles and permissions'],
        ),
      ),
      module_(
        6,
        text('Testlar va sifat', 'Тесты и качество', 'Testing and quality'),
        3,
        list(
          ['Unit testlar', 'E2E testlar', 'Mocking', 'CI pipeline'],
          ['Unit-тесты', 'E2E-тесты', 'Мокинг', 'CI pipeline'],
          ['Unit tests', 'E2E tests', 'Mocking', 'CI pipeline'],
        ),
      ),
      module_(
        7,
        text('Docker va deploy', 'Docker и деплой', 'Docker and deployment'),
        4,
        list(
          ['Docker asoslari', 'docker-compose', 'Nginx', 'Monitoring', 'Yakuniy loyiha'],
          ['Основы Docker', 'docker-compose', 'Nginx', 'Мониторинг', 'Финальный проект'],
          ['Docker basics', 'docker-compose', 'Nginx', 'Monitoring', 'Capstone project'],
        ),
      ),
    ),
    level: CourseLevel.INTERMEDIATE,
    format: CourseFormat.OFFLINE,
    durationMonths: 6,
    lessonsPerWeek: 3,
    lessonMinutes: 90,
    price: 1_900_000,
    discountPrice: null,
    coverImageUrl: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 2,
  },
  {
    slug: 'fullstack-javascript',
    categorySlug: 'backend',
    teacherSlugs: ['jasur-yuldashev', 'dilnoza-karimova'],
    title: text('Full Stack JavaScript', 'Full Stack JavaScript', 'Full Stack JavaScript'),
    shortDescription: text(
      'Bitta tilda ham frontend, ham backend — to‘liq mahsulot yarating.',
      'Один язык для фронтенда и бэкенда — создайте продукт целиком.',
      'One language for both ends — ship a complete product.',
    ),
    description: text(
      '<p>Eng uzun va eng chuqur dasturimiz. React va NestJS ni birlashtirib, haqiqiy mahsulotni noldan ishga tushiramiz.</p>',
      '<p>Наша самая длинная и глубокая программа. Объединяем React и NestJS и запускаем настоящий продукт с нуля.</p>',
      '<p>Our longest and deepest programme: React and NestJS combined into a real product shipped from scratch.</p>',
    ),
    outcomes: list(
      [
        'To‘liq mahsulotni mustaqil qurish',
        'Frontend va backendni birlashtirish',
        'Deploy va monitoring',
        'Jamoada ishlash',
      ],
      [
        'Самостоятельно строить продукт целиком',
        'Связывать фронтенд и бэкенд',
        'Деплой и мониторинг',
        'Работа в команде',
      ],
      [
        'Build an entire product yourself',
        'Wire frontend to backend',
        'Deploy and monitor',
        'Work in a team',
      ],
    ),
    requirements: list(
      ['Frontend yoki backend bo‘yicha boshlang‘ich bilim'],
      ['Начальные знания по фронтенду или бэкенду'],
      ['Some prior frontend or backend knowledge'],
    ),
    syllabus: syllabus(
      module_(
        1,
        text('Web asoslari', 'Основы веба', 'Web fundamentals'),
        3,
        list(
          ['HTML/CSS', 'Git', 'Terminal'],
          ['HTML/CSS', 'Git', 'Терминал'],
          ['HTML/CSS', 'Git', 'Terminal'],
        ),
      ),
      module_(
        2,
        text('JavaScript chuqur', 'JavaScript в глубину', 'JavaScript in depth'),
        5,
        list(
          ['ES6+', 'Asinxron kod', 'OOP', 'Funksional uslub'],
          ['ES6+', 'Асинхронный код', 'ООП', 'Функциональный стиль'],
          ['ES6+', 'Async code', 'OOP', 'Functional style'],
        ),
      ),
      module_(
        3,
        text('React', 'React', 'React'),
        5,
        list(
          ['Komponentlar', 'Hooklar', 'Router', 'State menejment'],
          ['Компоненты', 'Хуки', 'Router', 'Стейт-менеджмент'],
          ['Components', 'Hooks', 'Router', 'State management'],
        ),
      ),
      module_(
        4,
        text('Node.js va NestJS', 'Node.js и NestJS', 'Node.js and NestJS'),
        5,
        list(
          ['REST API', 'PostgreSQL', 'Prisma', 'Auth'],
          ['REST API', 'PostgreSQL', 'Prisma', 'Auth'],
          ['REST API', 'PostgreSQL', 'Prisma', 'Auth'],
        ),
      ),
      module_(
        5,
        text('TypeScript', 'TypeScript', 'TypeScript'),
        3,
        list(
          ['Tiplar', 'Generiklar', 'Monorepo'],
          ['Типы', 'Дженерики', 'Монорепо'],
          ['Types', 'Generics', 'Monorepo'],
        ),
      ),
      module_(
        6,
        text('DevOps asoslari', 'Основы DevOps', 'DevOps basics'),
        3,
        list(
          ['Docker', 'CI/CD', 'Nginx'],
          ['Docker', 'CI/CD', 'Nginx'],
          ['Docker', 'CI/CD', 'Nginx'],
        ),
      ),
      module_(
        7,
        text('Jamoaviy loyiha', 'Командный проект', 'Team project'),
        5,
        list(
          ['Talablar tahlili', 'Sprintlar', 'Code review', 'Taqdimot'],
          ['Анализ требований', 'Спринты', 'Code review', 'Презентация'],
          ['Requirements analysis', 'Sprints', 'Code review', 'Demo day'],
        ),
      ),
      module_(
        8,
        text('Karyera', 'Карьера', 'Career'),
        2,
        list(
          ['Rezyume', 'Portfolio', 'Texnik suhbat'],
          ['Резюме', 'Портфолио', 'Техническое интервью'],
          ['CV', 'Portfolio', 'Technical interview'],
        ),
      ),
    ),
    level: CourseLevel.ADVANCED,
    format: CourseFormat.HYBRID,
    durationMonths: 10,
    lessonsPerWeek: 3,
    lessonMinutes: 120,
    price: 2_800_000,
    discountPrice: 2_400_000,
    coverImageUrl: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 3,
  },
  {
    slug: 'flutter-mobile',
    categorySlug: 'mobile',
    teacherSlugs: ['sardor-tursunov'],
    title: text(
      'Flutter mobil dasturlash',
      'Мобильная разработка на Flutter',
      'Flutter mobile development',
    ),
    shortDescription: text(
      'Bitta koddan Android va iOS uchun ilova chiqaring.',
      'Одно приложение из одного кода для Android и iOS.',
      'One codebase, apps on both Android and iOS.',
    ),
    description: text(
      '<p>Dart tilidan boshlab, do‘konga chiqarishga tayyor ilovagacha. Har bir modulda real ilova ustida ishlaymiz.</p>',
      '<p>От языка Dart до приложения, готового к публикации в сторах. В каждом модуле — работа над реальным приложением.</p>',
      '<p>From the Dart language to a store-ready app, working on a real application in every module.</p>',
    ),
    outcomes: list(
      [
        'Dart tilida dasturlash',
        'Flutter UI qurish',
        'Firebase integratsiyasi',
        'Ilovani do‘konga chiqarish',
      ],
      [
        'Программировать на Dart',
        'Строить UI на Flutter',
        'Интеграция с Firebase',
        'Публикация в сторах',
      ],
      ['Program in Dart', 'Build Flutter UIs', 'Integrate Firebase', 'Publish to the stores'],
    ),
    requirements: list(
      ['Dasturlash asoslari bo‘yicha tushuncha'],
      ['Базовое понимание программирования'],
      ['Basic programming literacy'],
    ),
    syllabus: syllabus(
      module_(
        1,
        text('Dart tili', 'Язык Dart', 'The Dart language'),
        3,
        list(
          ['Sintaksis', 'OOP', 'Null safety'],
          ['Синтаксис', 'ООП', 'Null safety'],
          ['Syntax', 'OOP', 'Null safety'],
        ),
      ),
      module_(
        2,
        text('Flutter asoslari', 'Основы Flutter', 'Flutter fundamentals'),
        4,
        list(
          ['Widgetlar', 'Layout', 'Navigatsiya', 'Animatsiya'],
          ['Виджеты', 'Layout', 'Навигация', 'Анимация'],
          ['Widgets', 'Layout', 'Navigation', 'Animation'],
        ),
      ),
      module_(
        3,
        text('Holat boshqaruvi', 'Управление состоянием', 'State management'),
        3,
        list(
          ['setState', 'Provider', 'Bloc'],
          ['setState', 'Provider', 'Bloc'],
          ['setState', 'Provider', 'Bloc'],
        ),
      ),
      module_(
        4,
        text('Backend bilan ishlash', 'Работа с бэкендом', 'Working with a backend'),
        3,
        list(
          ['REST API', 'JSON', 'Firebase Auth', 'Firestore'],
          ['REST API', 'JSON', 'Firebase Auth', 'Firestore'],
          ['REST API', 'JSON', 'Firebase Auth', 'Firestore'],
        ),
      ),
      module_(
        5,
        text('Nashr qilish', 'Публикация', 'Publishing'),
        3,
        list(
          ['Build', 'Play Market', 'App Store', 'Yakuniy loyiha'],
          ['Сборка', 'Play Market', 'App Store', 'Финальный проект'],
          ['Builds', 'Play Market', 'App Store', 'Capstone project'],
        ),
      ),
    ),
    level: CourseLevel.BEGINNER,
    format: CourseFormat.OFFLINE,
    durationMonths: 5,
    lessonsPerWeek: 3,
    lessonMinutes: 90,
    price: 1_700_000,
    discountPrice: null,
    coverImageUrl: null,
    isFeatured: false,
    isPublished: true,
    sortOrder: 4,
  },
  {
    slug: 'ui-ux-figma',
    categorySlug: 'ui-ux-design',
    teacherSlugs: ['malika-abdullayeva'],
    title: text('UI/UX dizayn (Figma)', 'UI/UX дизайн (Figma)', 'UI/UX design (Figma)'),
    shortDescription: text(
      'Foydalanuvchi tadqiqotidan tayyor interfeysgacha bo‘lgan yo‘l.',
      'Путь от исследования пользователей до готового интерфейса.',
      'The full path from user research to a finished interface.',
    ),
    description: text(
      '<p>Dizayn — bu chiroyli rasm emas, balki muammoni yechish. Kursda tadqiqot, prototip, testlash va dizayn tizimini o‘rganamiz.</p>',
      '<p>Дизайн — это не красивая картинка, а решение задачи. Изучаем исследование, прототипирование, тестирование и дизайн-систему.</p>',
      '<p>Design is problem solving, not decoration. We cover research, prototyping, testing and design systems.</p>',
    ),
    outcomes: list(
      [
        'Figma da erkin ishlash',
        'Foydalanuvchi tadqiqoti o‘tkazish',
        'Prototip yaratish',
        'Dizayn tizimi qurish',
        'Portfolio tayyorlash',
      ],
      [
        'Свободно работать в Figma',
        'Проводить исследование пользователей',
        'Создавать прототипы',
        'Строить дизайн-систему',
        'Собрать портфолио',
      ],
      [
        'Work fluently in Figma',
        'Run user research',
        'Build prototypes',
        'Create a design system',
        'Assemble a portfolio',
      ],
    ),
    requirements: list(
      ['Maxsus tayyorgarlik talab qilinmaydi'],
      ['Специальная подготовка не требуется'],
      ['No prior preparation required'],
    ),
    syllabus: syllabus(
      module_(
        1,
        text('Dizayn asoslari', 'Основы дизайна', 'Design fundamentals'),
        3,
        list(
          ['Kompozitsiya', 'Rang', 'Tipografika', 'Grid'],
          ['Композиция', 'Цвет', 'Типографика', 'Сетка'],
          ['Composition', 'Colour', 'Typography', 'Grids'],
        ),
      ),
      module_(
        2,
        text('Figma', 'Figma', 'Figma'),
        3,
        list(
          ['Interfeys', 'Auto layout', 'Komponentlar', 'Variantlar'],
          ['Интерфейс', 'Auto layout', 'Компоненты', 'Варианты'],
          ['The interface', 'Auto layout', 'Components', 'Variants'],
        ),
      ),
      module_(
        3,
        text('UX tadqiqot', 'UX исследование', 'UX research'),
        3,
        list(
          ['Intervyu', 'Persona', 'User flow', 'Wireframe'],
          ['Интервью', 'Персона', 'User flow', 'Wireframe'],
          ['Interviews', 'Personas', 'User flows', 'Wireframes'],
        ),
      ),
      module_(
        4,
        text('Prototip va test', 'Прототип и тестирование', 'Prototyping and testing'),
        3,
        list(
          ['Interaktiv prototip', 'Usability test', 'Iteratsiya'],
          ['Интерактивный прототип', 'Usability-тест', 'Итерации'],
          ['Interactive prototypes', 'Usability testing', 'Iteration'],
        ),
      ),
      module_(
        5,
        text(
          'Dizayn tizimi va portfolio',
          'Дизайн-система и портфолио',
          'Design system and portfolio',
        ),
        4,
        list(
          ['Design tokens', 'Komponent kutubxonasi', 'Case study', 'Behance'],
          ['Design tokens', 'Библиотека компонентов', 'Case study', 'Behance'],
          ['Design tokens', 'Component library', 'Case studies', 'Behance'],
        ),
      ),
      module_(
        6,
        text('Dasturchilar bilan ishlash', 'Работа с разработчиками', 'Working with developers'),
        2,
        list(
          ['Handoff', 'Spetsifikatsiya', 'QA'],
          ['Handoff', 'Спецификация', 'QA'],
          ['Handoff', 'Specifications', 'QA'],
        ),
      ),
    ),
    level: CourseLevel.BEGINNER,
    format: CourseFormat.HYBRID,
    durationMonths: 4,
    lessonsPerWeek: 2,
    lessonMinutes: 90,
    price: 1_400_000,
    discountPrice: 1_200_000,
    coverImageUrl: null,
    isFeatured: true,
    isPublished: true,
    sortOrder: 5,
  },
  {
    slug: 'kompyuter-savodxonligi',
    categorySlug: 'foundation',
    teacherSlugs: ['nodira-ismoilova'],
    title: text('Kompyuter savodxonligi', 'Компьютерная грамотность', 'Computer literacy'),
    shortDescription: text(
      'Kompyuterni noldan o‘rganing: Windows, internet va ofis dasturlari.',
      'Освойте компьютер с нуля: Windows, интернет и офисные программы.',
      'Learn the computer from zero: Windows, the internet and office software.',
    ),
    description: text(
      '<p>Hech qachon kompyuter bilan ishlamaganlar uchun. Har bir dars amaliyot bilan olib boriladi, uy vazifalari oddiy va tushunarli.</p>',
      '<p>Для тех, кто никогда не работал с компьютером. Каждое занятие — практика, домашние задания простые и понятные.</p>',
      '<p>For people who have never used a computer. Every lesson is hands-on and the homework stays simple.</p>',
    ),
    outcomes: list(
      [
        'Windows bilan ishlash',
        'Internetdan xavfsiz foydalanish',
        'Word va Excel asoslari',
        'Elektron pochta va Telegram',
      ],
      [
        'Работать в Windows',
        'Безопасно пользоваться интернетом',
        'Основы Word и Excel',
        'Электронная почта и Telegram',
      ],
      ['Use Windows', 'Browse the internet safely', 'Word and Excel basics', 'Email and Telegram'],
    ),
    requirements: list(['Talab yo‘q'], ['Требований нет'], ['No requirements']),
    syllabus: syllabus(
      module_(
        1,
        text('Kompyuter bilan tanishuv', 'Знакомство с компьютером', 'Meeting the computer'),
        2,
        list(
          ['Qismlar', 'Klaviatura', 'Sichqoncha', 'Windows'],
          ['Устройство', 'Клавиатура', 'Мышь', 'Windows'],
          ['Hardware', 'Keyboard', 'Mouse', 'Windows'],
        ),
      ),
      module_(
        2,
        text('Fayllar va papkalar', 'Файлы и папки', 'Files and folders'),
        2,
        list(
          ['Yaratish', 'Nusxalash', 'Qidirish', 'Arxivlash'],
          ['Создание', 'Копирование', 'Поиск', 'Архивация'],
          ['Creating', 'Copying', 'Searching', 'Archiving'],
        ),
      ),
      module_(
        3,
        text('Internet', 'Интернет', 'The internet'),
        2,
        list(
          ['Brauzer', 'Qidiruv', 'Xavfsizlik', 'Yuklab olish'],
          ['Браузер', 'Поиск', 'Безопасность', 'Загрузки'],
          ['Browsers', 'Search', 'Safety', 'Downloads'],
        ),
      ),
      module_(
        4,
        text('Ofis dasturlari', 'Офисные программы', 'Office software'),
        4,
        list(
          ['Word', 'Excel', 'PowerPoint', 'Google Docs'],
          ['Word', 'Excel', 'PowerPoint', 'Google Docs'],
          ['Word', 'Excel', 'PowerPoint', 'Google Docs'],
        ),
      ),
      module_(
        5,
        text('Aloqa vositalari', 'Средства связи', 'Communication tools'),
        2,
        list(
          ['Email', 'Telegram', 'Zoom', 'Onlayn xizmatlar'],
          ['Email', 'Telegram', 'Zoom', 'Онлайн-сервисы'],
          ['Email', 'Telegram', 'Zoom', 'Online services'],
        ),
      ),
      module_(
        6,
        text('Amaliyot', 'Практика', 'Practice'),
        2,
        list(
          ['Rezyume yozish', 'Hujjat tayyorlash', 'Yakuniy ish'],
          ['Написание резюме', 'Подготовка документа', 'Итоговая работа'],
          ['Writing a CV', 'Preparing a document', 'Final assignment'],
        ),
      ),
    ),
    level: CourseLevel.BEGINNER,
    format: CourseFormat.OFFLINE,
    durationMonths: 3,
    lessonsPerWeek: 2,
    lessonMinutes: 60,
    price: 600_000,
    discountPrice: null,
    coverImageUrl: null,
    isFeatured: false,
    isPublished: true,
    sortOrder: 6,
  },
  {
    slug: 'react-native-mobile',
    categorySlug: 'mobile',
    teacherSlugs: ['sardor-tursunov', 'jasur-yuldashev'],
    title: text(
      'React Native mobil dasturlash',
      'Мобильная разработка на React Native',
      'React Native mobile development',
    ),
    shortDescription: text(
      'React bilangan bilimingizni mobil ilovalarga olib chiqing.',
      'Перенесите знания React в мобильные приложения.',
      'Take your React knowledge to mobile apps.',
    ),
    description: text(
      '<p>React bilan tanish dasturchilar uchun tezlashtirilgan mobil kurs. Expo, navigatsiya, qurilma imkoniyatlari va do‘konga chiqarish.</p>',
      '<p>Ускоренный мобильный курс для тех, кто знает React. Expo, навигация, возможности устройства и публикация.</p>',
      '<p>An accelerated mobile track for developers who already know React: Expo, navigation, device APIs and publishing.</p>',
    ),
    outcomes: list(
      ['React Native ilova qurish', 'Qurilma imkoniyatlaridan foydalanish', 'Do‘konga chiqarish'],
      [
        'Строить приложения на React Native',
        'Использовать возможности устройства',
        'Публиковать в сторах',
      ],
      ['Build React Native apps', 'Use device capabilities', 'Publish to the stores'],
    ),
    requirements: list(
      ['React bo‘yicha ishonchli bilim'],
      ['Уверенное знание React'],
      ['Solid React knowledge'],
    ),
    syllabus: syllabus(
      module_(
        1,
        text('React Native asoslari', 'Основы React Native', 'React Native fundamentals'),
        3,
        list(
          ['Expo', 'Komponentlar', 'Stillar'],
          ['Expo', 'Компоненты', 'Стили'],
          ['Expo', 'Components', 'Styling'],
        ),
      ),
      module_(
        2,
        text('Navigatsiya va holat', 'Навигация и состояние', 'Navigation and state'),
        3,
        list(
          ['React Navigation', 'Context', 'Zustand'],
          ['React Navigation', 'Context', 'Zustand'],
          ['React Navigation', 'Context', 'Zustand'],
        ),
      ),
      module_(
        3,
        text('Qurilma imkoniyatlari', 'Возможности устройства', 'Device capabilities'),
        3,
        list(
          ['Kamera', 'Geolokatsiya', 'Push bildirishnomalar'],
          ['Камера', 'Геолокация', 'Push-уведомления'],
          ['Camera', 'Geolocation', 'Push notifications'],
        ),
      ),
      module_(
        4,
        text('Nashr va yakuniy loyiha', 'Публикация и финальный проект', 'Publishing and capstone'),
        3,
        list(
          ['EAS Build', 'Store listing', 'Yakuniy loyiha'],
          ['EAS Build', 'Store listing', 'Финальный проект'],
          ['EAS Build', 'Store listing', 'Capstone project'],
        ),
      ),
    ),
    level: CourseLevel.INTERMEDIATE,
    format: CourseFormat.ONLINE,
    durationMonths: 4,
    lessonsPerWeek: 2,
    lessonMinutes: 90,
    price: 1_600_000,
    discountPrice: null,
    coverImageUrl: null,
    isFeatured: false,
    isPublished: true,
    sortOrder: 7,
  },
  {
    slug: 'devops-asoslari',
    categorySlug: 'backend',
    teacherSlugs: ['bekzod-rahmonov'],
    title: text('DevOps asoslari', 'Основы DevOps', 'DevOps foundations'),
    shortDescription: text(
      'Docker, CI/CD va Kubernetes — kodni ishlab chiqarishga olib chiqing.',
      'Docker, CI/CD и Kubernetes — доведите код до продакшена.',
      'Docker, CI/CD and Kubernetes — get your code to production.',
    ),
    description: text(
      '<p>Dasturchilar uchun infratuzilma kursi. Har bir mavzu real serverda amaliyot bilan mustahkamlanadi.</p>',
      '<p>Курс по инфраструктуре для разработчиков. Каждая тема закрепляется практикой на реальном сервере.</p>',
      '<p>An infrastructure course for developers, with every topic practised on a real server.</p>',
    ),
    outcomes: list(
      [
        'Docker bilan konteynerlash',
        'CI/CD pipeline qurish',
        'Kubernetes da deploy',
        'Monitoring sozlash',
      ],
      [
        'Контейнеризация с Docker',
        'Построение CI/CD pipeline',
        'Деплой в Kubernetes',
        'Настройка мониторинга',
      ],
      [
        'Containerise with Docker',
        'Build CI/CD pipelines',
        'Deploy to Kubernetes',
        'Set up monitoring',
      ],
    ),
    requirements: list(
      ['Linux va terminal bilan ishlash', 'Bitta dasturlash tilini bilish'],
      ['Работа с Linux и терминалом', 'Знание одного языка программирования'],
      ['Linux and terminal experience', 'One programming language'],
    ),
    syllabus: syllabus(
      module_(
        1,
        text('Linux va tarmoq', 'Linux и сеть', 'Linux and networking'),
        3,
        list(
          ['Fayl tizimi', 'Jarayonlar', 'SSH', 'Tarmoq asoslari'],
          ['Файловая система', 'Процессы', 'SSH', 'Основы сети'],
          ['File system', 'Processes', 'SSH', 'Networking basics'],
        ),
      ),
      module_(
        2,
        text('Docker', 'Docker', 'Docker'),
        3,
        list(
          ['Image va container', 'Dockerfile', 'Volume', 'docker-compose'],
          ['Образы и контейнеры', 'Dockerfile', 'Volume', 'docker-compose'],
          ['Images and containers', 'Dockerfile', 'Volumes', 'docker-compose'],
        ),
      ),
      module_(
        3,
        text('CI/CD', 'CI/CD', 'CI/CD'),
        3,
        list(
          ['GitHub Actions', 'Testlar', 'Artefaktlar', 'Deploy'],
          ['GitHub Actions', 'Тесты', 'Артефакты', 'Деплой'],
          ['GitHub Actions', 'Tests', 'Artefacts', 'Deployment'],
        ),
      ),
      module_(
        4,
        text('Kubernetes', 'Kubernetes', 'Kubernetes'),
        4,
        list(
          ['Pod va Service', 'Deployment', 'Ingress', 'Helm'],
          ['Pod и Service', 'Deployment', 'Ingress', 'Helm'],
          ['Pods and Services', 'Deployments', 'Ingress', 'Helm'],
        ),
      ),
      module_(
        5,
        text('Monitoring va xavfsizlik', 'Мониторинг и безопасность', 'Monitoring and security'),
        3,
        list(
          ['Prometheus', 'Grafana', 'Loglar', 'Sirlarni boshqarish'],
          ['Prometheus', 'Grafana', 'Логи', 'Управление секретами'],
          ['Prometheus', 'Grafana', 'Logs', 'Secret management'],
        ),
      ),
    ),
    level: CourseLevel.ADVANCED,
    format: CourseFormat.ONLINE,
    durationMonths: 4,
    lessonsPerWeek: 2,
    lessonMinutes: 120,
    price: 2_200_000,
    discountPrice: null,
    coverImageUrl: null,
    isFeatured: false,
    isPublished: false,
    sortOrder: 8,
  },
] as const;
