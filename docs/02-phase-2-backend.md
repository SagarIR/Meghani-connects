# Phase 2 – Backend Folder Structure

> **Current Status:** PARTIALLY COMPLETED  
> **Progress:** 4 / 6 verified tasks  
> **Last Updated:** 2026-11-17  
> **Next Action:** Enforce Role-Based Access Control by attaching `CanManageUsers` to `UserViewSet` and permissions to other ViewSets.  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md)

---

## Phase Progress Summary

| Task | Status | Evidence | Remaining Work |
|:---|:---:|:---|:---|
| Modular 9-App Django Structure | **COMPLETED** | Apps `users`, `products`, `sales`, `repairs`, `crm`, `expenses`, `analytics`, `notifications`, `core` active in `backend/apps/`. | None. |
| URL Configuration & Routing Engine | **COMPLETED** | `backend/core/urls.py` delegates cleanly to each app's router. | None. |
| Python Dependencies Management | **COMPLETED** | `backend/requirements.txt` specifies Django, DRF, SimpleJWT, Celery, Redis, Prophet, ReportLab. | None. |
| Django Core Settings Configuration | **COMPLETED** | `backend/core/settings.py` configured with `AUTH_USER_MODEL = 'users.User'`, REST_FRAMEWORK defaults, media and static settings. | None. |
| Shared Utilities (`backend/common/`) | **PARTIALLY COMPLETED** | `backend/common/` exists but has 0 imports across codebase; system migrated to `apps.core`. | Formalize deprecation or safely remove orphaned module. |
| Role-Based Access Control (RBAC) Enforcement | **PARTIALLY COMPLETED (SECURITY GAP)** | Custom permission classes exist in `apps/users/permissions.py`, but were never attached to ViewSets. `User.ROLE_CHOICES` has 2 roles vs 4 in permissions. | Synchronize `ROLE_CHOICES` and attach permissions to ViewSets in `views.py`. |

---

## Completed Tasks
- [x] Implemented modular 9-domain app architecture under `backend/apps/`.
- [x] Configured master REST URL routing with DRF `DefaultRouter` in all apps.
- [x] Established strict dependency specification in `backend/requirements.txt`.
- [x] Configured Django core settings including custom User model authentication, SimpleJWT, CORS, WhiteNoise, and Celery broker.

## Pending Tasks
- [ ] Enforce `CanManageUsers` on `UserViewSet` in `backend/apps/users/views.py`.
- [ ] Enforce `CanManageProducts` on `ProductViewSet` and `CanManageSales` on `SaleViewSet`.
- [ ] Synchronize `ROLE_CHOICES` in `apps/users/models.py` (`admin`, `manager`, `staff`, `viewer`).
- [ ] Clean up or deprecate orphaned `backend/common/` folder.

## Blocked Tasks
*None.*

## Completion Criteria
1. All 9 domain apps register cleanly without circular import errors. *(PASSED)*
2. System check identifies 0 issues (`python manage.py check`). *(PASSED)*
3. ViewSets reject unprivileged staff attempts to create administrator accounts or delete sales records. *(PENDING RBAC ENFORCEMENT)*

## Next Action
Attach `permission_classes = [CanManageUsers]` to `UserViewSet` in [backend/apps/users/views.py](../backend/apps/users/views.py).

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
├── common/                   → Shared utilities
│   ├── __init__.py
│   ├── permissions.py        → Custom permissions
│   ├── pagination.py         → Custom pagination
│   ├── utils.py              → Helper functions
│   └── exceptions.py         → Custom exceptions
│
├── static/                   → Static assets
│   ├── logos/
│   └── templates/
│
├── media/                    → User uploads
│   ├── receipts/
│   └── images/
│
└── scripts/                  → Automation scripts
    ├── backup_db.py
    └── sync_cloud.py
```

---

### App Responsibilities

| App | Responsibility |
|-----|----------------|
| `users` | User registration, login, JWT auth, role management |
| `products` | Product CRUD, stock management, barcode handling |
| `sales` | POS transactions, invoice generation, profit calculation |
| `repairs` | Repair job CRUD, status tracking, delivery reminders |
| `crm` | Customer profiles, loyalty points, birthday tracking |
| `expenses` | Expense categories, logging, profit integration |
| `analytics` | AI forecasting, reports generation, metrics caching |
| `notifications` | WhatsApp/SMS templates, sending, status tracking |

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
razorpay>=1.4
celery>=5.3
redis>=5.0
django-celery-beat>=2.5
boto3>=1.28
gunicorn>=21.0
```

---

### settings.py Configuration

```python
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Local apps
    'apps.users',
    'apps.products',
    'apps.sales',
    'apps.repairs',
    'apps.crm',
    'apps.expenses',
    'apps.analytics',
    'apps.notifications',
    'apps.core',
]

AUTH_USER_MODEL = 'users.User'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DATABASE_NAME'),
        'USER': os.getenv('DATABASE_USER'),
        'PASSWORD': os.getenv('DATABASE_PASSWORD'),
        'HOST': os.getenv('DATABASE_HOST', 'localhost'),
        'PORT': os.getenv('DATABASE_PORT', '5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

---

## Next Phase

→ [Phase 3 - Frontend Structure](./03-phase-3-frontend.md)
