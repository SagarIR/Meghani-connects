# Meghani Connect 360 – Project Overview & Master Documentation

## Project Information

| Field | Value |
|-------|-------|
| **Project Ecosystem** | Meghani Connect 360 |
| **Client** | Meghani Watch Co. (Est. 1984, Vadodara, Gujarat) |
| **Public Storefront** | Luxury Boutique Website (`frontend/src/app/(public)`) |
| **Internal Operations** | Saff Staff Portal (`frontend/src/app/(dashboard)`) |
| **Core Engine** | Django ERP/POS Backend (`backend/`) |
| **Database** | PostgreSQL 15 (Production target), SQLite 3 (Development seed) |
| **Primary Status Tracker** | [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md) |
| **Last Updated** | November 19, 2026 |

---

## Ecosystem Architecture & Tech Stack

Meghani Connect 360 is an integrated enterprise management system and luxury e-commerce platform built as a monorepo across three unified tiers:

```
                            ┌────────────────────────────────────────┐
                            │          Meghani Connect 360           │
                            └───────────────────┬────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
   ┌───────────────────────────┐                                 ┌───────────────────────────┐
   │    Meghani Watch Co.      │                                 │     Saff Staff Portal     │
   │  Public Luxury Boutique   │                                 │   Internal Operations     │
   │  Next.js 14 App Router    │                                 │   Next.js 14 App Router   │
   │  `app/(public)`           │                                 │   `app/(dashboard)`       │
   └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                │ REST API (Axios / JWT / SimpleJWT)
                                                ▼
                               ┌─────────────────────────────────┐
                               │       Django ERP/POS Engine     │
                               │   Django 4.2 LTS + DRF + Celery │
                               │     `backend/apps/`             │
                               └────────────────┬────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │      PostgreSQL 15 Database     │
                               │      + Redis Cache & Broker     │
                               └─────────────────────────────────┘
```

| Layer | Technologies & Frameworks |
|-------|--------------------------|
| **Frontend - Public** | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, Lucide React |
| **Frontend - Staff** | Next.js 14, React Context, Recharts, Lucide React, ReportLab PDF Printing |
| **Backend Core** | Django 4.2 LTS, Django REST Framework (DRF), SimpleJWT, Celery, Redis |
| **Database & Cache** | PostgreSQL 15 (Production target), SQLite 3 (Development seed), Redis 7 (Broker & Cache) |
| **AI & Forecasting** | Scikit-learn, Pandas, NumPy, Prophet (Sales forecasting with seasonal moving-average fallback) |
| **Third-Party APIs** | Twilio WhatsApp & SMS API, Cloudinary CDN (Razorpay documented as future optional integration) |

---

## Authoritative Documentation Directory

All documentation is consolidated under the `docs/` tree.

### Core Documentation
- [00-overview.md](./00-overview.md) – Executive overview and documentation entry point (this file)
- [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md) – **Authoritative Single Source of Truth** for task progress, roadmap status, blockers, defect resolutions, and next steps

### Technical Phase Specifications (Phases 1–8)
- [Phase 1: Setup & Environment Architecture](./01-phase-1-setup.md) – Project setup, Docker, Django config, Next.js initialisation
- [Phase 2: Backend Core Architecture](./02-phase-2-backend.md) – Django apps structure, DRF REST endpoints, JWT authentication, RBAC
- [Phase 3: Frontend Architecture](./03-phase-3-frontend.md) – Next.js 14 routing, UI component library, public luxury boutique & staff dashboard
- [Phase 4: Database Schema & Models](./04-phase-4-database.md) – PostgreSQL relational models, migrations, indexes, constraints
- [Phase 5: Module Development](./05-phase-5-modules.md) – POS & billing, repair management, inventory, CRM, staff access control
- [Phase 6: Reports & Visualizations](./06-phase-6-reports.md) – GST accounting, profit/loss ledger, export engine (PDF/Excel), charts
- [Phase 7: AI Automation & Notifications](./07-phase-7-ai.md) – Predictive analytics, WhatsApp/SMS messaging, automated triggers
- [Phase 8: Deployment & Production Ops](./08-phase-8-deployment.md) – Docker Compose, Nginx reverse proxy, SSL, automated backup, health checks

### System Architecture
- [ARCHITECTURE_REPORT.md](./architecture/ARCHITECTURE_REPORT.md) – Exhaustive technical architecture for Public Boutique, Saff Staff Portal, and Django Backend

### Deployment
- [DEPLOY.md](./deployment/DEPLOY.md) – Production deployment runbook, Docker configuration, and offline-first synchronization setup

---

## Master Execution Roadmap (Master Orders 1–7)

The project follows the authoritative **Master Orders Roadmap** as its primary execution sequence, while preserving the eight technical phases as supporting architectural references:

| Master Order | Focus & Scope | Current Status | Verification Evidence |
|:---:|:---|:---:|:---|
| **Master Order 1** | **Audit Reconciliation** | **COMPLETED** | Complete documentation inventory, phase reconciliation, and single source of truth established. |
| **Master Order 2** | **Security & Critical Fixes** | **COMPLETED** | RBAC enforced via `CanManageUsers`, password change 404 resolved, Twilio SMS setting added, customer bulk import implemented, Celery task keyword bug resolved. Verified with 73 backend tests and clean build. |
| **Master Order 3** | **ERP/POS Complete UI/UX Redesign** | **COMPLETED** | Luxury boutique design system (Midnight Black & Champagne Gold), 3-tab product modals, barcode lookup, split payments (`cash`, `upi`, `card`), and thermal receipt printing. Verified with 15 automated POS tests. |
| **Master Order 4** | **Public Website & SEO** | **COMPLETED** | 11 customer storefront pages, loupe zoom, price shielding for unlisted timepieces, WhatsApp concierge enquiry, dynamic `sitemap.xml`, and JSON-LD schemas. Verified with 12 automated frontend tests. |
| **Master Order 5** | **System Integration** | **COMPLETED** | Public inquiries integrated into Django CRM (`Enquiry`), in-desk quick customer registration in POS, concurrency locking (`select_for_update`) on checkout, and 5-stage repair Celery WhatsApp notifications. |
| **Master Order 6** | **Advanced Features & AI-Powered BI** | **COMPLETED** | Prophet 30/60/90-day sales forecasting with seasonal fallback, dynamic ROP reorder engine, Pareto ABC classification, Z-score anomaly radar, and AI Store Assistant with staff margin masking. Verified with 6 automated tests. |
| **Master Order 7** | **Production Deployment** | **PENDING** | Resolve `frontend/next.config.js` standalone export, integrate WhiteNoise staticfiles handler, provision cloud PostgreSQL/Redis, and configure SSL/domain. |

---

## Technical Phase Architecture Status (Supporting Reference)

The original 8 technical phases provide supporting structural architecture:

| Phase | Phase Name | Total Tasks | Completed | Partial | In Progress | Pending | Blocked | Needs Verification | Overall Status |
|:-----:|:-----------|:-----------:|:---------:|:-------:|:-----------:|:-------:|:-------:|:------------------:|:--------------:|
| **1** | [Setup & Environment Architecture](./01-phase-1-setup.md) | 7 | 6 | 1 | 0 | 0 | 0 | 0 | **PARTIAL** (85.7%) |
| **2** | [Backend Core Architecture](./02-phase-2-backend.md) | 6 | 3 | 2 | 0 | 1 | 0 | 0 | **PARTIAL** (50.0%) |
| **3** | [Frontend Architecture](./03-phase-3-frontend.md) | 7 | 5 | 2 | 0 | 0 | 0 | 0 | **PARTIAL** (71.4%) |
| **4** | [Database Schema & Models](./04-phase-4-database.md) | 9 | 9 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100.0%) |
| **5** | [Module Development](./05-phase-5-modules.md) | 11 | 11 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100.0%) |
| **6** | [Reports & Visualizations](./06-phase-6-reports.md) | 6 | 6 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100.0%) |
| **7** | [AI Automation & Notifications](./07-phase-7-ai.md) | 8 | 6 | 1 | 0 | 1 | 0 | 0 | **PARTIAL** (75.0%) |
| **8** | [Deployment & Production Ops](./08-phase-8-deployment.md) | 6 | 3 | 2 | 0 | 1 | 0 | 0 | **PARTIAL** (50.0%) |
| **TOTAL** | **All Phases Combined** | **60** | **49** | **8** | **0** | **3** | **0** | **0** | **81.67% Verified** |

> **Accounting & Operational Distinction:**
> - **Code-Wired Integrations:** Twilio SMS, WhatsApp notifications, and Celery crons have verified code syntax, schemas, and fallback exception handling. Full real-world delivery requires valid provider production credentials.
> - **Production Deployment:** Multi-container Docker configuration exists, but requires enabling `output: 'standalone'` in `next.config.js` and adding WhiteNoise for static asset serving prior to cloud container provisioning.
