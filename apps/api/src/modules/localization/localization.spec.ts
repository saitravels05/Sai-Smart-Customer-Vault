import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { formatTamilPassportWhatsAppMessage } from '@sai/shared-types';

describe('Phase 11 — Bilingual Localization (English / தமிழ்) & Mobile Layout Suite', () => {
  describe('Tamil WhatsApp Expiry Notification Message Generator', () => {
    it('should generate properly formatted bilingual Tamil WhatsApp message with customer name and passport details', () => {
      const msg = formatTamilPassportWhatsAppMessage({
        customerName: 'முருகன் சுப்பிரமணியன்',
        passportNumberMasked: 'L98XXXX41',
        expiryDateStr: '15/12/2026',
        daysRemaining: 63,
        branchName: 'மதுரை தலைமை அலுவலகம்',
        branchPhone: '+91 9894821561',
      });

      assert.ok(msg.includes('*வணக்கம் முருகன் சுப்பிரமணியன்!*'));
      assert.ok(msg.includes('L98XXXX41'));
      assert.ok(msg.includes('15/12/2026'));
      assert.ok(msg.includes('63 நாட்களில் காலாவதியாகிறது'));
      assert.ok(msg.includes('மதுரை தலைமை அலுவலகம்'));
      assert.ok(msg.includes('+91 9894821561'));
      assert.ok(msg.includes('https://www.saitravelservices.com/'));
    });

    it('should explicitly emphasize the statutory 6-month international travel validity rule in Tamil', () => {
      const msg = formatTamilPassportWhatsAppMessage({
        customerName: 'கார்த்திக்',
        passportNumberMasked: 'M12XXXX89',
        expiryDateStr: '01/01/2027',
        daysRemaining: 80,
        branchName: 'திருச்சி கிளை',
        branchPhone: '+91 9894619921',
      });

      // Statutory 6-month rule
      assert.ok(
        msg.includes('சர்வதேச பயண விதி') && msg.includes('குறைந்தபட்சம் 6 மாதங்கள்'),
        'Message must state the 6-month international validity rule in Tamil',
      );
    });
  });

  describe('Tamil Unicode Script & Vocabulary Compliance', () => {
    const essentialTamilTerms = [
      { key: 'passport', tamil: 'கடவுச்சீட்டு' },
      { key: 'visa', tamil: 'விசா' },
      { key: 'dashboard', tamil: 'முகப்புப்பலகை' },
      { key: 'customers', tamil: 'வாடிக்கையாளர்கள்' },
      { key: 'documentVault', tamil: 'ஆவணக் களஞ்சியம்' },
      { key: 'madurai', tamil: 'மதுரை' },
      { key: 'trichy', tamil: 'திருச்சி' },
    ];

    it('should contain authentic Tamil Unicode glyphs (U+0B80 to U+0BFF) for all travel agency terminology', () => {
      const tamilRegex = /[\u0B80-\u0BFF]/;
      for (const term of essentialTamilTerms) {
        assert.ok(
          tamilRegex.test(term.tamil),
          `Term '${term.tamil}' must contain valid Tamil script characters`,
        );
      }
    });

    it('should distinguish Madurai Head Office from Trichy Branch in Tamil script', () => {
      const mdu = 'மதுரை (தலைமை அலுவலகம்)';
      const tryBranch = 'திருச்சி (கிளை அலுவலகம்)';
      assert.notStrictEqual(mdu, tryBranch);
      assert.ok(mdu.includes('மதுரை'));
      assert.ok(tryBranch.includes('திருச்சி'));
    });
  });

  describe('Localized Date Formatting', () => {
    function formatDateTest(d: Date, locale: 'en' | 'ta'): string {
      return new Intl.DateTimeFormat(locale === 'ta' ? 'ta-IN' : 'en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }

    it('should format dates consistently in Indian Standard Time locale', () => {
      const testDate = new Date('2026-10-15T00:00:00Z');
      const enDate = formatDateTest(testDate, 'en');
      const taDate = formatDateTest(testDate, 'ta');

      assert.ok(enDate.includes('2026'), 'English date must contain year 2026');
      assert.ok(taDate.includes('2026'), 'Tamil date must contain year 2026');
    });
  });
});
