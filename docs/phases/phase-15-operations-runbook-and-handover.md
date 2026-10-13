# Phase 15: Operations Runbook, Staff Manual (Bilingual) & Production Go-Live Checklist

## Overview
**Phase 15** marks the final delivery and operational handover of the **SAI SMART CUSTOMER VAULT** enterprise system for **SAI TOURS & TRAVELS** (Madurai Head Office & Trichy Branch).

This document serves as the master operations runbook, bilingual training reference (English / தமிழ்), security governance protocol, and go-live deployment manual.

---

## 1. Daily Staff Operations Workflow

### Morning Travel Desk Checklist
1. **Log in to Portal:** Access `https://vault.saitravelservices.com/login` using your staff credentials.
2. **Review Expiry Alerts (`/reminders`):**
   - Inspect passports and visas expiring within **180 days**, **90 days**, **60 days**, and **30 days**.
   - Review critical flight departures scheduled in the next 3 days.
3. **Dispatch 1-Click WhatsApp Reminders:**
   - Click the green **WhatsApp** button beside any expiring record.
   - For Tamil-speaking customers, switch the language toggle to **தமிழ்** to generate the authentic Tamil message emphasizing the statutory 6-month international travel validity rule (*சர்வதேச பயண 6 மாத கால அவகாசம்*).
4. **New Customer Registration (`/customers/new`):**
   - Record customer demographics and contact numbers.
   - Enter national ID (Aadhaar number) — the system automatically sanitizes and stores it in masked format `XXXX-XXXX-1234` in compliance with UIDAI regulations.
5. **Drag-and-Drop Document Vaulting (`/documents`):**
   - Upload customer passport photo pages or visa approval letters (PDF/JPEG/PNG).
   - The AI OCR engine extracts the ICAO Doc 9303 Machine Readable Zone (MRZ) and pre-fills passport number, issue/expiry dates, and nationality.
   - Verify the extracted fields and approve them to automatically store credentials under AES-256-GCM encryption.

---

## 2. Managerial & Statutory Compliance Protocols

### A. DPDPA 2023 Consent Management
- **Recording Consent:** In the customer's profile under **DPDPA & Privacy**, click **Record New Consent**. Select purpose (`PASSPORT_PROCESSING`, `VISA_APPLICATION`, `FLIGHT_BOOKING`, `WHATSAPP_ALERTS`, or `DOCUMENT_VAULT_STORAGE`).
- **Consent Revocation:** If a client requests to opt out of WhatsApp alerts or promotional updates, click **Revoke** on that specific consent record and enter the written justification.

### B. Statutory Right to Erasure / Profile Anonymization (Section 12)
- When a customer formally exercises their right to data erasure:
  1. Open customer profile -> Navigate to **DPDPA & Privacy**.
  2. Click **Execute Right to Erasure** (requires Manager or Super Admin role).
  3. Enter the written statutory justification and type `ANONYMIZE` to confirm.
  4. The system permanently redacts personal identifiers while keeping financial transaction UUIDs for GST tax auditing.

### C. Cryptographic Audit Seal Verification (`/audit-logs`)
- Open the **Audit Logs** dashboard.
- Click **Verify Cryptographic Seals** to re-calculate all SHA-256 tamper-proof checksums across the audit trail.
- Confirm that all entries display `SEAL VERIFIED (TAMPER-FREE)`.

---

## 3. Bilingual Staff Reference Card (தமிழ் வழிகாட்டி)

### தமிழ் பணியாளர் வழிகாட்டுதல்கள் (Madurai & Trichy Desk)

| ஆங்கிலம் (English) | தமிழ் (Tamil) | பணியாளர் செய்ய வேண்டியவை (Action) |
|---|---|---|
| **Dashboard** | முகப்புப்பலகை | தினசரி பயண பதிவுகள் மற்றும் நினைவூட்டல்களைப் பார்க்கவும் |
| **Customer Vault** | வாடிக்கையாளர் களஞ்சியம் | புதிய வாடிக்கையாளர் விபரங்கள் மற்றும் குடும்ப உறுப்பினர்களை இணைக்கவும் |
| **Document Vault** | ஆவணக் களஞ்சியம் | கடவுச்சீட்டு மற்றும் விசா நகல்களைப் பதிவேற்றி பாதுகாக்கவும் (AES-256) |
| **AI Smart Search** | AI நுண்ணறிவுத் தேடல் | வாடிக்கையாளர் பெயர், கடவுச்சீட்டு எண் அல்லது பயண தேதியை நொடியில் தேடவும் |
| **Expiry Reminders** | காலாவதி நினைவூட்டல்கள் | 180 நாள் கடவுச்சீட்டு காலாவதி அறிவிப்புகளை வாட்ஸ்அப் மூலம் வாடிக்கையாளருக்கு அனுப்பவும் |
| **DPDPA Privacy** | தரவு பாதுகாப்பு & சம்மதம் | வாடிக்கையாளரின் சம்மதத்தை (Consent) பதிவு செய்யவும்; சட்டப்பூர்வ erasure கோரிக்கைகளை நிறைவேற்றவும் |

---

## 4. Disaster Recovery & System Maintenance Runbook

### A. Database Backup (Daily Cron Job)
```bash
# Automated nightly pg_dump backup with timestamp
docker compose exec postgres pg_dump -U postgres sai_vault_prod > /backup/sai_vault_$(date +%Y%m%d_%H%M%S).sql
```

### B. Point-in-Time Restoration
```bash
# Restore database from backup SQL
docker compose exec -T postgres psql -U postgres -d sai_vault_prod < /backup/sai_vault_20261013.sql
```

### C. Encrypted Vault Storage Backup
```bash
# Backup encrypted upload artifacts
tar -czvf /backup/vault_uploads_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/sai_vault_uploads/_data
```

### D. Service Health Diagnostic Probes
- **Liveness:** `curl -s http://localhost:4000/api/v1/health/liveness`
- **Readiness:** `curl -s http://localhost:4000/api/v1/health/readiness`
- **Smoke Runner:** `node scripts/smoke-test.js`

---

## 5. Production Go-Live Checklist

- [x] **Monorepo Architecture:** Clean Turborepo with shared types and packages (`pnpm build` passing).
- [x] **Database Engine:** PostgreSQL 16 with `pgvector` vector embeddings and field encryption.
- [x] **Multi-Branch Tenancy:** Separate data isolation for Madurai Head Office & Trichy Branch.
- [x] **Credential Vault:** AES-256-GCM encryption with blind SHA-256 hash search index.
- [x] **AI Intelligence:** Google Gemini 1.5 Flash + ICAO Doc 9303 TD3 MRZ OCR extraction.
- [x] **Smart Reminders:** 180, 90, 60, 30-day passport & visa lead time triggers with 1-click WhatsApp web dispatch.
- [x] **Localization:** Authentic Tamil (`ta`) and English (`en`) bilingual translations.
- [x] **Statutory Compliance:** UIDAI Aadhaar masking + DPDPA 2023 Consent Lifecycle + Right to Erasure.
- [x] **Tamper-Proof Audit Trail:** Deterministic SHA-256 cryptographic seals on every event.
- [x] **Automated Test Coverage:** 94 / 94 tests passing (0 failures).
- [x] **Container Deployment:** Multi-stage Dockerfiles + `docker-compose.yml` + Nginx Gateway.
