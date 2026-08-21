import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppConfig } from '../config/app.config';

/**
 * Structured request logging.
 *
 * Pretty-printed in development, single-line JSON in production, with a
 * request id correlating every line of one request. The redaction list is the
 * enforcement point for "never log passwords, tokens or auth bodies" (§7).
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const app = configService.getOrThrow<AppConfig>('app');

        return {
          pinoHttp: {
            level: app.isTest ? 'silent' : app.logLevel,
            genReqId: (req, res) => {
              const existing = req.headers['x-request-id'];
              const id =
                typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },
            transport: app.isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'pid,hostname,req.headers,res.headers',
                  },
                },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
                'req.body.password',
                'req.body.currentPassword',
                'req.body.newPassword',
                'req.body.refreshToken',
                'responseBody.data.accessToken',
                'responseBody.data.refreshToken',
              ],
              remove: true,
            },
            // Auth routes carry credentials, so their bodies never reach the log.
            autoLogging: {
              ignore: (req) => req.url?.includes('/health') === true,
            },
            customLogLevel: (_req, res, err) => {
              if (err || res.statusCode >= 500) {
                return 'error';
              }
              if (res.statusCode >= 400) {
                return 'warn';
              }
              return 'info';
            },
            customSuccessMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
