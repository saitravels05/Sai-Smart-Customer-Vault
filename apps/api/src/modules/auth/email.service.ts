import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  unconfigured?: boolean;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly isConfigured: boolean;

  constructor() {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase() || '';
    const smtpHost = process.env.SMTP_HOST;
    const resendApiKey = process.env.EMAIL_API_KEY;

    if (provider === 'smtp' || (smtpHost && smtpHost.trim() !== '')) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
        });
        this.isConfigured = true;
        this.logger.log(`Email service initialized with SMTP host: ${process.env.SMTP_HOST}`);
      } catch (err: any) {
        this.logger.error(`Failed to configure SMTP transporter: ${err.message}`);
        this.isConfigured = false;
      }
    } else if (provider === 'resend' || (resendApiKey && resendApiKey.trim() !== '')) {
      this.isConfigured = true;
      this.logger.log('Email service initialized with Resend provider.');
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'Email service unconfigured: Neither EMAIL_PROVIDER=resend with EMAIL_API_KEY nor SMTP_HOST configured. Transactional emails will report unconfigured.',
      );
    }
  }

  /**
   * Send Password Reset OTP Email
   */
  async sendPasswordResetOtp(to: string, otpCode: string): Promise<EmailSendResult> {
    const subject = 'SAI Smart Customer Vault — Password Reset OTP';
    const textContent = `Hello,

We received a request to reset your SAI Smart Customer Vault account password.

Your password reset verification code is:
${otpCode}

This code is valid for 5 minutes.
If you did not request a password reset, you can ignore this email.

For your security, do not share this code with anyone.

Regards,
SAI TOURS & TRAVELS
Madurai Head Office & Trichy Branch`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset OTP</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="560" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0B192C; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">SAI SMART CUSTOMER VAULT</h1>
              <p style="color: #E85A18; font-size: 12px; font-weight: 700; margin: 4px 0 0 0;">SAI TOURS & TRAVELS</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px; color: #1e293b; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0;">Hello,</p>
              <p>We received a request to reset your <strong>SAI Smart Customer Vault</strong> account password.</p>
              <p style="margin-bottom: 8px;">Your password reset verification code is:</p>
              <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0B192C; font-family: monospace;">${otpCode}</span>
              </div>
              <p style="color: #64748b; font-size: 13px;">This code is valid for <strong>5 minutes</strong>. If you did not request a password reset, you can ignore this email.</p>
              <p style="color: #dc2626; font-size: 13px; font-weight: 600;">For your security, do not share this code with anyone.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="margin: 0; font-size: 13px; color: #475569;">
                Regards,<br/>
                <strong>SAI TOURS & TRAVELS</strong><br/>
                <span style="font-size: 12px; color: #94a3b8;">Madurai Head Office (+91 9894821561) • Trichy Branch (+91 9894619921)</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendMail({
      to,
      subject,
      text: textContent,
      html: htmlContent,
      logLabel: 'Password Reset OTP',
    });
  }

  /**
   * Send Account Activation Confirmation Email
   */
  async sendAccountActivatedEmail(to: string, fullName: string, role: string): Promise<EmailSendResult> {
    const subject = 'SAI Smart Customer Vault — Account Activated';
    const textContent = `Hello ${fullName},

Your account registration for SAI Smart Customer Vault has been approved by the Owner.

Assigned Role: ${role}

You may now log in to the system at:
${process.env.APP_BASE_URL || 'http://localhost:3000'}/login

Regards,
SAI TOURS & TRAVELS`;

    return this.sendMail({
      to,
      subject,
      text: textContent,
      logLabel: 'Account Activation',
    });
  }

  /**
   * Send Password Change Confirmation Alert
   */
  async sendPasswordChangedAlert(to: string): Promise<EmailSendResult> {
    const subject = 'SAI Smart Customer Vault — Password Changed Successfully';
    const textContent = `Hello,

The password for your SAI Smart Customer Vault account has been successfully changed.
All previous active sessions have been securely terminated.

If you did not perform this action, please contact the Owner immediately.

Regards,
SAI TOURS & TRAVELS`;

    return this.sendMail({
      to,
      subject,
      text: textContent,
      logLabel: 'Password Changed Alert',
    });
  }

  /**
   * Core dispatcher supporting Resend, SMTP, and missing-configuration reporting
   */
  private async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    logLabel: string;
  }): Promise<EmailSendResult> {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'alerts@saitravelservices.com';
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase() || '';
    const resendApiKey = process.env.EMAIL_API_KEY;

    // Resend Provider
    if (provider === 'resend' || (resendApiKey && resendApiKey.trim() !== '')) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [options.to],
            subject: options.subject,
            text: options.text,
            html: options.html,
          }),
        });

        if (!response.ok) {
          const errData = await response.text();
          let parsedError = errData;
          try {
            const parsedJson = JSON.parse(errData);
            if (parsedJson.message) {
              parsedError = parsedJson.message;
            }
          } catch {}
          this.logger.error(`Resend API error sending ${options.logLabel} to ${options.to}: ${parsedError}`);
          return { success: false, error: parsedError };
        }

        const data: any = await response.json();
        this.logger.log(`Successfully delivered ${options.logLabel} to ${options.to} via Resend [ID: ${data.id}]`);
        return { success: true, messageId: data.id };
      } catch (err: any) {
        this.logger.error(`Failed to send email via Resend to ${options.to}: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    // SMTP Provider
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        this.logger.log(`Successfully sent ${options.logLabel} to ${options.to} via SMTP [ID: ${info.messageId}]`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        this.logger.error(`SMTP delivery failed for ${options.to}: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    // Unconfigured Provider
    this.logger.warn(
      `Email delivery skipped for [${options.logLabel}] to ${options.to}: No email provider configured (EMAIL_PROVIDER or SMTP_HOST).`,
    );
    return {
      success: false,
      unconfigured: true,
      error: 'Email provider not configured in environment',
    };
  }
}
