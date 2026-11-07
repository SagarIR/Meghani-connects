# Phase 1 – Core Architecture & Environment Setup

## Objective

Establish the development environment, define folder structure, and create project foundations.

---

## Tasks Checklist

- [ ] Setup Git repository
- [ ] Create Django backend project
- [ ] Create Next.js frontend project
- [ ] Configure PostgreSQL with environment variables
- [ ] Setup CORS configuration
- [ ] Setup JWT authentication base
- [ ] Setup API testing environment (Postman/Thunder Client)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| PostgreSQL | 15+ | Database |
| Git | Latest | Version control |

### VS Code Extensions (Recommended)

- Python
- Pylance
- Django
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Thunder Client (API testing)

---

## Step 1: Git Repository Setup

```bash
# Initialize repository
git init

# Create .gitignore
# (Backend)
__pycache__/
*.pyc
.env
db.sqlite3
media/
*.log

# (Frontend)
node_modules/
.next/
.env.local
```

---

## Step 2: Django Backend Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install Django
pip install django djangorestframework psycopg2-binary python-dotenv

# Create project
django-admin startproject core .

# Create apps
python manage.py startapp users
python manage.py startapp products
python manage.py startapp sales
python manage.py startapp repairs
python manage.py startapp crm
python manage.py startapp expenses
python manage.py startapp analytics
python manage.py startapp notifications
```

---

## Step 3: PostgreSQL Configuration

### Create Database

```sql
CREATE DATABASE meghani_connect_360;
CREATE USER meghani_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE meghani_connect_360 TO meghani_admin;
```

### Environment Variables (.env)

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_NAME=meghani_connect_360
DATABASE_USER=meghani_admin
DATABASE_PASSWORD=your_secure_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

---

## Step 4: Next.js Frontend Setup

```bash
# Create Next.js project
npx create-next-app@latest frontend --typescript --tailwind --eslint --app

# Install additional dependencies
cd frontend
npm install axios react-hook-form @hookform/resolvers yup
npm install recharts lucide-react
```

---

## Step 5: CORS Configuration

### Install django-cors-headers

```bash
pip install django-cors-headers
```

### settings.py

```python
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

---

## Deliverables

| Item | Status |
|------|--------|
| Running Django backend (http://localhost:8000) | Pending |
| Running Next.js frontend (http://localhost:3000) | Pending |
| PostgreSQL database connected | Pending |
| Git repository initialized | Pending |
| CORS configured | Pending |
| API testing environment ready | Pending |

---

## Next Phase

→ [Phase 2 - Backend Structure](./02-phase-2-backend.md)
