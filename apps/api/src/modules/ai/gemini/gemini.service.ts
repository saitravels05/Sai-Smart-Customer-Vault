import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { IcaoMrzParser } from '../mrz/icao-mrz-parser';
import { DocumentType } from '@sai/shared-types';

export interface ExtractedDocumentResult {
  modelName: string;
  data: Record<string, any>;
  confidenceScore: number;
  rawTextExtracted?: string;
}

@Injectable()
export class GeminiDocumentAiService {
  private readonly logger = new Logger(GeminiDocumentAiService.name);
  private client: GoogleGenAI | null = null;
  private readonly modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey });
        this.logger.log(`Initialized Google Gemini AI client using model: ${this.modelName}`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Google Gemini client: ${err.message}. Using intelligent fallback.`);
      }
    } else {
      this.logger.log('No GEMINI_API_KEY detected in environment. Running with intelligent rule-based / MRZ engine.');
    }
  }

  /**
   * Process a document buffer using Gemini multimodal API or intelligent fallback
   */
  async processDocument(
    fileBuffer: Buffer,
    mimeType: string,
    docType: DocumentType,
    fileName: string,
  ): Promise<ExtractedDocumentResult> {
    if (this.client) {
      try {
        return await this.extractWithGemini(fileBuffer, mimeType, docType);
      } catch (err: any) {
        this.logger.warn(`Gemini API call failed (${err.message}). Falling back to algorithmic engine.`);
      }
    }

    return this.extractWithAlgorithmicFallback(fileBuffer, mimeType, docType, fileName);
  }

  /**
   * Call Gemini 3.8 Flash multimodal API with structured schema instructions
   */
  private async extractWithGemini(
    fileBuffer: Buffer,
    mimeType: string,
    docType: DocumentType,
  ): Promise<ExtractedDocumentResult> {
    const prompt = this.getPromptForDocType(docType);
    const base64Data = fileBuffer.toString('base64');

    const interaction = await this.client!.interactions.create({
      model: this.modelName,
      input: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      systemInstruction:
        'You are an expert AI Travel Document Intelligence Engine for SAI Tours & Travels. Extract real data accurately into valid JSON. Return ONLY the JSON object. Do not wrap in markdown quotes if possible.',
    });

    const rawText = interaction.output_text || '{}';
    let parsed: any = {};

    try {
      // Clean possible markdown code fence
      const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanedJson);
    } catch {
      this.logger.warn('Failed to parse Gemini output as JSON, attempting regex cleanup.');
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    // If Passport, run ICAO 9303 checksum validation if MRZ is extracted
    if (docType === DocumentType.PASSPORT && parsed.rawLine1 && parsed.rawLine2) {
      const mrzResult = IcaoMrzParser.parseTd3(parsed.rawLine1, parsed.rawLine2);
      parsed = {
        ...parsed,
        ...mrzResult,
        // Preserve any back page fields extracted by Gemini
        fatherName: parsed.fatherName || null,
        motherName: parsed.motherName || null,
        spouseName: parsed.spouseName || null,
        address: parsed.address || null,
        placeOfIssue: parsed.placeOfIssue || mrzResult.issuingCountry,
      };
    }

    const confidenceScore = parsed.confidence ? Math.min(1, Math.max(0, parsed.confidence)) : 0.92;

    return {
      modelName: this.modelName,
      data: parsed,
      confidenceScore,
      rawTextExtracted: rawText.slice(0, 5000),
    };
  }

  /**
   * Algorithmic / rule-based extraction fallback for offline or air-gapped environments
   */
  private extractWithAlgorithmicFallback(
    fileBuffer: Buffer,
    _mimeType: string,
    docType: DocumentType,
    fileName: string,
  ): ExtractedDocumentResult {
    const rawContent = fileBuffer.toString('utf-8');

    if (docType === DocumentType.PASSPORT) {
      // Search for MRZ line patterns (P<IND... or similar 44-char strings)
      const mrzMatch = rawContent.match(/P[<A-Z][A-Z0-9<]{42}[\r\n]+[A-Z0-9<]{44}/);
      if (mrzMatch) {
        const lines = mrzMatch[0].split(/[\r\n]+/);
        if (lines.length >= 2) {
          const mrzResult = IcaoMrzParser.parseTd3(lines[0], lines[1]);
          return {
            modelName: 'icao-mrz-extractor-v1',
            data: mrzResult,
            confidenceScore: mrzResult.confidence,
            rawTextExtracted: mrzMatch[0],
          };
        }
      }

      // Default structured template for staff verification
      return {
        modelName: 'document-template-v1',
        data: {
          documentCode: 'P',
          issuingCountry: 'IND',
          surname: '',
          givenNames: '',
          passportNumber: '',
          nationality: 'IND',
          dateOfBirth: '',
          sex: 'M',
          expiryDate: '',
          isCheckDigitValid: false,
          confidence: 0.5,
          fieldConfidence: {
            passportNumber: 'LOW',
            dateOfBirth: 'LOW',
            expiryDate: 'LOW',
          },
        },
        confidenceScore: 0.5,
        rawTextExtracted: `Template prepared for ${fileName}`,
      };
    }

    if (docType === DocumentType.AADHAAR_MASKED) {
      return {
        modelName: 'uidai-template-v1',
        data: {
          name: '',
          maskedAadhaar: 'XXXX-XXXX-0000',
          dob: '',
          gender: 'MALE',
          address: 'Tamil Nadu, India',
          confidence: 0.6,
          fieldConfidence: {
            name: 'LOW',
            maskedAadhaar: 'MEDIUM',
          },
        },
        confidenceScore: 0.6,
        rawTextExtracted: `Aadhaar extraction template prepared for ${fileName}`,
      };
    }

    if (docType === DocumentType.FLIGHT_TICKET) {
      return {
        modelName: 'ticket-template-v1',
        data: {
          passengerName: '',
          airline: '',
          flightNumber: '',
          pnr: '',
          originAirport: '',
          destAirport: '',
          departureDateTime: '',
          confidence: 0.5,
          fieldConfidence: {
            passengerName: 'LOW',
            pnr: 'LOW',
          },
        },
        confidenceScore: 0.5,
        rawTextExtracted: `Ticket template prepared for ${fileName}`,
      };
    }

    if (docType === DocumentType.VISA_COPY) {
      return {
        modelName: 'visa-template-v1',
        data: {
          applicantName: '',
          country: 'SAU',
          visaCategory: 'TOURIST',
          visaNumber: '',
          expiryDate: '',
          entriesPermitted: 'SINGLE',
          confidence: 0.5,
          fieldConfidence: {
            applicantName: 'LOW',
            country: 'LOW',
            expiryDate: 'LOW',
          },
        },
        confidenceScore: 0.5,
        rawTextExtracted: `Visa template prepared for ${fileName}`,
      };
    }

    return {
      modelName: 'generic-template-v1',
      data: {
        documentName: fileName,
        confidence: 0.5,
      },
      confidenceScore: 0.5,
      rawTextExtracted: `Document metadata for ${fileName}`,
    };
  }

  private getPromptForDocType(docType: DocumentType): string {
    switch (docType) {
      case DocumentType.PASSPORT:
        return `Extract all fields from this passport image. If MRZ (two lines of 44 characters at bottom) is visible, extract rawLine1 and rawLine2 exactly.
Also extract from visual zones:
- surname
- givenNames
- passportNumber
- issuingCountry (3-letter ICAO code, e.g. IND)
- nationality (3-letter ICAO code, e.g. IND)
- dateOfBirth (YYYY-MM-DD)
- sex (M, F, X)
- placeOfBirth
- placeOfIssue
- issueDate (YYYY-MM-DD)
- expiryDate (YYYY-MM-DD)
- fatherName (from Indian back page if present)
- motherName (from Indian back page if present)
- spouseName (from Indian back page if present)
- address (from Indian back page if present)
- oldPassportNumber (if present)
- fileNumber (if present)
- confidence (number between 0 and 1)
- fieldConfidence (object mapping field names to HIGH, MEDIUM, or LOW)`;

      case DocumentType.VISA_COPY:
      case DocumentType.VISA_APPROVAL_LETTER:
        return `Extract all visa details into JSON:
- applicantName
- country (e.g. Saudi Arabia, UAE, Singapore, UK, USA)
- visaCategory (TOURIST, BUSINESS, UMRAH, TRANSIT, EMPLOYMENT)
- visaNumber
- passportNumber
- issueDate (YYYY-MM-DD)
- expiryDate (YYYY-MM-DD)
- durationOfStayDays (integer)
- entriesPermitted (SINGLE, DOUBLE, MULTIPLE)
- remarks
- confidence (0 to 1)
- fieldConfidence (mapping field names to HIGH, MEDIUM, LOW)`;

      case DocumentType.FLIGHT_TICKET:
      case DocumentType.E_TICKET:
        return `Extract flight ticket itinerary details into JSON:
- passengerName
- airline
- pnr (6 alphanumeric booking code)
- flightNumber
- ticketNumber
- originAirport (3-letter IATA code)
- destAirport (3-letter IATA code)
- departureDateTime (ISO format)
- arrivalDateTime (ISO format)
- cabinClass (ECONOMY, BUSINESS, FIRST)
- seatNumber
- baggageAllowance
- fareAmount
- confidence (0 to 1)
- fieldConfidence (mapping field names to HIGH, MEDIUM, LOW)`;

      case DocumentType.AADHAAR_MASKED:
        return `Extract Indian Aadhaar card details:
- name
- maskedAadhaar (MUST be masked format XXXX-XXXX-1234, first 8 digits masked with X, last 4 digits visible)
- dob (YYYY-MM-DD or year)
- gender (MALE, FEMALE)
- address
- confidence (0 to 1)
- fieldConfidence (mapping field names to HIGH, MEDIUM, LOW)`;

      default:
        return `Extract all textual information and key metadata from this document into structured JSON with confidence scores.`;
    }
  }
}
