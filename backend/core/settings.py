import os
import sys
from pathlib import Path
from datetime import timedelta
import urllib.parse
from django.core.exceptions import ImproperlyConfigured

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver,.vercel.app').split(',')

# Application definition
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
    'django_celery_beat',
    
    # Local apps
    'apps.core',
    'apps.users',
    'apps.products',
    'apps.sales',
    'apps.repairs',
    'apps.crm',
    'apps.expenses',
    'apps.purchasing',
    'apps.analytics',
    'apps.notifications',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ============ DATABASE CONFIGURATION ============
def parse_database_url(url_str: str) -> dict:
    """
    Parse a DATABASE_URL connection string into a Django DATABASES configuration dictionary.
    Supports PostgreSQL (postgresql://, postgres://, pgsql://) with query parameters for SSL
    (sslmode, channel_binding, etc.) and SQLite (sqlite://).
    """
    if not url_str or not url_str.strip():
        return None

    url = urllib.parse.urlparse(url_str.strip())
    scheme = url.scheme.lower()

    if scheme in ('sqlite', 'sqlite3'):
        path = url.path
        if url.netloc:
            path = url.netloc + path
        db_path = path.lstrip('/') if path and not path.startswith('/') else path
        return {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': Path(db_path) if db_path and db_path != ':memory:' else (BASE_DIR / 'db.sqlite3' if not db_path else ':memory:'),
        }

    if scheme not in ('postgres', 'postgresql', 'pgsql'):
        raise ImproperlyConfigured(
            f"Unsupported database scheme '{scheme}' in DATABASE_URL. "
            f"Supported schemes: postgresql://, postgres://, sqlite://"
        )

    db_name = urllib.parse.unquote(url.path.lstrip('/'))
    if not db_name:
        raise ImproperlyConfigured("DATABASE_URL must specify a database name.")
    if not url.hostname:
        raise ImproperlyConfigured("DATABASE_URL must specify a host.")

    db_user = urllib.parse.unquote(url.username) if url.username else ''
    db_password = urllib.parse.unquote(url.password) if url.password else ''
    db_host = url.hostname
    db_port = str(url.port) if url.port else '5432'

    options = {}
    if url.query:
        qs = urllib.parse.parse_qs(url.query)
        libpq_params = {
            'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslcrl',
            'channel_binding', 'connect_timeout', 'application_name',
            'keepalives', 'keepalives_idle', 'keepalives_interval', 'keepalives_count',
            'target_session_attrs', 'gssencmode'
        }
        for k, v in qs.items():
            k_lower = k.lower()
            if k_lower in libpq_params:
                options[k_lower] = v[0]
            elif k_lower in ('currentschema', 'schema'):
                options['options'] = f"-c search_path={v[0]}"
            elif k_lower == 'options':
                options['options'] = v[0]

    # SSL configuration for PostgreSQL / Neon
    ssl_env = os.getenv('DATABASE_SSL_MODE')
    if ssl_env:
        options['sslmode'] = ssl_env
    elif 'sslmode' not in options:
        if db_host not in ('localhost', '127.0.0.1') or os.getenv('DATABASE_SSL', '').lower() in ('true', '1'):
            options['sslmode'] = 'require'

    conn_max_age = int(os.getenv('CONN_MAX_AGE', '0'))

    config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_name,
        'USER': db_user,
        'PASSWORD': db_password,
        'HOST': db_host,
        'PORT': db_port,
        'CONN_MAX_AGE': conn_max_age,
    }
    if options:
        config['OPTIONS'] = options
    return config


# Determine runtime environment
IS_RUNNING_TESTS = 'test' in sys.argv
IS_PRODUCTION = (
    not DEBUG
    or os.getenv('VERCEL') == '1'
    or os.getenv('ENVIRONMENT') in ('production', 'prod', 'staging')
    or os.getenv('DJANGO_ENV') in ('production', 'prod', 'staging')
) and not IS_RUNNING_TESTS

database_url = os.getenv('DATABASE_URL', '').strip()
database_name = os.getenv('DATABASE_NAME', '').strip()

if database_url:
    db_config = parse_database_url(database_url)
    if IS_PRODUCTION and db_config.get('ENGINE') == 'django.db.backends.sqlite3':
        raise ImproperlyConfigured(
            "SQLite cannot be used in production. A production PostgreSQL DATABASE_URL is required."
        )
    DATABASES = {'default': db_config}

elif database_name:
    # Discrete PostgreSQL environment variables fallback (preserving backward compatibility)
    db_host = os.getenv('DATABASE_HOST', 'localhost').strip()
    db_port = os.getenv('DATABASE_PORT', '5432').strip()
    db_user = os.getenv('DATABASE_USER', '').strip()
    db_password = os.getenv('DATABASE_PASSWORD', '').strip()

    options = {}
    ssl_mode = os.getenv('DATABASE_SSL_MODE')
    if ssl_mode:
        options['sslmode'] = ssl_mode
    elif db_host not in ('localhost', '127.0.0.1') or os.getenv('DATABASE_SSL', '').lower() in ('true', '1'):
        options['sslmode'] = 'require'

    conn_max_age = int(os.getenv('CONN_MAX_AGE', '0'))

    config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': database_name,
        'USER': db_user,
        'PASSWORD': db_password,
        'HOST': db_host,
        'PORT': db_port,
        'CONN_MAX_AGE': conn_max_age,
    }
    if options:
        config['OPTIONS'] = options
    DATABASES = {'default': config}

else:
    # In production, fail clearly if no database is configured. Never silently use SQLite.
    if IS_PRODUCTION:
        raise ImproperlyConfigured(
            "Database configuration is missing in production. "
            "Please configure the DATABASE_URL environment variable with a PostgreSQL connection string. "
            "Silently falling back to SQLite in production is disabled."
        )
    # Local development SQLite fallback
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Static file serving with WhiteNoise (compressed storage in production)
if not DEBUG and 'test' not in sys.argv:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
else:
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'


# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.CustomPageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ] if 'test' not in sys.argv else [],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/min',
        'user': '1200/min',
        'login': '15/min',
    } if 'test' not in sys.argv else {},
}

# Cookie & Frame Security
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS Settings
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Allow all origins in development

# Celery Configuration
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
if 'test' in sys.argv or os.getenv('CELERY_ALWAYS_EAGER') == 'True':
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# AWS S3 Configuration (optional)
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    AWS_S3_REGION_NAME = 'ap-south-1'
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_DEFAULT_ACL = 'public-read'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER')
TWILIO_SMS_NUMBER = os.getenv('TWILIO_SMS_NUMBER')

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

# Business Settings
LOW_STOCK_THRESHOLD = 5
LOYALTY_POINTS_PER_100 = 1
LOYALTY_REDEMPTION_RATE = 0.5  # 1 point = Rs 0.50

# ============ PRODUCTION SECURITY SETTINGS ============
if not DEBUG:
    # HTTPS settings
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # HSTS
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Content security
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    
    # Logging
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '{levelname} {asctime} {module} {message}',
                'style': '{',
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
        },
    }

# Sentry Error Tracking (optional)
SENTRY_DSN = os.getenv('SENTRY_DSN')
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration()],
            traces_sample_rate=0.1,
            send_default_pii=True,
            environment='production' if not DEBUG else 'development',
        )
    except ImportError:
        pass
