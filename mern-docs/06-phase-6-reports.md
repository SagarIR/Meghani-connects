# Phase 6 – Reports & Visualization (MERN)

## Objective

Define report types, data structures, and export formats for business analytics.

---

## Report Types

### 1. Sales Summary Report

**API Endpoint**: `GET /api/reports/sales-summary`

**Query Parameters**:
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `paymentMode` - Filter by payment mode

**Controller**:

```javascript
// controllers/reports.controller.js

const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

exports.getSalesSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, paymentMode } = req.query;
    
    const match = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    if (paymentMode) match.paymentMode = paymentMode;

    const summary = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$profit' },
          transactionCount: { $sum: 1 },
          avgSale: { $avg: '$totalAmount' }
        }
      }
    ]);

    const byPaymentMode = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMode',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const dailyData = await Sale.aggregate([
      { $match: match },
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

    res.json({
      period: { startDate, endDate },
      summary: summary[0] || { totalSales: 0, totalProfit: 0, transactionCount: 0, avgSale: 0 },
      byPaymentMode: byPaymentMode.reduce((acc, curr) => {
        acc[curr._id] = curr.total;
        return acc;
      }, {}),
      dailyData: dailyData.map(d => ({
        date: d._id,
        sales: d.sales,
        profit: d.profit,
        count: d.count
      }))
    });
  } catch (error) {
    next(error);
  }
};
```

---

### 2. Product Performance Report

**API Endpoint**: `GET /api/reports/product-performance`

```javascript
exports.getProductPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate, category, limit = 10 } = req.query;

    const match = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Top sellers
    const topSellers = await Sale.aggregate([
      { $match: match },
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

    // Slow movers (products with no sales in period)
    const soldProductIds = topSellers.map(p => p._id);
    const slowMovers = await Product.find({
      _id: { $nin: soldProductIds },
      isActive: true,
      stock: { $gt: 0 }
    }).select('name brand stock sellingPrice').limit(10);

    res.json({ topSellers, slowMovers });
  } catch (error) {
    next(error);
  }
};
```

---

### 3. Expense Report

**API Endpoint**: `GET /api/reports/expenses`

```javascript
exports.getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const totalExpenses = await Expense.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const byCategory = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    // Get sales profit for net calculation
    const salesProfit = await Sale.aggregate([
      { $match: { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
      { $group: { _id: null, total: { $sum: '$profit' } } }
    ]);

    res.json({
      totalExpenses: totalExpenses[0]?.total || 0,
      byCategory: byCategory.reduce((acc, curr) => {
        acc[curr._id] = curr.total;
        return acc;
      }, {}),
      salesProfit: salesProfit[0]?.total || 0,
      netProfit: (salesProfit[0]?.total || 0) - (totalExpenses[0]?.total || 0)
    });
  } catch (error) {
    next(error);
  }
};
```

---

## Export Services

### PDF Export (PDFKit)

```javascript
// services/pdf.service.js

const PDFDocument = require('pdfkit');

const generateInvoice = async (sale) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Meghani Watch Co.', { align: 'center' });
    doc.fontSize(10).text('Your Trusted Watch Partner', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(12).text(`Invoice: ${sale.invoiceNumber}`);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // Customer
    if (sale.customer) {
      doc.text(`Customer: ${sale.customer.name}`);
      doc.text(`Phone: ${sale.customer.phone}`);
      doc.moveDown();
    }

    // Items table header
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, doc.y, { width: 200 });
    doc.text('Qty', 250, doc.y - 12, { width: 50, align: 'center' });
    doc.text('Price', 300, doc.y - 12, { width: 80, align: 'right' });
    doc.text('Total', 380, doc.y - 12, { width: 80, align: 'right' });
    doc.moveDown();
    doc.font('Helvetica');

    // Items
    sale.items.forEach(item => {
      const y = doc.y;
      doc.text(item.productName, 50, y, { width: 200 });
      doc.text(item.quantity.toString(), 250, y, { width: 50, align: 'center' });
      doc.text(`Rs. ${item.unitPrice}`, 300, y, { width: 80, align: 'right' });
      doc.text(`Rs. ${item.subtotal}`, 380, y, { width: 80, align: 'right' });
      doc.moveDown(0.5);
    });

    // Totals
    doc.moveDown();
    if (sale.discount > 0) {
      doc.text(`Discount: Rs. ${sale.discount}`, { align: 'right' });
    }
    doc.font('Helvetica-Bold');
    doc.text(`Total: Rs. ${sale.totalAmount}`, { align: 'right' });
    doc.font('Helvetica');
    doc.text(`Payment: ${sale.paymentMode.toUpperCase()}`, { align: 'right' });

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for your purchase!', { align: 'center' });

    doc.end();
  });
};

module.exports = { generateInvoice };
```

---

### Excel Export (exceljs)

```javascript
// services/excel.service.js

const ExcelJS = require('exceljs');

const generateSalesReport = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sales Report');

  // Headers
  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Sales (Rs.)', key: 'sales', width: 15 },
    { header: 'Profit (Rs.)', key: 'profit', width: 15 },
    { header: 'Transactions', key: 'count', width: 15 }
  ];

  // Style header
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '3B82F6' }
  };

  // Add data
  data.dailyData.forEach(row => {
    sheet.addRow(row);
  });

  // Summary row
  sheet.addRow({});
  sheet.addRow({
    date: 'TOTAL',
    sales: data.summary.totalSales,
    profit: data.summary.totalProfit,
    count: data.summary.transactionCount
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = { generateSalesReport };
```

---

## Charts (React + Recharts)

### SalesChart Component

```jsx
// components/charts/SalesChart.jsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`Rs. ${value.toLocaleString()}`, '']}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="sales" 
          stroke="#3b82f6" 
          name="Sales"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="profit" 
          stroke="#10b981" 
          name="Profit"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesChart;
```

---

## Next Phase

→ [Phase 7 - AI Features](./07-phase-7-ai.md)
