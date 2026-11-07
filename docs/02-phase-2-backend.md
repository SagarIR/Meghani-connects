# Phase 2 – Backend Folder Structure

## Objective

Organize Django backend with modular app structure, utilities, and configurations.

---

## Directory Structure

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

## App Responsibilities

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

## requirements.txt

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

## settings.py Configuration

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
