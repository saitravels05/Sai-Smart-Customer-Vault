# Phase 14: Production Containerization, Docker Compose & Deployment Architecture

## Overview
**Phase 14** equips **SAI SMART CUSTOMER VAULT** with turnkey, enterprise-grade deployment automation using **Docker**, **Docker Compose**, and **Nginx**.

The deployment architecture packages the complete stack—PostgreSQL with `pgvector`, Redis 7, NestJS API, Next.js 14 Web Portal, and Nginx reverse proxy—into coordinated, isolated, and scalable containers.

---

## 1. Container Architecture & Topography

```
                    Internet / Corporate LAN
                                │
                                ▼
                       ┌────────────────┐
                       │  Nginx Gateway │ (:80 / :443)
                       │  (Reverse Proxy│
                       │   50MB Uploads)│
                       └───────┬────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   ┌─────────────────┐                   ┌─────────────────┐
   │ Next.js 14 Web  │ (:3000)           │  NestJS REST API│ (:4000)
   │ (@sai/web)      │                   │  (@sai/api)     │
   │ (Non-root user) │                   │  (Non-root user)│
   └─────────────────┘                   └────────┬────────┘
                                                  │
                               ┌──────────────────┴──────────────────┐
                               ▼                                     ▼
                      ┌─────────────────┐                   ┌─────────────────┐
                      │ PostgreSQL 16   │ (:5432)           │ Redis 7 Alpine  │ (:6379)
                      │ + pgvector      │                   │ (BullMQ Queues) │
                      └─────────────────┘                   └─────────────────┘
```

---

## 2. Service Definitions (`docker-compose.yml`)

| Service | Base Image | Role | Healthcheck / Ports |
|---|---|---|---|
| `postgres` | `pgvector/pgvector:pg16` | Relational Vault & Vector Embeddings | `pg_isready` (Port 5432) |
| `redis` | `redis:7-alpine` | Caching & BullMQ Queue processing | `redis-cli ping` (Port 6379) |
| `api` | Node.js 20 Alpine Multi-Stage | NestJS Core API Engine | `/api/v1/health/liveness` (Port 4000) |
| `web` | Node.js 20 Alpine Multi-Stage | Next.js 14 Bilingual Portal | `/login` (Port 3000) |
| `nginx` | `nginx:alpine` | Unified Gateway, Gzip, 50MB Uploads | Port 80 (HTTP) |

---

## 3. Security & Operational Hardening

1. **Non-Root Execution:** Both `api` and `web` containers run under non-privileged system users (`nestjs:nodejs` and `nextjs:nodejs`), mitigating container escape risks.
2. **Persistent Volumes:**
   - `sai_vault_pgdata`: Preserves customer profiles, visas, passports, and audit logs across upgrades.
   - `sai_vault_redisdata`: Retains job queues and temporary session states.
   - `sai_vault_uploads`: Secures AES-256-GCM encrypted travel document artifacts on host storage.
3. **Nginx Security Headers:**
   - Strict content type sniffing protection (`X-Content-Type-Options: nosniff`).
   - Clickjacking prevention (`X-Frame-Options: SAMEORIGIN`).
   - Cross-site scripting filtering (`X-XSS-Protection: 1; mode=block`).
   - 50MB upload limits specifically designed for high-resolution passport scans.

---

## 4. Spin-Up Commands

### Production Deployment
```bash
# 1. Prepare environment variables
cp .env.production.example .env

# 2. Build and launch all containers in detached mode
docker compose up -d --build

# 3. Check health and container statuses
docker compose ps

# 4. View live logs
docker compose logs -f api
```

### Database Migration & Seed inside Docker
```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```
