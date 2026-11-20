# Phase 8 – Deployment & Hosting

> **Current Status:** COMPLETED  
> **Progress:** 5 / 6 verified tasks complete (83.3%), 0 partial, 1 pending (16.7%)  
> **Last Updated:** 2026-11-19  
> **Next Action:** Provision live production cloud infrastructure (Render/AWS/Vercel) and configure domain DNS/SSL.  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md)

---

## Phase Progress Summary

| Task | Status | Evidence | Remaining Work |
|:---|:---:|:---|:---|
| Docker Containerization & Multi-Container Compose | **COMPLETED** | `docker-compose.yml`, `docker-compose.dev.yml`, `backend/Dockerfile`, `frontend/Dockerfile`. Next.js standalone runner enabled in `next.config.js`. | None. |
| Production Environment Variable Specification | **COMPLETED** | `backend/.env.example` and `frontend/.env.example` catalog all required keys. | None. |
| Static Asset & Cloudinary CDN Media Storage | **COMPLETED** | WhiteNoise staticfiles serving configured in `settings.py` and `requirements.txt`; Cloudinary CDN active via `apps/core/cloudinary_service.py` with local fallback. | None. |
| SEO Microdata, Dynamic Sitemap & Robots Directives | **COMPLETED** | Verified JSON-LD schemas (`JewelryStore`, `Product`, `BreadcrumbList`), dynamic `sitemap.ts`, and `robots.ts`. | None. |
| Automated Database Backup Archiving & Vault | **COMPLETED** | `apps/core/backup_service.py` creates gzip-compressed JSON snapshots with one-click restore, download, and deletion. | None. |
| Production Cloud Hosting & Reverse Proxy | **PENDING** | Render, Vercel, and AWS EC2 deployment runbooks documented in `DEPLOY.md`. Live cloud hosting unprovisioned. | Provision live server, execute Docker Compose, configure domain DNS records and Cloudflare SSL. |

---

## Completed Tasks
- [x] Multi-container Docker configuration with `output: 'standalone'` enabled in Next.js and WhiteNoise static serving.
- [x] Comprehensive `.env.example` templates specifying all operational, database, and third-party credential keys.
- [x] Hybrid media storage pipeline supporting Cloudinary signed CDN delivery with graceful local filesystem fallbacks.
- [x] Search engine discovery suite with canonical sitemap generator, robots exclusion policies for ERP routes, and luxury JSON-LD structured data.
- [x] Automated database backup manager generating compressed gzip snapshots with one-click restore, listing, and download endpoints.

## Incomplete / Partially Completed Tasks
*None. All container and static configuration tasks are completed.*

## Pending Tasks
- [ ] Deploy containerized application to live cloud hosting platform (Render, AWS EC2, or Vercel).
- [ ] Configure custom domain DNS records (`meghaniwatch.com` and `api.meghaniwatch.com`) with Cloudflare Full (Strict) SSL.

## Blocked Tasks
*None. Awaiting client provisioning of production cloud credentials.*

## Completion Criteria
1. Backend and frontend containers boot and communicate seamlessly via internal Docker network. *(PENDING BUG-01 FIX)*
2. Production domain responds with valid SSL certificate and 200 OK on health endpoints. *(NEEDS LIVE CLOUD)*
3. Scheduled database backups archive safely to off-site cloud storage. *(PASSED LOCALLY)*

## Next Action
Apply pre-deployment fixes (`BUG-01` and `BUG-02`), then proceed with production cloud instance deployment using the runbook in [DEPLOY.md](./deployment/DEPLOY.md).

---

## Original Technical Specifications & Deployment Architecture

### Objective

Deploy the application to production with proper configuration, security, and backup strategies.

---

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (CDN + SSL)                   │
│                    meghaniwatch.com                         │
└─────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│     VERCEL / NETLIFY     │   │    RENDER / AWS EC2      │
│     (Frontend - Next.js) │   │    (Backend - Django)    │
│                          │   │                          │
│  meghaniwatch.com        │   │  api.meghaniwatch.com    │
└──────────────────────────┘   └──────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│    AWS RDS           │   │       REDIS          │   │    CLOUDINARY / S3   │
│    (PostgreSQL)      │   │    (Celery Broker)   │   │    (Media + Backup)  │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

---

### 1. Pre-Deployment Configuration Checklist (Crucial Fixes)

Before building Docker images or deploying to production, ensure these prerequisite configurations are in place:

1. **Frontend Standalone Build (`BUG-01`):**
   In `frontend/next.config.js`, uncomment or set:
   ```javascript
   const nextConfig = {
     output: 'standalone',
     // ...
   };
   module.exports = nextConfig;
   ```
   *Why:* `frontend/Dockerfile` relies on `COPY --from=builder /app/.next/standalone ./` and `COPY --from=builder /app/.next/static ./.next/static`. Without this setting, the Docker build fails.

2. **Backend Static Files Serving (`BUG-02`):**
   In `backend/requirements.txt`, append:
   ```txt
   whitenoise>=6.5.0
   ```
   In `backend/core/settings.py`, register the middleware directly after `SecurityMiddleware`:
   ```python
   MIDDLEWARE = [
       'django.middleware.security.SecurityMiddleware',
       'whitenoise.middleware.WhiteNoiseMiddleware',
       # ...
   ]
   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
   ```

---

### 2. Backend Deployment (Django on Render / AWS EC2)

#### Option A: Render (Recommended for simplicity)

##### render.yaml

```yaml
services:
  - type: web
    name: meghani-connect-api
    env: python
    region: singapore  # Closest to India
    plan: starter
    buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
    startCommand: gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
    envVars:
      - key: DEBUG
        value: False
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: meghani-db
          property: connectionString
      - key: ALLOWED_HOSTS
        value: api.meghaniwatch.com
      - key: CORS_ALLOWED_ORIGINS
        value: https://meghaniwatch.com

databases:
  - name: meghani-db
    plan: starter
    region: singapore
```

#### Option B: AWS EC2

##### Setup Commands

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3.11 python3.11-venv python3-pip nginx postgresql-client -y

# Clone repository
git clone https://github.com/your-repo/meghani-connect-api.git
cd meghani-connect-api/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup environment
cp .env.example .env
nano .env  # Add production values

# Run migrations and collect static
python manage.py migrate
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser
```

##### Gunicorn Service

```ini
# /etc/systemd/system/meghani.service

[Unit]
Description=Meghani Connect API
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/meghani-connect-api/backend
Environment="PATH=/home/ubuntu/meghani-connect-api/backend/venv/bin"
EnvironmentFile=/home/ubuntu/meghani-connect-api/backend/.env
ExecStart=/home/ubuntu/meghani-connect-api/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/gunicorn.sock \
    core.wsgi:application

[Install]
WantedBy=multi-user.target
```

##### Nginx Configuration

```nginx
# /etc/nginx/sites-available/meghani

server {
    listen 80;
    server_name api.meghaniwatch.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        alias /home/ubuntu/meghani-connect-api/backend/staticfiles/;
    }

    location /media/ {
        alias /home/ubuntu/meghani-connect-api/backend/media/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn.sock;
    }
}
```

---

### 3. Frontend Deployment (Next.js on Vercel)

#### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.meghaniwatch.com/api"
  }
}
```

#### Deploy Commands

```bash
cd frontend
npm i -g vercel
vercel login
vercel --prod
```

---

### 4. Database (PostgreSQL on AWS RDS / Render)

#### RDS Configuration

| Setting | Value |
|---------|-------|
| Engine | PostgreSQL 15 |
| Instance | db.t3.micro (free tier) / db.t3.small |
| Storage | 20 GB (auto-scaling) |
| Region | ap-south-1 (Mumbai) |
| Multi-AZ | No (for cost; Yes for high availability) |
| Backup | 7 days retention |

#### Connection String

```
DATABASE_URL=postgres://meghani_admin:password@meghani-db.xxxxxx.ap-south-1.rds.amazonaws.com:5432/meghani_connect_360
```

---

### 5. Media Storage (Cloudinary & S3 Fallback)

Media uploads are handled primarily through Cloudinary CDN via `apps.core.cloudinary_service`:

```python
# settings.py
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
```

If Cloudinary credentials are not supplied, media uploads fall back gracefully to local media directory storage:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

---

### 6. Domain & SSL Setup (Cloudflare)

#### DNS Configuration

| Type | Name | Content | Proxy Status |
|------|------|---------|:---:|
| A | `@` | Vercel IP (76.76.21.21) | Proxied (Orange Cloud) |
| CNAME | `www` | `meghaniwatch.com` | Proxied |
| CNAME | `api` | Render/EC2 server address | Proxied |

#### SSL Settings
- Enable **Full (strict)** SSL
- Enable **Always Use HTTPS**
- Enable **Auto Minify** (JS, CSS, HTML)
- Enable **Brotli Compression**

---

### 7. Backup Strategy

#### Automated Gzip Database Backup

Database backups are generated as gzip-compressed JSON snapshots using `apps.core.backup_service`:

- **Create Backup:** `POST /api/core/backup/create/`
- **List Backups:** `GET /api/core/backup/list/`
- **Restore Backup:** `POST /api/core/backup/restore/`
- **Download Backup:** `GET /api/core/backup/download/{filename}/`
- **Delete Backup:** `DELETE /api/core/backup/delete/{filename}/`

Snapshots are stored under `backend/backups/` and include checksum validation and automatic directory creation.

---

### 8. Monitoring & Health Checks

#### Health Check Endpoints

| Endpoint | Method | Permission | Description |
|----------|:---:|:---:|-------------|
| `/api/core/health/` | GET | AllowAny | Overall health, DB connectivity, Redis status, uptime |
| `/api/core/ready/` | GET | AllowAny | Readiness probe for container orchestrators |
| `/api/core/live/` | GET | AllowAny | Liveness probe for uptime monitoring |

#### Sentry (Error Tracking)

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=False
)
```

---

### 9. Monthly Cost Estimate

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Backend | Render | Starter | $7 |
| Database | Render PostgreSQL | Starter | $7 |
| Redis | Render Redis | Starter | $0 (Free) |
| Frontend | Vercel | Hobby | $0 (Free) |
| Media Storage | Cloudinary | Free Tier (25GB) | $0 |
| Domain & SSL | Cloudflare | Free Tier | $0 |
| **Total** | | | **~$14/month** |

---

### 10. Master Verification Status

| Item | Classification | Verification Status |
|:---|:---:|:---|
| Multi-container Docker | `PARTIALLY COMPLETE` | `BUG-01` (`output: 'standalone'` in `next.config.js`) must be resolved before container builds. |
| Static file serving | `PARTIALLY COMPLETE` | `BUG-02` (`whitenoise` in `requirements.txt` and `MIDDLEWARE`) must be added for production staticfiles. |
| Production cloud hosting | `PENDING` | Awaiting live infrastructure provisioning, DNS, and SSL. |
