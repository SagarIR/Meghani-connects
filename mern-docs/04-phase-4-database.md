# Phase 4 – Database Schema (MongoDB)

## Objective

Define MongoDB collections with Mongoose schemas, relationships, and validation.

---

## Collection Relationships

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   products   │       │  customers   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ _id          │       │ _id          │       │ _id          │
│ name         │       │ name         │       │ name         │
│ username     │       │ brand        │       │ phone        │
│ password     │       │ category     │       │ address      │
│ role         │       │ costPrice    │       │ dateOfBirth  │
│ phone        │       │ sellingPrice │       │ language     │
│ email        │       │ stock        │       │ loyaltyPoints│
└──────────────┘       │ barcode      │       └──────┬───────┘
       │               └──────┬───────┘              │
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────────────────────────────────────────────────┐
│                         sales                             │
├──────────────────────────────────────────────────────────┤
│ _id, invoiceNumber, customer (ref), createdBy (ref)      │
│ items: [{ product (ref), quantity, unitPrice, subtotal }]│
│ totalAmount, discount, paymentMode, profit, saleDate     │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   warranty   │  │   repairs    │  │  expenses    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Mongoose Schemas

### 1. User Model

```javascript
// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 50
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'staff'
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  language: {
    type: String,
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

---

### 2. Product Model

```javascript
// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['analog', 'digital', 'smart', 'wall', 'accessory']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  supplierName: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return this.sellingPrice - this.costPrice;
});

// Index for search
productSchema.index({ name: 'text', brand: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);
```

---

### 3. Customer Model

```javascript
// models/Customer.js

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  languagePreference: {
    type: String,
    default: 'en'
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Method to add loyalty points
customerSchema.methods.addPoints = function(amount) {
  const points = Math.floor(amount / 100); // 1 point per 100 Rs
  this.loyaltyPoints += points;
  return this.save();
};

// Method to redeem points
customerSchema.methods.redeemPoints = function(points) {
  if (this.loyaltyPoints < points) {
    throw new Error('Insufficient loyalty points');
  }
  this.loyaltyPoints -= points;
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);
```

---

### 4. Sale Model

```javascript
// models/Sale.js

const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String, // Denormalized for history
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  costPrice: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  items: [saleItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    required: true,
    enum: ['cash', 'upi', 'card', 'mixed']
  },
  profit: {
    type: Number,
    required: true
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate invoice number
saleSchema.statics.generateInvoiceNumber = async function() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    }
  });
  return `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// Calculate profit before save
saleSchema.pre('save', function(next) {
  if (this.isNew) {
    this.profit = this.items.reduce((total, item) => {
      return total + ((item.unitPrice - item.costPrice) * item.quantity);
    }, 0) - this.discount;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
```

---

### 5. Repair Model

```javascript
// models/Repair.js

const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  itemType: {
    type: String,
    required: [true, 'Item type is required'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  issueDescription: {
    type: String,
    required: [true, 'Issue description is required']
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  repairCharge: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['received', 'in_repair', 'ready', 'delivered', 'cancelled'],
    default: 'received'
  },
  deliveryDate: {
    type: Date
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate ticket number
repairSchema.statics.generateTicketNumber = async function() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    }
  });
  return `REP-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Repair', repairSchema);
```

---

### 6. Expense Model

```javascript
// models/Expense.js

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['rent', 'salary', 'utilities', 'maintenance', 'purchase', 'other']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  receipt: {
    type: String // File path
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
```

---

### 7. Warranty Model

```javascript
// models/Warranty.js

const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  warrantyMonths: {
    type: Number,
    required: true,
    default: 12
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  notified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate expiry date before save
warrantySchema.pre('save', function(next) {
  if (this.isNew && !this.expiryDate) {
    const expiry = new Date(this.startDate);
    expiry.setMonth(expiry.getMonth() + this.warrantyMonths);
    this.expiryDate = expiry;
  }
  next();
});

module.exports = mongoose.model('Warranty', warrantySchema);
```

---

### 8. Notification Model

```javascript
// models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  phone: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  sentOn: {
    type: Date
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
```

---

### 9. AnalyticsCache Model

```javascript
// models/AnalyticsCache.js

const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema({
  metricName: {
    type: String,
    required: true,
    unique: true
  },
  metricValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  period: {
    type: String
  },
  updatedOn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AnalyticsCache', analyticsCacheSchema);
```

---

## Indexes

```javascript
// Create indexes for performance
// Run once during setup

// Product search
db.products.createIndex({ name: "text", brand: "text", barcode: "text" });
db.products.createIndex({ barcode: 1 });
db.products.createIndex({ category: 1 });

// Sales queries
db.sales.createIndex({ createdAt: -1 });
db.sales.createIndex({ customer: 1 });
db.sales.createIndex({ invoiceNumber: 1 });

// Repairs
db.repairs.createIndex({ status: 1 });
db.repairs.createIndex({ customer: 1 });
db.repairs.createIndex({ ticketNumber: 1 });

// Customers
db.customers.createIndex({ phone: 1 });

// Warranty
db.warranties.createIndex({ expiryDate: 1 });
db.warranties.createIndex({ notified: 1 });
```

---

## Database Seeding Script

```javascript
// scripts/seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});

    // Create admin user
    await User.create({
      name: 'Admin',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      phone: '9876543210'
    });

    // Create sample products
    await Product.insertMany([
      { name: 'Titan Raga', brand: 'Titan', category: 'analog', costPrice: 2500, sellingPrice: 3500, stock: 10, barcode: 'TIT001' },
      { name: 'Casio G-Shock', brand: 'Casio', category: 'digital', costPrice: 4000, sellingPrice: 5500, stock: 5, barcode: 'CAS001' },
      { name: 'Apple Watch SE', brand: 'Apple', category: 'smart', costPrice: 25000, sellingPrice: 29000, stock: 3, barcode: 'APL001' },
    ]);

    // Create sample customer
    await Customer.create({
      name: 'Rahul Sharma',
      phone: '9876543211',
      address: 'Mumbai, Maharashtra',
      loyaltyPoints: 100
    });

    console.log('Seed data created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
```

---

## Next Phase

→ [Phase 5 - Module Breakdown](./05-phase-5-modules.md)
