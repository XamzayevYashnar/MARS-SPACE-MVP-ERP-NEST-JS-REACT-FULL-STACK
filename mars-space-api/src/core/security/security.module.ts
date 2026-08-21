import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HashingService } from './hashing.service';
import { TokenService } from './token.service';

/**
 * `JwtModule` is registered without a secret: `TokenService` passes the access
 * secret per call, which keeps the refresh secret from ever being the module
 * default by accident.
 */
@Module({
  imports: [JwtModule.register({})],
  providers: [HashingService, TokenService],
  exports: [HashingService, TokenService, JwtModule],
})
export class SecurityModule {}
