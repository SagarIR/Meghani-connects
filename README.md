# Meghani Connect 360

> **Enterprise ERP/POS, Public Luxury E-Commerce Boutique & Staff Operations Portal**  
> Developed for **Meghani Watch Co.** | Single Monorepo Architecture

---

## System Overview

Meghani Connect 360 is an offline-first enterprise management system and luxury boutique web platform designed specifically for high-end horological retail, customer relationship management, repair tracking, and automated business operations.

The repository hosts three interconnected applications in a unified monorepo:

1. **Meghani Watch Co. — Public Luxury Boutique (`frontend/src/app/(public)`)**
   - High-performance, customer-facing luxury e-commerce experience.
   - Built with Next.js 14 App Router, Tailwind CSS, Framer Motion, and GSAP.
   - Features 32 bespoke micro-interactions, smooth cursor choreographies, brand storytelling, catalogue browsing, and luxury aesthetic standards.
   - Fully optimized for SEO with JSON-LD structured schema markup (Store, Product, BreadcrumbList, WebSite).

2. **Saff Staff Portal — Internal Operations & POS (`frontend/src/app/(dashboard)`)**
   - High-throughput web interface for showroom staff, billing cashiers, inventory managers, and repair technicians.
   - Features barcode thermal receipt printing, quick POS cart management, multi-mode payments (Cash, Card, UPI, Razorpay), repair job ticketing, customer loyalty tracking, and live GST invoices.

3. **Meghani Connect 360 — Backend Core (`backend/`)**
   - Enterprise REST API built on **Django 5.x** and **Django REST Framework (DRF)**.
   - Powered by PostgreSQL 15 relational storage with Redis for caching and Celery asynchronous background tasks.
   - Comprehensive modules for `products`, `sales`, `crm`, `repairs`, `analytics`, `users`, and `core`.
   - Features automated WhatsApp/SMS notifications, Prophet-powered sales forecasting, inventory reorder prediction, and GST report generation.

---

## Master Documentation Directory

All documentation is maintained under the [`docs/`](./docs/00-overview.md) directory.

### Core Tracking & Architecture
- **[PROJECT_EXECUTION_TRACKER.md](./docs/PROJECT_EXECUTION_TRACKER.md)** — **The authoritative single source of truth** for all 8 development phases, 60 mapped tasks, progress metrics (78.33% verified complete), blocker tracking, and upcoming milestones.
- **[ARCHITECTURE_REPORT.md](./docs/architecture/ARCHITECTURE_REPORT.md)** — Comprehensive architectural breakdown of the Public Boutique, Saff Staff Portal, and Django ERP engine.
- **[DEPLOY.md](./docs/deployment/DEPLOY.md)** — Step-by-step production deployment manual, environment configuration, systemd services, and offline-first synchronization setup.
- **[00-overview.md](./docs/00-overview.md)** — High-level project index, core features, and module matrix.

### Phase Specifications (Phases 1 to 8)
- **[Phase 1: Setup & Environment Architecture](./docs/01-phase-1-setup.md)** — Environment bootstrap, monorepo layout, Docker Compose, Next.js / Django initialisation. *(Status: COMPLETED 100%)*
- **[Phase 2: Backend Core Architecture](./docs/02-phase-2-backend.md)** — Django REST Framework, JWT authentication, custom user models, core middleware. *(Status: PARTIAL 87.5%)*
- **[Phase 3: Frontend Architecture](./docs/03-phase-3-frontend.md)** — Next.js 14 App Router layout, dual public/staff routes, UI component library, animations. *(Status: COMPLETED 100%)*
- **[Phase 4: Database Schema & Relational Models](./docs/04-phase-4-database.md)** — PostgreSQL schemas, migrations, composite indices, foreign keys, constraints. *(Status: COMPLETED 100%)*
- **[Phase 5: Module Development & Business Logic](./docs/05-phase-5-modules.md)** — POS & Billing, Inventory & Serials, CRM & Loyalty, Repair Job Ticketing, RBAC. *(Status: PARTIAL 80.0%)*
- **[Phase 6: Reports, Financials & Analytics](./docs/06-phase-6-reports.md)** — GST GSTR-1 ledgers, Profit & Loss reporting, Excel/PDF export engines, Chart dashboards. *(Status: PARTIAL 83.3%)*
- **[Phase 7: AI Automation & Notifications](./docs/07-phase-7-ai.md)** — WhatsApp/SMS gateways, Celery Beat tasks, Scikit-learn & Prophet predictive analytics. *(Status: PARTIAL 50.0%)*
- **[Phase 8: Deployment & Production Ops](./docs/08-phase-8-deployment.md)** — Docker Compose production configuration, Nginx reverse proxy, SSL certbot, automated daily backups. *(Status: PARTIAL 16.7%)*

---

## Repository Directory Structure

```text
Meghani-Connects/
├── README.md                       # Monorepo Entry Point (this file)
├── docker-compose.yml              # Local / staging container orchestration
│
├── docs/                           # Master Documentation Repository
│   ├── 00-overview.md              # Project overview
│   ├── PROJECT_EXECUTION_TRACKER.md# Master Single Source of Truth
│   ├── 01-phase-1-setup.md         # Phase 1: Setup & Environment
│   ├── 02-phase-2-backend.md       # Phase 2: Backend Architecture
│   ├── 03-phase-3-frontend.md      # Phase 3: Frontend Architecture
│   ├── 04-phase-4-database.md      # Phase 4: Database Schema
│   ├── 05-phase-5-modules.md       # Phase 5: Modules (POS, CRM, Repairs)
│   ├── 06-phase-6-reports.md       # Phase 6: Reports & Financials
│   ├── 07-phase-7-ai.md            # Phase 7: AI & Notifications
│   ├── 08-phase-8-deployment.md    # Phase 8: Deployment & Ops
│   │
│   ├── architecture/
│   │   └── ARCHITECTURE_REPORT.md  # Tri-system architectural blueprint
│   │
│   └── deployment/
│       └── DEPLOY.md               # Production deployment runbook
│
├── backend/                        # Django REST API & Celery Service
│   ├── apps/
│   │   ├── analytics/              # AI forecasting, reports, Celery tasks
│   │   ├── core/                   # Base models, audit logging, health checks
│   │   ├── crm/                    # Customers, loyalty points, communication logs
│   │   ├── products/               # Watches, categories, brands, inventory
│   │   ├── repairs/                # Repair job tickets, service status, warranty
│   │   ├── sales/                  # Orders, invoices, payments, POS transactions
│   │   └── users/                  # Custom User model, staff profiles, RBAC
│   ├── meghani_core/               # Django root project configuration & settings
│   ├── manage.py
│   └── requirements.txt
├── frontend/                       # Next.js 14 Universal Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/           # Meghani Watch Co. Public Luxury Boutique
│   │   │   └── (dashboard)/        # Saff Staff Operations & POS Dashboard
│   │   ├── components/             # Reusable UI, animations, luxury widgets
│   │   ├── hooks/                  # Custom React hooks (offline, cart, animations)
│   │   ├── lib/                    # API clients, utilities, formatters
│   │   └── types/                  # TypeScript interface declarations
│   ├── package.json
│   └── tailwind.config.ts
```

---

## Quick Start & Local Development

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **PostgreSQL 15+**
- **Redis 7+**

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and configure DATABASE_URL, SECRET_KEY, REDIS_URL

# Apply database migrations
python manage.py migrate

# Seed initial demonstration data
python manage.py seed_data

# Start local API server
python manage.py runserver 8000
```
Backend API will be accessible at `http://localhost:8000/api/v1/`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
- **Public Boutique:** `http://localhost:3000/`
- **Saff Staff Portal:** `http://localhost:3000/login`

### 4. Running Automated Test Suites
Both suites must pass cleanly prior to code submission:

```bash
# Backend test suite (41 passing tests)
backend/venv/Scripts/python.exe backend/manage.py test apps.products apps.core apps.crm apps.users apps.sales apps.analytics

# Frontend test suites (7 public storefront tests + 13 POS workflow tests)
node frontend/test-public.js
node frontend/test-pos-workflow.js
```

---

## Development Progress Dashboard

```
Overall Verified Completion: 81.67% (49 of 60 Tasks Verified Complete)
```

| Phase | Description | Total Tasks | Done | Partial | Pending | Blocked | Verification | Status |
|:-----:|:------------|:-----------:|:----:|:-------:|:-------:|:-------:|:------------:|:------:|
| **1** | [Setup & Environment Architecture](./docs/01-phase-1-setup.md) | 6 | 6 | 0 | 0 | 0 | 0 | **COMPLETED** |
| **2** | [Backend Core Architecture](./docs/02-phase-2-backend.md) | 8 | 7 | 1 | 0 | 0 | 0 | **PARTIAL** |
| **3** | [Frontend Architecture](./docs/03-phase-3-frontend.md) | 8 | 8 | 0 | 0 | 0 | 0 | **COMPLETED** |
| **4** | [Database Schema & Models](./docs/04-phase-4-database.md) | 8 | 8 | 0 | 0 | 0 | 0 | **COMPLETED** |
| **5** | [Module Development & POS](./docs/05-phase-5-modules.md) | 10 | 9 | 1 | 0 | 0 | 0 | **PARTIAL** |
| **6** | [Reports & Analytics](./docs/06-phase-6-reports.md) | 6 | 6 | 0 | 0 | 0 | 0 | **COMPLETED** |
| **7** | [AI Automation & Notifications](./docs/07-phase-7-ai.md) | 8 | 4 | 3 | 0 | 0 | 1 | **PARTIAL** |
| **8** | [Deployment & Operations](./docs/08-phase-8-deployment.md) | 6 | 1 | 2 | 2 | 1 | 0 | **PARTIAL** |

For the complete task-by-task breakdown, evidence paths, and next implementation priorities, refer to [`docs/PROJECT_EXECUTION_TRACKER.md`](./docs/PROJECT_EXECUTION_TRACKER.md).
