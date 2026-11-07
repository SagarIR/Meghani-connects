# Phase 5 – Module Breakdown (MERN)

## Objective

Define detailed specifications for each application module with Express.js controllers and React components.

---

## Module 1: Dashboard & Analytics

### Features

| Feature | Description |
|---------|-------------|
| Overview Cards | Today's sales, repairs pending, low stock alerts |
| Sales Chart | Daily/Weekly/Monthly sales trend (Line Chart) |
| Profit Chart | Revenue vs Profit comparison |
| Top Products | Best selling products this month |
| Recent Activity | Latest sales & repairs |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Get overview statistics |
| GET | `/api/analytics/sales-chart` | Get sales chart data |
| GET | `/api/analytics/top-products` | Get top selling products |
| GET | `/api/analytics/recent-activity` | Get recent transactions |

### Controller

```javascript
// controllers/analytics.controller.js

const Sale = require('../models/Sale');
const Repair = require('../models/Repair');
const Product = require('../models/Product');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's sales
    const todaySales = await Sale.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, profit: { $sum: '$profit' }, count: { $sum: 1 } } }
    ]);

    // Pending repairs
    const pendingRepairs = await Repair.countDocuments({
      status: { $in: ['received', 'in_repair'] }
    });

    // Low stock items
    const lowStock = await Product.countDocuments({
      stock: { $lte: 5 },
      isActive: true
    });

    res.json({
      todaySales: todaySales[0]?.total || 0,
      todayProfit: todaySales[0]?.profit || 0,
      todayTransactions: todaySales[0]?.count || 0,
      pendingRepairs,
      lowStockItems: lowStock
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalesChart = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const salesData = await Sale.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalAmount' },
          profit: { $sum: '$profit' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(salesData.map(d => ({
      date: d._id,
      sales: d.sales,
      profit: d.profit,
      count: d.count
    })));
  } catch (error) {
    next(error);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const topProducts = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.productName' },
          sold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(topProducts);
  } catch (error) {
    next(error);
  }
};
```

---

## Module 2: Sales & POS System

### Features

| Feature | Description |
|---------|-------------|
| Barcode Scanner | Scan to add product to cart |
| Product Search | Search by name/brand/barcode |
| Cart Management | Add, remove, update quantity |
| Discount | Apply percentage or fixed discount |
| Payment | Cash, UPI, Card, or Mixed |
| Invoice | Print thermal receipt + PDF |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/search?q=` | Search products |
| GET | `/api/products/barcode/:code` | Get product by barcode |
| POST | `/api/sales` | Create new sale |
| GET | `/api/sales` | List all sales |
| GET | `/api/sales/:id` | Get sale details |
| GET | `/api/sales/:id/invoice` | Download invoice PDF |

### Controller

```javascript
// controllers/sales.controller.js

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Warranty = require('../models/Warranty');
const { generateInvoiceNumber } = require('../utils/helpers');
const pdfService = require('../services/pdf.service');

exports.createSale = async (req, res, next) => {
  try {
    const { customerId, items, discount = 0, paymentMode, notes } = req.body;

    // Validate stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
    }

    // Generate invoice number
    const invoiceNumber = await Sale.generateInvoiceNumber();

    // Prepare sale items
    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      const subtotal = product.sellingPrice * item.quantity;
      
      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        subtotal
      });

      totalAmount += subtotal;

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create sale
    const sale = await Sale.create({
      invoiceNumber,
      customer: customerId,
      items: saleItems,
      totalAmount: totalAmount - discount,
      discount,
      paymentMode,
      notes,
      createdBy: req.user._id
    });

    // Add loyalty points if customer exists
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        await customer.addPoints(totalAmount - discount);
      }
    }

    // Create warranty entries (12 months default)
    for (const item of saleItems) {
      await Warranty.create({
        sale: sale._id,
        product: item.product,
        customer: customerId,
        warrantyMonths: 12
      });
    }

    // Populate and return
    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'name phone')
      .populate('items.product', 'name brand');

    res.status(201).json(populatedSale);
  } catch (error) {
    next(error);
  }
};

exports.getSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(query)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getInvoicePDF = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name brand');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const pdfBuffer = await pdfService.generateInvoice(sale);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${sale.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
```

---

## Module 3: Repair Management

### Features

| Feature | Description |
|---------|-------------|
| Create Repair | Log new repair job with customer |
| Status Tracking | Received → In Repair → Ready → Delivered |
| Notifications | Auto WhatsApp when ready for pickup |
| Repair Invoice | Generate repair receipt |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/repairs` | Create repair job |
| GET | `/api/repairs` | List repairs (filter by status) |
| GET | `/api/repairs/:id` | Get repair details |
| PATCH | `/api/repairs/:id/status` | Update status |

### Controller

```javascript
// controllers/repairs.controller.js

const Repair = require('../models/Repair');
const whatsappService = require('../services/whatsapp.service');

exports.createRepair = async (req, res, next) => {
  try {
    const { customerId, itemType, brand, issueDescription, estimatedCost, notes } = req.body;

    const ticketNumber = await Repair.generateTicketNumber();

    const repair = await Repair.create({
      ticketNumber,
      customer: customerId,
      itemType,
      brand,
      issueDescription,
      estimatedCost,
      notes,
      createdBy: req.user._id
    });

    const populatedRepair = await Repair.findById(repair._id)
      .populate('customer', 'name phone');

    res.status(201).json(populatedRepair);
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, repairCharge, deliveryDate } = req.body;

    const repair = await Repair.findById(req.params.id)
      .populate('customer', 'name phone');

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    repair.status = status;
    if (repairCharge) repair.repairCharge = repairCharge;
    if (deliveryDate) repair.deliveryDate = deliveryDate;
    if (status === 'delivered') repair.deliveryDate = new Date();

    await repair.save();

    // Send WhatsApp notification when ready
    if (status === 'ready' && repair.customer?.phone) {
      await whatsappService.sendMessage(
        repair.customer.phone,
        `Hello ${repair.customer.name}, your ${repair.itemType} is ready for pickup. Ticket: ${repair.ticketNumber}. Thank you for choosing Meghani Watch Co.`
      );
    }

    res.json(repair);
  } catch (error) {
    next(error);
  }
};
```

---

## Module 4: CRM (Customer Management)

### Features

| Feature | Description |
|---------|-------------|
| Customer List | Searchable customer database |
| Customer Profile | Purchase history, repairs, loyalty points |
| Loyalty System | Points per purchase, redeem for discounts |
| Birthday Offers | Auto-notify customers on birthday |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/customers` | Create customer |
| GET | `/api/customers` | List customers |
| GET | `/api/customers/:id` | Get customer with history |
| PATCH | `/api/customers/:id` | Update customer |
| GET | `/api/customers/:id/history` | Get purchase & repair history |

### Controller

```javascript
// controllers/customers.controller.js

const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Repair = require('../models/Repair');

exports.getCustomerWithHistory = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const [purchases, repairs] = await Promise.all([
      Sale.find({ customer: customer._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('invoiceNumber totalAmount paymentMode createdAt'),
      Repair.find({ customer: customer._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('ticketNumber itemType status repairCharge createdAt')
    ]);

    // Calculate stats
    const totalSpent = await Sale.aggregate([
      { $match: { customer: customer._id } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      customer,
      purchases,
      repairs,
      stats: {
        totalPurchases: purchases.length,
        totalRepairs: repairs.length,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
```

---

## Module 5: Products & Inventory

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products` | Create product |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Soft delete |
| GET | `/api/products/low-stock` | Get low stock items |
| POST | `/api/products/bulk-import` | Import from Excel |

### Controller

```javascript
// controllers/products.controller.js

const Product = require('../models/Product');
const excelService = require('../services/excel.service');

exports.getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category, lowStock } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    if (lowStock === 'true') {
      query.stock = { $lte: 5 };
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      barcode: req.params.barcode,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.bulkImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file required' });
    }

    const products = await excelService.parseProductsExcel(req.file.path);
    const result = await Product.insertMany(products, { ordered: false });

    res.json({
      message: `${result.length} products imported successfully`,
      count: result.length
    });
  } catch (error) {
    next(error);
  }
};
```

---

## Module 6: Expense Management

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses` | List expenses |
| GET | `/api/expenses/summary` | Monthly summary |
| DELETE | `/api/expenses/:id` | Delete expense |

---

## Module 7: Notifications

### WhatsApp Service

```javascript
// services/whatsapp.service.js

const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendMessage = async (phone, message) => {
  try {
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('WhatsApp error:', error);
    return { success: false, error: error.message };
  }
};

const sendTemplateMessage = async (phone, templateName, params) => {
  const templates = {
    sale_receipt: `Thank you for your purchase at Meghani Watch Co. Invoice: ${params.invoiceNumber}. Amount: Rs. ${params.amount}`,
    repair_ready: `Hello ${params.name}, your ${params.itemType} is ready for pickup. Ticket: ${params.ticketNumber}`,
    birthday: `Happy Birthday ${params.name}! Visit Meghani Watch Co. for a special 10% discount today.`,
    warranty_expiry: `Reminder: Your warranty for ${params.productName} expires on ${params.expiryDate}.`
  };

  const message = templates[templateName];
  if (!message) throw new Error('Template not found');

  return sendMessage(phone, message);
};

module.exports = { sendMessage, sendTemplateMessage };
```

---

## Module 8: Settings & Backup

### Backup Script

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

const backupDatabase = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.gz`;
  const filepath = path.join(__dirname, '../backups', filename);

  // Create backup directory
  if (!fs.existsSync(path.dirname(filepath))) {
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
  }

  // Mongodump
  const cmd = `mongodump --uri="${process.env.MONGODB_URI}" --archive="${filepath}" --gzip`;
  
  exec(cmd, async (error) => {
    if (error) {
      console.error('Backup failed:', error);
      return;
    }

    // Upload to S3
    const fileStream = fs.createReadStream(filepath);
    await s3.upload({
      Bucket: process.env.AWS_BACKUP_BUCKET,
      Key: `mongodb/${filename}`,
      Body: fileStream
    }).promise();

    // Cleanup local file
    fs.unlinkSync(filepath);
    console.log(`Backup completed: ${filename}`);
  });
};

module.exports = { backupDatabase };
```

---

## Next Phase

→ [Phase 6 - Reports](./06-phase-6-reports.md)
