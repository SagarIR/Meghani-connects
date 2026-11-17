# Phase 1 – Core Architecture & Environment Setup (MERN)

> **ARCHIVED LEGACY SPECIFICATION – SUPERSEDED**  
> **Status:** Legacy Reference Only  
> **Architecture:** MERN (Node.js/Express/MongoDB) – Abandoned in favor of Django 4.2 LTS / PostgreSQL / Next.js 14.  
> **Active Specification Reference:** [Phase 1 Setup](../../../01-phase-1-setup.md)  
> **Document Location:** `docs/archive/legacy/mern-docs/01-phase-1-setup.md`

---

## Objective

Establish the development environment, define folder structure, and create project foundations.

---

## Tasks Checklist

- [ ] Setup Git repository
- [ ] Create Express.js backend project
- [ ] Create React + Vite frontend project
- [ ] Configure MongoDB with environment variables
- [ ] Setup CORS configuration
- [ ] Setup JWT authentication base
- [ ] Setup API testing environment (Postman/Thunder Client)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20+ LTS | Backend & Frontend runtime |
| MongoDB | 7.0+ | Database (local or Atlas) |
| Git | Latest | Version control |

---

## Step 1: Git Repository Setup

```bash
# Initialize repository
git init

# Create .gitignore
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
```

---

## Step 2: Backend Setup (Express.js)

```bash
# Create backend folder
mkdir backend
cd backend

# Initialize package.json
npm init -y

# Install dependencies
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
npm install multer morgan helmet express-validator
npm install -D nodemon

# Create folder structure
mkdir -p config middleware models routes controllers services utils
```

---

## Next Phase

→ [Phase 2 - Backend Structure](./02-phase-2-backend.md)
