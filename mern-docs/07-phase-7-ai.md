# Phase 7 – AI Automation Features (MERN)

## Objective

Implement AI-powered analytics, forecasting, and automation using JavaScript/Node.js libraries.

---

## AI Features Overview

| Feature | Purpose | Technology |
|---------|---------|------------|
| Sales Forecasting | Predict next month's sales | Simple-Statistics / TensorFlow.js |
| Stock Predictions | Suggest reorder quantities | Linear Regression |
| Smart Alerts | Low stock, slow movers | Rule-based |
| Profit Prediction | Expected monthly gain | Regression |

---

## 1. Sales Forecasting

### Using Simple-Statistics for Linear Regression

```javascript
// services/ai.service.js

const ss = require('simple-statistics');
const Sale = require('../models/Sale');

class AIService {
  
  // Get historical sales data
  async getSalesData(days = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await Sale.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return sales.map((s, i) => [i, s.total]);
  }

  // Predict future sales using linear regression
  async predictSales(daysAhead = 30) {
    const data = await this.getSalesData(90);
    
    if (data.length < 7) {
      return { error: 'Not enough data for prediction' };
    }

    // Linear regression
    const regression = ss.linearRegression(data);
    const predict = ss.linearRegressionLine(regression);

    // Predict next N days
    const predictions = [];
    const lastIndex = data.length - 1;
    
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      predictions.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.max(0, Math.round(predict(lastIndex + i)))
      });
    }

    const totalPredicted = predictions.reduce((sum, p) => sum + p.predicted, 0);
    const avgDaily = totalPredicted / daysAhead;

    return {
      predictions,
      summary: {
        totalPredicted,
        avgDaily: Math.round(avgDaily),
        confidence: this.calculateConfidence(data, regression)
      }
    };
  }

  calculateConfidence(data, regression) {
    const predict = ss.linearRegressionLine(regression);
    const rSquared = ss.rSquared(data, predict);
    return Math.round(rSquared * 100);
  }
}

module.exports = new AIService();
```

---

## 2. Stock Prediction & Reorder Suggestions

```javascript
// services/stock.service.js

const Product = require('../models/Product');
const Sale = require('../models/Sale');

class StockService {
  
  async calculateSalesVelocity(productId, weeks = 12) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const sales = await Sale.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $match: { 'items.product': productId } },
      { $group: { _id: null, totalSold: { $sum: '$items.quantity' } } }
    ]);

    const totalSold = sales[0]?.totalSold || 0;
    return totalSold / weeks; // Weekly velocity
  }

  async getReorderSuggestions(leadTimeDays = 7, safetyStockDays = 14) {
    const products = await Product.find({ isActive: true, stock: { $gt: 0 } });
    const suggestions = [];

    for (const product of products) {
      const weeklyVelocity = await this.calculateSalesVelocity(product._id);
      
      if (weeklyVelocity === 0) continue;

      const dailyVelocity = weeklyVelocity / 7;
      const reorderPoint = dailyVelocity * (leadTimeDays + safetyStockDays);
      const daysOfStock = product.stock / dailyVelocity;

      if (product.stock <= reorderPoint) {
        suggestions.push({
          productId: product._id,
          productName: product.name,
          brand: product.brand,
          currentStock: product.stock,
          dailyVelocity: Math.round(dailyVelocity * 10) / 10,
          daysOfStock: Math.round(daysOfStock),
          reorderPoint: Math.round(reorderPoint),
          suggestedQuantity: Math.round(dailyVelocity * 30), // 1 month supply
          urgency: daysOfStock <= 3 ? 'critical' : daysOfStock <= 7 ? 'high' : 'medium'
        });
      }
    }

    return suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }
}

module.exports = new StockService();
```

---

## 3. Smart Alerts System

```javascript
// services/alerts.service.js

const Product = require('../models/Product');
const Repair = require('../models/Repair');
const Customer = require('../models/Customer');
const Warranty = require('../models/Warranty');
const Sale = require('../models/Sale');

class AlertsService {
  
  async getLowStockAlerts(threshold = 5) {
    return Product.find({
      stock: { $lte: threshold },
      isActive: true
    }).select('name brand stock category').lean();
  }

  async getSlowMovers(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get products sold in period
    const soldProducts = await Sale.aggregate([
      { $match: { createdAt: { $gte: cutoffDate } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product' } }
    ]);

    const soldIds = soldProducts.map(p => p._id);

    // Get unsold products with stock
    return Product.find({
      _id: { $nin: soldIds },
      isActive: true,
      stock: { $gt: 0 }
    }).select('name brand stock sellingPrice').lean();
  }

  async getWarrantyExpiring(daysAhead = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Warranty.find({
      expiryDate: { $lte: futureDate, $gte: new Date() },
      notified: false
    })
    .populate('customer', 'name phone')
    .populate('product', 'name')
    .lean();
  }

  async getBirthdayCustomers() {
    const today = new Date();
    return Customer.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$dateOfBirth' }, today.getMonth() + 1] },
          { $eq: [{ $dayOfMonth: '$dateOfBirth' }, today.getDate()] }
        ]
      }
    }).select('name phone').lean();
  }

  async getAllAlerts() {
    const [lowStock, slowMovers, warrantyExpiring, birthdays] = await Promise.all([
      this.getLowStockAlerts(),
      this.getSlowMovers(),
      this.getWarrantyExpiring(),
      this.getBirthdayCustomers()
    ]);

    return {
      lowStock,
      slowMovers,
      warrantyExpiring,
      birthdays,
      summary: {
        lowStockCount: lowStock.length,
        slowMoversCount: slowMovers.length,
        warrantyExpiringCount: warrantyExpiring.length,
        birthdaysCount: birthdays.length
      }
    };
  }
}

module.exports = new AlertsService();
```

---

## 4. Scheduled Tasks (node-cron)

```javascript
// services/scheduler.service.js

const cron = require('node-cron');
const alertsService = require('./alerts.service');
const whatsappService = require('./whatsapp.service');
const aiService = require('./ai.service');
const AnalyticsCache = require('../models/AnalyticsCache');

class SchedulerService {
  
  init() {
    // Daily at 9 AM - Birthday wishes
    cron.schedule('0 9 * * *', async () => {
      console.log('Running birthday wishes task...');
      await this.sendBirthdayWishes();
    });

    // Daily at 10 AM - Warranty reminders
    cron.schedule('0 10 * * *', async () => {
      console.log('Running warranty reminders task...');
      await this.sendWarrantyReminders();
    });

    // Daily at midnight - Update forecasts
    cron.schedule('0 0 * * *', async () => {
      console.log('Running forecast update task...');
      await this.updateForecasts();
    });

    console.log('Scheduler initialized');
  }

  async sendBirthdayWishes() {
    try {
      const customers = await alertsService.getBirthdayCustomers();
      
      for (const customer of customers) {
        await whatsappService.sendTemplateMessage(customer.phone, 'birthday', {
          name: customer.name
        });
      }
      
      console.log(`Sent ${customers.length} birthday wishes`);
    } catch (error) {
      console.error('Birthday wishes error:', error);
    }
  }

  async sendWarrantyReminders() {
    try {
      const warranties = await alertsService.getWarrantyExpiring(7);
      
      for (const warranty of warranties) {
        await whatsappService.sendTemplateMessage(warranty.customer.phone, 'warranty_expiry', {
          productName: warranty.product.name,
          expiryDate: warranty.expiryDate.toLocaleDateString()
        });
        
        // Mark as notified
        await Warranty.findByIdAndUpdate(warranty._id, { notified: true });
      }
      
      console.log(`Sent ${warranties.length} warranty reminders`);
    } catch (error) {
      console.error('Warranty reminders error:', error);
    }
  }

  async updateForecasts() {
    try {
      const forecast = await aiService.predictSales(30);
      
      await AnalyticsCache.findOneAndUpdate(
        { metricName: 'monthly_forecast' },
        { 
          metricName: 'monthly_forecast',
          metricValue: forecast,
          updatedOn: new Date()
        },
        { upsert: true }
      );
      
      console.log('Forecast updated');
    } catch (error) {
      console.error('Forecast update error:', error);
    }
  }
}

module.exports = new SchedulerService();
```

---

## 5. API Endpoints

```javascript
// routes/analytics.routes.js

const router = require('express').Router();
const { protect } = require('../middleware/auth');
const aiService = require('../services/ai.service');
const stockService = require('../services/stock.service');
const alertsService = require('../services/alerts.service');

// Get sales forecast
router.get('/forecast', protect, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const forecast = await aiService.predictSales(parseInt(days));
    res.json(forecast);
  } catch (error) {
    next(error);
  }
});

// Get reorder suggestions
router.get('/reorder-suggestions', protect, async (req, res, next) => {
  try {
    const suggestions = await stockService.getReorderSuggestions();
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});

// Get all alerts
router.get('/alerts', protect, async (req, res, next) => {
  try {
    const alerts = await alertsService.getAllAlerts();
    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

// Get AI insights for dashboard
router.get('/insights', protect, async (req, res, next) => {
  try {
    const [forecast, reorder, alerts] = await Promise.all([
      aiService.predictSales(30),
      stockService.getReorderSuggestions(),
      alertsService.getAllAlerts()
    ]);

    const insights = [];

    // Forecast insight
    if (forecast.summary) {
      insights.push({
        type: 'forecast',
        icon: 'trending-up',
        title: 'Sales Forecast',
        message: `Expected sales this month: Rs. ${forecast.summary.totalPredicted.toLocaleString()}`,
        priority: 'info'
      });
    }

    // Low stock alerts
    if (alerts.lowStock.length > 0) {
      insights.push({
        type: 'alert',
        icon: 'alert-triangle',
        title: 'Low Stock Alert',
        message: `${alerts.lowStock.length} products are running low.`,
        priority: 'warning'
      });
    }

    // Reorder suggestions
    const criticalReorders = reorder.filter(r => r.urgency === 'critical');
    if (criticalReorders.length > 0) {
      insights.push({
        type: 'action',
        icon: 'shopping-cart',
        title: 'Urgent Reorder',
        message: `${criticalReorders.length} products need immediate restocking.`,
        priority: 'danger'
      });
    }

    res.json({ insights });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## Dependencies

```json
{
  "dependencies": {
    "simple-statistics": "^7.8.3",
    "node-cron": "^3.0.3"
  }
}
```

---

## Next Phase

→ [Phase 8 - Deployment](./08-phase-8-deployment.md)
