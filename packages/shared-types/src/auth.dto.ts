import { z } from 'zod';
import { UserRole } from './enums.js';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const mfaVerifySchema = z.object({
  userId: z.string().uuid(),
  totpCode: z.string().length(6, 'TOTP code must be 6 digits'),
});

export type MfaVerifyDto = z.infer<typeof mfaVerifySchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export interface AuthUserResponse {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  designation: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  isMfaEnabled: boolean;
}

export interface LoginResponseDto {
  requiresMfa?: boolean;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUserResponse;
}
