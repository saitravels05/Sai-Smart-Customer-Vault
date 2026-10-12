export class AssistantSafetyGuard {
  private static readonly INJECTION_PATTERNS = [
    /ignore\s+(?:all\s+)?previous\s+instructions/i,
    /override\s+(?:system|branch|security)\s+(?:rules|filters|prompts)/i,
    /system\s+prompt/i,
    /drop\s+table/i,
    /bypass\s+(?:auth|tenancy|mfa)/i,
    /show\s+all\s+(?:passwords|hashes|tokens|api_keys)/i,
    /act\s+as\s+(?:dan|developer\s+mode|unrestricted)/i,
    /leak\s+(?:all\s+)?records/i,
  ];

  /**
   * Validate user input against prompt injection and malicious jailbreaks
   */
  static validate(prompt: string): { isSafe: boolean; reason?: string } {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return { isSafe: false, reason: 'Empty query submitted.' };
    }

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          reason: 'Request blocked by SAI Security Policy: Suspicious prompt injection pattern detected.',
        };
      }
    }

    return { isSafe: true };
  }

  /**
   * Sanitize text output for sensitive PII
   */
  static sanitizeOutput(text: string): string {
    // Mask 12 digit Aadhaar numbers (e.g. 1234 5678 9012 or 123456789012)
    return text.replace(/\b(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})\b/g, 'XXXX-XXXX-$3');
  }
}
