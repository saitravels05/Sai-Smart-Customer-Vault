import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@sai/database';
import {
  ReminderDto,
  ReminderStatsDto,
  ReminderScanReportDto,
  ReminderType,
  ReminderChannel,
  ReminderStatus,
  UserRole,
} from '@sai/shared-types';
import { ReminderCalculator } from './reminder-calculator';
import { WhatsAppNotifier } from './whatsapp-notifier';

interface AuthUserContext {
  userId: string;
  role: UserRole;
  branchId: string;
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  /**
   * Scan active records across passports, visas, and bookings, generating deduplicated reminders
   */
  async scanAndGenerateReminders(): Promise<ReminderScanReportDto> {
    const startTime = Date.now();
    let scannedCount = 0;
    let createdCount = 0;
    let skippedDuplicatesCount = 0;

    const now = new Date();
    const horizon180Days = new Date();
    horizon180Days.setDate(now.getDate() + 180);

    // 1. Scan Passports expiring within 180 days (or expired)
    const passports = await prisma.passport.findMany({
      where: {
        expiryDate: { lte: horizon180Days },
        customer: { isDeleted: false },
      },
      include: {
        customer: {
          select: { id: true, fullName: true, customerNumber: true, primaryPhone: true, whatsappNumber: true, branchId: true },
        },
      },
    });

    for (const p of passports) {
      scannedCount++;
      const { daysLeft, severity } = ReminderCalculator.calculateSeverity(p.expiryDate);
      const leadDay = ReminderCalculator.matchLeadDay(daysLeft) || (daysLeft < 0 ? 0 : 180);

      // Check deduplication: Avoid duplicate reminder for same customer, type, targetDate, and leadDay
      const existing = await prisma.reminder.findFirst({
        where: {
          customerId: p.customer.id,
          type: ReminderType.PASSPORT_EXPIRY,
          targetDate: p.expiryDate,
          leadDays: leadDay,
        },
      });

      if (existing) {
        skippedDuplicatesCount++;
        continue;
      }

      const { title, message } = ReminderCalculator.generateMessage(
        ReminderType.PASSPORT_EXPIRY,
        p.customer.fullName,
        p.expiryDate,
        daysLeft,
      );

      const hasConsent = await WhatsAppNotifier.hasWhatsAppConsent(p.customer.id);
      const channel = p.customer.whatsappNumber && hasConsent ? ReminderChannel.WHATSAPP : ReminderChannel.DASHBOARD;

      await prisma.reminder.create({
        data: {
          customerId: p.customer.id,
          type: ReminderType.PASSPORT_EXPIRY,
          channel,
          title,
          message,
          targetDate: p.expiryDate,
          leadDays: leadDay,
          scheduledFor: new Date(),
          status: ReminderStatus.SCHEDULED,
        },
      });

      createdCount++;
    }

    // 2. Scan Visas expiring within 90 days
    const horizon90Days = new Date();
    horizon90Days.setDate(now.getDate() + 90);

    const visas = await prisma.visa.findMany({
      where: {
        expiryDate: { lte: horizon90Days },
        customer: { isDeleted: false },
      },
      include: {
        customer: {
          select: { id: true, fullName: true, customerNumber: true, primaryPhone: true, whatsappNumber: true, branchId: true },
        },
      },
    });

    for (const v of visas) {
      scannedCount++;
      const { daysLeft } = ReminderCalculator.calculateSeverity(v.expiryDate);
      const leadDay = ReminderCalculator.matchLeadDay(daysLeft) || (daysLeft < 0 ? 0 : 90);

      const existing = await prisma.reminder.findFirst({
        where: {
          customerId: v.customer.id,
          type: ReminderType.VISA_EXPIRY,
          targetDate: v.expiryDate,
          leadDays: leadDay,
        },
      });

      if (existing) {
        skippedDuplicatesCount++;
        continue;
      }

      const { title, message } = ReminderCalculator.generateMessage(
        ReminderType.VISA_EXPIRY,
        v.customer.fullName,
        v.expiryDate,
        daysLeft,
        { country: v.country, visaType: v.visaCategory },
      );

      const hasConsent = await WhatsAppNotifier.hasWhatsAppConsent(v.customer.id);
      const channel = v.customer.whatsappNumber && hasConsent ? ReminderChannel.WHATSAPP : ReminderChannel.DASHBOARD;

      await prisma.reminder.create({
        data: {
          customerId: v.customer.id,
          type: ReminderType.VISA_EXPIRY,
          channel,
          title,
          message,
          targetDate: v.expiryDate,
          leadDays: leadDay,
          scheduledFor: new Date(),
          status: ReminderStatus.SCHEDULED,
        },
      });

      createdCount++;
    }

    // 3. Scan Upcoming Travel Bookings within 7 days
    const horizon7Days = new Date();
    horizon7Days.setDate(now.getDate() + 7);

    const bookings = await prisma.travelBooking.findMany({
      where: {
        departureTime: { gte: now, lte: horizon7Days },
        customer: { isDeleted: false },
      },
      include: {
        customer: {
          select: { id: true, fullName: true, customerNumber: true, primaryPhone: true, whatsappNumber: true, branchId: true },
        },
      },
    });

    for (const b of bookings) {
      if (!b.departureTime) continue;
      scannedCount++;
      const { daysLeft } = ReminderCalculator.calculateSeverity(b.departureTime);
      const leadDay = daysLeft <= 1 ? 1 : 7;

      const existing = await prisma.reminder.findFirst({
        where: {
          customerId: b.customer.id,
          type: ReminderType.UPCOMING_FLIGHT_DEPARTURE,
          targetDate: b.departureTime,
          leadDays: leadDay,
        },
      });

      if (existing) {
        skippedDuplicatesCount++;
        continue;
      }

      const { title, message } = ReminderCalculator.generateMessage(
        ReminderType.UPCOMING_FLIGHT_DEPARTURE,
        b.customer.fullName,
        b.departureTime,
        daysLeft,
        { route: `${b.originAirport || ''} -> ${b.destAirport || ''}`, carrier: b.airline || 'Scheduled Flight' },
      );

      await prisma.reminder.create({
        data: {
          customerId: b.customer.id,
          type: ReminderType.UPCOMING_FLIGHT_DEPARTURE,
          channel: ReminderChannel.WHATSAPP,
          title,
          message,
          targetDate: b.departureTime,
          leadDays: leadDay,
          scheduledFor: new Date(),
          status: ReminderStatus.SCHEDULED,
        },
      });

      createdCount++;
    }

    this.logger.log(`Expiry scan complete: ${scannedCount} records inspected, ${createdCount} reminders generated, ${skippedDuplicatesCount} duplicates skipped.`);

    return {
      scannedCount,
      createdCount,
      dispatchedCount: 0,
      skippedDuplicatesCount,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Retrieve reminders with branch tenancy and optional filters
   */
  async getReminders(
    user: AuthUserContext,
    filters?: {
      status?: ReminderStatus;
      type?: ReminderType;
      channel?: ReminderChannel;
      limit?: number;
      offset?: number;
    },
  ): Promise<ReminderDto[]> {
    const branchWhere = user.role === UserRole.SUPER_ADMIN ? {} : { customer: { branchId: user.branchId } };

    const where: any = {
      ...branchWhere,
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.channel) where.channel = filters.channel;

    const branches = await prisma.branch.findMany({ select: { id: true, name: true, code: true } });
    const branchMap = new Map(branches.map((b) => [b.id, `${b.name} (${b.code})`]));

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            customerNumber: true,
            branchId: true,
            primaryPhone: true,
            whatsappNumber: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return reminders.map((r) => {
      const { daysLeft, severity } = ReminderCalculator.calculateSeverity(r.targetDate);
      return {
        id: r.id,
        customerId: r.customer.id,
        customerName: r.customer.fullName,
        customerNumber: r.customer.customerNumber,
        branchId: r.customer.branchId,
        branchName: branchMap.get(r.customer.branchId) || 'Branch Office',
        primaryPhone: r.customer.primaryPhone,
        whatsappNumber: r.customer.whatsappNumber || undefined,
        type: r.type as any,
        channel: r.channel as any,
        title: r.title,
        message: r.message,
        targetDate: new Date(r.targetDate).toISOString().split('T')[0],
        leadDays: r.leadDays,
        scheduledFor: r.scheduledFor.toISOString(),
        status: r.status as any,
        sentAt: r.sentAt?.toISOString(),
        acknowledgedAt: r.acknowledgedAt?.toISOString(),
        failureReason: r.failureReason || undefined,
        daysUntilTarget: daysLeft,
        severity,
        createdAt: r.createdAt.toISOString(),
      };
    });
  }

  /**
   * Compute aggregated dashboard metrics for expiry alerts
   */
  async getReminderStats(user: AuthUserContext): Promise<ReminderStatsDto> {
    const branchWhere = user.role === UserRole.SUPER_ADMIN ? {} : { customer: { branchId: user.branchId } };

    const activeReminders = await prisma.reminder.findMany({
      where: {
        ...branchWhere,
        status: { in: [ReminderStatus.SCHEDULED, ReminderStatus.SENT] },
      },
      select: { targetDate: true, channel: true },
    });

    let within7 = 0;
    let within30 = 0;
    let within90 = 0;
    let within180 = 0;
    let expired = 0;

    let dashboardChan = 0;
    let emailChan = 0;
    let whatsappChan = 0;

    for (const r of activeReminders) {
      const { daysLeft } = ReminderCalculator.calculateSeverity(r.targetDate);
      if (daysLeft < 0) expired++;
      else if (daysLeft <= 7) within7++;
      else if (daysLeft <= 30) within30++;
      else if (daysLeft <= 90) within90++;
      else if (daysLeft <= 180) within180++;

      if (r.channel === ReminderChannel.WHATSAPP) whatsappChan++;
      else if (r.channel === ReminderChannel.EMAIL) emailChan++;
      else dashboardChan++;
    }

    return {
      totalActive: activeReminders.length,
      expiringWithin7Days: within7,
      expiringWithin30Days: within30,
      expiringWithin90Days: within90,
      expiringWithin180Days: within180,
      expired,
      pendingByChannel: {
        dashboard: dashboardChan,
        email: emailChan,
        whatsapp: whatsappChan,
      },
    };
  }

  /**
   * Mark reminder as acknowledged by travel consultant
   */
  async acknowledgeReminder(id: string, user: AuthUserContext): Promise<ReminderDto> {
    const reminder = await this.findReminderWithAccess(id, user);

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: ReminderStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      },
      include: {
        customer: {
          select: { id: true, fullName: true, customerNumber: true, branchId: true, primaryPhone: true, whatsappNumber: true },
        },
      },
    });

    await this.logReminderAction('REMINDER_ACKNOWLEDGED', id, user);

    const { daysLeft, severity } = ReminderCalculator.calculateSeverity(updated.targetDate);
    return {
      id: updated.id,
      customerId: updated.customer.id,
      customerName: updated.customer.fullName,
      customerNumber: updated.customer.customerNumber,
      branchId: updated.customer.branchId,
      branchName: 'Branch Office',
      primaryPhone: updated.customer.primaryPhone,
      whatsappNumber: updated.customer.whatsappNumber || undefined,
      type: updated.type as any,
      channel: updated.channel as any,
      title: updated.title,
      message: updated.message,
      targetDate: new Date(updated.targetDate).toISOString().split('T')[0],
      leadDays: updated.leadDays,
      scheduledFor: updated.scheduledFor.toISOString(),
      status: updated.status as any,
      acknowledgedAt: updated.acknowledgedAt?.toISOString(),
      daysUntilTarget: daysLeft,
      severity,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Dismiss a reminder
   */
  async dismissReminder(id: string, user: AuthUserContext): Promise<void> {
    await this.findReminderWithAccess(id, user);

    await prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.DISMISSED },
    });

    await this.logReminderAction('REMINDER_DISMISSED', id, user);
  }

  /**
   * Dispatch notification for reminder (WhatsApp, Email)
   */
  async dispatchReminder(id: string, user: AuthUserContext): Promise<{ success: boolean; dispatchId?: string; error?: string }> {
    const reminder = await this.findReminderWithAccess(id, user);

    if (reminder.channel === ReminderChannel.WHATSAPP) {
      const recipientPhone = reminder.customer.whatsappNumber || reminder.customer.primaryPhone;
      const formatted = WhatsAppNotifier.formatMessage(reminder.customer.fullName, reminder.message);

      const result = await WhatsAppNotifier.dispatch({
        recipientPhone,
        messageText: formatted,
        customerId: reminder.customer.id,
      });

      if (result.success) {
        await prisma.reminder.update({
          where: { id },
          data: { status: ReminderStatus.SENT, sentAt: new Date(), failureReason: null },
        });
        await this.logReminderAction('REMINDER_DISPATCHED_WHATSAPP', id, user);
        return result;
      } else {
        await prisma.reminder.update({
          where: { id },
          data: { status: ReminderStatus.FAILED, failureReason: result.error },
        });
        return result;
      }
    }

    // Default dashboard dispatch
    await prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.SENT, sentAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Verify staff member has access to the customer's branch
   */
  private async findReminderWithAccess(id: string, user: AuthUserContext) {
    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID "${id}" was not found.`);
    }

    if (user.role !== UserRole.SUPER_ADMIN && reminder.customer.branchId !== user.branchId) {
      throw new ForbiddenException('Access denied: You cannot manage reminders belonging to another branch.');
    }

    return reminder;
  }

  private async logReminderAction(action: string, entityId: string, user: AuthUserContext) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.userId || undefined,
          branchId: user.branchId || undefined,
          action,
          entityType: 'REMINDER',
          entityId,
          ipAddress: '127.0.0.1',
        },
      });
    } catch (e: any) {
      this.logger.warn(`Failed to log reminder audit: ${e.message}`);
    }
  }
}
