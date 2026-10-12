import { SearchIntent, SearchIntentType, DetectedEntities, DocumentType } from '@sai/shared-types';

export class SearchIntentParser {
  /**
   * Parse natural language search queries into structured intent and entities
   */
  static parse(query: string): SearchIntent {
    const q = query.trim();
    const qLower = q.toLowerCase();

    const entities: DetectedEntities = {};
    let intentType: SearchIntentType = 'GENERAL';
    const suggestions: string[] = [];

    // 1. Phone number detection
    const phoneMatch = q.match(/(\+?\d{1,3}[-.\s]?)?(\d{10})/);
    if (phoneMatch) {
      entities.phone = phoneMatch[2];
      intentType = 'CUSTOMER';
      suggestions.push(`Phone number: ${entities.phone}`);
    }

    // 2. Customer ID detection (e.g. SAI-2026-0001 or SAI20260001)
    const custIdMatch = q.match(/SAI[-_]?\d{4}[-_]?\d{4}/i);
    if (custIdMatch) {
      entities.customerNumber = custIdMatch[0].toUpperCase();
      intentType = 'CUSTOMER';
      suggestions.push(`Customer Number: ${entities.customerNumber}`);
    }

    // 3. Passport number format (e.g. A1234567, L898902C3 - 1 letter + 7-8 digits/alphanumeric)
    const passportMatch = q.match(/\b([A-Z][0-9]{7,8})\b/i);
    if (passportMatch && !custIdMatch) {
      entities.passportNumber = passportMatch[1].toUpperCase();
      suggestions.push(`Passport number: ${entities.passportNumber}`);
    }

    // 4. Branch detection (Madurai vs Trichy)
    if (qLower.includes('madurai') || qLower.includes('ho') || qLower.includes('head office')) {
      entities.branchName = 'Madurai';
      suggestions.push('Branch: Madurai HO');
    } else if (qLower.includes('trichy') || qLower.includes('tiruchirappalli') || qLower.includes('branch office')) {
      entities.branchName = 'Trichy';
      suggestions.push('Branch: Trichy BO');
    }

    // 5. Expiry days detection (e.g. "expire within 90 days", "in 30 days", "expiring in 6 months")
    const daysMatch = qLower.match(/expir\w*\s+(?:within|in|under)?\s*(\d+)\s*(?:days?|d)/i);
    const monthsMatch = qLower.match(/expir\w*\s+(?:within|in|under)?\s*(\d+)\s*(?:months?|m)/i);

    if (daysMatch) {
      entities.expiryDays = parseInt(daysMatch[1], 10);
      intentType = 'PASSPORT_EXPIRY';
      suggestions.push(`Expiring within ${entities.expiryDays} days`);
    } else if (monthsMatch) {
      entities.expiryDays = parseInt(monthsMatch[1], 10) * 30;
      intentType = 'PASSPORT_EXPIRY';
      suggestions.push(`Expiring within ${monthsMatch[1]} months (~${entities.expiryDays} days)`);
    } else if (qLower.includes('expire') || qLower.includes('expiry') || qLower.includes('renewal')) {
      // Default to 180 days (6 months standard international rule)
      entities.expiryDays = 180;
      intentType = 'PASSPORT_EXPIRY';
      suggestions.push('Expiring within 180 days (6-month rule)');
    }

    // 6. Destination detection (popular travel destinations for SAI Tours & Travels)
    const destinations = [
      'singapore', 'malaysia', 'dubai', 'uae', 'thailand', 'saudi arabia', 'oman',
      'qatar', 'kuwait', 'bahrain', 'uk', 'london', 'united kingdom', 'usa', 'united states',
      'canada', 'australia', 'schengen', 'france', 'germany', 'sri lanka', 'bali', 'indonesia', 'vietnam'
    ];

    for (const dest of destinations) {
      if (qLower.includes(dest)) {
        entities.destination = dest.charAt(0).toUpperCase() + dest.slice(1);
        suggestions.push(`Destination: ${entities.destination}`);
        if (intentType === 'GENERAL') {
          intentType = 'VISA_DESTINATION';
        }
        break;
      }
    }

    // 7. Document type detection
    if (qLower.includes('passport') && !qLower.includes('ticket')) {
      entities.documentType = DocumentType.PASSPORT;
      suggestions.push('Document Type: Passport');
      if (intentType === 'GENERAL') intentType = 'DOCUMENT';
    } else if (qLower.includes('visa')) {
      entities.documentType = DocumentType.VISA_COPY;
      suggestions.push('Document Type: Visa');
      if (intentType === 'GENERAL') intentType = 'VISA_DESTINATION';
    } else if (qLower.includes('ticket') || qLower.includes('flight') || qLower.includes('boarding pass')) {
      entities.documentType = DocumentType.FLIGHT_TICKET;
      suggestions.push('Document Type: Flight Ticket');
      intentType = 'FLIGHT_BOOKING';
    } else if (qLower.includes('aadhaar') || qLower.includes('aadhar')) {
      entities.documentType = DocumentType.AADHAAR_MASKED;
      suggestions.push('Document Type: Aadhaar Card');
      if (intentType === 'GENERAL') intentType = 'DOCUMENT';
    } else if (qLower.includes('insurance')) {
      entities.documentType = DocumentType.TRAVEL_INSURANCE;
      suggestions.push('Document Type: Travel Insurance');
      if (intentType === 'GENERAL') intentType = 'DOCUMENT';
    }

    // 8. Date ranges (e.g., "yesterday", "last month", "today")
    const now = new Date();
    if (qLower.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
      entities.dateRange = { from: startOfDay, to: endOfDay };
      intentType = 'RECENT_UPLOADS';
      suggestions.push('Uploaded: Yesterday');
    } else if (qLower.includes('today')) {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      entities.dateRange = { from: startOfDay };
      intentType = 'RECENT_UPLOADS';
      suggestions.push('Uploaded: Today');
    } else if (qLower.includes('last month')) {
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
      entities.dateRange = { from: firstDayPrevMonth, to: lastDayPrevMonth };
      suggestions.push('Date range: Last month');
    }

    // 9. Customer name heuristic (e.g. "customer Kumar", "for customer Kumar", "for Priya")
    const nameMatch = q.match(/(?:(?:for\s+)?(?:customer|client|passenger)|for|named)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (nameMatch) {
      let extractedName = nameMatch[1].trim();
      extractedName = extractedName.replace(/^(?:customer|client|passenger)\s+/i, '').trim();
      entities.customerName = extractedName;
      suggestions.push(`Customer Name: ${entities.customerName}`);
      if (intentType === 'GENERAL') intentType = 'CUSTOMER';
    } else if (intentType === 'GENERAL' && !phoneMatch && !custIdMatch && q.length > 2) {
      // If no specific keyword matched, treat query as potential customer name search
      const cleaned = q.replace(/(find|show|search|documents?|for|of|all|the)\b/gi, '').trim();
      if (cleaned.length > 1) {
        entities.customerName = cleaned;
        suggestions.push(`Name / Keyword: ${cleaned}`);
      }
    }

    return {
      intentType,
      detectedEntities: entities,
      suggestedFilterSummary: suggestions.length > 0 ? suggestions.join(' • ') : 'Natural query search',
    };
  }
}
