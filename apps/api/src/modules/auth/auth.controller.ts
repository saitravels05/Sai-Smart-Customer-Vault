import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
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
} from '@sai/shared-types';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication result (or MFA challenge)' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.login(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 6-digit TOTP MFA code' })
  @ApiResponse({ status: 200, description: 'Tokens issued upon successful MFA' })
  async verifyMfa(
    @Body(new ZodValidationPipe(mfaVerifySchema)) dto: MfaVerifyDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.authService.verifyMfa(dto, ip, userAgent);
    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and refresh access token' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto,
  ) {
    const result = await this.authService.refreshTokens(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve current authenticated user context' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile and branch scope' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      data: user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate active user session' })
  @ApiResponse({ status: 200, description: 'Session terminated' })
  async logout() {
    return {
      success: true,
      message: 'Successfully logged out',
    };
  }
}
