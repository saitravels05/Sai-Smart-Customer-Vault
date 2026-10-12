import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { ReminderCalculator } from './reminder-calculator';
import { WhatsAppNotifier } from './whatsapp-notifier';
import { ReminderType, ReminderChannel, UserRole } from '@sai/shared-types';

describe('Phase 8 — Smart Expiry Reminder & Automated Notifications Suite', () => {
  describe('Expiry Thresholds and Severity Calculation', () => {
    it('should classify passport expiring in 180 days as LOW severity', () => {
      const target = new Date();
      target.setDate(target.getDate() + 180);

      const { daysLeft, severity } = ReminderCalculator.calculateSeverity(target);
      assert.strictEqual(severity, 'LOW');
      assert.ok(daysLeft >= 179 && daysLeft <= 181);
    });

    it('should classify visa expiring in 30 days as HIGH severity', () => {
      const target = new Date();
      target.setDate(target.getDate() + 25);

      const { daysLeft, severity } = ReminderCalculator.calculateSeverity(target);
      assert.strictEqual(severity, 'HIGH');
      assert.ok(daysLeft >= 24 && daysLeft <= 26);
    });

    it('should classify flight departing in 3 days as CRITICAL severity', () => {
      const target = new Date();
      target.setDate(target.getDate() + 3);

      const { daysLeft, severity } = ReminderCalculator.calculateSeverity(target);
      assert.strictEqual(severity, 'CRITICAL');
      assert.ok(daysLeft >= 2 && daysLeft <= 4);
    });

    it('should classify past date as EXPIRED', () => {
      const target = new Date();
      target.setDate(target.getDate() - 5);

      const { daysLeft, severity } = ReminderCalculator.calculateSeverity(target);
      assert.strictEqual(severity, 'EXPIRED');
      assert.ok(daysLeft < 0);
    });
  });

  describe('Milestone Lead-Day Matching', () => {
    it('should match standard 180, 90, 60, 30, 7, 1 lead intervals', () => {
      assert.strictEqual(ReminderCalculator.matchLeadDay(180), 180);
      assert.strictEqual(ReminderCalculator.matchLeadDay(89), 90);
      assert.strictEqual(ReminderCalculator.matchLeadDay(30), 30);
      assert.strictEqual(ReminderCalculator.matchLeadDay(7), 7);
      assert.strictEqual(ReminderCalculator.matchLeadDay(1), 1);
    });
  });

  describe('Travel Desk Message Generation', () => {
    it('should generate passport message with 6-month validity rule and branch contacts', () => {
      const target = new Date();
      target.setDate(target.getDate() + 120);

      const { title, message } = ReminderCalculator.generateMessage(
        ReminderType.PASSPORT_EXPIRY,
        'Kumar S',
        target,
        120,
      );

      assert.ok(title.includes('Passport Renewal Alert'));
      assert.ok(message.includes('6 months passport validity'));
      assert.ok(message.includes('+91 9894821561'));
      assert.ok(message.includes('+91 9894619921'));
    });

    it('should generate visa message with country and visa type', () => {
      const target = new Date();
      target.setDate(target.getDate() + 15);

      const { title, message } = ReminderCalculator.generateMessage(
        ReminderType.VISA_EXPIRY,
        'Priya R',
        target,
        15,
        { country: 'Singapore', visaType: 'Tourist eVisa' },
      );

      assert.ok(title.includes('Singapore Visa Expiry Alert'));
      assert.ok(message.includes('Singapore'));
      assert.ok(message.includes('Tourist eVisa'));
    });

    it('should generate flight departure alert with carrier and check-in prompt', () => {
      const target = new Date();
      target.setDate(target.getDate() + 1);

      const { title, message } = ReminderCalculator.generateMessage(
        ReminderType.UPCOMING_FLIGHT_DEPARTURE,
        'Ramesh M',
        target,
        1,
        { carrier: 'Air India Express', route: 'TRZ -> SIN' },
      );

      assert.ok(title.includes('Upcoming Flight Departure'));
      assert.ok(message.includes('Air India Express'));
      assert.ok(message.includes('web check-in'));
    });
  });

  describe('WhatsApp Notification Formatting & Dispatch URL', () => {
    it('should format WhatsApp message with SAI branding header and footer', () => {
      const formatted = WhatsAppNotifier.formatMessage('Kumar S', 'Your passport expires soon.');
      assert.ok(formatted.includes('*SAI TOURS & TRAVELS — TRAVEL ALERT*'));
      assert.ok(formatted.includes('Madurai (Head Office): +91 9894821561'));
      assert.ok(formatted.includes('Trichy (Branch Office): +91 9894619921'));
      assert.ok(formatted.includes('www.saitravelservices.com'));
    });

    it('should generate valid wa.me URI with URL encoded text', () => {
      const url = WhatsAppNotifier.generateWhatsAppUrl('9894821561', 'Hello Kumar');
      assert.strictEqual(url.startsWith('https://wa.me/919894821561?text='), true);
      assert.ok(url.includes('Hello%20Kumar'));
    });
  });
});
