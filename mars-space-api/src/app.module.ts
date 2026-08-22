import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { AppConfig } from './core/config/app.config';
import { CoreModule } from './core/core.module';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ContactMessagesModule } from './modules/contact-messages/contact-messages.module';
import { CoursesModule } from './modules/courses/courses.module';
import { GroupsModule } from './modules/groups/groups.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PostsModule } from './modules/posts/posts.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

/**
 * Composition root.
 *
 * The global provider order matters: `JwtAuthGuard` must run before
 * `RolesGuard` (which reads `request.user`), and `PrismaExceptionFilter` is
 * registered after `AllExceptionsFilter` because Nest applies global filters
 * in reverse, letting the specific one win over the catch-all.
 */
@Module({
  imports: [
    CoreModule,
    PrismaModule,
    // Drives the refresh-token reaper in AuthModule.
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const app = configService.getOrThrow<AppConfig>('app');
        return {
          throttlers: [{ ttl: app.throttleTtlSeconds * 1000, limit: app.throttleLimit }],
        };
      },
    }),

    AuthModule,
    UsersModule,
    CategoriesModule,
    CoursesModule,
    TeachersModule,
    GroupsModule,
    StudentsModule,
    LeadsModule,
    PostsModule,
    TestimonialsModule,
    ContactMessagesModule,
    SettingsModule,
    UploadsModule,
    StatisticsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    // Registered before the transform so its budget covers the whole handler.
    // Built by hand rather than `useClass`: the constructor takes a plain
    // `number`, which Nest would try to resolve as a provider called `Number`.
    { provide: APP_INTERCEPTOR, useFactory: () => new TimeoutInterceptor() },
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
