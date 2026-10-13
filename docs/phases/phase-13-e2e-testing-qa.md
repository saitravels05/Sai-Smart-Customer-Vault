# Phase 13: End-to-End Enterprise Journey Testing & Quality Assurance (QA)

## Overview
**Phase 13** delivers full-scale verification, health observability, and end-to-end regression validation for **SAI SMART CUSTOMER VAULT** across **SAI TOURS & TRAVELS** operations.

It introduces container liveness and readiness diagnostic probes, multi-tenant lifecycle simulation tests, and automated smoke testing runners.

---

## 1. Quality Assurance Architecture

### A. Observability & Health Probes (`/api/v1/health/`)
- **API Health Diagnostic (`/health`):**
  - Returns service status, node runtime version, uptime, and real-time process memory consumption (RSS, Heap Used, Heap Total in MB).
- **Liveness Probe (`/health/liveness`):**
  - High-frequency container health check for Kubernetes / Docker orchestrators to detect process lockup.
- **Deep Readiness Probe (`/health/readiness`):**
  - Real-time evaluation of critical infrastructure components:
    - **PostgreSQL Database Engine:** Direct ping with latency measurement in milliseconds.
    - **Vault Storage Engine:** Filesystem write & purge verification to guarantee document uploads can be processed.
    - **AI Intelligence Engine:** Verification of Google Gemini 1.5 Flash configuration and vector embeddings.
    - **Compliance Engine:** Validation of DPDPA 2023 `v2023.1` notice and UIDAI Aadhaar masking enforcement.

### B. End-to-End Customer Journey Simulation (`e2e-workflow.spec.ts`)
Validates the complete 7-step customer travel lifecycle:
1. **Multi-Branch Tenancy Isolation:** Verifies separate branch scopes for Madurai Head Office (`MDR-HO`) and Trichy Branch (`TRY-BR`).
2. **Customer Intake & UIDAI Aadhaar Masking:** Verifies raw 12-digit Aadhaar input is automatically obscured to `XXXX-XXXX-1234` and validates rejection of unmasked numbers.
3. **AES-256-GCM Vaulting & Blind Hash Indexing:** Verifies cryptographic credential encryption and deterministic SHA-256 hash generation for fast exact-match lookups.
4. **180-Day Passport Validity & Bilingual WhatsApp Dispatch:** Validates statutory 6-month validity threshold calculation and generates localized English & authentic Tamil (`ta`) WhatsApp renewal links.
5. **DPDPA 2023 Consent Lifecycle:** Verifies typed consent purposes (`PASSPORT_PROCESSING`, `VISA_APPLICATION`, etc.) and statutory notice metadata.
6. **Cryptographic SHA-256 Tamper Seal:** Verifies deterministic 64-character hash seal generation and single-byte tampering detection.
7. **DPDPA Section 12 Right to Erasure:** Verifies irreversible PII redaction (`[DPDPA ANONYMIZED]`) while retaining anonymized ledger UUIDs for GST compliance.

---

## 2. Live Smoke Testing Runner (`scripts/smoke-test.js`)
A production verification script that queries live running servers and confirms HTTP 200 responses across:
- `http://localhost:4000/api/v1/health` — API Health Status Probe
- `http://localhost:4000/api/v1/health/liveness` — Container Liveness Probe
- `http://localhost:4000/api/v1/health/readiness` — Deep Infrastructure Readiness Probe
- `http://localhost:3000/login` — Next.js 14 Web Portal Interface

---

## 3. Test Coverage Summary
- **Total Monorepo Tests Passing:** **94 / 94 tests** (0 failures, 100% pass rate).
  - 87 API & E2E Tests in `@sai/api`.
  - 7 Security & Encryption Tests in `@sai/database`.
- **Live Smoke Test:** 4 / 4 probes successfully verified against active running ports.
