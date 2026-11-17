# Phase 5 – Module Breakdown

> **Current Status:** PARTIALLY COMPLETED  
> **Progress:** 9 / 11 verified tasks  
> **Last Updated:** 2026-11-17  
> **Next Action:** Resolve password change 404 URL mismatch in `apps/users/views.py`.  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md)

---

## Phase Progress Summary

| Task | Status | Evidence | Remaining Work |
|:---|:---:|:---|:---|
| Executive Dashboard & Real-Time KPIs | **COMPLETED** | `app/(dashboard)/dashboard/page.tsx` fetches `/api/analytics/dashboard/stats/`, `/sales-chart/`, `/recent-activity/`, and `/ai/insights/`. | None. |
| POS Barcode Billing & Atomic Checkout | **COMPLETED** | `BarcodeScanner.tsx`, `sales/page.tsx`, `SaleCreateSerializer` (`@transaction.atomic`), thermal receipt modal in `Invoice.tsx`. | None. |
| POS Split / Mixed Payment UI Support | **COMPLETED** | Multi-method split tender in `sales/page.tsx` (Cash, UPI, Card), real-time balance calculations, `payment_details` JSON storage, backend validation, and receipt rendering. | None. |
| Product & Inventory Management with Bulk Import | **COMPLETED** | `products/page.tsx`, `ProductViewSet`, tabbed product modal, `BulkImport.tsx` with line-by-line validation. | None. |
| Watch Repair Workshop & 5-Stage State Machine | **COMPLETED** | `repairs/page.tsx`, `RepairViewSet`, full lifecycle (`received` to `delivered`), automated WhatsApp hook on `ready`. | None. |
| CRM Customer Directory & Loyalty Points Engine | **COMPLETED** | `customers/page.tsx`, `CustomerViewSet`, phone lookup, tier badges, points accrual and checkout redemption. | None. |
| Customer Bulk Import Endpoint | **PENDING / NOT STARTED** | `BulkImport.tsx` includes Customer Import UI dispatching to `/customers/import/`, but endpoint is missing in `apps/crm/urls.py`. | Implement `CustomerImportView` or remove tab from UI. |
| Operating Expense Tracker with Bill Upload | **COMPLETED** | `expenses/page.tsx`, `ExpenseViewSet`, category filtering, receipt image uploads, Net Profit impact. | None. |
| Website CMS Administration Dashboard | **COMPLETED** | `website-cms/page.tsx`, `apps/core/views.py`, CRUD for banners, brand partners, milestones, gallery, lead enquiry inbox. | None. |
| Business Settings & Gzip Database Backup Engine | **COMPLETED** | `settings/page.tsx`, `apps/core/backup_service.py`, Gzip JSON dump creation, listing, restore, and delete endpoints. | None. |
| User Password Change Endpoint | **PARTIALLY COMPLETED (BUG)** | Frontend calls `POST /api/users/change-password/`. DRF router registers `change_password/` (underscored), resulting in 404. | Add `url_path='change-password'` to `@action` decorator in `UserViewSet`. |

---

## Completed Tasks
- [x] Executive dashboard aggregating real-time sales revenue, profits, repair queue, and inventory alerts.
- [x] Point of Sale checkout system supporting webcam and hardware barcode scanners, dynamic cart calculations, sequential invoice numbering (`INV-YYYYMMDD-XXXX`), and `@transaction.atomic` inventory decrementing.
- [x] Multi-method split tender payment processing in POS supporting concurrent Cash, UPI, and Card splits with real-time balance validation and receipt itemization.
- [x] Full catalog management with tabbed detail modals and working Excel/CSV bulk import.
- [x] Comprehensive watch repair workshop module with sequential tickets (`REP-YYYYMMDD-XXXX`), status workflow, and automated WhatsApp alert triggers.
- [x] CRM customer database with automated loyalty points accrual ($1\text{ pt} / \text{₹}100$) and POS checkout discount redemption.
- [x] Operating expense tracking categorized across 8 business accounts with bill image uploads.
- [x] Integrated Website CMS allowing store managers to update public storefront content, banners, milestones, and review customer consultation enquiries.
- [x] Database backup manager generating gzip-compressed JSON archives with one-click restore and download.

## Pending Tasks
- [ ] Add `url_path='change-password'` to `@action` decorator in `backend/apps/users/views.py`.
- [ ] Implement `CustomerImportView` in `backend/apps/crm/views.py` or remove the customer option from `BulkImport.tsx`.

## Blocked Tasks
*None.*

## Completion Criteria
1. Barcode scan instantly finds product and adds to cart with accurate price and stock validation. *(PASSED)*
2. Advancing repair ticket to `ready` triggers automated customer notification. *(PASSED)*
3. Password change request from user settings succeeds without HTTP 404 errors. *(PENDING FIX)*

## Next Action
Fix the password change URL pattern in [backend/apps/users/views.py](../backend/apps/users/views.py).

---

## Original Technical Specifications & Module Breakdown

### Objective

Define detailed specifications for each application module.

---

### Module 1: Dashboard & Analytics

#### Features

| Feature | Description |
|---------|-------------|
| Overview Cards | Today's sales, repairs pending, low stock alerts |
| Sales Chart | Daily/Weekly/Monthly sales trend (Line Chart) |
| Profit Chart | Revenue vs Profit comparison |
| Top Products | Best selling products this month |
| Recent Activity | Latest sales & repairs |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats/` | Get overview statistics |
| GET | `/api/dashboard/sales-chart/` | Get sales chart data |
| GET | `/api/dashboard/top-products/` | Get top selling products |
| GET | `/api/dashboard/recent-activity/` | Get recent transactions |

#### Data Structure

```json
{
  "stats": {
    "today_sales": 15000,
    "today_profit": 3500,
    "pending_repairs": 8,
    "low_stock_items": 5
  },
  "sales_chart": [
    { "date": "2026-01-10", "sales": 12000, "profit": 2800 }
  ],
  "top_products": [
    { "id": 1, "name": "Titan Analog", "sold": 25, "revenue": 75000 }
  ]
}
```

---

### Module 2: Sales & POS System

#### Features

| Feature | Description |
|---------|-------------|
| Barcode Scanner | Scan to add product to cart |
| Product Search | Search by name/brand/barcode |
| Cart Management | Add, remove, update quantity |
| Discount | Apply percentage or fixed discount |
| Payment | Cash, UPI, Card, or Mixed |
| Invoice | Print thermal receipt + PDF |
| Customer Linking | Assign sale to customer |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/search/` | Search products |
| GET | `/api/products/barcode/{code}/` | Get product by barcode |
| POST | `/api/sales/` | Create new sale |
| GET | `/api/sales/` | List all sales |
| GET | `/api/sales/{id}/` | Get sale details |
| GET | `/api/sales/{id}/invoice/` | Download invoice PDF |

#### Sale Creation Payload

```json
{
  "customer_id": 5,
  "items": [
    { "product_id": 12, "quantity": 2, "unit_price": 3500 },
    { "product_id": 8, "quantity": 1, "unit_price": 2200 }
  ],
  "discount": 500,
  "payment_mode": "upi",
  "notes": "Gift wrapping requested"
}
```

#### Business Logic

```python
def create_sale(data):
    # 1. Validate stock availability
    # 2. Calculate subtotals
    # 3. Apply discount
    # 4. Calculate profit (sum of selling_price - cost_price per item)
    # 5. Generate invoice number (INV-YYYYMMDD-XXXX)
    # 6. Deduct stock from products
    # 7. Add loyalty points to customer
    # 8. Create warranty entries if applicable
    # 9. Return sale with invoice number
```

---

### Module 3: Repair Management

#### Features

| Feature | Description |
|---------|-------------|
| Create Repair | Log new repair job with customer |
| Status Tracking | Received → In Repair → Ready → Delivered |
| Notifications | Auto WhatsApp when ready for pickup |
| Repair Invoice | Generate repair receipt |
| History | View customer's past repairs |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/repairs/` | Create repair job |
| GET | `/api/repairs/` | List repairs (filter by status) |
| GET | `/api/repairs/{id}/` | Get repair details |
| PATCH | `/api/repairs/{id}/status/` | Update status |
| GET | `/api/repairs/{id}/invoice/` | Download repair invoice |

#### Status Workflow

```
received → in_repair → ready → delivered
                    ↘ cancelled
```

#### Auto Notifications

```python
# When status changes to 'ready'
def on_repair_ready(repair):
    message = f"Your {repair.item_type} is ready for pickup. Ticket: {repair.ticket_number}"
    send_whatsapp(repair.customer.phone, message)
```

---

### Module 4: CRM (Customer Management)

#### Features

| Feature | Description |
|---------|-------------|
| Customer List | Searchable customer database |
| Customer Profile | Purchase history, repairs, loyalty points |
| Loyalty System | Points per purchase, redeem for discounts |
| Birthday Offers | Auto-notify customers on birthday |
| Language Preference | Store preferred communication language |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/customers/` | Create customer |
| GET | `/api/customers/` | List customers |
| GET | `/api/customers/{id}/` | Get customer with history |
| PATCH | `/api/customers/{id}/` | Update customer |
| GET | `/api/customers/{id}/purchases/` | Get purchase history |
| GET | `/api/customers/{id}/repairs/` | Get repair history |

#### Loyalty Points System

```python
POINTS_PER_100_RUPEES = 1
POINTS_REDEMPTION_RATE = 0.5  # 1 point = Rs 0.50

def add_loyalty_points(customer, sale_amount):
    points = int(sale_amount / 100) * POINTS_PER_100_RUPEES
    customer.loyalty_points += points
    customer.save()

def redeem_points(customer, points_to_redeem):
    if customer.loyalty_points >= points_to_redeem:
        discount = points_to_redeem * POINTS_REDEMPTION_RATE
        customer.loyalty_points -= points_to_redeem
        customer.save()
        return discount
    return 0
```

---

### Module 5: Inventory & Products

#### Features

| Feature | Description |
|---------|-------------|
| Product CRUD | Add, edit, delete products |
| Stock Management | Track inventory levels |
| Low Stock Alerts | Notify when stock < threshold |
| Barcode Generation | Generate barcode for new products |
| Categories | Analog, Digital, Smart, Wall, Accessory |
| Bulk Import | Import products from Excel |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products/` | Create product |
| GET | `/api/products/` | List products (filter, paginate) |
| GET | `/api/products/{id}/` | Get product details |
| PATCH | `/api/products/{id}/` | Update product |
| DELETE | `/api/products/{id}/` | Soft delete product |
| POST | `/api/products/bulk-import/` | Import from Excel |
| GET | `/api/products/low-stock/` | Get low stock items |

#### Stock Threshold Alert

```python
LOW_STOCK_THRESHOLD = 5

def check_low_stock():
    low_stock = Product.objects.filter(stock__lte=LOW_STOCK_THRESHOLD, is_active=True)
    for product in low_stock:
        create_alert(f"Low stock: {product.name} ({product.stock} left)")
```

---

### Module 6: Expense Management

#### Features

| Feature | Description |
|---------|-------------|
| Log Expenses | Record business expenses |
| Categories | Rent, Salary, Utilities, Maintenance, Purchase |
| Receipt Upload | Attach receipt image |
| Monthly Summary | View expenses by month |
| Profit Integration | Factor expenses into profit calculations |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses/` | Create expense |
| GET | `/api/expenses/` | List expenses (filter by date/category) |
| GET | `/api/expenses/summary/` | Get monthly summary |
| DELETE | `/api/expenses/{id}/` | Delete expense |

---

### Module 7: Notifications

#### Features

| Feature | Description |
|---------|-------------|
| WhatsApp Integration | Send via Twilio WhatsApp API |
| SMS Fallback | Send SMS if WhatsApp fails |
| Templates | Predefined message templates |
| Bulk Send | Send offers to multiple customers |
| Status Tracking | Track sent/pending/failed |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/send/` | Send notification |
| POST | `/api/notifications/bulk/` | Send bulk notifications |
| GET | `/api/notifications/` | List notifications |
| GET | `/api/notifications/templates/` | Get message templates |

#### Message Templates

| Template | Message |
|----------|---------|
| sale_receipt | "Thank you for your purchase at Meghani Watch Co. Invoice: {invoice_number}" |
| repair_ready | "Your {item_type} is ready for pickup. Ticket: {ticket_number}" |
| birthday | "Happy Birthday {name}! Visit us for a special 10% discount today." |
| warranty_expiry | "Your warranty for {product_name} expires on {date}. Renew now!" |

---

### Module 8: Settings & Backup

#### Features

| Feature | Description |
|---------|-------------|
| User Preferences | Theme, language, notification settings |
| Business Settings | Store name, address, GST, logo |
| Backup | Manual database backup |
| Cloud Sync | Sync data to cloud |
| Data Export | Export all data as Excel/CSV |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/` | Get all settings |
| PATCH | `/api/settings/` | Update settings |
| POST | `/api/backup/create/` | Create backup |
| GET | `/api/backup/list/` | List backups |
| POST | `/api/backup/restore/` | Restore from backup |

---

## Next Phase

→ [Phase 6 - Reports](./06-phase-6-reports.md)
