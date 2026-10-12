import { PassportMrzExtraction, MrzChecksumDetails } from '@sai/shared-types';

export class IcaoMrzParser {
  private static readonly WEIGHTS = [7, 3, 1];

  /**
   * Character mapping according to ICAO Doc 9303:
   * '0'-'9' -> 0-9
   * 'A'-'Z' -> 10-35
   * '<'     -> 0
   */
  public static getCharValue(char: string): number {
    const code = char.toUpperCase().charCodeAt(0);
    if (code >= 48 && code <= 57) {
      return code - 48; // '0'-'9'
    }
    if (code >= 65 && code <= 90) {
      return code - 55; // 'A'-'Z' (A=10, B=11 ... Z=35)
    }
    return 0; // '<' or any other filler
  }

  /**
   * Compute ICAO 9303 check digit for given input string
   */
  public static calculateCheckDigit(input: string): number {
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      const charVal = this.getCharValue(input[i]);
      const weight = this.WEIGHTS[i % 3];
      sum += charVal * weight;
    }
    return sum % 10;
  }

  /**
   * Convert YYMMDD string to ISO YYYY-MM-DD date
   */
  public static parseMrzDate(yymmdd: string, isExpiry = false): string {
    if (!yymmdd || yymmdd.length !== 6 || yymmdd.includes('<')) {
      return '';
    }
    const yy = parseInt(yymmdd.slice(0, 2), 10);
    const mm = yymmdd.slice(2, 4);
    const dd = yymmdd.slice(4, 6);

    const currentYearTwoDigits = new Date().getFullYear() % 100;
    let fullYear: number;

    if (isExpiry) {
      // Passports typically expire in the future or recent past (2000+)
      fullYear = yy >= 0 && yy <= 99 ? 2000 + yy : 1900 + yy;
    } else {
      // Birth date: if YY is greater than current YY, it's 1900s, else 2000s
      fullYear = yy > currentYearTwoDigits ? 1900 + yy : 2000 + yy;
    }

    return `${fullYear}-${mm}-${dd}`;
  }

  /**
   * Parse TD3 (Passport) MRZ (Two 44-character lines)
   */
  public static parseTd3(line1: string, line2: string): PassportMrzExtraction {
    const cleanL1 = line1.trim().padEnd(44, '<').slice(0, 44);
    const cleanL2 = line2.trim().padEnd(44, '<').slice(0, 44);

    // Line 1:
    // Pos 0-1: Document Code ('P<')
    const documentCode = cleanL1.slice(0, 2).replace(/</g, '');
    // Pos 2-4: Issuing Country
    const issuingCountry = cleanL1.slice(2, 5).replace(/</g, '');
    // Pos 5-43: Names (Surname<<Given<Names)
    const rawNames = cleanL1.slice(5, 44);
    const nameParts = rawNames.split('<<');
    const surname = (nameParts[0] || '').replace(/</g, ' ').trim();
    const givenNames = (nameParts[1] || '').replace(/</g, ' ').trim();

    // Line 2:
    // Pos 0-8: Passport Number
    const rawPassportNumber = cleanL2.slice(0, 9);
    const passportNumber = rawPassportNumber.replace(/</g, '');
    const passportNumberCheckDigit = cleanL2[9];

    // Pos 10-12: Nationality
    const nationality = cleanL2.slice(10, 13).replace(/</g, '');

    // Pos 13-18: Date of Birth
    const rawDob = cleanL2.slice(13, 19);
    const dobCheckDigit = cleanL2[19];
    const dateOfBirth = this.parseMrzDate(rawDob, false);

    // Pos 20: Sex ('M', 'F', 'X', '<')
    let sex: 'M' | 'F' | 'X' | '<' = '<';
    const rawSex = cleanL2[20];
    if (rawSex === 'M' || rawSex === 'F' || rawSex === 'X') {
      sex = rawSex;
    }

    // Pos 21-26: Expiry Date
    const rawExpiry = cleanL2.slice(21, 27);
    const expiryCheckDigit = cleanL2[27];
    const expiryDate = this.parseMrzDate(rawExpiry, true);

    // Pos 28-41: Personal / Optional Number
    const rawOptional = cleanL2.slice(28, 42);
    const optionalCheckDigit = cleanL2[42];

    // Pos 43: Composite Check Digit
    const compositeCheckDigit = cleanL2[43];

    // Calculate Check Digits:
    const calcPassportCheck = this.calculateCheckDigit(rawPassportNumber).toString();
    const calcDobCheck = this.calculateCheckDigit(rawDob).toString();
    const calcExpiryCheck = this.calculateCheckDigit(rawExpiry).toString();

    // Composite string per ICAO Doc 9303:
    // passportNumber + checkDigit + dob + dobCheck + expiry + expiryCheck + optional + optionalCheck
    const compositeData =
      cleanL2.slice(0, 10) + cleanL2.slice(13, 20) + cleanL2.slice(21, 43);
    const calcCompositeCheck = this.calculateCheckDigit(compositeData).toString();

    const checksumDetails: MrzChecksumDetails = {
      passportNumberValid: calcPassportCheck === passportNumberCheckDigit,
      dobValid: calcDobCheck === dobCheckDigit,
      expiryValid: calcExpiryCheck === expiryCheckDigit,
      compositeValid: calcCompositeCheck === compositeCheckDigit,
    };

    const isCheckDigitValid =
      checksumDetails.passportNumberValid &&
      checksumDetails.dobValid &&
      checksumDetails.expiryValid &&
      checksumDetails.compositeValid;

    // Field confidence mapping
    const fieldConfidence: Record<string, 'HIGH' | 'MEDIUM' | 'LOW'> = {
      passportNumber: checksumDetails.passportNumberValid ? 'HIGH' : 'LOW',
      dateOfBirth: checksumDetails.dobValid ? 'HIGH' : 'LOW',
      expiryDate: checksumDetails.expiryValid ? 'HIGH' : 'LOW',
      surname: surname.length > 0 ? 'HIGH' : 'MEDIUM',
      givenNames: givenNames.length > 0 ? 'HIGH' : 'MEDIUM',
      nationality: nationality.length === 3 ? 'HIGH' : 'LOW',
      issuingCountry: issuingCountry.length === 3 ? 'HIGH' : 'LOW',
    };

    const validCount = Object.values(checksumDetails).filter(Boolean).length;
    const confidence = parseFloat((0.6 + (validCount / 4) * 0.4).toFixed(2));

    return {
      documentCode,
      issuingCountry,
      surname,
      givenNames,
      passportNumber,
      passportNumberCheckDigit,
      nationality,
      dateOfBirth,
      dobCheckDigit,
      sex,
      expiryDate,
      expiryCheckDigit,
      compositeCheckDigit,
      rawLine1: cleanL1,
      rawLine2: cleanL2,
      isCheckDigitValid,
      checksumDetails,
      confidence,
      fieldConfidence,
    };
  }
}
