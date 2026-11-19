# Meghani Connect 360 - Deployment Guide

> **Document Location:** `docs/deployment/DEPLOY.md`  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](../PROJECT_EXECUTION_TRACKER.md)  
> **Detailed Phase Specification:** [Phase 8 – Deployment & Hosting](../08-phase-8-deployment.md)  
> **Last Updated:** 2026-11-19

---

## Pre-Deployment Configuration Checklist (Crucial)

Before building Docker images or initiating cloud deployments, verify that the following prerequisites are applied:

1. **Frontend Standalone Build (`BUG-01`):**
   In `frontend/next.config.js`, ensure `output: 'standalone'` is active:
   ```javascript
   const nextConfig = {
     output: 'standalone',
     // ...
   };
   module.exports = nextConfig;
   ```
   *Required for the multi-stage Next.js `Dockerfile` to successfully bundle the production runner layer.*

2. **Backend Static Files Serving (`BUG-02`):**
   In `backend/requirements.txt`, ensure `whitenoise>=6.5.0` is present:
   ```txt
   whitenoise>=6.5.0
   ```
   And register `WhiteNoiseMiddleware` immediately following `SecurityMiddleware` in `backend/core/settings.py`:
   ```python
   MIDDLEWARE = [
       'django.middleware.security.SecurityMiddleware',
       'whitenoise.middleware.WhiteNoiseMiddleware',
       # ...
   ]
   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
   ```

---

## Quick Start (Docker)

```bash
# Clone and navigate to project
cd Meghani-Connects

# Copy environment file
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit .env files with your operational credentials

# Start all services (Database, Redis, Backend, Frontend, Celery Worker, Celery Beat)
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create initial administrator
docker-compose exec backend python manage.py createsuperuser

# Access the applications:
# Public Boutique: http://localhost:3000
# Staff Operations Portal: http://localhost:3000/dashboard
# Backend API: http://localhost:8000/api
# Django Admin: http://localhost:8000/admin
```

---

## Deployment Options

### Option 1: Render (Recommended - Simplest)

**Cost:** ~$14/month

1. **Create Render Account** at https://render.com

2. **Deploy Backend:**
   - New > Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - Start Command: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
   - Add environment variables from `backend/.env.example`

3. **Deploy Database:**
   - New > PostgreSQL
   - Copy connection string to backend env: `DATABASE_URL`

4. **Deploy Frontend:**
   - Use Vercel (below) or Render Web Service
   - Set `NEXT_PUBLIC_API_URL` to your Render backend API URL (e.g., `https://api.meghaniwatch.com/api`)

---

### Option 2: Vercel (Frontend) + Render (Backend)

**Cost:** ~$7/month (Vercel free hobby tier + Render backend starter)

1. **Frontend on Vercel:**
   ```bash
   cd frontend
   npm i -g vercel
   vercel login
   vercel --prod
   ```
   - Set environment variable: `NEXT_PUBLIC_API_URL=https://api.meghaniwatch.com/api`

2. **Backend on Render:** (same as Option 1)

---

### Option 3: AWS (Production Scale)

**Cost:** ~$50-100/month

| Service | AWS Component |
|---------|---------------|
| Backend | EC2 t3.small |
| Database | RDS PostgreSQL 15 |
| Redis | ElastiCache |
| Storage | S3 / Cloudinary |
| CDN | CloudFront |

**Setup:**
```bash
# On EC2 instance
sudo apt update && sudo apt install python3.11 python3.11-venv nginx -y

# Clone and setup
git clone your-repo
cd Meghani-Connects/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations and collect static
python manage.py migrate
python manage.py collectstatic --noinput

# Configure nginx, gunicorn, and systemd services
# See docs/08-phase-8-deployment.md for full configs
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
# Required
DEBUG=False
SECRET_KEY=your-secure-secret-key
DATABASE_URL=postgres://user:pass@host:5432/dbname
ALLOWED_HOSTS=api.meghaniwatch.com
CORS_ALLOWED_ORIGINS=https://meghaniwatch.com

# Optional / Feature-Specific
REDIS_URL=redis://host:6379/0
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_NUMBER=+14155238886
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
SENTRY_DSN=xxx
```

### Frontend (`frontend/.env.production`)
```env
NEXT_PUBLIC_API_URL=https://api.meghaniwatch.com/api
NEXT_PUBLIC_APP_NAME=Meghani Connect 360
```

---

## Health Checks & Diagnostics

| Endpoint | Description | Permission |
|----------|-------------|:---:|
| `/api/core/health/` (and `/api/health/`) | Full system health status (DB, Redis, Celery, uptime) | `AllowAny` |
| `/api/core/ready/` (and `/api/ready/`) | Container / Kubernetes readiness probe | `AllowAny` |
| `/api/core/live/` (and `/api/live/`) | Container liveness probe | `AllowAny` |

---

## SSL / Domain Setup (Cloudflare)

1. Add domain `meghaniwatch.com` to Cloudflare.
2. Configure DNS records:
   - A record: `@` → Vercel IP (`76.76.21.21`), Proxied
   - CNAME: `www` → `meghaniwatch.com`, Proxied
   - CNAME: `api` → Render/EC2 endpoint, Proxied
3. Enable SSL: **Full (strict)**.
4. Enable: **Always Use HTTPS** and **Brotli Compression**.

---

## Backup Strategy

### Manual Gzip Archiving via API:
- `POST /api/core/backup/create/` (generates `.json.gz` snapshot in `backend/backups/`)
- `GET /api/core/backup/list/` (lists existing snapshots with timestamps and byte sizes)
- `POST /api/core/backup/restore/` (restores snapshot)

### CLI Database Dump (Docker):
```bash
# Manual PostgreSQL dump
docker-compose exec db pg_dump -U meghani_admin meghani_connect_360 > backup.sql

# Restore dump
docker-compose exec -T db psql -U meghani_admin meghani_connect_360 < backup.sql
```

---

## Celery Workers (Background Tasks)

```bash
# Start Celery worker
celery -A core worker -l info

# Start Celery Beat scheduler
celery -A core beat -l info

# Docker (already included in docker-compose.yml)
docker-compose up -d celery celery-beat
```

---

## Launch Checklist

- [ ] `output: 'standalone'` uncommented in `frontend/next.config.js` (`BUG-01`)
- [ ] `whitenoise>=6.5.0` added to `backend/requirements.txt` and `MIDDLEWARE` (`BUG-02`)
- [ ] `DEBUG=False` in production `.env`
- [ ] Unique, cryptographically strong `SECRET_KEY` generated
- [ ] SSL certificate active via Cloudflare Full (Strict)
- [ ] Database backup creation endpoint verified
- [ ] Celery worker and Celery Beat daemon active
- [ ] Health check (`/api/core/health/`) returns HTTP 200 `healthy`
- [ ] Test authentication and JWT auto-refresh
- [ ] Test POS barcode lookup, split payments, and thermal receipt print
- [ ] Test watch repair ticket lifecycle (`received` $\rightarrow$ `ready`)
