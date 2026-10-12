# SAI SMART CUSTOMER VAULT — ARCHITECTURAL BLUEPRINT & SYSTEM SPECIFICATION
**Document Version:** 1.0.0 (Phase 0 Planning & Architecture)  
**Target Enterprise:** SAI TOURS & TRAVELS (Madurai HO & Trichy Branch)  
**Domain:** [https://www.saitravelservices.com/](https://www.saitravelservices.com/)  
**Classification:** Confidential & Proprietary  

---

## 1. Executive Summary & Requirements Decomposition

### 1.1 Business Context & Operations
**SAI TOURS & TRAVELS** operates primary travel agency centers with a Head Office in **Madurai** and a Branch Office in **Trichy**, Tamil Nadu, handling thousands of client records annually across:
1. **Passport Services** (Fresh, Renewal, Tatkaal, ECNR/ECR, Minor)
2. **Tourist & Business Visas** (Schengen, GCC/Middle East, Southeast Asia, US, UK, Australia, etc.)
3. **Flight Booking & E-Ticketing** (Domestic & International)
4. **Tour Packages & Hotel Reservations**
5. **Certificate Attestation & Gazette Services**
6. **Transport & Local Ground Travel**

### 1.2 Core Architectural Principles
* **Real Operational Integrity:** Zero mock data, simulated network responses, or fake success messages. Every transaction, upload, query, and AI extraction connects to real infrastructure.
* **Strict Least-Privilege & Multi-Branch Tenancy:** Staff members in Madurai cannot access Trichy customer records unless authorized at the organizational level by Super Admins.
* **Confidential Document Isolation:** Passports, Visas, and Identity records are stored exclusively in private, encrypted S3-compatible buckets. No public bucket access is permitted. All downloads utilize signed URLs with tight expiration windows (300 seconds).
* **Deterministic AI & Human-in-the-Loop:** AI acts solely as an accelerator, not an autonomous decider. Extracted passport MRZ records, visa dates, and ticket itineraries are routed through an interactive verification queue before committing to PostgreSQL.
* **Statutory Compliance (DPDPA 2023 & UIDAI):** Full compliance with India's Digital Personal Data Protection Act 2023, automated consent auditing, and strict Aadhaar masking (never storing unmasked 12-digit Aadhaar numbers).

---

## 2. Monorepo Repository Structure

The project is structured as a performant, modular TypeScript monorepo using **pnpm workspaces** and **Turborepo**:

```
sai-customer-vault/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Linting, type-checking, automated unit/integration tests
│       └── deploy.yml                 # Automated deployment pipeline
├── apps/
│   ├── web/                           # Next.js 15 (App Router) Frontend
│   │   ├── public/
│   │   │   ├── branding/
│   │   │   │   └── logo.jpg           # SAI Tours & Travels Official Logo
│   │   │   └── locales/
│   │   │       ├── en/                # English translations
│   │   │       └── ta/                # Tamil translations
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   └── mfa/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx     # Shell: Sidebar, Topbar, Global Search, Lang Switcher
│   │   │   │   │   ├── page.tsx       # Advanced Analytics Dashboard
│   │   │   │   │   ├── customers/
│   │   │   │   │   │   ├── page.tsx   # Customer Directory (Filters, Search, Export)
│   │   │   │   │   │   ├── new/       # Customer Registration Wizard
│   │   │   │   │   │   └── [id]/      # Detailed Customer Profile & Tabs
│   │   │   │   │   ├── documents/
│   │   │   │   │   │   ├── page.tsx   # Document Vault & Search
│   │   │   │   │   │   └── upload/    # Bulk / Direct Document Uploader
│   │   │   │   │   ├── ai-review/     # AI Extraction Human-Verification Queue
│   │   │   │   │   ├── ai-assistant/  # SAI AI Natural Language Chat Assistant
│   │   │   │   │   ├── reminders/     # Expiry Tracking (Passports, Visas, Tickets)
│   │   │   │   │   ├── branches/      # Madurai & Trichy Branch Management
│   │   │   │   │   ├── staff/         # Staff Directory & Role Provisioning
│   │   │   │   │   ├── audit-logs/    # Tamper-Evident Access & Activity Logs
│   │   │   │   │   └── settings/      # Organization Branding, Storage, Retention
│   │   │   │   └── api/               # Next.js proxy/edge endpoints if required
│   │   │   ├── components/
│   │   │   │   ├── ui/                # shadcn/ui primitive components
│   │   │   │   ├── customer/          # Profile cards, family links, duplicate alerts
│   │   │   │   ├── document/          # Secure PDF/image viewer, version history, dropzone
│   │   │   │   ├── ai/                # MRZ visual comparison viewer, confidence badges
│   │   │   │   └── layout/            # Navigation, header, breadcrumbs, notifications
│   │   │   ├── hooks/                 # useCustomer, useDocuments, useBranchScope
│   │   │   ├── lib/                   # API clients, formatters, i18n utilities
│   │   │   └── styles/                # Tailwind configuration, theme variables
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                           # NestJS Backend Application
│       ├── src/
│       │   ├── common/
│       │   │   ├── decorators/        # @CurrentUser, @Roles, @RequireBranchAccess
│       │   │   ├── guards/            # JwtAuthGuard, RolesGuard, BranchTenantGuard
│       │   │   ├── filters/           # GlobalExceptionFilter (Sanitizes PII from logs)
│       │   │   ├── interceptors/      # AuditLogInterceptor, TransformResponseInterceptor
│       │   │   └── pipes/             # ZodValidationPipe
│       │   ├── config/                # Environment validation (Zod schema)
│       │   ├── modules/
│       │   │   ├── auth/              # Authentication, Argon2id, MFA TOTP, Refresh Tokens
│       │   │   ├── users/             # User & Staff profile administration
│       │   │   ├── branches/          # Madurai / Trichy Branch management
│       │   │   ├── customers/         # Customer CRM, duplicate detector, family link
│       │   │   ├── documents/         # S3 pre-signed upload/download, versioning, metadata
│       │   │   ├── ai-engine/         # OCR, MRZ parser, Ticket/Visa extractor, pgvector
│       │   │   ├── reminders/         # BullMQ automated 180/90/30/7-day cron reminder dispatch
│       │   │   ├── audit/             # Tamper-evident logging and DPDPA access trails
│       │   │   └── reports/           # Aggregate statistics from live database queries
│       │   ├── jobs/                  # BullMQ processor definitions (Malware, OCR, Alerts)
│       │   ├── main.ts                # Application bootstrap (OpenAPI Swagger, Helmet, CORS)
│       │   └── app.module.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/                      # Shared Database Engine & Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # PostgreSQL + pgvector schema
│   │   │   └── migrations/            # Version-controlled SQL migrations
│   │   ├── src/
│   │   │   ├── index.ts               # PrismaClient singleton with encryption extensions
│   │   │   └── seed.ts                # Zero-dummy baseline seeder (Roles, Initial Branches)
│   │   └── package.json
│   │
│   ├── shared-types/                  # Shared TypeScript Interfaces, Enums & Zod Schemas
│   │   ├── src/
│   │   │   ├── customer.dto.ts
│   │   │   ├── document.dto.ts
│   │   │   ├── ai-extraction.dto.ts
│   │   │   ├── reminder.dto.ts
│   │   │   └── enums.ts
│   │   └── package.json
│   │
│   └── config/                        # Shared ESLint, Prettier, and TypeScript configs
│
├── docker/
│   ├── docker-compose.dev.yml         # Local PostgreSQL with pgvector, Redis, MinIO, ClamAV
│   └── Dockerfile.api
├── assets/
│   └── logo.jpg                       # Official SAI Tours & Travels Logo
├── docs/
│   ├── architecture/                  # Architectural blueprints, threat model
│   └── api/                           # OpenAPI generated documentation
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
└── README.md
```

---

## 3. Database Architecture & Complete PostgreSQL Schema

The database leverages **PostgreSQL 16** with the **`pgvector`** extension for vector similarity calculations and full-text search indexes (`tsvector`).

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [pgvector(map: "vector")]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

enum UserRole {
  SUPER_ADMIN
  BRANCH_MANAGER
  STAFF
  READ_ONLY
}

enum Gender {
  MALE
  FEMALE
  OTHER
  UNSPECIFIED
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum ServiceCategory {
  PASSPORT_SERVICES
  TOURIST_VISA
  BUSINESS_VISA
  FLIGHT_BOOKING
  HOTEL_BOOKING
  TOUR_PACKAGES
  CERTIFICATE_ATTESTATION
  GAZETTE_SERVICES
  TRANSPORT_RENTALS
  OTHER_TRAVEL_SERVICES
}

enum DocumentCategory {
  IDENTITY_DOCUMENT
  TRAVEL_DOCUMENT
  BUSINESS_DOCUMENT
  APPLICATION_DOCUMENT
  ATTESTATION_DOCUMENT
}

enum DocumentType {
  PASSPORT
  AADHAAR_MASKED
  PAN_CARD
  VOTER_ID
  DRIVING_LICENCE
  BIRTH_CERTIFICATE
  MARRIAGE_CERTIFICATE
  FLIGHT_TICKET
  E_TICKET
  BOARDING_PASS
  VISA_COPY
  VISA_APPROVAL_LETTER
  TRAVEL_INSURANCE
  HOTEL_BOOKING_CONFIRMATION
  TOUR_ITINERARY
  IMMIGRATION_DOCUMENT
  INVOICE
  PAYMENT_RECEIPT
  CUSTOMER_APPLICATION
  EMPLOYER_NOC_LETTER
  BUSINESS_INVITATION_LETTER
  UNDERTAKING_LETTER
  ATTESTATION_CERTIFICATE
  OTHER
}

enum AIJobStatus {
  PENDING
  PROCESSING
  COMPLETED
  VERIFIED
  REJECTED
  FAILED
}

enum ReminderType {
  PASSPORT_EXPIRY
  VISA_EXPIRY
  TRAVEL_INSURANCE_EXPIRY
  UPCOMING_FLIGHT_DEPARTURE
  HOTEL_CHECKIN
  DOCUMENT_RENEWAL
  VISA_APPLICATION_FOLLOWUP
}

enum ReminderChannel {
  DASHBOARD
  EMAIL
  WHATSAPP
}

enum ReminderStatus {
  SCHEDULED
  SENT
  ACKNOWLEDGED
  DISMISSED
  FAILED
}

// ----------------------------------------------------
// Organization & Staffing
// ----------------------------------------------------

model Branch {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code        String   @unique @db.VarChar(10) // e.g. "IXM-HO" (Madurai), "TRZ-BO" (Trichy)
  name        String   @db.VarChar(100)        // "Madurai Head Office", "Trichy Branch Office"
  address     String   @db.Text
  city        String   @db.VarChar(50)
  state       String   @default("Tamil Nadu") @db.VarChar(50)
  country     String   @default("India") @db.VarChar(50)
  phone       String   @db.VarChar(20)
  email       String   @db.VarChar(100)
  isHeadOffice Boolean @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  staff       StaffProfile[]
  customers   Customer[]
  auditLogs   AuditLog[]

  @@map("branches")
}

model User {
  id              String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email           String         @unique @db.VarChar(150)
  passwordHash    String         @db.VarChar(255) // Argon2id hash
  role            UserRole       @default(STAFF)
  mfaSecret       String?        @db.VarChar(255) // Encrypted TOTP secret
  isMfaEnabled    Boolean        @default(false)
  isActive        Boolean        @default(true)
  lastLoginAt     DateTime?      @db.Timestamptz(6)
  currentSessionId String?       @db.VarChar(255)
  failedAttempts  Int            @default(0)
  lockedUntil     DateTime?      @db.Timestamptz(6)
  createdAt       DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @db.Timestamptz(6)

  staffProfile    StaffProfile?
  auditLogs       AuditLog[]
  documentAccessLogs DocumentAccessLog[]
  verifiedAiResults AIExtractionResult[] @relation("VerifiedByUser")

  @@map("users")
}

model StaffProfile {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String   @unique @db.Uuid
  branchId        String   @db.Uuid
  staffCode       String   @unique @db.VarChar(20)
  fullName        String   @db.VarChar(120)
  designation     String   @db.VarChar(80) // e.g. "Passport Executive", "Branch Manager"
  contactNumber   String   @db.VarChar(20)
  createdAt       DateTime @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @db.Timestamptz(6)

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  branch          Branch   @relation(fields: [branchId], references: [id], onDelete: Restrict)
  assignedCustomers Customer[] @relation("AssignedStaff")

  @@map("staff_profiles")
}

// ----------------------------------------------------
// Customer Management
// ----------------------------------------------------

model Customer {
  id                 String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerNumber     String          @unique @db.VarChar(25) // e.g. "SAI-2026-0001"
  branchId           String          @db.Uuid
  assignedStaffId    String?         @db.Uuid
  
  // Basic Information
  fullName           String          @db.VarChar(150)
  dateOfBirth        DateTime?       @db.Date
  gender             Gender          @default(UNSPECIFIED)
  nationality        String          @default("Indian") @db.VarChar(60)
  
  // Contact Channels
  primaryPhone       String          @db.VarChar(20)
  whatsappNumber     String?         @db.VarChar(20)
  email              String?         @db.VarChar(120)
  
  // Residential Address
  addressLine        String?         @db.Text
  city               String?         @db.VarChar(60)
  state              String?         @default("Tamil Nadu") @db.VarChar(60)
  postalCode         String?         @db.VarChar(15)
  country            String?         @default("India") @db.VarChar(60)
  
  // Primary Service & Status
  primaryCategory    ServiceCategory @default(PASSPORT_SERVICES)
  status             CustomerStatus  @default(ACTIVE)
  notes              String?         @db.Text
  
  // System Metadata
  registeredAt       DateTime        @default(now()) @db.Timestamptz(6)
  archivedAt         DateTime?       @db.Timestamptz(6)
  isDeleted          Boolean         @default(false)
  createdAt          DateTime        @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime        @updatedAt @db.Timestamptz(6)

  // Relations
  branch             Branch          @relation(fields: [branchId], references: [id], onDelete: Restrict)
  assignedStaff      StaffProfile?   @relation("AssignedStaff", fields: [assignedStaffId], references: [id], onDelete: SetNull)
  contacts           CustomerContact[]
  services           CustomerService[]
  passports          Passport[]
  visas              Visa[]
  bookings           TravelBooking[]
  documents          Document[]
  reminders          Reminder[]
  consents           CustomerConsent[]
  relationshipsFrom  CustomerRelationship[] @relation("RelSubject")
  relationshipsTo    CustomerRelationship[] @relation("RelRelative")

  @@index([branchId])
  @@index([primaryPhone])
  @@index([fullName])
  @@index([status])
  @@index([registeredAt])
  @@map("customers")
}

model CustomerContact {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId     String   @db.Uuid
  contactType    String   @db.VarChar(30) // "ALTERNATE_PHONE", "OFFICE", "EMERGENCY"
  contactValue   String   @db.VarChar(100)
  isPrimary      Boolean  @default(false)
  createdAt      DateTime @default(now()) @db.Timestamptz(6)

  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@map("customer_contacts")
}

model CustomerRelationship {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId     String   @db.Uuid
  relativeId     String   @db.Uuid
  relationship   String   @db.VarChar(40) // "SPOUSE", "CHILD", "PARENT", "CO_TRAVELER"
  groupName      String?  @db.VarChar(80) // e.g. "Kumar Singapore Family Tour 2026"
  createdAt      DateTime @default(now()) @db.Timestamptz(6)

  customer       Customer @relation("RelSubject", fields: [customerId], references: [id], onDelete: Cascade)
  relative       Customer @relation("RelRelative", fields: [relativeId], references: [id], onDelete: Cascade)

  @@unique([customerId, relativeId, relationship])
  @@map("customer_relationships")
}

model CustomerService {
  id             String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId     String          @db.Uuid
  serviceCategory ServiceCategory
  serviceName    String          @db.VarChar(150)
  serviceDate    DateTime        @default(now()) @db.Date
  status         String          @default("IN_PROGRESS") @db.VarChar(30) // IN_PROGRESS, COMPLETED, CANCELLED
  remarks        String?         @db.Text
  createdAt      DateTime        @default(now()) @db.Timestamptz(6)
  updatedAt      DateTime        @updatedAt @db.Timestamptz(6)

  customer       Customer        @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId, serviceCategory])
  @@map("customer_services")
}

// ----------------------------------------------------
// Travel Credentials & Bookings
// ----------------------------------------------------

model Passport {
  id                 String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId         String    @db.Uuid
  passportNumberEnc  String    @db.VarChar(255) // Encrypted with AES-256-GCM
  passportNumberMask String    @db.VarChar(20)  // "V12***89" for authorized display
  passportHash       String    @unique @db.VarChar(64) // SHA-256 hash for fast exact-match lookup
  issuingCountry     String    @default("IND") @db.VarChar(10) // ISO 3166-1 alpha-3
  issueDate          DateTime? @db.Date
  expiryDate         DateTime  @db.Date
  placeOfIssue       String?   @db.VarChar(80)
  mrzRawLine1        String?   @db.VarChar(60)
  mrzRawLine2        String?   @db.VarChar(60)
  isCurrent          Boolean   @default(true)
  createdAt          DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime  @updatedAt @db.Timestamptz(6)

  customer           Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([expiryDate])
  @@index([customerId])
  @@map("passports")
}

model Visa {
  id                 String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId         String    @db.Uuid
  country            String    @db.VarChar(60)  // e.g. "Singapore", "Malaysia", "UAE"
  visaNumberEnc      String?   @db.VarChar(255) // Encrypted
  visaCategory       String    @db.VarChar(50)  // "TOURIST", "BUSINESS", "EMPLOYMENT"
  issueDate          DateTime? @db.Date
  expiryDate         DateTime  @db.Date
  durationOfStayDays Int?
  entriesPermitted   String    @default("SINGLE") @db.VarChar(20) // "SINGLE", "MULTIPLE"
  status             String    @default("ACTIVE") @db.VarChar(30)
  createdAt          DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime  @updatedAt @db.Timestamptz(6)

  customer           Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([expiryDate])
  @@index([customerId])
  @@map("visas")
}

model TravelBooking {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId      String    @db.Uuid
  bookingRef      String    @db.VarChar(40)  // Internal / Agent Reference
  pnr             String?   @db.VarChar(20)  // Airline PNR
  airline         String?   @db.VarChar(80)
  flightNumber    String?   @db.VarChar(30)
  originAirport   String?   @db.VarChar(10)  // "MAA", "TRZ", "IXM"
  destAirport     String?   @db.VarChar(10)  // "SIN", "KUL", "DXB"
  departureTime   DateTime? @db.Timestamptz(6)
  arrivalTime     DateTime? @db.Timestamptz(6)
  hotelName       String?   @db.VarChar(150)
  checkInDate     DateTime? @db.Date
  checkOutDate    DateTime? @db.Date
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @db.Timestamptz(6)

  customer        Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([departureTime])
  @@index([customerId])
  @@map("travel_bookings")
}

// ----------------------------------------------------
// Secure Document Vault
// ----------------------------------------------------

model Document {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId       String           @db.Uuid
  branchId         String           @db.Uuid
  category         DocumentCategory
  type             DocumentType
  title            String           @db.VarChar(200)
  description      String?          @db.Text
  tags             String[]         @default([])
  
  // Storage pointer (Never public)
  storageKey       String           @unique @db.VarChar(255) // S3 object key: tenants/{branchId}/{customerId}/{docId}.ext
  bucketName       String           @db.VarChar(100)
  fileSizeBytes    BigInt
  mimeType         String           @db.VarChar(100)
  sha256Checksum   String           @db.VarChar(64)
  isEncryptedAtRest Boolean         @default(true)
  
  // Security & Health
  isMalwareClean   Boolean          @default(false)
  scanCompletedAt  DateTime?        @db.Timestamptz(6)
  isArchived       Boolean          @default(false)
  isDeleted        Boolean          @default(false)
  
  // Versioning
  currentVersion   Int              @default(1)
  
  createdAt        DateTime         @default(now()) @db.Timestamptz(6)
  updatedAt        DateTime         @updatedAt @db.Timestamptz(6)

  // Relations
  customer         Customer         @relation(fields: [customerId], references: [id], onDelete: Cascade)
  versions         DocumentVersion[]
  accessLogs       DocumentAccessLog[]
  aiJobs           AIProcessingJob[]
  embeddings       SearchEmbedding[]

  @@index([customerId])
  @@index([type])
  @@index([category])
  @@index([createdAt])
  @@map("documents")
}

model DocumentVersion {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  documentId     String   @db.Uuid
  versionNumber  Int
  storageKey     String   @db.VarChar(255)
  fileSizeBytes  BigInt
  sha256Checksum String   @db.VarChar(64)
  uploadedById   String   @db.Uuid
  reason         String?  @db.VarChar(255)
  createdAt      DateTime @default(now()) @db.Timestamptz(6)

  document       Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, versionNumber])
  @@map("document_versions")
}

model DocumentAccessLog {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  documentId   String   @db.Uuid
  userId       String   @db.Uuid
  action       String   @db.VarChar(30) // "PREVIEW", "DOWNLOAD", "AI_SCAN", "DELETE"
  ipAddress    String   @db.VarChar(45)
  userAgent    String?  @db.Text
  accessedAt   DateTime @default(now()) @db.Timestamptz(6)

  document     Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([documentId])
  @@index([userId])
  @@index([accessedAt])
  @@map("document_access_logs")
}

// ----------------------------------------------------
// AI Engine & Processing Pipeline
// ----------------------------------------------------

model AIProcessingJob {
  id              String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  documentId      String             @db.Uuid
  jobType         String             @db.VarChar(50) // "PASSPORT_MRZ", "FLIGHT_TICKET", "VISA", "CLASSIFY"
  status          AIJobStatus        @default(PENDING)
  modelName       String             @db.VarChar(80) // e.g. "gemini-1.5-flash", "tesseract-ocr-fallback"
  rawTextExtracted String?           @db.Text
  confidenceScore Decimal?           @db.Decimal(5, 2)
  errorMessage    String?            @db.Text
  startedAt       DateTime?          @db.Timestamptz(6)
  completedAt     DateTime?          @db.Timestamptz(6)
  createdAt       DateTime           @default(now()) @db.Timestamptz(6)

  document        Document           @relation(fields: [documentId], references: [id], onDelete: Cascade)
  extractionResult AIExtractionResult?

  @@index([documentId])
  @@index([status])
  @@map("ai_processing_jobs")
}

model AIExtractionResult {
  id              String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  jobId           String          @unique @db.Uuid
  extractedJson   Json            // Structured raw payload from AI
  verifiedJson    Json?           // Cleaned payload verified by human staff
  isVerified      Boolean         @default(false)
  verifiedById    String?         @db.Uuid
  verifiedAt      DateTime?       @db.Timestamptz(6)
  appliedToCustomer Boolean       @default(false)
  createdAt       DateTime        @default(now()) @db.Timestamptz(6)

  job             AIProcessingJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  verifiedBy      User?           @relation("VerifiedByUser", fields: [verifiedById], references: [id], onDelete: SetNull)

  @@map("ai_extraction_results")
}

model SearchEmbedding {
  id          String                 @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  documentId  String                 @db.Uuid
  branchId    String                 @db.Uuid
  chunkText   String                 @db.Text
  embedding   Unsupported("vector(768)") // pgvector 768-dim embeddings
  createdAt   DateTime               @default(now()) @db.Timestamptz(6)

  document    Document               @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([branchId])
  @@map("search_embeddings")
}

// ----------------------------------------------------
// Automated Reminders & Alerts
// ----------------------------------------------------

model Reminder {
  id             String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId     String          @db.Uuid
  type           ReminderType
  channel        ReminderChannel @default(DASHBOARD)
  title          String          @db.VarChar(200)
  message        String          @db.Text
  targetDate     DateTime        @db.Date
  leadDays       Int             // 180, 90, 30, 7, 1
  scheduledFor   DateTime        @db.Timestamptz(6)
  status         ReminderStatus  @default(SCHEDULED)
  sentAt         DateTime?       @db.Timestamptz(6)
  acknowledgedAt DateTime?       @db.Timestamptz(6)
  failureReason  String?         @db.Text
  createdAt      DateTime        @default(now()) @db.Timestamptz(6)
  updatedAt      DateTime        @updatedAt @db.Timestamptz(6)

  customer       Customer        @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([scheduledFor, status])
  @@index([customerId])
  @@map("reminders")
}

// ----------------------------------------------------
// Governance, Audit & DPDPA Consent
// ----------------------------------------------------

model CustomerConsent {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId     String   @db.Uuid
  purpose        String   @db.VarChar(120) // "PASSPORT_PROCESSING", "VISA_SUBMISSION", "WHATSAPP_UPDATES"
  isGranted      Boolean  @default(true)
  noticeVersion  String   @db.VarChar(20)  // "v1.0-2026"
  ipAddress      String?  @db.VarChar(45)
  recordedById   String   @db.Uuid
  recordedAt     DateTime @default(now()) @db.Timestamptz(6)
  revokedAt      DateTime? @db.Timestamptz(6)

  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId])
  @@map("customer_consents")
}

model AuditLog {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String?  @db.Uuid
  branchId     String?  @db.Uuid
  action       String   @db.VarChar(80)  // e.g. "CUSTOMER_CREATED", "PASSPORT_DOWNLOAD_URL_ISSUED"
  entityType   String   @db.VarChar(50)  // "CUSTOMER", "DOCUMENT", "USER", "REMINDER"
  entityId     String   @db.VarChar(100)
  oldStateJson Json?
  newStateJson Json?
  ipAddress    String   @db.VarChar(45)
  userAgent    String?  @db.Text
  timestamp    DateTime @default(now()) @db.Timestamptz(6)

  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  branch       Branch?  @relation(fields: [branchId], references: [id], onDelete: SetNull)

  @@index([entityType, entityId])
  @@index([timestamp])
  @@index([userId])
  @@map("audit_logs")
}
```

---

## 4. Key Architectural Decisions Summary

1. **Direct-to-S3 Presigned Uploads:** Prevents memory overload on the NestJS API server when travel staff upload multi-page passport/visa scan PDFs.
2. **Deterministic MRZ Check-Digit Validation:** ICAO Doc 9303 Part 3/4 verification catches OCR typos immediately before human review.
3. **Mandatory Human-in-the-Loop:** AI parses documents into a staging table (`ai_extraction_results`). Profiles are never overwritten without explicit staff confirmation.
4. **Tenant Scoping at Query Level:** Madurai and Trichy data remain strictly isolated using PostgreSQL query-level filters and branch guards.
5. **Aadhaar Masking and DPDPA Compliance:** Sensitive identification follows UIDAI regulations (`XXXX-XXXX-1234`) with immutable audit trails.
