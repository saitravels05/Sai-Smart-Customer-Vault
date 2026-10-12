# Phase 6: AI Document Intelligence & OCR Extraction Engine
**SAI SMART CUSTOMER VAULT** — SAI Tours & Travels (Madurai HO & Trichy BO)

---

## 1. Executive Summary
Phase 6 delivers an enterprise-grade AI extraction engine combining Google Gemini 3.8 Flash multimodal intelligence with a pure-TypeScript ICAO Doc 9303 Machine Readable Zone (MRZ) parser. It automates customer passport, visa, flight ticket, and national ID onboarding while enforcing Human-in-the-Loop (HITL) verification and Indian statutory privacy compliance (DPDPA 2023 & UIDAI Aadhaar masking).

---

## 2. Core Capabilities & Architecture

### 2.1 Pure TypeScript ICAO Doc 9303 MRZ Engine (`icao-mrz-parser.ts`)
- **TD3 (Passports):** 2 lines of 44 characters each.
- **TD1 (ID Cards):** 3 lines of 30 characters each.
- **TD2 (Visas/IDs):** 2 lines of 36 characters each.
- **7-3-1 Weighting Verification:** Computes and verifies standard ICAO check digits over document numbers, dates of birth (YYMMDD), expiration dates (YYMMDD), and composite records.
- **Forgery & Corruption Detection:** Immediately flags checksum discrepancies if OCR data is altered or unreadable.
- **Century Inference:** Context-aware century attribution for YYMMDD dates without year-2000 ambiguity.

### 2.2 Gemini Multimodal Document AI Service (`gemini.service.ts`)
- Utilizes `@google/genai` with model `gemini-3.8-flash`.
- Ingests scanned travel documents (PDF, JPEG, PNG).
- Enforces strict JSON schemas returning:
  - Document categorization (`PASSPORT`, `VISA`, `FLIGHT_TICKET`, `HOTEL_VOUCHER`, `AADHAAR_CARD`, `PAN_CARD`).
  - Structured metadata (full names, document numbers, nationalities, dates of birth, issue/expiry dates).
  - Confidence scoring per field (0.0 to 1.0).
  - Raw MRZ line extraction with automated handoff to the ICAO validator.
  - Fail-safe fallback algorithm for offline or simulated test environments.

### 2.3 End-to-End Pipeline & Audit State (`ai.service.ts` & `ai.controller.ts`)
- **Job Lifecycle:** Tracks `AIProcessingJob` state (`PENDING` -> `PROCESSING` -> `COMPLETED` / `FAILED`).
- **Structured Storage:** Persists raw and parsed outputs into `AIExtractionResult`.
- **Statutory Encryption & Masking:**
  - AES-256-GCM encryption with SHA-256 search hashing for sensitive passport numbers.
  - Strict UIDAI masking (`XXXX-XXXX-1234`) for Aadhaar cards.
- **Auto-Population Action:** `POST /api/v1/ai/jobs/:jobId/apply` automatically inserts or updates verified records into `Passport`, `Visa`, or `TravelBooking` tables.

### 2.4 Split-Screen Human-in-the-Loop UI (`ai-verification-modal.tsx`)
- **Dual-Pane Viewport:**
  - **Left Pane:** High-resolution document viewer for PDF or image source.
  - **Right Pane:** Categorized editable fields for staff review.
- **Visual Confidence Indicators:** Color-coded confidence pills (Green > 0.85, Amber 0.60–0.85, Red < 0.60).
- **ICAO Validation Status:** Live badge displaying mathematical MRZ check status (Verified / Checksum Mismatch).
- **Integrated Action:** One-click "Verify & Apply to Customer Profile" updates the profile with zero manual transcription errors.

---

## 3. Automated Test Verification

| Test Suite | Total Tests | Passed | Execution Time |
| :--- | :---: | :---: | :---: |
| **Phase 3 (Auth & Tenancy)** | 7 | 7 | 454 ms |
| **Phase 4 (Customer CRM)** | 7 | 7 | 8 ms |
| **Phase 5 (Document Vault)** | 13 | 13 | 73 ms |
| **Phase 6 (AI & MRZ Engine)** | 8 | 8 | 59 ms |
| **Database Suite (@sai/database)** | 7 | 7 | 281 ms |
| **Total Monorepo Tests** | **42** | **42** | **100% Passing** |

---

## 4. Key Endpoints Implemented

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/ai/extract` | Initiates AI extraction for an uploaded document |
| `GET` | `/api/v1/ai/jobs/:jobId` | Retrieves status and structured results of an extraction job |
| `POST` | `/api/v1/ai/jobs/:jobId/apply` | Commits verified extraction data into customer profile models |
| `POST` | `/api/v1/ai/mrz/validate` | Validates raw MRZ text lines using ICAO Doc 9303 algorithm |
