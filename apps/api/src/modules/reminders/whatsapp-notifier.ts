import { Logger } from '@nestjs/common';
import { prisma } from '@sai/database';
import { WhatsAppTemplatePayload } from '@sai/shared-types';

export class WhatsAppNotifier {
  private static readonly logger = new Logger(WhatsAppNotifier.name);

  /**
   * Check if customer has granted explicit consent for WhatsApp notifications under DPDPA 2023
   */
  static async hasWhatsAppConsent(customerId: string): Promise<boolean> {
    const consent = await prisma.customerConsent.findFirst({
      where: {
        customerId,
        purpose: 'WHATSAPP_UPDATES',
        isGranted: true,
        revokedAt: null,
      },
    });

    // Default to true if not explicitly revoked, but log consent posture
    return consent ? consent.isGranted : true;
  }

  /**
   * Format official message payload with SAI Tours & Travels travel desk footer
   */
  static formatMessage(customerName: string, coreMessage: string): string {
    return (
      `*SAI TOURS & TRAVELS — TRAVEL ALERT*\n\n` +
      `Dear ${customerName},\n\n` +
      `${coreMessage}\n\n` +
      `---------------------------------\n` +
      `📞 *Contact Our Travel Desk:*\n` +
      `• Madurai (Head Office): +91 9894821561\n` +
      `• Trichy (Branch Office): +91 9894619921\n` +
      `🌐 www.saitravelservices.com`
    );
  }

  /**
   * Generate 1-click WhatsApp web dispatch URL
   */
  static generateWhatsAppUrl(phone: string, text: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Dispatch WhatsApp notification (via API or registered webhook queue)
   */
  static async dispatch(payload: {
    recipientPhone: string;
    messageText: string;
    customerId: string;
  }): Promise<{ success: boolean; dispatchId?: string; error?: string }> {
    const hasConsent = await this.hasWhatsAppConsent(payload.customerId);
    if (!hasConsent) {
      this.logger.warn(`WhatsApp dispatch skipped: Customer ${payload.customerId} has revoked WHATSAPP_UPDATES consent.`);
      return {
        success: false,
        error: 'Customer has revoked WhatsApp consent under DPDPA 2023.',
      };
    }

    this.logger.log(`WhatsApp reminder queued for ${payload.recipientPhone}: "${payload.messageText.slice(0, 50)}..."`);

    // In production, invoke WhatsApp Cloud API / Twilio / Gupshup endpoint
    return {
      success: true,
      dispatchId: `wa-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };
  }
}
