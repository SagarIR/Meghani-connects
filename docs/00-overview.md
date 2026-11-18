# Meghani Connect 360 – Project Overview & Master Documentation

## Project Information

| Field | Value |
|-------|-------|
| **Project Ecosystem** | Meghani Connect 360 |
| **Client** | Meghani Watch Co. |
| **Public Storefront** | Luxury Boutique Website (`frontend/src/app/(public)`) |
| **Internal Operations** | Saff Staff Portal (`frontend/src/app/(dashboard)`) |
| **Core Engine** | Django ERP/POS Backend (`backend/`) |
| **Database** | PostgreSQL |
| **Primary Status Tracker** | [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md) |
| **Last Updated** | November 2026 |

---

## Ecosystem Architecture & Tech Stack

Meghani Connect 360 is an integrated, offline-first enterprise management system and luxury e-commerce platform built as a monorepo across three unified tiers:

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
                                                │ REST API (Axios / JWT / Offline Sync)
                                                ▼
                               ┌─────────────────────────────────┐
                               │       Django ERP/POS Engine     │
                               │     Django 5.x + DRF + Celery   │
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
| **Frontend - Public** | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, GSAP, Lucide React |
| **Frontend - Staff** | Next.js 14, Zustand State Management, TanStack Table, Recharts, React-to-Print |
| **Backend Core** | Django 5.x, Django REST Framework (DRF), SimpleJWT, Celery, Redis |
| **Database & Cache** | PostgreSQL 15, Redis 7 (Caching, Celery Broker, Rate Limiting) |
| **AI & Forecasting** | Scikit-learn, Pandas, NumPy, Prophet (Sales forecasting, stock reorder prediction) |
| **Third-Party APIs** | Razorpay Payment Gateway, Twilio / WhatsApp Business Cloud API, Fast2SMS Gateway |

---

## Authoritative Documentation Directory

All documentation is consolidated under the `docs/` tree.

### Core Documentation
- [00-overview.md](./00-overview.md) – Executive overview and documentation entry point (this file)
- [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md) – **Authoritative Single Source of Truth** for task progress, roadmap status, blockers, and next steps

### Technical Phase Specifications (Phases 1–8)
- [Phase 1: Setup & Environment Architecture](./01-phase-1-setup.md) – Project setup, Docker, Django config, Next.js initialisation
- [Phase 2: Backend Core Architecture](./02-phase-2-backend.md) – Django apps structure, DRF REST endpoints, JWT authentication
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
| **Master Order 2** | **Security & Critical Fixes** | **COMPLETED** | RBAC enforced via `CanManageUsers`, password change 404 resolved, Twilio SMS setting added, customer bulk import implemented, Celery task keyword bug resolved. Verified with 57 backend tests, 21 frontend tests, and production build. |
| **Master Order 3** | **ERP/POS Complete UI/UX Redesign** | **PENDING NEXT** | Comprehensive overhaul of POS checkout, cart interactions, responsive layout, thermal receipt rendering, and staff ergonomics. |
| **Master Order 4** | **Public Website & SEO** | **PENDING** | Luxury digital storefront refinements, brand showcase, JSON-LD structured data, metadata optimization, and customer viewing enquiry flow. |
| **Master Order 5** | **System Integration** | **PENDING** | End-to-end integration between public consultation leads, repair atelier ticketing, and CRM customer profiles. |
| **Master Order 6** | **Advanced Features** | **PENDING** | AI-driven stockout prediction, Prophet forecasting models, automated repair status alerts, and loyalty tier automations. |
| **Master Order 7** | **Production Deployment** | **PENDING** | Multi-container Docker deployment, cloud PaaS infrastructure provisioning, SSL, CDN media caching, and disaster recovery verification. |

---

## Technical Phase Architecture Status (Supporting Reference)

The original 8 technical phases provide supporting structural architecture:

| Phase | Phase Name | Total Tasks | Completed | Partial | In Progress | Pending | Blocked | Needs Verification | Overall Status |
|:-----:|:-----------|:-----------:|:---------:|:-------:|:-----------:|:-------:|:-------:|:------------------:|:--------------:|
| **1** | [Setup & Environment Architecture](./01-phase-1-setup.md) | 7 | 6 | 1 | 0 | 0 | 0 | 0 | **PARTIAL** (85.7%) |
| **2** | [Backend Core Architecture](./02-phase-2-backend.md) | 6 | 5 | 1 | 0 | 0 | 0 | 0 | **PARTIAL** (83.3%) |
| **3** | [Frontend Architecture](./03-phase-3-frontend.md) | 7 | 6 | 1 | 0 | 0 | 0 | 0 | **PARTIAL** (85.7%) |
| **4** | [Database Schema & Models](./04-phase-4-database.md) | 9 | 9 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100%) |
| **5** | [Module Development](./05-phase-5-modules.md) | 11 | 11 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100%) |
| **6** | [Reports & Visualizations](./06-phase-6-reports.md) | 6 | 6 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100%) |
| **7** | [AI Automation & Notifications](./07-phase-7-ai.md) | 8 | 6 | 1 | 0 | 1 | 0 | 0 | **PARTIAL** (75.0%) |
| **8** | [Deployment & Production Ops](./08-phase-8-deployment.md) | 6 | 5 | 0 | 0 | 0 | 0 | 1 | **NEEDS VERIFICATION** |
| **TOTAL** | **All Phases Combined** | **60** | **54** | **4** | **0** | **1** | **0** | **1** | **90.00% Verified** |

> **Accounting & Operational Distinction:**
> - **Code-Wired Integrations:** Twilio SMS, WhatsApp notifications, and Celery crons have verified code syntax, schemas, and fallback exception handling. Full real-world delivery requires valid provider production credentials.
> - **Production Deployment:** Dockerfiles and Compose files are built and tested. Live hosting requires cloud infrastructure provisioning.
