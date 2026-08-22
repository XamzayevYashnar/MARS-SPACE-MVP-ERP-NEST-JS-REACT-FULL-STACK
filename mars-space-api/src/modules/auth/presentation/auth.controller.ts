import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import {
  LOGIN_THROTTLE,
  REFRESH_THROTTLE,
  REFRESH_TOKEN_COOKIE,
} from '../../../common/constants/app.constants';
import { ApiOkEnvelope } from '../../../common/decorators/api-response.decorators';
import { CurrentUser, Public } from '../../../common/decorators/auth.decorators';
import { AppConfig } from '../../../core/config/app.config';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../../core/security/token.service';
import { UserResponseDto } from '../../users/application/dto/user.dto';
import {
  AuthTokensDto,
  ChangePasswordDto,
  LoginDto,
  LoginResponseDto,
  MessageResponseDto,
  RefreshTokenDto,
} from '../application/dto/auth.dto';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { GetProfileUseCase } from '../application/use-cases/get-profile.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { InvalidRefreshTokenError } from '../domain/errors/auth.errors';

/**
 * Auth surface of §6.3.
 *
 * The refresh token is returned in the body *and* set as an httpOnly cookie:
 * browser clients get XSS-safe storage, native clients read the body.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly tokenService: TokenService,
    configService: ConfigService,
  ) {
    this.isProduction = configService.getOrThrow<AppConfig>('app').isProduction;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: LOGIN_THROTTLE })
  @ApiOperation({ summary: 'Exchange email and password for a token pair' })
  @ApiOkEnvelope(LoginResponseDto)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const tokens = await this.loginUseCase.execute(dto, this.contextOf(request));
    this.setRefreshCookie(response, tokens.refreshToken);
    return tokens;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: REFRESH_THROTTLE })
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  @ApiOkEnvelope(AuthTokensDto)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthTokensDto> {
    const presented = dto.refreshToken ?? this.readRefreshCookie(request);
    if (!presented) {
      throw new InvalidRefreshTokenError('No refresh token was provided');
    }

    const tokens = await this.refreshTokenUseCase.execute(presented, this.contextOf(request));
    this.setRefreshCookie(response, tokens.refreshToken);
    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke the current refresh session' })
  @ApiOkEnvelope(MessageResponseDto)
  async logout(
    @Body() dto: RefreshTokenDto,
    @CurrentUser('id') userId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponseDto> {
    await this.logoutUseCase.execute(dto.refreshToken ?? this.readRefreshCookie(request), userId);
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Current user profile' })
  @ApiOkEnvelope(UserResponseDto)
  me(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    return this.getProfileUseCase.execute(userId);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change the password and revoke all other sessions' })
  @ApiOkEnvelope(MessageResponseDto)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('id') userId: string,
    @Req() request: Request,
  ): Promise<MessageResponseDto> {
    await this.changePasswordUseCase.execute(userId, dto, this.readRefreshCookie(request));
    return { message: 'Password changed. All other sessions have been signed out.' };
  }

  private contextOf(request: Request): { userAgent: string | null; ipAddress: string | null } {
    return {
      userAgent: request.headers['user-agent'] ?? null,
      ipAddress: request.ip ?? null,
    };
  }

  private readRefreshCookie(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[REFRESH_TOKEN_COOKIE];
  }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(REFRESH_TOKEN_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: this.tokenService.refreshTtlMs(),
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? ('strict' as const) : ('lax' as const),
      path: '/',
    };
  }
}
