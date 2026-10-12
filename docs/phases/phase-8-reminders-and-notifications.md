# Phase 8: Smart Expiry Reminder System & Automated Notifications
**SAI SMART CUSTOMER VAULT** — SAI Tours & Travels (Madurai HO & Trichy BO)

---

## 1. Executive Summary
Phase 8 delivers an automated, multi-tier document expiry tracking and notification engine for **SAI TOURS & TRAVELS**. Operating across the Madurai Head Office and Trichy Branch Office, Phase 8 proactively prevents customer travel disruption caused by expired passports, expiring visas, or missed flight check-ins. The engine implements strict 6-month international travel validity tracking, multi-channel notifications (WhatsApp Business API, Email, Dashboard), DPDPA 2023 customer consent auditing, and deduplicated background scanning.

---

## 2. Core Capabilities & Architecture

### 2.1 Multi-Tier Milestone & Severity Calculator (`reminder-calculator.ts`)
- **Configurable Lead Intervals:** `180`, `90`, `60`, `30`, `7`, and `1` days before target date, plus expired tracking (`< 0` days).
- **Severity Classification:**
  - `CRITICAL`: $\le 7$ days until target date (immediate flight departure or imminent expiry).
  - `HIGH`: $\le 30$ days until target date (visa renewals, upcoming travel).
  - `MEDIUM`: $\le 90$ days until target date.
  - `LOW`: $\le 180$ days until target date (mandatory international 6-month passport validity window).
  - `EXPIRED`: Past target date ($< 0$ days).
- **Standardized Travel Desk Copy:**
  - Automated copy incorporates official travel desk contacts (Madurai HO: `+91 9894821561` / Trichy BO: `+91 9894619921`) and explains the international 6-month validity requirement.

### 2.2 WhatsApp Business Dispatch & Consent Auditing (`whatsapp-notifier.ts`)
- **DPDPA 2023 Consent Verification:** Checks `CustomerConsent` table (`purpose: "WHATSAPP_UPDATES"`). If consent is revoked, dispatch is aborted with an audit trail, automatically falling back to internal staff Dashboard alerts.
- **Official Message Formatting:** Prepares branded templates with travel alert headers and branch contact signatures.
- **1-Click Web Dispatch:** Formats direct `https://wa.me/91[PHONE]?text=[ENCODED_MESSAGE]` URLs for staff immediate follow-up.

### 2.3 Automated Background Scanner & Reminders Service (`reminders.service.ts`)
- **Automated Scanning (`POST /api/v1/reminders/scan`):**
  - Scans active customer Passports ($\le 180$ days).
  - Scans active Visas ($\le 90$ days).
  - Scans Travel Bookings ($\le 7$ days).
- **Deduplication Engine:** Evaluates `(customerId, type, targetDate, leadDays)` to guarantee zero duplicate reminder spam.
- **Branch Tenancy Scoping:**
  - Non-Super Admin travel staff are strictly restricted to alerts for their branch (`customer.branchId = user.branchId`).
  - Cross-branch access attempts are rejected with `403 Forbidden`.
- **Alert Lifecycle Management:**
  - Endpoints to `acknowledge` (mark resolved by staff), `dismiss`, or manually trigger `dispatch`.

### 2.4 Smart Expiry Reminders Dashboard UI (`/reminders`)
- **Metrics Ribbon:** Real-time counts for Critical ($\le 7$d), Urgent ($\le 30$d), 6-Month Rule ($\le 180$d), Expired, and Active alerts.
- **Filter Controls:** Filter by event type (`PASSPORT_EXPIRY`, `VISA_EXPIRY`, `FLIGHT_DEPARTURE`), status, or channel.
- **Action Feed:** Displays customer details, customer ID, branch badge, severity pill, message copy, and 1-click WhatsApp button.

---

## 3. Automated Test Verification

| Test Suite | Total Tests | Passed | Execution Time |
| :--- | :---: | :---: | :---: |
| **Phase 3 (Auth & Tenancy)** | 7 | 7 | 445 ms |
| **Phase 4 (Customer CRM)** | 7 | 7 | 8 ms |
| **Phase 5 (Document Vault)** | 13 | 13 | 72 ms |
| **Phase 6 (AI & MRZ Engine)** | 8 | 8 | 66 ms |
| **Phase 7 (Smart Search & Assistant)** | 12 | 12 | 22 ms |
| **Phase 8 (Reminders & Notifications)** | 10 | 10 | 18 ms |
| **Database Suite (@sai/database)** | 7 | 7 | 303 ms |
| **Total Monorepo Tests** | **64** | **64** | **100% Passing** |

---

## 4. Key Endpoints Implemented

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/reminders` | Retrieves branch-scoped reminders with status/type/channel filters |
| `GET` | `/api/v1/reminders/stats` | Aggregated dashboard metrics across urgency tiers and channels |
| `POST` | `/api/v1/reminders/scan` | Triggers background expiry scan and deduplicated reminder creation |
| `POST` | `/api/v1/reminders/:id/acknowledge` | Marks a reminder as acknowledged by travel consultant |
| `POST` | `/api/v1/reminders/:id/dismiss` | Dismisses a reminder from active queues |
| `POST` | `/api/v1/reminders/:id/dispatch` | Dispatches notification via WhatsApp / Email with audit trail |
