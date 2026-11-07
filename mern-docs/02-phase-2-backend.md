# Phase 2 – Backend Folder Structure (MERN)

## Objective

Organize Express.js backend with modular structure, middleware, and services.

---

## Directory Structure

```
backend/
│
├── package.json
├── server.js                 → Entry point
├── .env
│
├── config/
│   ├── db.js                 → MongoDB connection
│   ├── cors.js               → CORS configuration
│   └── keys.js               → Environment variables
│
├── middleware/
│   ├── auth.js               → JWT authentication
│   ├── errorHandler.js       → Global error handler
│   ├── validate.js           → Request validation
│   └── upload.js             → Multer file upload
│
├── models/
│   ├── User.js               → User schema
│   ├── Product.js            → Product schema
│   ├── Sale.js               → Sales schema
│   ├── SaleItem.js           → Sale items schema
│   ├── Repair.js             → Repair schema
│   ├── Customer.js           → Customer schema
│   ├── Expense.js            → Expense schema
│   ├── Warranty.js           → Warranty schema
│   ├── Notification.js       → Notification schema
│   └── AnalyticsCache.js     → Analytics cache schema
│
├── routes/
│   ├── auth.routes.js        → Login/Register routes
│   ├── users.routes.js       → User management
│   ├── products.routes.js    → Product CRUD
│   ├── sales.routes.js       → POS & billing
│   ├── repairs.routes.js     → Repair workflows
│   ├── customers.routes.js   → CRM routes
│   ├── expenses.routes.js    → Expense logging
│   ├── analytics.routes.js   → AI insights & reports
│   └── notifications.routes.js → WhatsApp/SMS
│
├── controllers/
│   ├── auth.controller.js
│   ├── users.controller.js
│   ├── products.controller.js
│   ├── sales.controller.js
│   ├── repairs.controller.js
│   ├── customers.controller.js
│   ├── expenses.controller.js
│   ├── analytics.controller.js
│   └── notifications.controller.js
│
├── services/
│   ├── whatsapp.service.js   → Twilio WhatsApp
│   ├── sms.service.js        → SMS Gateway
│   ├── payment.service.js    → Razorpay integration
│   ├── pdf.service.js        → Invoice generation (PDFKit)
│   ├── excel.service.js      → Excel export (exceljs)
│   └── ai.service.js         → Forecasting logic
│
├── utils/
│   ├── helpers.js            → Utility functions
│   ├── constants.js          → App constants
│   ├── logger.js             → Winston logger
│   └── generateToken.js      → JWT token generator
│
├── validators/
│   ├── auth.validator.js     → Auth request validation
│   ├── product.validator.js  → Product validation
│   ├── sale.validator.js     → Sale validation
│   └── customer.validator.js → Customer validation
│
├── uploads/                  → Uploaded receipts/images
│
└── scripts/
    ├── seed.js               → Database seeding
    └── backup.js             → Backup script
```

---

## Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `auth` | User registration, login, JWT tokens |
| `users` | User CRUD, role management |
| `products` | Product CRUD, stock management, barcode |
| `sales` | POS transactions, invoice generation |
| `repairs` | Repair job CRUD, status tracking |
| `customers` | Customer profiles, loyalty points |
| `expenses` | Expense categories, logging |
| `analytics` | AI forecasting, reports, metrics |
| `notifications` | WhatsApp/SMS templates, sending |

---

## package.json

```json
{
  "name": "meghani-connect-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5-lts.1",
    "twilio": "^4.19.0",
    "razorpay": "^2.9.2",
    "pdfkit": "^0.14.0",
    "exceljs": "^4.4.0",
    "node-cron": "^3.0.3",
    "winston": "^3.11.0",
    "simple-statistics": "^7.8.3",
    "@tensorflow/tfjs-node": "^4.14.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## Core Files

### server.js

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const corsOptions = require('./config/cors');

const app = express();

// Connect to MongoDB
connectDB();

// Security & Parsing Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/repairs', require('./routes/repairs.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```

---

### middleware/errorHandler.js

```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

---

### middleware/validate.js

```javascript
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

module.exports = validate;
```

---

### middleware/upload.js

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only images and PDFs are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
```

---

### utils/generateToken.js

```javascript
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = generateToken;
```

---

### utils/helpers.js

```javascript
// Generate invoice number: INV-YYYYMMDD-XXXX
const generateInvoiceNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${random}`;
};

// Generate repair ticket: REP-YYYYMMDD-XXXX
const generateTicketNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REP-${dateStr}-${random}`;
};

// Calculate profit
const calculateProfit = (items) => {
  return items.reduce((total, item) => {
    return total + ((item.unitPrice - item.costPrice) * item.quantity);
  }, 0);
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

module.exports = {
  generateInvoiceNumber,
  generateTicketNumber,
  calculateProfit,
  paginate
};
```

---

### Example Route: routes/auth.routes.js

```javascript
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'staff']).withMessage('Invalid role')
], validate, register);

router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, login);

router.get('/me', protect, getMe);

module.exports = router;
```

---

### Example Controller: controllers/auth.controller.js

```javascript
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, username, password, role, phone, email } = req.body;

    const user = await User.create({
      name,
      username,
      password,
      role,
      phone,
      email
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json(req.user);
};
```

---

## Next Phase

→ [Phase 3 - Frontend Structure](./03-phase-3-frontend.md)
