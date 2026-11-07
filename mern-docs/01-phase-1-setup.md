# Phase 1 – Core Architecture & Environment Setup (MERN)

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

### VS Code Extensions (Recommended)

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Thunder Client (API testing)
- MongoDB for VS Code
- Prettier
- ESLint

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

### package.json scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### server.js (Entry Point)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/repairs', require('./routes/repairs.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));

// Error handler
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## Step 3: MongoDB Configuration

### Option A: Local MongoDB

```bash
# Install MongoDB locally
# Windows: Download from mongodb.com
# Start MongoDB service
```

### Option B: MongoDB Atlas (Cloud)

1. Create account at mongodb.com/atlas
2. Create free cluster
3. Get connection string

### config/db.js

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Environment Variables (.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meghani_connect_360
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
```

---

## Step 4: Frontend Setup (React + Vite)

```bash
# Go back to project root
cd ..

# Create React app with Vite
npm create vite@latest frontend -- --template react

# Navigate and install dependencies
cd frontend
npm install

# Install additional packages
npm install axios react-router-dom react-hook-form @hookform/resolvers yup
npm install recharts lucide-react react-hot-toast date-fns
npm install @tanstack/react-query

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
```

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Step 5: CORS Configuration

### backend/config/cors.js

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
```

### Update server.js

```javascript
const corsOptions = require('./config/cors');
app.use(cors(corsOptions));
```

---

## Step 6: JWT Authentication Setup

### middleware/auth.js

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
};

module.exports = { protect, authorize };
```

---

## Deliverables

| Item | Status |
|------|--------|
| Running Express backend (http://localhost:5000) | Pending |
| Running React frontend (http://localhost:5173) | Pending |
| MongoDB database connected | Pending |
| Git repository initialized | Pending |
| CORS configured | Pending |
| JWT auth middleware ready | Pending |

---

## Project Structure After Phase 1

```
meghani_connect_360/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── .gitignore
```

---

## Next Phase

→ [Phase 2 - Backend Structure](./02-phase-2-backend.md)
