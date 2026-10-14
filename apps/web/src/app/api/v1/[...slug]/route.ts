import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@sai/database';
import { argon2Verify, argon2id } from 'hash-wasm';

async function hashPassword(plainText: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  return await argon2id({
    password: plainText,
    salt,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: 'encoded',
  });
}

async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password: plainText, hash });
  } catch {
    return false;
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// JWT Helper
function verifyJwtToken(authHeader: string | null): any {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'sai_vault_hmac_otp_secret_key_2026';
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64url');
    if (expectedSig !== parts[2]) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function signJwtToken(payload: Record<string, any>, expiresInSec = 86400): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'sai_vault_hmac_otp_secret_key_2026';
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

// Resend Email Helper
async function sendResendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
  const apiKey = process.env.EMAIL_API_KEY || '';
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey) {
    console.error('EMAIL_API_KEY is not set in environment.');
    return false;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0B192C; margin: 0 0 4px 0; font-size: 20px; font-weight: 800;">SAI TOURS & TRAVELS</h2>
        <p style="color: #E85A18; font-size: 13px; font-weight: 700; margin: 0;">SAI SMART CUSTOMER VAULT</p>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">You requested a password reset verification code for your account: <strong>${toEmail}</strong></p>
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 24px; text-align: center; border-radius: 10px; margin: 24px 0;">
        <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Your 6-Digit OTP Code</p>
        <h1 style="font-size: 40px; letter-spacing: 10px; color: #E85A18; margin: 0; font-family: monospace;">${otpCode}</h1>
        <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">Valid for <strong>5 minutes</strong> • Single-use only</p>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">If you did not make this request, please ignore this email or notify the Madurai Head Office immediately (+91 9894821561).</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">SAI Tours & Travels • Madurai Head Office & Trichy Branch • Tamil Nadu, India</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `SAI Tours & Travels <${fromEmail}>`,
        to: [toEmail],
        subject: `SAI SMART VAULT — Password Reset Verification Code: ${otpCode}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      return true;
    }

    // In Resend sandbox mode, if recipient is restricted to verified email, dispatch copy to saitourism22@gmail.com
    if (data.statusCode === 403 && data.message?.includes('saitourism22@gmail.com')) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `SAI Tours & Travels <${fromEmail}>`,
          to: ['saitourism22@gmail.com'],
          subject: `[Sandbox OTP for ${toEmail}] SAI SMART VAULT — Verification Code: ${otpCode}`,
          html: htmlContent,
        }),
      });
      return true;
    }
  } catch (err) {
    console.error('Error sending email through Resend:', err);
  }
  return false;
}

// ----------------------------------------------------
// Handlers
// ----------------------------------------------------

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = (params.slug || []).join('/');

  try {
    // 1. FORGOT PASSWORD
    if (path === 'auth/forgot-password') {
      const body = await req.json();
      const cleanEmail = (body.email || '').toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      const genericResponse = {
        success: true,
        message: 'If this email is registered, a password reset verification code has been sent.',
      };

      if (!user || !user.isActive) {
        return NextResponse.json(genericResponse);
      }

      // Generate 6-digit OTP
      const rawOtp = crypto.randomInt(100000, 999999).toString();
      const hmacSecret = process.env.JWT_ACCESS_SECRET || 'sai_vault_hmac_otp_secret_key_2026';
      const otpHash = crypto.createHmac('sha256', hmacSecret).update(rawOtp).digest('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Invalidate existing challenges
      await prisma.passwordResetChallenge.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      // Save challenge
      await prisma.passwordResetChallenge.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt,
          attemptCount: 0,
        },
      });

      // Dispatch Email via Resend
      await sendResendOtpEmail(cleanEmail, rawOtp);

      return NextResponse.json(genericResponse);
    }

    // 2. VERIFY OTP
    if (path === 'auth/verify-otp') {
      const body = await req.json();
      const cleanEmail = (body.email || '').toLowerCase().trim();
      const cleanOtp = (body.otp || '').trim();

      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: { message: 'Invalid or expired OTP code' } }, { status: 400 });
      }

      const challenge = await prisma.passwordResetChallenge.findFirst({
        where: {
          userId: user.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!challenge) {
        return NextResponse.json(
          { success: false, error: { message: 'OTP code has expired or was already used. Please request a new code.' } },
          { status: 400 },
        );
      }

      const hmacSecret = process.env.JWT_ACCESS_SECRET || 'sai_vault_hmac_otp_secret_key_2026';
      const candidateHash = crypto.createHmac('sha256', hmacSecret).update(cleanOtp).digest('hex');

      if (candidateHash !== challenge.otpHash) {
        await prisma.passwordResetChallenge.update({
          where: { id: challenge.id },
          data: { attemptCount: { increment: 1 } },
        });
        return NextResponse.json({ success: false, error: { message: 'Invalid OTP code. Please check your email and try again.' } }, { status: 400 });
      }

      // Mark challenge consumed
      await prisma.passwordResetChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });

      // Generate single-use reset token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const authExpires = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.passwordResetAuthorization.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: authExpires,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          resetToken: rawToken,
          message: 'OTP verified successfully.',
        },
      });
    }

    // 3. RESEND OTP
    if (path === 'auth/resend-otp') {
      const body = await req.json();
      const cleanEmail = (body.email || '').toLowerCase().trim();

      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (user && user.isActive) {
        const rawOtp = crypto.randomInt(100000, 999999).toString();
        const hmacSecret = process.env.JWT_ACCESS_SECRET || 'sai_vault_hmac_otp_secret_key_2026';
        const otpHash = crypto.createHmac('sha256', hmacSecret).update(rawOtp).digest('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.passwordResetChallenge.updateMany({
          where: { userId: user.id, consumedAt: null },
          data: { consumedAt: new Date() },
        });

        await prisma.passwordResetChallenge.create({
          data: {
            userId: user.id,
            otpHash,
            expiresAt,
            attemptCount: 0,
          },
        });

        await sendResendOtpEmail(cleanEmail, rawOtp);
      }

      return NextResponse.json({
        success: true,
        message: 'A fresh verification code has been dispatched to your email address.',
      });
    }

    // 4. RESET PASSWORD
    if (path === 'auth/reset-password') {
      const body = await req.json();
      const resetToken = (body.resetToken || '').trim();
      const newPassword = body.newPassword || '';

      if (!resetToken || !newPassword || newPassword.length < 8) {
        return NextResponse.json({ success: false, error: { message: 'Password must be at least 8 characters long.' } }, { status: 400 });
      }

      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const auth = await prisma.passwordResetAuthorization.findFirst({
        where: {
          tokenHash,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!auth) {
        return NextResponse.json(
          { success: false, error: { message: 'Password reset session has expired or is invalid. Please request a new OTP.' } },
          { status: 400 },
        );
      }

      const passwordHash = await hashPassword(newPassword);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: auth.userId },
          data: {
            passwordHash,
            mustChangePassword: false,
            failedAttempts: 0,
            lockedUntil: null,
          },
        }),
        prisma.passwordResetAuthorization.update({
          where: { id: auth.id },
          data: { consumedAt: new Date() },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Password reset successful. You can now log in with your new password.',
      });
    }

    // 5. LOGIN
    if (path === 'auth/login') {
      const body = await req.json();
      const cleanEmail = (body.email || '').toLowerCase().trim();
      const password = body.password || '';

      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          staffProfile: {
            include: { branch: true },
          },
        },
      });

      if (!user || !user.isActive) {
        return NextResponse.json({ success: false, error: { message: 'Invalid email or password' } }, { status: 401 });
      }

      let passwordValid = false;
      try {
        passwordValid = await verifyPassword(password, user.passwordHash);
      } catch {
        passwordValid = false;
      }

      if (!passwordValid) {
        return NextResponse.json({ success: false, error: { message: 'Invalid email or password' } }, { status: 401 });
      }

      const tokenPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        branchId: user.staffProfile?.branchId || '',
        branchCode: user.staffProfile?.branch?.code || 'IXM-HO',
        fullName: user.staffProfile?.fullName || 'SAI Tours & Travels Owner',
      };

      const accessToken = signJwtToken(tokenPayload, body.rememberMe ? 7 * 86400 : 86400);

      const response = NextResponse.json({
        success: true,
        data: {
          accessToken,
          requiresMfa: false,
          mustChangePassword: user.mustChangePassword,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.staffProfile?.fullName || 'SAI Tours & Travels Owner',
            designation: user.staffProfile?.designation || 'Managing Director / Owner',
            branchId: user.staffProfile?.branchId || '',
            branchCode: user.staffProfile?.branch?.code || 'IXM-HO',
            branchName: user.staffProfile?.branch?.name || 'Madurai Head Office',
          },
        },
      });

      response.cookies.set('sai_session_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: body.rememberMe ? 7 * 86400 : 86400,
      });

      return response;
    }

    // 6. LOGOUT
    if (path === 'auth/logout') {
      const response = NextResponse.json({ success: true, message: 'Successfully logged out' });
      response.cookies.set('sai_session_token', '', { path: '/', maxAge: 0 });
      return response;
    }

    // 7. SIGNUP REQUEST
    if (path === 'auth/signup-request') {
      const body = await req.json();
      const applicantEmail = (body.applicantEmail || '').toLowerCase().trim();

      const existingUser = await prisma.user.findUnique({ where: { email: applicantEmail } });
      if (existingUser) {
        return NextResponse.json({ success: false, error: { message: 'An account with this email address already exists.' } }, { status: 400 });
      }

      const passwordHash = await hashPassword(body.password);

      const request = await prisma.registrationRequest.create({
        data: {
          applicantEmail,
          fullName: body.fullName,
          mobile: body.mobile,
          branchId: body.branchId || null,
          branchName: body.branchName || 'Madurai Head Office',
          passwordHash,
          status: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          requestId: request.id,
          message: 'Your registration request has been submitted for Owner approval.',
        },
      });
    }

    // 8. CHANGE PASSWORD
    if (path === 'auth/change-password') {
      const user = verifyJwtToken(req.headers.get('authorization'));
      if (!user) {
        return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
      }

      const body = await req.json();
      const passwordHash = await hashPassword(body.newPassword);

      await prisma.user.update({
        where: { id: user.sub },
        data: { passwordHash, mustChangePassword: false },
      });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // 9. CREATE CUSTOMER
    if (path === 'customers') {
      const user = verifyJwtToken(req.headers.get('authorization'));
      if (!user) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });

      const body = await req.json();
      const customerCount = await prisma.customer.count();
      const customerNumber = `SAI-${String(customerCount + 1).padStart(5, '0')}`;

      const customer = await prisma.customer.create({
        data: {
          customerNumber,
          branchId: body.branchId || user.branchId,
          fullName: body.fullName,
          primaryPhone: body.primaryPhone,
          email: body.email || null,
          whatsappNumber: body.whatsappNumber || null,
          primaryCategory: body.primaryCategory || 'PASSPORT_SERVICES',
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({ success: true, data: customer });
    }

    return NextResponse.json({ error: { message: `Route not found: ${path}` } }, { status: 404 });
  } catch (error: any) {
    console.error(`API Error in ${path}:`, error);
    return NextResponse.json({ success: false, error: { message: error.message || 'Internal Server Error' } }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = (params.slug || []).join('/');

  try {
    // 1. AUTH ME
    if (path === 'auth/me') {
      const user = verifyJwtToken(req.headers.get('authorization'));
      if (!user) {
        return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.sub },
        include: { staffProfile: { include: { branch: true } } },
      });

      if (!dbUser) {
        return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          mustChangePassword: dbUser.mustChangePassword,
          fullName: dbUser.staffProfile?.fullName || 'User',
          designation: dbUser.staffProfile?.designation || '',
          branchId: dbUser.staffProfile?.branchId || '',
          branchCode: dbUser.staffProfile?.branch?.code || '',
          branchName: dbUser.staffProfile?.branch?.name || '',
        },
      });
    }

    // 2. DASHBOARD STATS & ANALYTICS
    if (path === 'dashboard/stats') {
      const [totalCustomers, activePassports, activeVisas, pendingReminders] = await Promise.all([
        prisma.customer.count({ where: { isDeleted: false } }),
        prisma.passport.count({ where: { isCurrent: true } }),
        prisma.visa.count({ where: { status: 'ACTIVE' } }),
        prisma.reminder.count({ where: { status: 'SCHEDULED' } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          totalCustomers,
          activePassports,
          activeVisas,
          pendingReminders,
          storageBytesUsed: 0,
        },
      });
    }

    if (path === 'dashboard/analytics') {
      return NextResponse.json({
        success: true,
        data: {
          monthlyTrend: [
            { month: 'Jan', customers: 12 },
            { month: 'Feb', customers: 18 },
            { month: 'Mar', customers: 24 },
            { month: 'Apr', customers: 30 },
          ],
          servicesBreakdown: [
            { category: 'PASSPORT_SERVICES', count: 45 },
            { category: 'TOURIST_VISA', count: 30 },
            { category: 'FLIGHT_BOOKING', count: 20 },
            { category: 'HOTEL_BOOKING', count: 15 },
          ],
        },
      });
    }

    // 3. BRANCHES & STAFF
    if (path === 'branches') {
      const branches = await prisma.branch.findMany({ where: { isActive: true } });
      return NextResponse.json({ success: true, data: branches });
    }

    if (path === 'staff') {
      const staff = await prisma.staffProfile.findMany({ include: { branch: true } });
      return NextResponse.json({ success: true, data: staff });
    }

    // 4. CUSTOMERS LIST
    if (path === 'customers') {
      const customers = await prisma.customer.findMany({
        where: { isDeleted: false },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: customers, meta: { total: customers.length, page: 1, limit: 50 } });
    }

    // 5. REMINDERS LIST
    if (path === 'reminders') {
      const reminders = await prisma.reminder.findMany({
        take: 50,
        orderBy: { targetDate: 'asc' },
        include: { customer: true },
      });
      return NextResponse.json({ success: true, data: reminders });
    }

    // 6. OWNER APPROVALS
    if (path === 'owner/approvals') {
      const requests = await prisma.registrationRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: requests });
    }

    // 7. OWNER USERS
    if (path === 'owner/users') {
      const users = await prisma.user.findMany({
        include: { staffProfile: { include: { branch: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: users });
    }

    return NextResponse.json({ error: { message: `Route not found: ${path}` } }, { status: 404 });
  } catch (error: any) {
    console.error(`API GET Error in ${path}:`, error);
    return NextResponse.json({ success: false, error: { message: error.message || 'Internal Server Error' } }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Branch-Id',
    },
  });
}
