# Phase 12: Security Hardening & Statutory Privacy Compliance (DPDPA 2023 & UIDAI Guidelines)

## Overview
**Phase 12** elevates **SAI SMART CUSTOMER VAULT** to institutional-grade security and full compliance with India's **Digital Personal Data Protection Act (DPDPA 2023)** and **UIDAI Aadhaar Regulatory Directives** for travel operators.

Travel agencies handle highly sensitive citizen identity artifacts—passports, visas, and national identity numbers—which require stringent data fiduciary safeguards, explicit consent lifecycle tracking, statutory right to erasure, and tamper-proof cryptographic audit trails.

---

## 1. Statutory Compliance Architecture

### A. UIDAI Aadhaar Masking Policy
- **Directive Compliance:** In accordance with UIDAI regulations, travel agencies are prohibited from storing or displaying raw 12-digit Aadhaar numbers in plaintext.
- **Sanitization & Masking:** All Aadhaar numbers pass through `sanitizeAadhaarNumber()`, obscuring the first 8 digits into standard display format: `XXXX-XXXX-1234`.
- **Validation:** Strict regex validation `isValidMaskedAadhaar()` verifies adherence across inputs and reports.

### B. DPDPA 2023 Consent Lifecycle Registry
- **Purposes Tracked:**
  1. `PASSPORT_PROCESSING` — Verification and consular presentation.
  2. `VISA_APPLICATION` — Official embassy and VFS lodgment.
  3. `FLIGHT_BOOKING` — Airline GDS / PNR reservation and ticketing.
  4. `WHATSAPP_ALERTS` — Automated document expiry alerts and flight updates.
  5. `DOCUMENT_VAULT_STORAGE` — AES-256-GCM encrypted cloud/local storage.
  6. `MARKETING_UPDATES` — Travel packages and visa policy newsletters.
- **Bilingual Statutory Notice:** Pre-configured disclaimers in **English** and **Tamil (தமிழ்)** referencing statutory notice version `v2023.1`.
- **Consent Revocation:** Instant withdrawal mechanism with mandatory audit logging and reason recording.

### C. Statutory Right to Erasure / Profile Anonymization (DPDPA Section 12)
- **Problem Solved:** When a client completes their travel engagement or submits a legal erasure request, their PII must be permanently eradicated while ensuring past financial transaction IDs remain verifiable for statutory GST audits.
- **Action:**
  - `fullName` is replaced with `[DPDPA ANONYMIZED]`.
  - `email`, `primaryPhone`, `whatsappNumber`, and `addressLine` are scrubbed.
  - Linked passports and uploaded documents are securely expunged.
  - System status transitions to `ARCHIVED` with audit trail recording.

### D. Cryptographic Audit Log Seal & Tamper Verification
- **SHA-256 Chain Seal:** Every audit log record generates a deterministic 64-character SHA-256 hash sealing its `id`, `action`, `entityType`, `entityId`, `branchId`, `userId`, `timestamp`, and state payloads.
- **Integrity Verifier:** `GET /compliance/audit-logs/verify-integrity` recalculates checksums dynamically, identifying unauthorized database alterations or record tampering.

---

## 2. API Endpoints (`/api/v1/compliance/`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/compliance/customers/:id/consents` | Authenticated Staff | Record informed DPDPA consent with notice version |
| `GET` | `/compliance/customers/:id/consents` | Authenticated Staff | Retrieve active & revoked consent records |
| `POST` | `/compliance/customers/:id/consents/:consentId/revoke` | Authenticated Staff | Revoke consent with mandatory legal justification |
| `POST` | `/compliance/customers/:id/anonymize` | Manager / Super Admin | Execute statutory DPDPA Section 12 Right to Erasure |
| `GET` | `/compliance/audit-logs` | Manager / Super Admin | Branch-scoped query of immutable audit log trail |
| `GET` | `/compliance/audit-logs/verify-integrity` | Manager / Super Admin | Compute cryptographic SHA-256 seal verification |

---

## 3. UI Interfaces

1. **Immutable Audit Trail Dashboard (`/audit-logs`):**
   - Live queryable table displaying actions, staff authors, branches, and timestamps.
   - Interactive Cryptographic Integrity Verifier badge checking SHA-256 seals.
   - JSON Inspector modal for before/after state diff examination.
2. **Customer 360° Profile Integration (`/customers/[id]`):**
   - Dedicated **DPDPA & Privacy** tab.
   - Active Consent Registry with quick "Record Consent" and "Revoke" modals.
   - Bilingual English/Tamil statutory policy disclosure card.
   - DPDPA Section 12 Right to Erasure execution modal with strict double confirmation.

---

## 4. Test Coverage & Quality Verification
- **Automated Tests:** 7 comprehensive test suites in `apps/api/src/modules/compliance/compliance.spec.ts`.
- **Monorepo Test Pass Rate:** 85 / 85 tests passing (78 API + 7 Database).
- **Production Build:** Next.js 14 compiles all 14 routes with 0 errors (`pnpm --filter @sai/web build`).
