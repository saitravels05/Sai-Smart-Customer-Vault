import { z } from 'zod';
import { AIJobStatus } from './enums.js';

export const mrzChecksumDetailsSchema = z.object({
  passportNumberValid: z.boolean(),
  dobValid: z.boolean(),
  expiryValid: z.boolean(),
  compositeValid: z.boolean(),
});

export type MrzChecksumDetails = z.infer<typeof mrzChecksumDetailsSchema>;

export const passportMrzExtractionSchema = z.object({
  documentCode: z.string().default('P'),
  issuingCountry: z.string().default('IND'),
  surname: z.string().min(1),
  givenNames: z.string().min(1),
  passportNumber: z.string().min(6).max(12),
  passportNumberCheckDigit: z.string().length(1),
  nationality: z.string().min(2),
  dateOfBirth: z.string(), // ISO YYYY-MM-DD or YYMMDD
  dobCheckDigit: z.string().length(1),
  sex: z.enum(['M', 'F', '<', 'X']),
  expiryDate: z.string(), // ISO YYYY-MM-DD or YYMMDD
  expiryCheckDigit: z.string().length(1),
  compositeCheckDigit: z.string().length(1),
  rawLine1: z.string().length(44),
  rawLine2: z.string().length(44),
  isCheckDigitValid: z.boolean(),
  checksumDetails: mrzChecksumDetailsSchema.optional(),

  // Back page & metadata
  placeOfBirth: z.string().optional().nullable(),
  placeOfIssue: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  spouseName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  oldPassportNumber: z.string().optional().nullable(),
  fileNumber: z.string().optional().nullable(),

  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
});

export type PassportMrzExtraction = z.infer<typeof passportMrzExtractionSchema>;

export const flightTicketExtractionSchema = z.object({
  passengerName: z.string().min(2),
  airline: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
  pnr: z.string().optional().nullable(),
  originAirport: z.string().max(10).optional().nullable(),
  destAirport: z.string().max(10).optional().nullable(),
  departureDateTime: z.string().optional().nullable(),
  arrivalDateTime: z.string().optional().nullable(),
  cabinClass: z.string().optional().nullable(),
  seatNumber: z.string().optional().nullable(),
  baggageAllowance: z.string().optional().nullable(),
  ticketNumber: z.string().optional().nullable(),
  fareAmount: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
});

export type FlightTicketExtraction = z.infer<typeof flightTicketExtractionSchema>;

export const visaExtractionSchema = z.object({
  applicantName: z.string().min(2),
  country: z.string().min(2),
  visaCategory: z.string().default('TOURIST'),
  visaNumber: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().min(1),
  durationOfStayDays: z.number().int().optional().nullable(),
  entriesPermitted: z.enum(['SINGLE', 'MULTIPLE', 'DOUBLE']).default('SINGLE'),
  remarks: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
});

export type VisaExtraction = z.infer<typeof visaExtractionSchema>;

export const aadhaarExtractionSchema = z.object({
  name: z.string().min(2),
  maskedAadhaar: z.string().regex(/^XXXX-XXXX-\d{4}$/, 'Must be statutory masked format XXXX-XXXX-1234'),
  dob: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
});

export type AadhaarExtraction = z.infer<typeof aadhaarExtractionSchema>;

export const panCardExtractionSchema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Valid 10-char PAN format'),
  name: z.string().min(2),
  fatherName: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
});

export type PanCardExtraction = z.infer<typeof panCardExtractionSchema>;

export const hotelVoucherExtractionSchema = z.object({
  hotelName: z.string().min(2),
  bookingRef: z.string().optional().nullable(),
  guestNames: z.array(z.string()).default([]),
  checkInDate: z.string().optional().nullable(),
  checkOutDate: z.string().optional().nullable(),
  roomType: z.string().optional().nullable(),
  mealPlan: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
});

export type HotelVoucherExtraction = z.infer<typeof hotelVoucherExtractionSchema>;

export const travelInsuranceExtractionSchema = z.object({
  provider: z.string().min(2),
  policyNumber: z.string().min(2),
  insuredNames: z.array(z.string()).default([]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  sumInsured: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
});

export type TravelInsuranceExtraction = z.infer<typeof travelInsuranceExtractionSchema>;

export const verifyAiResultSchema = z.object({
  jobId: z.string().uuid(),
  verifiedData: z.record(z.any()),
  applyToCustomer: z.boolean().default(true),
});

export type VerifyAiResultDto = z.infer<typeof verifyAiResultSchema>;
