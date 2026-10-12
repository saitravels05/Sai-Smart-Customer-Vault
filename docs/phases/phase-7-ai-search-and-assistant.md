# Phase 7: AI Smart Search & SAI AI Assistant
**SAI SMART CUSTOMER VAULT** — SAI Tours & Travels (Madurai HO & Trichy BO)

---

## 1. Executive Summary
Phase 7 delivers a unified, natural language search engine and conversational AI operational assistant for **SAI TOURS & TRAVELS**. Built to empower travel agency consultants across Madurai Head Office and Trichy Branch Office, Phase 7 enables instant discovery of customers, expiring passports, destination visas, flight itineraries, and vault documents using plain English queries, while guaranteeing strict multi-branch tenancy isolation, prompt injection defense, and India DPDPA 2023 / UIDAI privacy compliance.

---

## 2. Core Capabilities & Architecture

### 2.1 Natural Language Search Intent Engine (`search-intent-parser.ts`)
- **Deterministic & Pattern Parsing:** Extracts search intent and entities from natural language queries:
  - `"Find the passport document for customer Kumar"` ➔ Entity: `customerName: "Kumar"`, `documentType: PASSPORT`
  - `"Show customers whose passports expire within 90 days"` ➔ Intent: `PASSPORT_EXPIRY`, `expiryDays: 90`
  - `"Find Singapore visa customers from Madurai"` ➔ Intent: `VISA_DESTINATION`, `destination: "Singapore"`, `branch: "Madurai"`
  - `"Show all flight tickets booked last month"` ➔ Intent: `FLIGHT_BOOKING`, `documentType: FLIGHT_TICKET`
  - `"Find customer documents uploaded yesterday"` ➔ Intent: `RECENT_UPLOADS`, date range filters
  - `"Search customer 9894821561"` ➔ Intent: `CUSTOMER`, `phone: "9894821561"`
  - `"Find file SAI-2026-0042"` ➔ Intent: `CUSTOMER`, `customerNumber: "SAI-2026-0042"`
  - Raw Passport numbers (e.g. `L898902C3`) ➔ SHA-256 blind indexing query with role-based clearance.

### 2.2 Multi-Entity Hybrid Search Service (`search.service.ts`)
- **Query Execution:** Runs cross-table queries across `Customer`, `Passport`, `Visa`, `TravelBooking`, and `Document`.
- **Tenancy Scoping:**
  - `SUPER_ADMIN`: Cross-branch clearance across Madurai HO and Trichy BO.
  - `BRANCH_MANAGER` / `STAFF`: Strictly confined to assigned branch ID (`403 Forbidden` if attempting cross-branch query).
- **Statutory PII Masking:**
  - Masked Aadhaar: `XXXX-XXXX-1234`
  - Masked Passport: `L8***C3`
- **Tamper-Evident Audit Logging:** Every search query is recorded in `AuditLog` (`action: "SMART_SEARCH_EXECUTED"`).

### 2.3 SAI AI Assistant & RAG Grounding Engine (`assistant.service.ts`)
- **Dual Context Modes:**
  - **Global Travel Desk Context:** Scoped to the consultant's branch for fleet-wide queries (e.g., expiring passports, destination visas).
  - **Customer Profile Drawer Context:** Focused retrieval on a single customer's full travel portfolio, passports, visas, bookings, and document vault.
- **Gemini 3.8 Flash Integration:** Uses `@google/genai` with model `gemini-3.8-flash` for contextual responses.
- **Deterministic RAG Fallback:** Guarantees zero downtime by synthesizing structured database records with exact citations if offline.
- **Source Citations:** Generates interactive source badges linking to customer profiles (`/customers/:id`) and documents.
- **Prompt Injection Defense (`assistant-safety.ts`):** Rejects jailbreak patterns (`ignore previous instructions`, `override branch filters`, `drop table`).

### 2.4 Modern Web User Interfaces
- **AI Smart Search Page (`/search`):**
  - Search input with debounce and sample question chips.
  - Real-time intent interpretation banner with execution timing.
  - Filtered tabs: `All`, `Customers`, `Passports`, `Visas`, `Bookings`, `Documents`.
  - Quick action buttons (View Profile, Direct Call, Direct WhatsApp).
- **SAI AI Assistant Page (`/ai-assistant`):**
  - Conversational chat thread with suggestions.
  - Verified source citation cards linking directly to customer files.
  - DPDPA 2023 compliance badge and reset chat capability.
- **Global Header Search Integration (`header.tsx`):**
  - Topbar search input with shortcut hint submitting directly to `/search`.

---

## 3. Automated Test Verification

| Test Suite | Tests | Passed | Execution Time |
| :--- | :---: | :---: | :---: |
| **Phase 3 (Auth & Tenancy)** | 7 | 7 | 313 ms |
| **Phase 4 (Customer CRM)** | 7 | 7 | 7 ms |
| **Phase 5 (Document Vault)** | 13 | 13 | 67 ms |
| **Phase 6 (AI & MRZ Engine)** | 8 | 8 | 20 ms |
| **Phase 7 (Smart Search & Assistant)** | 12 | 12 | 23 ms |
| **Database Suite (@sai/database)** | 7 | 7 | 293 ms |
| **Total Monorepo Tests** | **54** | **54** | **100% Passing** |

---

## 4. Key Endpoints Implemented

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/search` | Natural language multi-entity hybrid search with tenancy filters |
| `POST` | `/api/v1/search/interpret` | Parses a natural language query into intent and detected entities |
| `POST` | `/api/v1/assistant/chat` | RAG-grounded conversational AI assistant endpoint |
| `GET` | `/api/v1/assistant/suggestions` | Returns recommended starter questions for travel consultants |
