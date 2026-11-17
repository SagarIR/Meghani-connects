# Phase 8 – Deployment & Hosting

> **Current Status:** NEEDS VERIFICATION  
> **Progress:** 5 / 6 verified tasks  
> **Last Updated:** 2026-11-17  
> **Next Action:** Provision live production infrastructure (Render/AWS), configure DNS records, and verify live SSL certificates.  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md)

---

## Phase Progress Summary

| Task | Status | Evidence | Remaining Work |
|:---|:---:|:---|:---|
| Docker Containerization & Multi-Container Compose | **COMPLETED** | `docker-compose.yml`, `docker-compose.dev.yml`, `backend/Dockerfile`, `frontend/Dockerfile`. | None. |
| Production Environment Variable Specification | **COMPLETED** | `backend/.env.example` and `frontend/.env.example` catalog all required keys. | None. |
| Static Asset & Cloudinary CDN Media Storage | **COMPLETED** | WhiteNoise configured for Django staticfiles; `apps/core/cloudinary_service.py` handles image uploads with local media fallback. | None. |
| SEO Microdata, Dynamic Sitemap & Robots Directives | **COMPLETED** | Verified JSON-LD schemas (`JewelryStore`, `Product`, `BreadcrumbList`), dynamic `sitemap.ts`, and `robots.ts`. | None. |
| Automated Database Backup Archiving & Vault | **COMPLETED** | `apps/core/backup_service.py` creates gzip-compressed JSON snapshots with one-click restore and deletion. | None. |
| Production Cloud Hosting & Reverse Proxy | **NEEDS VERIFICATION** | Render, Vercel, and AWS EC2 deployment topologies documented in `DEPLOY.md`. Actual live hosting requires live cloud infrastructure provisioning. | Provision live server, execute Docker Compose, configure domain DNS and SSL. |

---

## Completed Tasks
- [x] Multi-container Docker configuration supporting frontend, backend, PostgreSQL, Redis, and Celery workers.
- [x] Comprehensive `.env.example` templates specifying all operational and third-party credential keys.
- [x] Hybrid media storage pipeline supporting Cloudinary signed CDN delivery with graceful local filesystem fallbacks.
- [x] Search engine discovery suite with canonical sitemap generators, robots exclusion policies for ERP routes, and luxury structured data.
- [x] Automated database backup manager generating compressed gzip snapshots with one-click restore and download.

## Pending Tasks
- [ ] Deploy containerized application to live cloud hosting platform (Render, AWS EC2, or Vercel).
- [ ] Configure custom domain DNS records (`meghaniwatch.com` and `api.meghaniwatch.com`) with Cloudflare Full SSL.

## Blocked Tasks
*None. Awaiting client provisioning of production cloud credentials.*

## Completion Criteria
1. Backend and frontend containers boot and communicate seamlessly via internal Docker network. *(PASSED)*
2. Production domain responds with valid SSL certificate and 200 OK on health endpoints. *(NEEDS LIVE CLOUD)*
3. Scheduled database backups archive safely to off-site cloud storage. *(PASSED LOCALLY)*

## Next Action
Provision staging or production cloud instance using Docker Compose runbook in [DEPLOY.md](./deployment/DEPLOY.md).

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
│                    meghani-connect.com                      │
└─────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│     VERCEL / NETLIFY     │   │    RENDER / AWS EC2      │
│     (Frontend - Next.js) │   │    (Backend - Django)    │
│                          │   │                          │
│  meghani-connect.com     │   │  api.meghani-connect.com │
└──────────────────────────┘   └──────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│    AWS RDS           │   │       REDIS          │   │       AWS S3         │
│    (PostgreSQL)      │   │    (Celery Broker)   │   │    (Media + Backup)  │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

---

### 1. Backend Deployment (Django on Render)

#### Option A: Render (Recommended for simplicity)

##### render.yaml

```yaml
services:
  - type: web
    name: meghani-connect-api
    env: python
    region: singapore  # Closest to India
    plan: starter
    buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput
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
        value: api.meghani-connect.com
      - key: CORS_ALLOWED_ORIGINS
        value: https://meghani-connect.com

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
cd meghani-connect-api

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup environment
cp .env.example .env
nano .env  # Add production values

# Run migrations
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
WorkingDirectory=/home/ubuntu/meghani-connect-api
Environment="PATH=/home/ubuntu/meghani-connect-api/venv/bin"
EnvironmentFile=/home/ubuntu/meghani-connect-api/.env
ExecStart=/home/ubuntu/meghani-connect-api/venv/bin/gunicorn \
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
    server_name api.meghani-connect.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        alias /home/ubuntu/meghani-connect-api/staticfiles/;
    }

    location /media/ {
        alias /home/ubuntu/meghani-connect-api/media/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn.sock;
    }
}
```

---

### 2. Frontend Deployment (Next.js on Vercel)

#### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.meghani-connect.com"
  }
}
```

#### Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

---

### 3. Database (PostgreSQL on AWS RDS)

#### RDS Configuration

| Setting | Value |
|---------|-------|
| Engine | PostgreSQL 15 |
| Instance | db.t3.micro (free tier) / db.t3.small |
| Storage | 20 GB (auto-scaling) |
| Region | ap-south-1 (Mumbai) |
| Multi-AZ | No (for cost, Yes for production) |
| Backup | 7 days retention |

#### Security Group

```
Inbound Rules:
- Type: PostgreSQL (5432)
- Source: Your EC2 Security Group / Render IPs
```

#### Connection String

```
DATABASE_URL=postgres://meghani_admin:password@meghani-db.xxxxxx.ap-south-1.rds.amazonaws.com:5432/meghani_connect_360
```

---

### 4. Redis (For Celery)

#### Option A: Render Redis

```yaml
# Add to render.yaml
services:
  - type: redis
    name: meghani-redis
    plan: starter
    region: singapore
```

#### Option B: AWS ElastiCache

| Setting | Value |
|---------|-------|
| Engine | Redis 7.x |
| Node Type | cache.t3.micro |
| Region | ap-south-1 |

---

### 5. Media Storage (AWS S3)

#### S3 Bucket Configuration

```bash
# Create bucket
aws s3 mb s3://meghani-connect-media --region ap-south-1

# Bucket policy
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::meghani-connect-media/*"
        }
    ]
}
```

#### Django Settings

```python
# settings.py

# S3 Configuration
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = 'meghani-connect-media'
AWS_S3_REGION_NAME = 'ap-south-1'
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_DEFAULT_ACL = 'public-read'

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'
```

---

### 6. Domain & SSL

#### DNS Configuration (Cloudflare)

| Type | Name | Content |
|------|------|---------|
| A | @ | Vercel IP |
| CNAME | www | meghani-connect.com |
| CNAME | api | render/ec2 domain |

#### SSL (Cloudflare)

- Enable Full (strict) SSL
- Enable Always Use HTTPS
- Enable Auto Minify (JS, CSS, HTML)

---

### 7. Backup Strategy

#### Automated Database Backup

```python
# scripts/backup_db.py

import subprocess
import boto3
from datetime import datetime
import os

def backup_database():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'backup_{timestamp}.sql'
    
    # Create backup
    subprocess.run([
        'pg_dump',
        '-h', os.getenv('DATABASE_HOST'),
        '-U', os.getenv('DATABASE_USER'),
        '-d', os.getenv('DATABASE_NAME'),
        '-f', filename
    ])
    
    # Compress
    subprocess.run(['gzip', filename])
    
    # Upload to S3
    s3 = boto3.client('s3')
    s3.upload_file(
        f'{filename}.gz',
        'meghani-connect-backups',
        f'database/{filename}.gz'
    )
    
    # Cleanup local file
    os.remove(f'{filename}.gz')
    
    print(f'Backup completed: {filename}.gz')

if __name__ == '__main__':
    backup_database()
```

#### Cron Job (EC2)

```bash
# Nightly backup at 2 AM
0 2 * * * /home/ubuntu/meghani-connect-api/venv/bin/python /home/ubuntu/meghani-connect-api/scripts/backup_db.py >> /var/log/backup.log 2>&1
```

#### Celery Task (Alternative)

```python
@shared_task
def nightly_backup():
    from scripts.backup_db import backup_database
    backup_database()
```

---

### 8. Environment Variables Checklist

#### Backend (.env)

```env
# Django
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=api.meghani-connect.com

# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://hostname:6379/0

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=meghani-connect-media

# Twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Razorpay
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret

# CORS
CORS_ALLOWED_ORIGINS=https://meghani-connect.com
```

#### Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL=https://api.meghani-connect.com
NEXT_PUBLIC_APP_NAME=Meghani Connect 360
```

---

### 9. Monitoring & Logging

#### Sentry (Error Tracking)

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=True
)
```

#### Health Check Endpoint

```python
# apps/core/views.py

class HealthCheckView(APIView):
    permission_classes = []
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'database': self.check_database(),
            'redis': self.check_redis(),
            'timestamp': timezone.now()
        })
```

---

### 10. Deployment Checklist

#### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database migrations tested
- [ ] Static files collected
- [ ] SECRET_KEY is unique and secure
- [ ] DEBUG = False
- [ ] ALLOWED_HOSTS configured

#### Post-Deployment

- [ ] SSL certificate active
- [ ] Database connected
- [ ] Redis connected
- [ ] Celery workers running
- [ ] Celery beat running
- [ ] Media uploads working
- [ ] Email/WhatsApp notifications working
- [ ] Backup cron job running
- [ ] Monitoring active
- [ ] Test all critical flows

---

### Cost Estimate (Monthly)

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Backend | Render | Starter | $7 |
| Database | Render | Starter | $7 |
| Redis | Render | Starter | $0 (free) |
| Frontend | Vercel | Free | $0 |
| Storage | AWS S3 | Pay as you go | ~$1 |
| Domain | Cloudflare | Pro | $0 |
| **Total** | | | **~$15/month** |

---

### Production Upgrade Path

When traffic grows:

1. **Backend**: Render Starter → Standard ($25/mo)
2. **Database**: Render Starter → Standard ($15/mo) or AWS RDS
3. **Add**: Load balancer for multiple backend instances
4. **Add**: CDN for static assets (CloudFront)
5. **Add**: Dedicated Redis cluster
