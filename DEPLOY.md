# Meghani Connect 360 - Deployment Guide

## Quick Start (Docker)

```bash
# Clone and navigate to project
cd meghani_connect_360

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api
# Admin: http://localhost:8000/admin
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
   - Add environment variables from `.env.example`

3. **Deploy Database:**
   - New > PostgreSQL
   - Copy connection string to backend env: `DATABASE_URL`

4. **Deploy Frontend:**
   - Use Vercel (below) or Render Static Site
   - Set `NEXT_PUBLIC_API_URL` to your Render backend URL

---

### Option 2: Vercel + Render

**Cost:** ~$7/month (Vercel free + Render backend)

1. **Frontend on Vercel:**
   ```bash
   cd frontend
   npm i -g vercel
   vercel login
   vercel --prod
   ```
   - Set env: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`

2. **Backend on Render:** (same as above)

---

### Option 3: AWS (Production Scale)

**Cost:** ~$50-100/month

| Service | AWS Component |
|---------|---------------|
| Backend | EC2 t3.small |
| Database | RDS PostgreSQL |
| Redis | ElastiCache |
| Storage | S3 |
| CDN | CloudFront |

**Setup:**
```bash
# On EC2 instance
sudo apt update && sudo apt install python3.11 python3.11-venv nginx -y

# Clone and setup
git clone your-repo
cd meghani_connect_360/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure nginx, gunicorn, systemd
# See docs/08-phase-8-deployment.md for full configs
```

---

## Environment Variables

### Backend (.env)
```env
# Required
DEBUG=False
SECRET_KEY=your-secure-secret-key
DATABASE_URL=postgres://user:pass@host:5432/dbname
ALLOWED_HOSTS=api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Optional
REDIS_URL=redis://host:6379/0
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
SENTRY_DSN=xxx
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## Health Checks

| Endpoint | Description |
|----------|-------------|
| `/api/health/` | Full health status |
| `/api/ready/` | Readiness probe |
| `/api/live/` | Liveness probe |

---

## SSL/Domain Setup (Cloudflare)

1. Add domain to Cloudflare
2. Configure DNS:
   - A record: `@` → Vercel IP
   - CNAME: `api` → Render/EC2 domain
3. Enable SSL: Full (strict)
4. Enable: Always Use HTTPS

---

## Backup Strategy

```bash
# Manual backup
docker-compose exec db pg_dump -U meghani_admin meghani_connect > backup.sql

# Restore
docker-compose exec -T db psql -U meghani_admin meghani_connect < backup.sql
```

---

## Celery Workers (Background Tasks)

```bash
# Start worker
celery -A core worker -l info

# Start scheduler
celery -A core beat -l info

# Docker (already included in docker-compose.yml)
docker-compose up -d celery celery-beat
```

---

## Monitoring

1. **Sentry** - Error tracking
   - Add `SENTRY_DSN` to env

2. **UptimeRobot** - Uptime monitoring
   - Monitor: `https://api.yourdomain.com/api/health/`

---

## Checklist Before Launch

- [ ] DEBUG=False in production
- [ ] Unique SECRET_KEY
- [ ] SSL certificate active
- [ ] Database backup configured
- [ ] Celery workers running
- [ ] Health checks passing
- [ ] Test login flow
- [ ] Test sales creation
- [ ] Test repair creation
- [ ] Test notifications (if Twilio configured)
