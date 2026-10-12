# Phase 10: Customer Profile 360° Interface & Advanced Customer Features
**SAI SMART CUSTOMER VAULT** — SAI Tours & Travels (Madurai HO & Trichy BO)

---

## 1. Executive Summary
Phase 10 delivers a 360-degree customer management command center for **SAI TOURS & TRAVELS**. The interface unifies customer identity, encrypted travel credentials (passports & visas), flight & hotel booking histories, document vaults, internal staff communications, family/group traveler networks, and chronological audit histories into a responsive interface. 

Additionally, Phase 10 introduces the **6-Month International Passport Validity Rule** alert system, an automated **Duplicate Profile Detection Algorithm**, and an atomic **Customer Profile Merge Engine** compliant with DPDPA 2023 data stewardship guidelines.

---

## 2. Core Capabilities & Architecture

### 2.1 Customer Profile 360° Navigation Tabs (`/customers/[id]`)
The unified profile screen organizes all customer records into 7 specialized functional tabs:
1. **Overview & Contacts:**
   - Identity & Demographics: Full name, SAI Customer Number (`SAI-YYYY-XXXX`), Gender, DOB, Nationality, and DPDPA 2023 verified consent indicator.
   - Contact & Address: Primary mobile phone with 1-click Direct Call, WhatsApp number with 1-click `wa.me` chat generator, Email address, and physical residential address.
   - Branch Tenancy: Scoped branch assignment (`IXM-HO` or `TRZ-BO`) and assigned staff advisor.
2. **Credentials (Passports & Visas):**
   - **Passport Cards:** Masked passport number (`V12***89`), country, place of issue, issue/expiry dates, and AES-256-GCM encryption badge.
   - **6-Month Validity Radar:** Automatically evaluates passport days remaining until expiration. If $< 180$ days, triggers an urgent pulsating alert warning that international airlines and immigration will deny boarding.
   - **Visa Cards:** Country clearance, category (`TOURIST`, `BUSINESS`, `EMPLOYMENT`, `STUDENT`, `TRANSIT`, `UMRAH_HAJJ`), entries permitted (`SINGLE`, `DOUBLE`, `MULTIPLE`), allowed stay days, and active validity badge.
   - Interactive modals for adding and removing passports and visas.
3. **Travel Bookings & Itineraries:**
   - **Flight Cards:** Airline carrier, flight number, 1-click PNR clipboard copy, route (`IXM` ✈️ `SIN`), scheduled departure and arrival timestamps.
   - **Hotel Cards:** Property name, check-in date, check-out date, and duration of stay.
   - Modal for recording new flight tickets or hotel reservations with instant database persistence.
4. **Document Vault:**
   - Deeply embedded `<DocumentVault>` component allowing direct upload, category filtering, PDF watermarking, and AI OCR analysis directly within the customer's profile.
5. **Staff Notes & Communications Feed:**
   - Chronological communication log parsed from customer records with author tags, timestamps, and service tags (`GENERAL`, `VISA`, `PASSPORT`, `TICKETING`, `PAYMENT`, `COMPLIANCE`).
   - Modal note composer enabling staff to append time-stamped observations.
6. **Family & Co-Travelers Network:**
   - Group travel relationships linking relatives or group tour participants with relationship tags (`SPOUSE`, `CHILD`, `PARENT`, `SIBLING`, `CO_TRAVELER`, `COLLEAGUE`).
   - Deep linking to relative profiles for 1-click cross-navigation.
   - Modal customer search and relationship linker.
7. **Activity Timeline:**
   - Real-time audit trail displaying service milestones, document uploads, credential updates, and staff interactions in reverse chronological order.

---

### 2.2 6-Month International Passport Validity Rule
- **Standard:** International aviation (ICAO) and immigration regulations require passengers to carry a passport valid for at least 6 months (180 days) beyond the departure date.
- **Rule Engine:**
  - $\Delta t \le 0$: Marked `EXPIRED` (Red badge). Boarding prohibited.
  - $0 < \Delta t < 180$: Marked `< 6 Months (Xd left)` (Pulsating Amber badge) with critical alert: *"Airlines & immigration will deny boarding. Urgent renewal required before booking."*
  - $\Delta t \ge 180$: Marked `Valid (Xd left)` (Emerald badge).

---

### 2.3 Duplicate Profile Detection Algorithm
- Scans the database in real-time when loading customer profiles:
  - **Phone Match (95% Score):** Matches primary phone or WhatsApp number against existing active records.
  - **Name Match (80% Score):** Case-insensitive exact name matching.
- **Alert Banner:** When candidates exist, an alert banner appears at the top of the profile displaying match percentage, candidate name, SAI number, and a *"Review & Merge Profile"* action button.

---

### 2.4 Atomic Profile Merge Engine
- **Authorization:** Restricted to `SUPER_ADMIN` and `BRANCH_MANAGER` roles.
- **Database Transaction (`prisma.$transaction`):**
  1. Atomically transfers all `Document` records from the duplicate customer to the primary target customer.
  2. Reassigns all `Passport` credentials.
  3. Reassigns all `Visa` credentials.
  4. Reassigns all `TravelBooking` records.
  5. Reassigns all `Reminder` records.
  6. Appends a timestamped `[MERGED RECORD]` note to the target profile detailing the duplicate SAI ID, name, and resolution reason.
  7. Marks the duplicate customer as `isDeleted = true` and `status = ARCHIVED`.
  8. Emits an immutable audit log entry (`CUSTOMERS_MERGED`).

---

## 3. Endpoints & Data Transfer Objects

| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/customers/:id/passports` | Super Admin, Manager, Staff | Adds AES-256 encrypted passport credential |
| `DELETE` | `/customers/:id/passports/:passportId` | Super Admin, Manager, Staff | Deletes passport credential |
| `POST` | `/customers/:id/visas` | Super Admin, Manager, Staff | Records visa validity and entry category |
| `DELETE` | `/customers/:id/visas/:visaId` | Super Admin, Manager, Staff | Deletes visa record |
| `POST` | `/customers/:id/bookings` | Super Admin, Manager, Staff | Adds flight itinerary or hotel booking |
| `DELETE` | `/customers/:id/bookings/:bookingId` | Super Admin, Manager, Staff | Removes travel booking |
| `POST` | `/customers/:id/notes` | Super Admin, Manager, Staff | Appends timestamped staff note |
| `GET` | `/customers/:id/duplicates` | Super Admin, Manager, Staff | Scans for potential duplicate profiles |
| `POST` | `/customers/:id/merge` | Super Admin, Branch Manager | Atomically merges duplicate into target profile |
| `POST` | `/customers/:id/relationships` | Super Admin, Manager, Staff | Links family member or co-traveler |
| `DELETE` | `/customers/:id/relationships/:relId` | Super Admin, Manager, Staff | Unlinks family or group relationship |

---

## 4. Verification & Testing

### 4.1 Unit Test Coverage
- `customers.spec.ts`: Added tests verifying:
  - 6-month passport validity calculations.
  - Multi-criteria duplicate scoring (mobile 95%, name 80%).
  - Role-based authorization for customer profile merging (Super Admin / Branch Manager granted; Staff denied).
- Total API Tests: **66 / 66 passing**.
- Total Database Tests: **7 / 7 passing**.
- **Monorepo Total:** **73 / 73 passing** (0 failures).

### 4.2 Production Web Build
- Executed `pnpm --filter @sai/web build`:
  - Compiled 13 static & dynamic routes.
  - Dynamic route `/customers/[id]` built cleanly at 25.4 kB with 0 type errors.
