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

## Project Status Summary

As reconciled in [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md):

| Phase | Phase Name | Total Tasks | Completed | Partial | In Progress | Pending | Blocked | Needs Verification | Overall Status |
|:-----:|:-----------|:-----------:|:---------:|:-------:|:-----------:|:-------:|:-------:|:------------------:|:--------------:|
| **1** | [Setup & Environment Architecture](./01-phase-1-setup.md) | 6 | 6 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100%) |
| **2** | [Backend Core Architecture](./02-phase-2-backend.md) | 8 | 7 | 1 | 0 | 0 | 0 | 0 | **PARTIAL** (87.5%) |
| **3** | [Frontend Architecture](./03-phase-3-frontend.md) | 8 | 8 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100%) |
| **4** | [Database Schema & Models](./04-phase-4-database.md) | 8 | 8 | 0 | 0 | 0 | 0 | 0 | **COMPLETED** (100%) |
| **5** | [Module Development](./05-phase-5-modules.md) | 10 | 8 | 2 | 0 | 0 | 0 | 0 | **PARTIAL** (80.0%) |
| **6** | [Reports & Visualizations](./06-phase-6-reports.md) | 6 | 5 | 1 | 0 | 0 | 0 | 0 | **PARTIAL** (83.3%) |
| **7** | [AI Automation & Notifications](./07-phase-7-ai.md) | 8 | 4 | 3 | 0 | 0 | 0 | 1 | **PARTIAL** (50.0%) |
| **8** | [Deployment & Production Ops](./08-phase-8-deployment.md) | 6 | 1 | 2 | 0 | 2 | 1 | 0 | **PARTIAL** (16.7%) |
| **TOTAL** | **All Phases Combined** | **60** | **47** | **9** | **0** | **2** | **1** | **1** | **78.33% Verified** |
