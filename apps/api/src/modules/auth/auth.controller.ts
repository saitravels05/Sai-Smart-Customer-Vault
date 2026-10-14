import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  LoginDto,
  loginSchema,
  MfaVerifyDto,
  mfaVerifySchema,
  RefreshTokenDto,
  refreshTokenSchema,
  SignupRequestDto,
  signupRequestSchema,
  ForgotPasswordDto,
  forgotPasswordSchema,
  VerifyOtpDto,
  verifyOtpSchema,
  ResendOtpDto,
  resendOtpSchema,
  ResetPasswordDto,
  resetPasswordSchema,
  ChangePasswordDto,
  changePasswordSchema,
} from '@sai/shared-types';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 1. Login with email & password, issuing secure HttpOnly cookie and Bearer tokens
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication result or MFA requirement' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.login(dto, ip, userAgent);

    if (result.accessToken) {
      // Set secure HttpOnly session cookie
      res.cookie('sai_session_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: dto.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000,
      });
    }

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 2. Owner-Controlled Public Registration Request (PENDING)
   */
  @Post('signup-request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit registration request for Owner approval' })
  async requestSignup(
    @Body(new ZodValidationPipe(signupRequestSchema)) dto: SignupRequestDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.requestSignup(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 3. Forgot Password — Issue 6-Digit Email OTP
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP code via registered email' })
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.forgotPassword(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 4. Resend OTP with 60-second cooldown
   */
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend password reset OTP code after cooldown' })
  async resendOtp(
    @Body(new ZodValidationPipe(resendOtpSchema)) dto: ResendOtpDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.resendOtp(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 5. Verify 6-Digit OTP and receive short-lived Reset Authorization Token
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email OTP and obtain password reset authorization' })
  async verifyOtp(
    @Body(new ZodValidationPipe(verifyOtpSchema)) dto: VerifyOtpDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.verifyOtp(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 6. Reset Password with Reset Authorization Token
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set new password using single-use reset authorization token' })
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.resetPassword(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 7. Change Password (for authenticated user or required first login)
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const userId = user.id || user.userId || '';
    const result = await this.authService.changePassword(dto, userId, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 8. Verify TOTP 6-Digit MFA Code
   */
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 6-digit TOTP MFA code' })
  async verifyMfa(
    @Body(new ZodValidationPipe(mfaVerifySchema)) dto: MfaVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.verifyMfa(dto, ip, userAgent);

    if (result.accessToken) {
      res.cookie('sai_session_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 9. Refresh Access Token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and refresh access token' })
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(dto);
    res.cookie('sai_session_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 10. Get Current Authenticated Profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve current authenticated user context' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      data: user,
    };
  }

  /**
   * 11. Terminate Session & Clear Cookies
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate active user session' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('sai_session_token', { path: '/' });
    return {
      success: true,
      message: 'Successfully logged out',
    };
  }
}
