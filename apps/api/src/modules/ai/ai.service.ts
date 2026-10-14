import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  prisma,
  UserRole,
  AIJobStatus,
  DocumentType,
  encryptField,
  hashField,
  maskIdentifier,
} from '@sai/database';
import { LocalStorageService } from '../documents/storage/local-storage.service';
import { GeminiDocumentAiService } from './gemini/gemini.service';
import { VerifyAiResultDto } from '@sai/shared-types';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  branchId?: string | null;
  branchCode?: string | null;
  name?: string | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly storageService: LocalStorageService,
    private readonly geminiService: GeminiDocumentAiService,
  ) {}

  /**
   * Enforce branch access on document
   */
  private async verifyDocumentBranchAccess(
    documentId: string,
    user: AuthenticatedUser,
  ) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        customer: {
          select: { id: true, branchId: true, fullName: true, customerNumber: true },
        },
      },
    });

    if (!doc || doc.isDeleted) {
      throw new NotFoundException(`Document with ID ${documentId} not found.`);
    }

    if (user.role !== UserRole.OWNER) {
      if (!user.branchId || doc.customer.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Security Violation: Staff is strictly restricted to documents in their assigned branch.',
        );
      }
    }

    return doc;
  }

  /**
   * Queue & trigger AI document intelligence extraction job
   */
  async triggerExtraction(documentId: string, user: AuthenticatedUser): Promise<any> {
    const doc = await this.verifyDocumentBranchAccess(documentId, user);

    // 1. Create processing job record
    const job = await prisma.aIProcessingJob.create({
      data: {
        documentId: doc.id,
        jobType: 'DOCUMENT_EXTRACTION',
        status: AIJobStatus.PROCESSING,
        modelName: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        startedAt: new Date(),
      },
    });

    try {
      // 2. Read document from storage
      const fileBuffer = await this.storageService.getFile(doc.storageKey);

      // 3. Process with Gemini / ICAO Engine
      const extraction = await this.geminiService.processDocument(
        fileBuffer,
        doc.mimeType,
        doc.type as any,
        doc.title,
      );

      // 4. Update job to completed
      await prisma.aIProcessingJob.update({
        where: { id: job.id },
        data: {
          status: AIJobStatus.COMPLETED,
          modelName: extraction.modelName,
          rawTextExtracted: extraction.rawTextExtracted || null,
          confidenceScore: extraction.confidenceScore,
          completedAt: new Date(),
        },
      });

      // 5. Store extraction result
      const result = await prisma.aIExtractionResult.create({
        data: {
          jobId: job.id,
          extractedJson: extraction.data,
          isVerified: false,
        },
      });

      this.logger.log(
        `AI extraction completed for doc ${doc.id} (Job: ${job.id}, Confidence: ${extraction.confidenceScore})`,
      );

      return {
        jobId: job.id,
        status: AIJobStatus.COMPLETED,
        modelName: extraction.modelName,
        confidenceScore: extraction.confidenceScore,
        extractedData: extraction.data,
        isVerified: false,
      };
    } catch (err: any) {
      this.logger.error(`AI Extraction failed for doc ${doc.id}: ${err.message}`);
      await prisma.aIProcessingJob.update({
        where: { id: job.id },
        data: {
          status: AIJobStatus.FAILED,
          errorMessage: err.message,
          completedAt: new Date(),
        },
      });

      throw new BadRequestException(`Document extraction failed: ${err.message}`);
    }
  }

  /**
   * Get extraction result by Job ID
   */
  async getExtractionByJobId(jobId: string, user: AuthenticatedUser): Promise<any> {
    const job = await prisma.aIProcessingJob.findUnique({
      where: { id: jobId },
      include: {
        document: {
          include: { customer: true },
        },
        extractionResult: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`AI processing job ${jobId} not found.`);
    }

    await this.verifyDocumentBranchAccess(job.documentId, user);

    return {
      jobId: job.id,
      documentId: job.documentId,
      documentTitle: job.document.title,
      documentType: job.document.type,
      customerId: job.document.customerId,
      customerName: job.document.customer.fullName,
      status: job.status,
      modelName: job.modelName,
      confidenceScore: Number(job.confidenceScore || 0),
      extractedData: job.extractionResult?.extractedJson || {},
      verifiedData: job.extractionResult?.verifiedJson || null,
      isVerified: job.extractionResult?.isVerified || false,
      appliedToCustomer: job.extractionResult?.appliedToCustomer || false,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }

  /**
   * Get latest extraction for a specific document
   */
  async getLatestExtractionForDocument(documentId: string, user: AuthenticatedUser): Promise<any> {
    await this.verifyDocumentBranchAccess(documentId, user);

    const latestJob = await prisma.aIProcessingJob.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          include: { customer: true },
        },
        extractionResult: true,
      },
    });

    if (!latestJob) {
      return null;
    }

    return {
      jobId: latestJob.id,
      documentId: latestJob.documentId,
      documentTitle: latestJob.document.title,
      documentType: latestJob.document.type,
      status: latestJob.status,
      modelName: latestJob.modelName,
      confidenceScore: Number(latestJob.confidenceScore || 0),
      extractedData: latestJob.extractionResult?.extractedJson || {},
      verifiedData: latestJob.extractionResult?.verifiedJson || null,
      isVerified: latestJob.extractionResult?.isVerified || false,
      appliedToCustomer: latestJob.extractionResult?.appliedToCustomer || false,
      completedAt: latestJob.completedAt,
    };
  }

  /**
   * Get queue of AI processing jobs with branch tenancy
   */
  async getQueue(user: AuthenticatedUser): Promise<any[]> {
    try {
      const branchWhere =
        user.role === UserRole.OWNER || !user.branchId
          ? {}
          : { document: { customer: { branchId: user.branchId } } };

      const jobs = await prisma.aIProcessingJob.findMany({
        where: branchWhere,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          document: {
            include: {
              customer: {
                select: { id: true, fullName: true, customerNumber: true, branchId: true },
              },
            },
          },
          extractionResult: true,
        },
      });

      return jobs.map((j) => ({
        id: j.id,
        documentId: j.documentId,
        documentTitle: j.document.title,
        documentType: j.document.type,
        customerName: j.document.customer?.fullName || 'Unknown',
        customerNumber: j.document.customer?.customerNumber || '',
        customerId: j.document.customer?.id,
        status: j.status,
        confidenceScore: j.confidenceScore ? Number(j.confidenceScore) : null,
        startedAt: j.startedAt,
        completedAt: j.completedAt,
        isVerified: j.extractionResult?.isVerified || false,
        extractedData: j.extractionResult?.extractedJson || null,
      }));
    } catch (err: any) {
      this.logger.warn(`Database offline in getQueue: ${err.message}. Returning empty queue.`);
      return [];
    }
  }

  /**
   * Human-in-the-loop: Verify extracted data and automatically update customer profile records
   */
  async verifyAndApply(verifyDto: VerifyAiResultDto, user: AuthenticatedUser): Promise<any> {
    const job = await prisma.aIProcessingJob.findUnique({
      where: { id: verifyDto.jobId },
      include: {
        document: {
          include: { customer: true },
        },
        extractionResult: true,
      },
    });

    if (!job || !job.extractionResult) {
      throw new NotFoundException(`AI extraction result not found for job ${verifyDto.jobId}`);
    }

    await this.verifyDocumentBranchAccess(job.documentId, user);

    const verified = verifyDto.verifiedData;

    // 1. Update AIExtractionResult with staff verification
    const updatedResult = await prisma.aIExtractionResult.update({
      where: { jobId: job.id },
      data: {
        verifiedJson: verified,
        isVerified: true,
        verifiedById: (user as any).id || (user as any).userId || null,
        verifiedAt: new Date(),
        appliedToCustomer: verifyDto.applyToCustomer,
      },
    });

    // 2. If applyToCustomer is true, auto-populate the customer profile
    if (verifyDto.applyToCustomer) {
      const customerId = job.document.customerId;
      const docType = job.document.type;

      if (docType === DocumentType.PASSPORT) {
        const passportNum = verified.passportNumber?.trim();
        if (passportNum && verified.expiryDate) {
          const enc = encryptField(passportNum);
          const mask = maskIdentifier(passportNum, 'PASSPORT');
          const hash = hashField(passportNum);

          const expiryDateObj = new Date(verified.expiryDate);

          await prisma.passport.upsert({
            where: { passportHash: hash },
            create: {
              customerId,
              passportNumberEnc: enc,
              passportNumberMask: mask,
              passportHash: hash,
              issuingCountry: verified.issuingCountry || 'IND',
              issueDate: verified.issueDate ? new Date(verified.issueDate) : null,
              expiryDate: expiryDateObj,
              placeOfIssue: verified.placeOfIssue || null,
              mrzRawLine1: verified.rawLine1 || null,
              mrzRawLine2: verified.rawLine2 || null,
              isCurrent: true,
            },
            update: {
              issuingCountry: verified.issuingCountry || 'IND',
              issueDate: verified.issueDate ? new Date(verified.issueDate) : null,
              expiryDate: expiryDateObj,
              placeOfIssue: verified.placeOfIssue || null,
              mrzRawLine1: verified.rawLine1 || null,
              mrzRawLine2: verified.rawLine2 || null,
              isCurrent: true,
              updatedAt: new Date(),
            },
          });

          this.logger.log(`Auto-created/updated Passport record from AI verification for customer ${customerId}`);
        }
      } else if (docType === DocumentType.VISA_COPY || docType === DocumentType.VISA_APPROVAL_LETTER) {
        if (verified.country && verified.expiryDate) {
          const visaNum = verified.visaNumber?.trim();
          const enc = visaNum ? encryptField(visaNum) : null;

          await prisma.visa.create({
            data: {
              customerId,
              country: verified.country,
              visaNumberEnc: enc,
              visaCategory: verified.visaCategory || 'TOURIST',
              issueDate: verified.issueDate ? new Date(verified.issueDate) : null,
              expiryDate: new Date(verified.expiryDate),
              durationOfStayDays: verified.durationOfStayDays ? Number(verified.durationOfStayDays) : null,
              entriesPermitted: verified.entriesPermitted || 'SINGLE',
            },
          });

          this.logger.log(`Auto-created Visa record from AI verification for customer ${customerId}`);
        }
      } else if (docType === DocumentType.FLIGHT_TICKET || docType === DocumentType.E_TICKET) {
        if (verified.pnr || verified.airline) {
          await prisma.travelBooking.create({
            data: {
              customerId,
              bookingRef: verified.pnr || verified.ticketNumber || 'TICKET',
              pnr: verified.pnr || null,
              airline: verified.airline || null,
              flightNumber: verified.flightNumber || null,
              originAirport: verified.originAirport || null,
              destAirport: verified.destAirport || null,
              departureTime: verified.departureDateTime ? new Date(verified.departureDateTime) : null,
              arrivalTime: verified.arrivalDateTime ? new Date(verified.arrivalDateTime) : null,
            },
          });

          this.logger.log(`Auto-created TravelBooking record from AI verification for customer ${customerId}`);
        }
      }
    }

    return {
      success: true,
      message: 'Document intelligence verified and successfully committed to customer vault.',
      data: updatedResult,
    };
  }
}
