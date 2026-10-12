import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { IcaoMrzParser } from './mrz/icao-mrz-parser';
import { encryptField, decryptField, hashField, maskIdentifier } from '@sai/database';

describe('Phase 6 — AI Document Intelligence & ICAO 9303 MRZ Engine', () => {
  describe('ICAO 9303 Check Digit Algorithm', () => {
    it('should correctly calculate ICAO 9303 check digits with 7-3-1 weighting', () => {
      // Standard test sample: "L898902C<" with check digit 3
      const checkDigit = IcaoMrzParser.calculateCheckDigit('L898902C<');
      assert.strictEqual(checkDigit, 3);
    });

    it('should map filler "<" to zero value and letters to 10-35', () => {
      assert.strictEqual(IcaoMrzParser.getCharValue('<'), 0);
      assert.strictEqual(IcaoMrzParser.getCharValue('0'), 0);
      assert.strictEqual(IcaoMrzParser.getCharValue('9'), 9);
      assert.strictEqual(IcaoMrzParser.getCharValue('A'), 10);
      assert.strictEqual(IcaoMrzParser.getCharValue('Z'), 35);
    });

    it('should format YYMMDD dates into clean ISO YYYY-MM-DD', () => {
      const birthDate = IcaoMrzParser.parseMrzDate('850520', false);
      assert.strictEqual(birthDate, '1985-05-20');

      const expiryDate = IcaoMrzParser.parseMrzDate('281015', true);
      assert.strictEqual(expiryDate, '2028-10-15');
    });
  });

  describe('ICAO Doc 9303 TD3 Passport Full MRZ Extraction', () => {
    it('should extract and mathematically validate official ICAO TD3 passport MRZ', () => {
      // Official ICAO Doc 9303 Part 4 test vector
      const line1 = 'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<';
      const line2 = 'L898902C36UTO7408122F1204159ZE184226B<<<<<10';

      const result = IcaoMrzParser.parseTd3(line1, line2);

      assert.strictEqual(result.documentCode, 'P');
      assert.strictEqual(result.issuingCountry, 'UTO');
      assert.strictEqual(result.surname, 'ERIKSSON');
      assert.strictEqual(result.givenNames, 'ANNA MARIA');
      assert.strictEqual(result.passportNumber, 'L898902C3');
      assert.strictEqual(result.passportNumberCheckDigit, '6');
      assert.strictEqual(result.nationality, 'UTO');
      assert.strictEqual(result.dateOfBirth, '1974-08-12');
      assert.strictEqual(result.sex, 'F');
      assert.strictEqual(result.expiryDate, '2012-04-15');
      assert.strictEqual(result.isCheckDigitValid, true);

      // Verify all individual check digits
      assert.ok(result.checksumDetails?.passportNumberValid);
      assert.ok(result.checksumDetails?.dobValid);
      assert.ok(result.checksumDetails?.expiryValid);
      assert.ok(result.checksumDetails?.compositeValid);
      assert.ok(result.confidence >= 0.9);
    });

    it('should parse Indian Passport MRZ test vector correctly', () => {
      // Indian Passport (IND) TD3 sample
      const line1 = 'P<INDKUMAR<<RAMESH<<<<<<<<<<<<<<<<<<<<<<<<<<';
      const passportField = 'Z1234567<';
      const passCheck = IcaoMrzParser.calculateCheckDigit(passportField); // 1
      const dobField = '850520';
      const dobCheck = IcaoMrzParser.calculateCheckDigit(dobField); // 2
      const expField = '281015';
      const expCheck = IcaoMrzParser.calculateCheckDigit(expField); // 7
      const optional = '<<<<<<<<<<<<<<0'; // 15 chars
      const compositeData = `${passportField}${passCheck}${dobField}${dobCheck}M${expField}${expCheck}${optional}`;
      const compositeCheck = IcaoMrzParser.calculateCheckDigit(
        `${passportField}${passCheck}${dobField}${dobCheck}${expField}${expCheck}${optional}`,
      );

      const line2 = `${passportField}${passCheck}IND${dobField}${dobCheck}M${expField}${expCheck}${optional}${compositeCheck}`;

      const result = IcaoMrzParser.parseTd3(line1, line2);

      assert.strictEqual(result.issuingCountry, 'IND');
      assert.strictEqual(result.nationality, 'IND');
      assert.strictEqual(result.surname, 'KUMAR');
      assert.strictEqual(result.givenNames, 'RAMESH');
      assert.strictEqual(result.passportNumber, 'Z1234567');
      assert.strictEqual(result.sex, 'M');
      assert.strictEqual(result.dateOfBirth, '1985-05-20');
      assert.strictEqual(result.expiryDate, '2028-10-15');
      assert.ok(result.checksumDetails?.passportNumberValid);
      assert.ok(result.checksumDetails?.dobValid);
      assert.ok(result.checksumDetails?.expiryValid);
      assert.ok(result.isCheckDigitValid);
    });

    it('should flag checksum failure when MRZ data is forged or corrupted', () => {
      // Tampered passport number: change 'L898902C' to 'L898902X' without updating check digit
      const line1 = 'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<';
      const line2 = 'L898902X<3UTO7408122F1204159ZE184226B<<<<<10';

      const result = IcaoMrzParser.parseTd3(line1, line2);

      assert.strictEqual(result.isCheckDigitValid, false);
      assert.strictEqual(result.checksumDetails?.passportNumberValid, false);
      assert.strictEqual(result.fieldConfidence?.passportNumber, 'LOW');
    });
  });

  describe('Human-in-the-Loop Auto-Population & Security Transformation', () => {
    it('should encrypt passport number with AES-256-GCM and generate search hash', () => {
      const verifiedPassport = 'Z1234567';
      const encrypted = encryptField(verifiedPassport);
      const hash = hashField(verifiedPassport);
      const masked = maskIdentifier(verifiedPassport, 'PASSPORT');

      assert.ok(encrypted.length >= 64);
      assert.strictEqual(decryptField(encrypted), verifiedPassport);
      assert.strictEqual(hash.length, 64);
      assert.strictEqual(masked, 'Z1***67');
    });

    it('should enforce UIDAI compliant masking for Aadhaar card extraction', () => {
      const fullAadhaar = '987654321098';
      const masked = maskIdentifier(fullAadhaar, 'AADHAAR');
      assert.strictEqual(masked, 'XXXX-XXXX-1098');
    });
  });
});
