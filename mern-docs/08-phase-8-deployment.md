# Phase 8 – Deployment & Hosting (MERN)

## Objective

Deploy the MERN application to production with proper configuration, security, and backup.

---

## Deployment Architecture

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
│     VERCEL / NETLIFY     │   │   RENDER / RAILWAY       │
│     (Frontend - React)   │   │   (Backend - Express)    │
│                          │   │                          │
│  meghani-connect.com     │   │  api.meghani-connect.com │
└──────────────────────────┘   └──────────────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                              ▼                         ▼
                   ┌──────────────────┐   ┌──────────────────┐
                   │  MONGODB ATLAS   │   │     AWS S3       │
                   │  (Database)      │   │  (Media/Backup)  │
                   └──────────────────┘   └──────────────────┘
```

---

## 1. Backend Deployment (Express on Render)

### render.yaml

```yaml
services:
  - type: web
    name: meghani-connect-api
    env: node
    region: singapore
    plan: starter
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://meghani-connect.com
```

### Production server.js updates

```javascript
// Add trust proxy for Render
app.set('trust proxy', 1);

// Add rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Compression
const compression = require('compression');
app.use(compression());
```

---

## 2. Frontend Deployment (React on Vercel)

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Environment Variables

Set in Vercel Dashboard:
- `VITE_API_URL` = `https://api.meghani-connect.com`
- `VITE_APP_NAME` = `Meghani Connect 360`

---

## 3. MongoDB Atlas Setup

### Steps

1. Create account at mongodb.com/atlas
2. Create new cluster (Free M0 or Paid M10+)
3. Set region: Mumbai (ap-south-1)
4. Create database user
5. Whitelist IP addresses (or 0.0.0.0/0 for Render)
6. Get connection string

### Connection String

```
mongodb+srv://username:password@cluster.xxxxx.mongodb.net/meghani_connect_360?retryWrites=true&w=majority
```

### Indexes (Run once)

```javascript
// Connect to MongoDB Atlas and run:
db.products.createIndex({ name: "text", brand: "text", barcode: "text" });
db.products.createIndex({ barcode: 1 });
db.sales.createIndex({ createdAt: -1 });
db.sales.createIndex({ invoiceNumber: 1 });
db.repairs.createIndex({ ticketNumber: 1 });
db.repairs.createIndex({ status: 1 });
db.customers.createIndex({ phone: 1 });
db.warranties.createIndex({ expiryDate: 1 });
```

---

## 4. AWS S3 for Media Storage

### Setup

```bash
aws s3 mb s3://meghani-connect-media --region ap-south-1
```

### Multer-S3 Configuration

```javascript
// config/s3.js

const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
```

---

## 5. Environment Variables

### Backend (.env.production)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/meghani_connect_360
JWT_SECRET=your-super-secret-production-key
JWT_EXPIRE=30d

# CORS
FRONTEND_URL=https://meghani-connect.com

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=meghani-connect-media

# Twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=+14155238886

# Razorpay
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

---

## 6. Domain & SSL

### Cloudflare DNS

| Type | Name | Content |
|------|------|---------|
| CNAME | @ | cname.vercel-dns.com |
| CNAME | www | cname.vercel-dns.com |
| CNAME | api | your-render-url.onrender.com |

### SSL Settings

- SSL/TLS: Full (strict)
- Always Use HTTPS: On
- Auto Minify: JS, CSS, HTML

---

## 7. PM2 for Process Management (if using VPS)

### ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'meghani-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true
  }]
};
```

### Commands

```bash
# Start
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Logs
pm2 logs meghani-api
```

---

## 8. Database Backup

### Automated Backup Script

```javascript
// scripts/backup.js

const { exec } = require('child_process');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.gz`;
  const filepath = path.join('/tmp', filename);

  // Run mongodump
  const cmd = `mongodump --uri="${process.env.MONGODB_URI}" --archive="${filepath}" --gzip`;
  
  exec(cmd, async (error, stdout, stderr) => {
    if (error) {
      console.error('Backup failed:', error);
      return;
    }

    // Upload to S3
    const fileStream = fs.createReadStream(filepath);
    
    await s3.upload({
      Bucket: process.env.AWS_BACKUP_BUCKET,
      Key: `backups/${filename}`,
      Body: fileStream
    }).promise();

    // Cleanup
    fs.unlinkSync(filepath);
    console.log(`Backup completed: ${filename}`);
  });
}

// Schedule daily backup
const cron = require('node-cron');
cron.schedule('0 2 * * *', backup); // 2 AM daily

module.exports = { backup };
```

---

## 9. Health Check & Monitoring

### Health Endpoint

```javascript
// routes/health.routes.js

const router = require('express').Router();
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };

  try {
    await mongoose.connection.db.admin().ping();
    res.json(healthcheck);
  } catch (error) {
    healthcheck.status = 'error';
    healthcheck.database = 'error';
    res.status(503).json(healthcheck);
  }
});

module.exports = router;
```

### Sentry Error Tracking

```javascript
// Add to server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
// ... routes
app.use(Sentry.Handlers.errorHandler());
```

---

## 10. Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] MongoDB indexes created
- [ ] JWT secret is strong and unique
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Compression enabled

### Post-Deployment

- [ ] SSL certificate active
- [ ] Database connected
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] File uploads working (S3)
- [ ] WhatsApp notifications working
- [ ] Backup cron job running
- [ ] Monitoring active

---

## Cost Estimate (Monthly)

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Backend | Render | Starter | $7 |
| Database | MongoDB Atlas | M0 Free / M10 | $0 / $57 |
| Frontend | Vercel | Free | $0 |
| Storage | AWS S3 | Pay as you go | ~$1 |
| CDN/DNS | Cloudflare | Free | $0 |
| **Total (Free Tier)** | | | **~$8/month** |
| **Total (Production)** | | | **~$65/month** |

---

## Scaling Path

When traffic grows:

1. **Backend**: Render Starter → Standard ($25/mo)
2. **Database**: Atlas M0 → M10 → M30
3. **Add**: Redis for caching (Render Redis)
4. **Add**: Load balancer for multiple instances
5. **Add**: CDN for static assets (CloudFront)
