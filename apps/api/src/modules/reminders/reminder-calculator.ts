import { ReminderType, ReminderSeverity } from '@sai/shared-types';

export class ReminderCalculator {
  static readonly STANDARD_LEAD_DAYS = [180, 90, 60, 30, 7, 1];

  /**
   * Calculate severity based on days remaining until target date
   */
  static calculateSeverity(targetDate: Date): { daysLeft: number; severity: ReminderSeverity } {
    const now = new Date();
    // Normalize to date boundaries
    const targetTime = new Date(targetDate).setHours(0, 0, 0, 0);
    const nowTime = new Date(now).setHours(0, 0, 0, 0);

    const diffMs = targetTime - nowTime;
    const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { daysLeft, severity: 'EXPIRED' };
    }
    if (daysLeft <= 7) {
      return { daysLeft, severity: 'CRITICAL' };
    }
    if (daysLeft <= 30) {
      return { daysLeft, severity: 'HIGH' };
    }
    if (daysLeft <= 90) {
      return { daysLeft, severity: 'MEDIUM' };
    }
    return { daysLeft, severity: 'LOW' };
  }

  /**
   * Determine matching lead day interval from days remaining
   */
  static matchLeadDay(daysLeft: number): number | null {
    if (daysLeft < 0) return 0;
    for (const lead of this.STANDARD_LEAD_DAYS) {
      // Trigger if days remaining is within a 2-day window of the milestone
      if (daysLeft <= lead && daysLeft > lead - 3) {
        return lead;
      }
    }
    return null;
  }

  /**
   * Generate standardized reminder copy for travel operations
   */
  static generateMessage(
    type: ReminderType,
    customerName: string,
    targetDate: Date,
    daysLeft: number,
    metadata?: Record<string, any>,
  ): { title: string; message: string } {
    const formattedDate = new Date(targetDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    switch (type) {
      case ReminderType.PASSPORT_EXPIRY:
        return {
          title: `Passport Renewal Alert — ${customerName}`,
          message:
            daysLeft < 0
              ? `Dear ${customerName}, your passport expired on ${formattedDate}. Urgent renewal is required for any domestic or international travel.`
              : daysLeft <= 180
              ? `Dear ${customerName}, your passport expires in ${daysLeft} days (${formattedDate}). International travel requires at least 6 months passport validity. Please contact SAI Tours & Travels (Madurai: +91 9894821561 / Trichy: +91 9894619921) to begin your passport renewal.`
              : `Passport renewal reminder for ${customerName}. Expiry date: ${formattedDate}.`,
        };

      case ReminderType.VISA_EXPIRY:
        const country = metadata?.country || 'Destination';
        const visaType = metadata?.visaType || 'Tourist';
        return {
          title: `${country} Visa Expiry Alert — ${customerName}`,
          message:
            daysLeft < 0
              ? `Your ${country} ${visaType} visa expired on ${formattedDate}. If you are currently abroad or planning travel, please consult SAI Tours & Travels immediately.`
              : `Your ${country} ${visaType} visa will expire in ${daysLeft} days on ${formattedDate}. Contact SAI Tours & Travels if you require a visa extension or re-application.`,
        };

      case ReminderType.TRAVEL_INSURANCE_EXPIRY:
        return {
          title: `Travel Insurance Expiry — ${customerName}`,
          message: `Your travel insurance policy expires on ${formattedDate}. Ensure you have active coverage for upcoming trips.`,
        };

      case ReminderType.UPCOMING_FLIGHT_DEPARTURE:
        const route = metadata?.route || 'Scheduled Flight';
        const carrier = metadata?.carrier || 'Flight';
        return {
          title: `Upcoming Flight Departure — ${carrier} (${route})`,
          message: `Dear ${customerName}, your flight ${carrier} (${route}) is scheduled to depart on ${formattedDate}. Please complete web check-in 24 hours prior to departure.`,
        };

      case ReminderType.HOTEL_CHECKIN:
        return {
          title: `Hotel Check-in Reminder — ${customerName}`,
          message: `Upcoming hotel booking check-in on ${formattedDate}. Please keep your hotel voucher and identification ready.`,
        };

      default:
        return {
          title: `Document Renewal Alert — ${customerName}`,
          message: `Reminder for ${customerName}: Document validity milestone on ${formattedDate}.`,
        };
    }
  }
}
