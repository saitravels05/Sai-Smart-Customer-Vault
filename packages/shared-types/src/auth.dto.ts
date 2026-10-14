import { z } from 'zod';
import { UserRole, UserStatus, RegistrationStatus } from './enums.js';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
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

export const signupRequestSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
    branch: z.string().min(1, 'Please select your branch'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    confirmPassword: z.string().min(12, 'Confirm password must match'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupRequestDto = z.infer<typeof signupRequestSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid registered email address'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResendOtpDto = z.infer<typeof resendOtpSchema>;

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(12, 'Password must be at least 12 characters'),
    confirmPassword: z.string().min(12, 'Confirm password must match'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(12, 'New password must be at least 12 characters'),
    confirmPassword: z.string().min(12, 'Confirm password must match'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const approveRegistrationSchema = z.object({
  role: z.enum([UserRole.ADMIN, UserRole.STAFF]),
  notes: z.string().optional(),
});

export type ApproveRegistrationDto = z.infer<typeof approveRegistrationSchema>;

export const rejectRegistrationSchema = z.object({
  reason: z.string().optional(),
});

export type RejectRegistrationDto = z.infer<typeof rejectRegistrationSchema>;

export const changeUserRoleSchema = z.object({
  role: z.enum([UserRole.ADMIN, UserRole.STAFF]),
});

export type ChangeUserRoleDto = z.infer<typeof changeUserRoleSchema>;

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type ToggleUserStatusDto = z.infer<typeof toggleUserStatusSchema>;

export const createUserByOwnerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile number is required'),
  branchId: z.string().min(1, 'Branch is required'),
  designation: z.string().default('Staff'),
  role: z.enum([UserRole.ADMIN, UserRole.STAFF]),
  initialPassword: z.string().min(12, 'Password must be at least 12 characters').optional(),
});

export type CreateUserByOwnerDto = z.infer<typeof createUserByOwnerSchema>;

export interface AuthUserResponse {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  designation: string;
  mobile?: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  isMfaEnabled: boolean;
  mustChangePassword?: boolean;
  status?: UserStatus;
  lastLoginAt?: string | null;
}

export interface LoginResponseDto {
  requiresMfa?: boolean;
  mustChangePassword?: boolean;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUserResponse;
}

export interface RegistrationRequestItem {
  id: string;
  applicantEmail: string;
  fullName: string;
  mobile: string;
  branchName: string;
  status: RegistrationStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}
