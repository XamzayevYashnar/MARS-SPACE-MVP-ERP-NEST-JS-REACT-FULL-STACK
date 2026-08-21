-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseFormat" AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('FORMING', 'ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'FROZEN', 'DROPPED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CONTACTED', 'ENROLLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE_FORM', 'COURSE_PAGE', 'HERO_FORM', 'TELEGRAM', 'INSTAGRAM', 'PHONE', 'WALK_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "iconKey" TEXT,
    "colorHex" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "shortDescription" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "outcomes" JSONB,
    "requirements" JSONB,
    "syllabus" JSONB,
    "categoryId" TEXT NOT NULL,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "format" "CourseFormat" NOT NULL DEFAULT 'OFFLINE',
    "durationMonths" INTEGER NOT NULL,
    "lessonsPerWeek" INTEGER NOT NULL,
    "lessonMinutes" INTEGER NOT NULL DEFAULT 90,
    "price" DECIMAL(12,2) NOT NULL,
    "discountPrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "coverImageUrl" TEXT,
    "promoVideoUrl" TEXT,
    "metaTitle" JSONB,
    "metaDescription" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" JSONB NOT NULL,
    "bio" JSONB,
    "photoUrl" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "socials" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_teachers" (
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "course_teachers_pkey" PRIMARY KEY ("courseId","teacherId")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "weekDays" "WeekDay"[] DEFAULT ARRAY[]::"WeekDay"[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "roomName" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 15,
    "status" "GroupStatus" NOT NULL DEFAULT 'FORMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "birthDate" TIMESTAMP(3),
    "groupId" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "courseId" TEXT,
    "message" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE_FORM',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "adminNote" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "pageUrl" TEXT,
    "contactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "excerpt" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "coverImageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorId" TEXT,
    "readMinutes" INTEGER NOT NULL DEFAULT 3,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" JSONB,
    "metaDescription" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" JSONB,
    "avatarUrl" TEXT,
    "courseId" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "content" JSONB NOT NULL,
    "videoUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_isActive_sortOrder_idx" ON "categories"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_categoryId_isPublished_idx" ON "courses"("categoryId", "isPublished");

-- CreateIndex
CREATE INDEX "courses_isPublished_isFeatured_sortOrder_idx" ON "courses"("isPublished", "isFeatured", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_slug_key" ON "teachers"("slug");

-- CreateIndex
CREATE INDEX "teachers_isActive_sortOrder_idx" ON "teachers"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");

-- CreateIndex
CREATE INDEX "groups_courseId_status_idx" ON "groups"("courseId", "status");

-- CreateIndex
CREATE INDEX "groups_status_startDate_idx" ON "groups"("status", "startDate");

-- CreateIndex
CREATE INDEX "students_groupId_status_idx" ON "students"("groupId", "status");

-- CreateIndex
CREATE INDEX "students_phone_idx" ON "students"("phone");

-- CreateIndex
CREATE INDEX "leads_status_createdAt_idx" ON "leads"("status", "createdAt");

-- CreateIndex
CREATE INDEX "leads_courseId_idx" ON "leads"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_isPublished_publishedAt_idx" ON "posts"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "testimonials_isPublished_sortOrder_idx" ON "testimonials"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "contact_messages_isRead_createdAt_idx" ON "contact_messages"("isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "media_files_key_key" ON "media_files"("key");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
