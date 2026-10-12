import { ReminderType, ReminderChannel, ReminderStatus } from './enums.js';

export type ReminderSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'EXPIRED';

export interface ReminderDto {
  id: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  branchId: string;
  branchName: string;
  primaryPhone: string;
  whatsappNumber?: string;
  type: ReminderType;
  channel: ReminderChannel;
  title: string;
  message: string;
  targetDate: string;
  leadDays: number;
  scheduledFor: string;
  status: ReminderStatus;
  sentAt?: string;
  acknowledgedAt?: string;
  failureReason?: string;
  daysUntilTarget: number;
  severity: ReminderSeverity;
  createdAt: string;
}

export interface CreateReminderDto {
  customerId: string;
  type: ReminderType;
  channel?: ReminderChannel;
  title: string;
  message: string;
  targetDate: string;
  leadDays: number;
  scheduledFor?: string;
}

export interface ReminderScanReportDto {
  scannedCount: number;
  createdCount: number;
  dispatchedCount: number;
  skippedDuplicatesCount: number;
  executionTimeMs: number;
}

export interface ReminderStatsDto {
  totalActive: number;
  expiringWithin7Days: number;
  expiringWithin30Days: number;
  expiringWithin90Days: number;
  expiringWithin180Days: number;
  expired: number;
  pendingByChannel: {
    dashboard: number;
    email: number;
    whatsapp: number;
  };
}

export interface WhatsAppTemplatePayload {
  templateName: string;
  recipientPhone: string;
  languageCode: 'en' | 'ta';
  variables: Record<string, string>;
}
