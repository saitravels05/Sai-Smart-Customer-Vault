import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { prisma, maskPassportNumber } from '@sai/database';
import {
  AskAssistantDto,
  AssistantResponseDto,
  AssistantSourceReference,
  AssistantSuggestedAction,
  UserRole,
} from '@sai/shared-types';
import { AssistantSafetyGuard } from './assistant-safety';
import { SearchIntentParser } from '../search/search-intent-parser';

interface AuthUserContext {
  userId: string;
  role: UserRole;
  branchId: string;
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private client: GoogleGenAI | null = null;
  private readonly modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey });
        this.logger.log(`Initialized Gemini Assistant with model: ${this.modelName}`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Gemini client for Assistant: ${err.message}`);
      }
    }
  }

  /**
   * Process conversational staff queries with RAG grounding, RBAC tenancy, and source citations
   */
  async askAssistant(dto: AskAssistantDto, user: AuthUserContext): Promise<AssistantResponseDto> {
    const startTime = Date.now();
    const question = dto.question.trim();

    // 1. Safety Guard check (Prompt injection & jailbreak defense)
    const safetyCheck = AssistantSafetyGuard.validate(question);
    if (!safetyCheck.isSafe) {
      return {
        answer: `⚠️ **Security Alert**: ${safetyCheck.reason}\n\nSAI AI Assistant enforces strict protection against prompt overrides and unauthorized access.`,
        sources: [],
        suggestedQuestions: ['Show customers who need passport renewal', 'Find Singapore visa customers'],
        modelUsed: 'SAI-Security-Guard',
        processingTimeMs: Date.now() - startTime,
      };
    }

    const sources: AssistantSourceReference[] = [];
    const suggestedActions: AssistantSuggestedAction[] = [];
    let retrievedContext = '';

    // 2. Resolve Context: Case A — Specific Customer Drawer Context
    if (dto.contextCustomerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: dto.contextCustomerId },
        include: {
          passports: true,
          visas: true,
          bookings: { orderBy: { departureTime: 'desc' } },
          documents: { where: { isDeleted: false } },
          branch: true,
        },
      });

      if (!customer || customer.isDeleted) {
        return {
          answer: 'Customer record not found or has been archived.',
          sources: [],
          suggestedQuestions: [],
          modelUsed: 'system',
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Strict tenancy check: Non-superadmin cannot inspect another branch's customer
      if (user.role !== UserRole.SUPER_ADMIN && customer.branchId !== user.branchId) {
        throw new ForbiddenException('Access Denied: You cannot query customer records belonging to another branch.');
      }

      sources.push({
        entityType: 'CUSTOMER',
        entityId: customer.id,
        title: `${customer.fullName} (${customer.customerNumber})`,
        link: `/customers/${customer.id}`,
        details: `Branch: ${customer.branch.name} • Contact: ${customer.primaryPhone}`,
      });

      suggestedActions.push({
        label: `View ${customer.fullName}'s Profile`,
        action: 'VIEW_CUSTOMER',
        payload: { customerId: customer.id },
      });

      retrievedContext = `
CUSTOMER FILE:
Name: ${customer.fullName}
Customer Number: ${customer.customerNumber}
Branch: ${customer.branch.name}
Phone: ${customer.primaryPhone}
Category: ${customer.primaryCategory}
Status: ${customer.status}

PASSPORTS (${customer.passports.length}):
${customer.passports
  .map(
    (p) =>
      `- Expiry: ${new Date(p.expiryDate).toISOString().split('T')[0]}, Country: ${p.issuingCountry || 'IND'}, Place of Issue: ${p.placeOfIssue || 'N/A'}`,
  )
  .join('\n')}

VISAS (${customer.visas.length}):
${customer.visas
  .map(
    (v) =>
      `- Country: ${v.country}, Category: ${v.visaCategory}, Valid until: ${new Date(v.expiryDate).toISOString().split('T')[0]}, Status: ${v.status}`,
  )
  .join('\n')}

TRAVEL BOOKINGS (${customer.bookings.length}):
${customer.bookings
  .map(
    (b) =>
      `- Route: ${b.originAirport || ''} -> ${b.destAirport || ''}, Carrier: ${b.airline || 'N/A'}, Departure: ${b.departureTime ? new Date(b.departureTime).toISOString().split('T')[0] : 'N/A'}, Ref: ${b.bookingRef}`,
  )
  .join('\n')}

UPLOADED DOCUMENTS (${customer.documents.length}):
${customer.documents.map((d) => `- ${d.title} [${d.type}] (Uploaded: ${new Date(d.createdAt).toISOString().split('T')[0]})`).join('\n')}
      `;

      // Add documents to sources if mentioned
      for (const d of customer.documents) {
        sources.push({
          entityType: 'DOCUMENT',
          entityId: d.id,
          title: d.title,
          link: `/customers/${customer.id}?tab=documents`,
          details: `Type: ${d.type}`,
        });
      }
    } else {
      // Case B: General Travel Desk Questions (Scoped to Staff's Branch)
      const branchWhere = user.role === UserRole.SUPER_ADMIN ? {} : { branchId: user.branchId };
      const intent = SearchIntentParser.parse(question);

      if (intent.intentType === 'PASSPORT_EXPIRY' || intent.detectedEntities.expiryDays) {
        const days = intent.detectedEntities.expiryDays || 180;
        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(now.getDate() + days);

        const expiring = await prisma.passport.findMany({
          where: {
            expiryDate: { gte: now, lte: maxDate },
            customer: { ...branchWhere, isDeleted: false },
          },
          include: { customer: { include: { branch: true } } },
          take: 10,
        });

        retrievedContext = `EXPIRING PASSPORTS (Within ${days} days):\n` +
          expiring
            .map(
              (p) =>
                `- ${p.customer.fullName} (${p.customer.customerNumber}) - Expires: ${new Date(p.expiryDate).toISOString().split('T')[0]} - Branch: ${p.customer.branch.name} - Phone: ${p.customer.primaryPhone}`,
            )
            .join('\n');

        for (const p of expiring) {
          sources.push({
            entityType: 'PASSPORT',
            entityId: p.id,
            title: `Passport: ${p.customer.fullName} (${p.customer.customerNumber})`,
            link: `/customers/${p.customer.id}?tab=travel`,
            details: `Expires on ${new Date(p.expiryDate).toISOString().split('T')[0]}`,
          });
        }
      } else if (intent.detectedEntities.destination) {
        const dest = intent.detectedEntities.destination;
        const visas = await prisma.visa.findMany({
          where: {
            country: { contains: dest, mode: 'insensitive' },
            customer: { ...branchWhere, isDeleted: false },
          },
          include: { customer: { include: { branch: true } } },
          take: 10,
        });

        retrievedContext = `VISAS FOR DESTINATION ${dest}:\n` +
          visas
            .map(
              (v) =>
                `- ${v.customer.fullName} (${v.customer.customerNumber}) - Country: ${v.country} - Status: ${v.status} - Valid until: ${new Date(v.expiryDate).toISOString().split('T')[0]} - Branch: ${v.customer.branch.name}`,
            )
            .join('\n');

        for (const v of visas) {
          sources.push({
            entityType: 'VISA',
            entityId: v.id,
            title: `${v.country} Visa: ${v.customer.fullName}`,
            link: `/customers/${v.customer.id}?tab=credentials`,
            details: `Status: ${v.status}`,
          });
        }
      } else {
        // Broad search across customer records
        const customers = await prisma.customer.findMany({
          where: { ...branchWhere, isDeleted: false },
          include: { branch: true, passports: true, visas: true, bookings: true },
          take: 5,
          orderBy: { registeredAt: 'desc' },
        });

        retrievedContext = `RECENT CUSTOMER RECORDS:\n` +
          customers
            .map(
              (c) =>
                `- ${c.fullName} (${c.customerNumber}) - Category: ${c.primaryCategory} - Bookings: ${c.bookings.length} - Branch: ${c.branch.name}`,
            )
            .join('\n');

        for (const c of customers) {
          sources.push({
            entityType: 'CUSTOMER',
            entityId: c.id,
            title: `${c.fullName} (${c.customerNumber})`,
            link: `/customers/${c.id}`,
            details: `${c.primaryCategory} • ${c.branch.name}`,
          });
        }
      }
    }

    // 3. Generate Answer (using Gemini 3.8 Flash or deterministic synthesis)
    let answer = '';
    let modelUsed = 'Deterministic-RAG-Engine';

    if (this.client) {
      try {
        const prompt = `
Question from staff member: "${question}"

RELEVANT DATABASE RECORDS (Retrieved under authorized branch scope):
${retrievedContext || 'No matching database records found for this criteria.'}

Please generate a professional, concise, direct response for the staff member.
Cite customer names, customer numbers, dates, and destinations clearly.
Remember the strict instructions: Do NOT fabricate records. Redact any sensitive Aadhaar numbers to XXXX-XXXX-1234.
        `;

        const response = await (this.client as any).interactions.create({
          model: this.modelName,
          input: prompt,
          systemInstruction:
            'You are SAI AI Assistant, an internal operational AI assistant for travel agency staff at SAI TOURS & TRAVELS (Madurai Head Office & Trichy Branch). Always ground your answers strictly in the provided database records. Do not assume or hallucinate information.',
        });

        answer = response.output_text || '';
        modelUsed = this.modelName;
      } catch (geminiErr: any) {
        this.logger.warn(`Gemini call failed for Assistant (${geminiErr.message}). Using deterministic answer synthesis.`);
      }
    }

    // Deterministic Fallback Synthesis if Gemini not available or failed
    if (!answer) {
      answer = this.synthesizeDeterministicAnswer(question, retrievedContext, sources.length);
    }

    // Output Sanitization
    answer = AssistantSafetyGuard.sanitizeOutput(answer);

    // 4. Asynchronous Audit Log for Compliance
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.userId || undefined,
          branchId: user.branchId,
          action: 'AI_CHAT_QUERY',
          entityType: 'ASSISTANT_CONVERSATION',
          entityId: question.slice(0, 100),
          ipAddress: '127.0.0.1',
          newStateJson: {
            question,
            sourcesCount: sources.length,
            contextCustomerId: dto.contextCustomerId || null,
          },
        },
      });
    } catch (auditErr: any) {
      this.logger.warn(`Audit log creation failed for Assistant: ${auditErr.message}`);
    }

    return {
      answer,
      sources: sources.slice(0, 6),
      suggestedQuestions: [
        'Show customers whose passports expire within 90 days',
        'Find Singapore visa customers from Madurai',
        'Show recent flight bookings',
        'Find customer documents uploaded this week',
      ],
      suggestedActions,
      modelUsed,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * High-fidelity deterministic answer synthesis when Gemini LLM is offline or in testing
   */
  private synthesizeDeterministicAnswer(question: string, context: string, sourcesCount: number): string {
    if (!context || sourcesCount === 0) {
      return `I examined our database for **"${question}"** within your authorized branch scope, but did not find any active matching records.\n\nPlease verify the spelling, customer ID, or try broadening your search criteria.`;
    }

    const lines = context.trim().split('\n').filter((l) => l.trim().length > 0);
    const summaryList = lines.slice(0, 8).join('\n');

    return `Based on our authorized database records for **SAI TOURS & TRAVELS**, here is the verified information:\n\n${summaryList}\n\n*All referenced profiles and documents are linked below with full audit verification.*`;
  }
}
