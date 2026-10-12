-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'READ_ONLY');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED');
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "ServiceCategory" AS ENUM ('PASSPORT_SERVICES', 'TOURIST_VISA', 'BUSINESS_VISA', 'FLIGHT_BOOKING', 'HOTEL_BOOKING', 'TOUR_PACKAGES', 'CERTIFICATE_ATTESTATION', 'GAZETTE_SERVICES', 'TRANSPORT_RENTALS', 'OTHER_TRAVEL_SERVICES');
CREATE TYPE "DocumentCategory" AS ENUM ('IDENTITY_DOCUMENT', 'TRAVEL_DOCUMENT', 'BUSINESS_DOCUMENT', 'APPLICATION_DOCUMENT', 'ATTESTATION_DOCUMENT');
CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'AADHAAR_MASKED', 'PAN_CARD', 'VOTER_ID', 'DRIVING_LICENCE', 'BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'FLIGHT_TICKET', 'E_TICKET', 'BOARDING_PASS', 'VISA_COPY', 'VISA_APPROVAL_LETTER', 'TRAVEL_INSURANCE', 'HOTEL_BOOKING_CONFIRMATION', 'TOUR_ITINERARY', 'IMMIGRATION_DOCUMENT', 'INVOICE', 'PAYMENT_RECEIPT', 'CUSTOMER_APPLICATION', 'EMPLOYER_NOC_LETTER', 'BUSINESS_INVITATION_LETTER', 'UNDERTAKING_LETTER', 'ATTESTATION_CERTIFICATE', 'OTHER');
CREATE TYPE "AIJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'VERIFIED', 'REJECTED', 'FAILED');
CREATE TYPE "ReminderType" AS ENUM ('PASSPORT_EXPIRY', 'VISA_EXPIRY', 'TRAVEL_INSURANCE_EXPIRY', 'UPCOMING_FLIGHT_DEPARTURE', 'HOTEL_CHECKIN', 'DOCUMENT_RENEWAL', 'VISA_APPLICATION_FOLLOWUP');
CREATE TYPE "ReminderChannel" AS ENUM ('DASHBOARD', 'EMAIL', 'WHATSAPP');
CREATE TYPE "ReminderStatus" AS ENUM ('SCHEDULED', 'SENT', 'ACKNOWLEDGED', 'DISMISSED', 'FAILED');

-- CreateTable branches
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "state" VARCHAR(50) NOT NULL DEFAULT 'Tamil Nadu',
    "country" VARCHAR(50) NOT NULL DEFAULT 'India',
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "isHeadOffice" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(150) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "mfaSecret" VARCHAR(255),
    "isMfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ(6),
    "currentSessionId" VARCHAR(255),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable staff_profiles
CREATE TABLE "staff_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "staffCode" VARCHAR(20) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "designation" VARCHAR(80) NOT NULL,
    "contactNumber" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable customers
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerNumber" VARCHAR(25) NOT NULL,
    "branchId" UUID NOT NULL,
    "assignedStaffId" UUID,
    "fullName" VARCHAR(150) NOT NULL,
    "dateOfBirth" DATE,
    "gender" "Gender" NOT NULL DEFAULT 'UNSPECIFIED',
    "nationality" VARCHAR(60) NOT NULL DEFAULT 'Indian',
    "primaryPhone" VARCHAR(20) NOT NULL,
    "whatsappNumber" VARCHAR(20),
    "email" VARCHAR(120),
    "addressLine" TEXT,
    "city" VARCHAR(60),
    "state" VARCHAR(60) DEFAULT 'Tamil Nadu',
    "postalCode" VARCHAR(15),
    "country" VARCHAR(60) DEFAULT 'India',
    "primaryCategory" "ServiceCategory" NOT NULL DEFAULT 'PASSPORT_SERVICES',
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "registeredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMPTZ(6),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable customer_contacts
CREATE TABLE "customer_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "contactType" VARCHAR(30) NOT NULL,
    "contactValue" VARCHAR(100) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable customer_relationships
CREATE TABLE "customer_relationships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "relativeId" UUID NOT NULL,
    "relationship" VARCHAR(40) NOT NULL,
    "groupName" VARCHAR(80),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable customer_services
CREATE TABLE "customer_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "serviceCategory" "ServiceCategory" NOT NULL,
    "serviceName" VARCHAR(150) NOT NULL,
    "serviceDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable passports
CREATE TABLE "passports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "passportNumberEnc" VARCHAR(255) NOT NULL,
    "passportNumberMask" VARCHAR(20) NOT NULL,
    "passportHash" VARCHAR(64) NOT NULL,
    "issuingCountry" VARCHAR(10) NOT NULL DEFAULT 'IND',
    "issueDate" DATE,
    "expiryDate" DATE NOT NULL,
    "placeOfIssue" VARCHAR(80),
    "mrzRawLine1" VARCHAR(60),
    "mrzRawLine2" VARCHAR(60),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable visas
CREATE TABLE "visas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "country" VARCHAR(60) NOT NULL,
    "visaNumberEnc" VARCHAR(255),
    "visaCategory" VARCHAR(50) NOT NULL,
    "issueDate" DATE,
    "expiryDate" DATE NOT NULL,
    "durationOfStayDays" INTEGER,
    "entriesPermitted" VARCHAR(20) NOT NULL DEFAULT 'SINGLE',
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "visas_pkey" PRIMARY KEY ("id")
);

-- CreateTable travel_bookings
CREATE TABLE "travel_bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "bookingRef" VARCHAR(40) NOT NULL,
    "pnr" VARCHAR(20),
    "airline" VARCHAR(80),
    "flightNumber" VARCHAR(30),
    "originAirport" VARCHAR(10),
    "destAirport" VARCHAR(10),
    "departureTime" TIMESTAMPTZ(6),
    "arrivalTime" TIMESTAMPTZ(6),
    "hotelName" VARCHAR(150),
    "checkInDate" DATE,
    "checkOutDate" DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "travel_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable documents
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "storageKey" VARCHAR(255) NOT NULL,
    "bucketName" VARCHAR(100) NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sha256Checksum" VARCHAR(64) NOT NULL,
    "isEncryptedAtRest" BOOLEAN NOT NULL DEFAULT true,
    "isMalwareClean" BOOLEAN NOT NULL DEFAULT false,
    "scanCompletedAt" TIMESTAMPTZ(6),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable document_versions
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageKey" VARCHAR(255) NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "sha256Checksum" VARCHAR(64) NOT NULL,
    "uploadedById" UUID NOT NULL,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable document_access_logs
CREATE TABLE "document_access_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "accessedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable ai_processing_jobs
CREATE TABLE "ai_processing_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "jobType" VARCHAR(50) NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "modelName" VARCHAR(80) NOT NULL,
    "rawTextExtracted TEXT,
    "confidenceScore" DECIMAL(5,2),
    "errorMessage" TEXT,
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable ai_extraction_results
CREATE TABLE "ai_extraction_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobId" UUID NOT NULL,
    "extractedJson" JSONB NOT NULL,
    "verifiedJson" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMPTZ(6),
    "appliedToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_extraction_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable reminders
CREATE TABLE "reminders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "type" "ReminderType" NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'DASHBOARD',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "targetDate" DATE NOT NULL,
    "leadDays" INTEGER NOT NULL,
    "scheduledFor" TIMESTAMPTZ(6) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'SCHEDULED',
    "sentAt" TIMESTAMPTZ(6),
    "acknowledgedAt" TIMESTAMPTZ(6),
    "failureReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable customer_consents
CREATE TABLE "customer_consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL,
    "purpose" VARCHAR(120) NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "noticeVersion" VARCHAR(20) NOT NULL,
    "ipAddress" VARCHAR(45),
    "recordedById" UUID NOT NULL,
    "recordedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),

    CONSTRAINT "customer_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable audit_logs
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "branchId" UUID,
    "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "oldStateJson" JSONB,
    "newStateJson" JSONB,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "staff_profiles_userId_key" ON "staff_profiles"("userId");
CREATE UNIQUE INDEX "staff_profiles_staffCode_key" ON "staff_profiles"("staffCode");
CREATE UNIQUE INDEX "customers_customerNumber_key" ON "customers"("customerNumber");
CREATE INDEX "customers_branchId_idx" ON "customers"("branchId");
CREATE INDEX "customers_primaryPhone_idx" ON "customers"("primaryPhone");
CREATE INDEX "customers_fullName_idx" ON "customers"("fullName");
CREATE INDEX "customers_status_idx" ON "customers"("status");
CREATE INDEX "customers_registeredAt_idx" ON "customers"("registeredAt");
CREATE UNIQUE INDEX "customer_relationships_customerId_relativeId_relationship_key" ON "customer_relationships"("customerId", "relativeId", "relationship");
CREATE INDEX "customer_services_customerId_serviceCategory_idx" ON "customer_services"("customerId", "serviceCategory");
CREATE UNIQUE INDEX "passports_passportHash_key" ON "passports"("passportHash");
CREATE INDEX "passports_expiryDate_idx" ON "passports"("expiryDate");
CREATE INDEX "passports_customerId_idx" ON "passports"("customerId");
CREATE INDEX "visas_expiryDate_idx" ON "visas"("expiryDate");
CREATE INDEX "visas_customerId_idx" ON "visas"("customerId");
CREATE INDEX "travel_bookings_departureTime_idx" ON "travel_bookings"("departureTime");
CREATE INDEX "travel_bookings_customerId_idx" ON "travel_bookings"("customerId");
CREATE UNIQUE INDEX "documents_storageKey_key" ON "documents"("storageKey");
CREATE INDEX "documents_customerId_idx" ON "documents"("customerId");
CREATE INDEX "documents_type_idx" ON "documents"("type");
CREATE INDEX "documents_category_idx" ON "documents"("category");
CREATE INDEX "documents_createdAt_idx" ON "documents"("createdAt");
CREATE UNIQUE INDEX "document_versions_documentId_versionNumber_key" ON "document_versions"("documentId", "versionNumber");
CREATE INDEX "document_access_logs_documentId_idx" ON "document_access_logs"("documentId");
CREATE INDEX "document_access_logs_userId_idx" ON "document_access_logs"("userId");
CREATE INDEX "document_access_logs_accessedAt_idx" ON "document_access_logs"("accessedAt");
CREATE INDEX "ai_processing_jobs_documentId_idx" ON "ai_processing_jobs"("documentId");
CREATE INDEX "ai_processing_jobs_status_idx" ON "ai_processing_jobs"("status");
CREATE UNIQUE INDEX "ai_extraction_results_jobId_key" ON "ai_extraction_results"("jobId");
CREATE INDEX "reminders_scheduledFor_status_idx" ON "reminders"("scheduledFor", "status");
CREATE INDEX "reminders_customerId_idx" ON "reminders"("customerId");
CREATE INDEX "customer_consents_customerId_idx" ON "customer_consents"("customerId");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- Foreign Keys
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_relationships" ADD CONSTRAINT "customer_relationships_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_relationships" ADD CONSTRAINT "customer_relationships_relativeId_fkey" FOREIGN KEY ("relativeId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_services" ADD CONSTRAINT "customer_services_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "passports" ADD CONSTRAINT "passports_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visas" ADD CONSTRAINT "visas_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "travel_bookings" ADD CONSTRAINT "travel_bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_processing_jobs" ADD CONSTRAINT "ai_processing_jobs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_extraction_results" ADD CONSTRAINT "ai_extraction_results_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ai_processing_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_extraction_results" ADD CONSTRAINT "ai_extraction_results_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_consents" ADD CONSTRAINT "customer_consents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
