# Phase 2 – Backend Folder Structure

> **Current Status:** COMPLETED  
> **Progress:** 5 / 6 verified tasks complete (83.3%), 0 partial, 1 pending (16.7%)  
> **Last Updated:** 2026-11-19  
> **Next Action:** Safely retire orphaned `backend/common/` directory (`DEBT-01`).  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md)

---

## Phase Progress Summary

| Task | Status | Evidence | Remaining Work |
|:---|:---:|:---|:---|
| Modular 9-App Django Structure | **COMPLETED** | Apps `users`, `products`, `sales`, `repairs`, `crm`, `expenses`, `analytics`, `notifications`, `core` active in `backend/apps/`. | None. |
| URL Configuration & Routing Engine | **COMPLETED** | `backend/core/urls.py` delegates cleanly to each app's router under `/api/`. | None. |
| Python Dependencies Management | **COMPLETED** | `backend/requirements.txt` specifies Django 4.2 LTS, DRF, SimpleJWT, Celery, Redis, Prophet, ReportLab, and `whitenoise>=6.5.0`. | None. |
| Django Core Settings Configuration | **COMPLETED** | `backend/core/settings.py` configured with `AUTH_USER_MODEL = 'users.User'`, REST_FRAMEWORK defaults, WhiteNoise in `MIDDLEWARE`, and `STATICFILES_STORAGE`. | None. |
| Shared Utilities (`backend/common/`) | **PENDING (DEAD CODE)** | `backend/common/` exists but has 0 imports across codebase; system migrated utilities to `apps.core`. | Formalize deprecation and safely retire orphaned module (`DEBT-01`). |
| Role-Based Access Control (RBAC) Enforcement | **COMPLETED** | Custom permission classes (`CanManageUsers`, `CanManageProducts`, `CanManageSales`, `CanManageRepairs`, `IsManagerOrAbove`, `CanViewReports`) actively attached to ViewSets. `User.ROLE_CHOICES` includes all 4 roles (`admin`, `manager`, `staff`, `viewer`). | None. |

---

## Completed Tasks
- [x] Implemented modular 9-domain app architecture under `backend/apps/`.
- [x] Configured master REST URL routing with DRF `DefaultRouter` across all domain apps.
- [x] Configured production static asset serving with WhiteNoise middleware and compressed storage.
- [x] Enforced Role-Based Access Control (RBAC) with granular permissions attached across ViewSets and 4 distinct roles in `User.ROLE_CHOICES`.

## Incomplete / Partially Completed Tasks
*None. All core backend configuration tasks are completed.*

## Pending Tasks
- [ ] Safely remove or deprecate orphaned `backend/common/` folder (`DEBT-01`).

## Blocked Tasks
*None.*

## Completion Criteria
1. All 9 domain apps register cleanly without circular import errors. *(PASSED)*
2. System check identifies 0 issues (`python manage.py check`). *(PASSED)*
3. ViewSets reject unprivileged staff attempts to create administrator accounts or delete sales records. *(PASSED)*
4. Static assets serve correctly in containerized production. *(PENDING BUG-02 FIX)*

## Next Action
Add `whitenoise` to [backend/requirements.txt](../backend/requirements.txt) and [backend/core/settings.py](../backend/core/settings.py).

---

## Original Technical Specifications & Backend Architecture

### Objective

Organize Django backend with modular app structure, utilities, and configurations.

---

### Directory Structure

```
backend/
│
├── manage.py
├── requirements.txt
├── .env
│
├── core/                     → Django project settings
│   ├── __init__.py
│   ├── settings.py           → Main settings
│   ├── urls.py               → Root URL configuration
│   ├── wsgi.py               → WSGI entry point
│   └── asgi.py               → ASGI entry point
│
├── apps/
│   ├── __init__.py
│   │
│   ├── users/                → User authentication & roles
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   │
│   ├── products/             → Product CRUD & inventory
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   │
│   ├── sales/                → POS system & billing
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   │
│   ├── repairs/              → Repair job workflows
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   │
│   ├── crm/                  → Customer profiles & loyalty
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   │
│   ├── expenses/             → Expense logging
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   │
│   ├── analytics/            → AI insights & reports
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── forecasting.py
│   │   │   └── reports.py
│   │   └── tests.py
│   │
│   └── notifications/        → WhatsApp/SMS automation
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── services/
│       │   ├── __init__.py
│       │   ├── whatsapp.py
│       │   └── sms.py
│       └── tests.py
│
├── common/                   → Shared utilities (Deprecated; migrated to apps.core)
│
├── static/                   → Static assets
├── media/                    → User uploads
└── backups/                  → Automated Gzip JSON database snapshots
```

---

### App Responsibilities

| App | Responsibility |
|-----|----------------|
| `users` | User registration, login, JWT auth, role management (`admin`, `manager`, `staff`, `viewer`) |
| `products` | Product catalog, inventory stock tracking, barcode lookup |
| `sales` | POS transactions, split payments, invoice generation, profit calculation |
| `repairs` | Repair job state machine, technician tracking, pickup notifications |
| `crm` | Customer directory, loyalty points ledger, customer consultation enquiries, bulk import |
| `expenses` | Expense logging across 8 categories, receipt uploads, Net Profit deduction |
| `analytics` | AI sales forecasting, Smart ROP, ABC Pareto classification, Anomaly radar, AI assistant, PDF reports |
| `notifications` | WhatsApp & SMS automated alerts, Twilio integration, delivery logs |
| `core` | Website CMS management, database backup/restore engine, system health diagnostics, Cloudinary CDN |

---

### requirements.txt

```txt
Django>=4.2,<5.0
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
psycopg2-binary>=2.9
python-dotenv>=1.0
django-cors-headers>=4.3
Pillow>=10.0
pandas>=2.0
scikit-learn>=1.3
prophet>=1.1
openpyxl>=3.1
reportlab>=4.0
twilio>=8.0
celery>=5.3
redis>=5.0
django-celery-beat>=2.5
boto3>=1.28
gunicorn>=21.0
whitenoise>=6.5.0
```

---

## Next Phase

→ [Phase 3 - Frontend Structure](./03-phase-3-frontend.md)
