# Phase 5 – Module Breakdown

> **Current Status:** COMPLETED  
> **Progress:** 11 / 11 verified tasks (100%)  
> **Last Updated:** 2026-11-19  
> **Next Action:** All core functional modules verified complete. Proceed to Order 7 (Deployment & Defect Fixes).  
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
| Customer Bulk Import Endpoint | **COMPLETED** | `CustomerImportView`, `CustomerExportTemplateView`, and `CustomerImportService` active in `apps/crm/views.py` and `apps/crm/urls.py`. | None. |
| Operating Expense Tracker with Bill Upload | **COMPLETED** | `expenses/page.tsx`, `ExpenseViewSet`, category filtering, receipt image uploads, Net Profit impact. | None. |
| Website CMS Administration Dashboard | **COMPLETED** | `website-cms/page.tsx`, `apps/core/views.py`, CRUD for banners, brand partners, milestones, gallery, lead enquiry inbox. | None. |
| Business Settings & Gzip Database Backup Engine | **COMPLETED** | `settings/page.tsx`, `apps/core/backup_service.py`, Gzip JSON dump creation, listing, restore, download, and delete endpoints. | None. |
| User Password Change Endpoint | **COMPLETED** | `@action(detail=False, methods=['post'], url_path='change-password')` in `apps/users/views.py` correctly maps to frontend callers. | None. |

---

## Completed Tasks
- [x] Executive dashboard aggregating real-time sales revenue, profits, repair queue, and inventory alerts.
- [x] Point of Sale checkout system supporting webcam and hardware barcode scanners, dynamic cart calculations, sequential invoice numbering (`INV-YYYYMMDD-XXXX`), and `@transaction.atomic` inventory decrementing.
- [x] Multi-method split tender payment processing in POS supporting concurrent Cash, UPI, and Card splits with real-time balance validation and receipt itemization.
- [x] Full catalog management with tabbed detail modals and working Excel/CSV bulk import.
- [x] Comprehensive watch repair workshop module with sequential tickets (`REP-YYYYMMDD-XXXX`), status workflow, and automated WhatsApp alert triggers.
- [x] CRM customer database with automated loyalty points accrual ($1\text{ pt} / \text{₹}100$) and POS checkout discount redemption.
- [x] Customer bulk import endpoint and template download service (`/api/crm/import/` and `/api/crm/import/template/`).
- [x] Operating expense tracking categorized across 8 business accounts with bill image uploads.
- [x] Integrated Website CMS allowing store managers to update public storefront content, banners, milestones, and review customer consultation enquiries.
- [x] Database backup manager generating gzip-compressed JSON archives with one-click restore and download.
- [x] User password change endpoint mapped to `/api/users/change-password/`.

## Pending Tasks
*None. All 11 Core Module Tasks are fully implemented and verified.*

## Blocked Tasks
*None.*

## Completion Criteria
1. Barcode scan instantly finds product and adds to cart with accurate price and stock validation. *(PASSED)*
2. Advancing repair ticket to `ready` triggers automated customer notification. *(PASSED)*
3. Password change request from user settings succeeds without HTTP 404 errors. *(PASSED)*
4. Customer Excel/CSV file imports cleanly into the CRM database. *(PASSED)*

## Next Action
Proceed to Order 7 (Deployment & Defect Fixes) in [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md).

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
| GET | `/api/analytics/dashboard/stats/` | Get overview statistics |
| GET | `/api/analytics/dashboard/sales-chart/` | Get sales chart data |
| GET | `/api/analytics/dashboard/top-products/` | Get top selling products |
| GET | `/api/analytics/dashboard/recent-activity/` | Get recent transactions |

---

### Module 2: Sales & POS System

#### Features

| Feature | Description |
|---------|-------------|
| Barcode Scanner | Scan to add product to cart (camera + hardware scanner) |
| Product Search | Search by name/brand/barcode |
| Cart Management | Add, remove, update quantity |
| Discount & Points | Apply percentage/fixed discount or redeem loyalty points |
| Split Payment | Cash, UPI, Card, or Mixed / Split tender |
| Invoice | Print thermal receipt modal + PDF download |
| Customer Linking | Assign sale to customer |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/search/` | Search products |
| GET | `/api/products/barcode/{code}/` | Get product by barcode |
| POST | `/api/sales/` | Create new sale (atomic) |
| GET | `/api/sales/` | List all sales |
| GET | `/api/sales/{id}/` | Get sale details |
| GET | `/api/sales/{id}/invoice/` | Download invoice PDF |

---

### Module 3: Repair Management

#### Features

| Feature | Description |
|---------|-------------|
| Create Repair | Log new repair job with customer & watch brand |
| Status Tracking | Received → In Repair → Ready → Delivered |
| Notifications | Auto WhatsApp when ready for pickup |
| Repair Invoice | Generate repair receipt PDF |
| History | View customer's past repairs |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/repairs/` | Create repair job |
| GET | `/api/repairs/` | List repairs (filter by status) |
| GET | `/api/repairs/{id}/` | Get repair details |
| PATCH | `/api/repairs/{id}/status/` | Update status (triggers notification) |
| GET | `/api/repairs/{id}/invoice/` | Download repair invoice |

#### Status Workflow

```
received → in_repair → ready → delivered
                    ↘ cancelled
```

---

### Module 4: CRM (Customer Management)

#### Features

| Feature | Description |
|---------|-------------|
| Customer List | Searchable customer database with tier badges |
| Customer Profile | Purchase history, repairs, loyalty points |
| Loyalty System | Points per purchase ($1\text{ pt} / \text{₹}100$), redeem for discounts |
| Bulk Import | Import customers from Excel (.xlsx/.xls) or CSV |
| Consultation Inquiries | Store and manage leads from public boutique |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/crm/customers/` | Create customer |
| GET | `/api/crm/customers/` | List customers |
| GET | `/api/crm/customers/{id}/` | Get customer with history |
| PATCH | `/api/crm/customers/{id}/` | Update customer |
| POST | `/api/crm/import/` | Bulk import customers from Excel/CSV |
| GET | `/api/crm/import/template/` | Download sample Excel import template |
| GET | `/api/crm/enquiries/` | List consultation leads from public site |

---

### Module 5: Inventory & Products

#### Features

| Feature | Description |
|---------|-------------|
| Product CRUD | Add, edit, delete products |
| Stock Management | Track inventory levels and stock adjustments |
| Low Stock Alerts | Notify when stock $\le$ threshold |
| Barcode Generation | Generate barcode for new products |
| Categories | Analog, Digital, Smart, Wall, Luxury, Vintage |
| Bulk Import | Import products from Excel/CSV with row validation |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products/` | Create product |
| GET | `/api/products/` | List products (filter, paginate) |
| GET | `/api/products/{id}/` | Get product details |
| PATCH | `/api/products/{id}/` | Update product |
| DELETE | `/api/products/{id}/` | Soft delete product |
| POST | `/api/products/bulk-import/` | Import from Excel/CSV |
| GET | `/api/products/low-stock/` | Get low stock items |

---

### Module 6: Expense Management

#### Features

| Feature | Description |
|---------|-------------|
| Log Expenses | Record business expenses across 8 accounts |
| Categories | Rent, Salary, Utilities, Maintenance, Inventory, Marketing, Packaging, Other |
| Receipt Upload | Attach receipt image |
| Monthly Summary | View expenses by month |
| Profit Integration | Factor expenses into Net Profit calculations |

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
| SMS Fallback | Send SMS if WhatsApp delivery fails |
| Templates | Predefined message templates |
| Status Tracking | Track sent/delivered/failed states |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/send/` | Send notification |
| GET | `/api/notifications/` | List notifications |

---

### Module 8: Settings & Backup

#### Features

| Feature | Description |
|---------|-------------|
| Business Settings | Store name, address, GST, phone numbers, invoice notes |
| Gzip Database Backup | One-click JSON gzip backup creation, listing, restore, download |
| Website CMS | Manage homepage hero banners, brand partners, milestones, gallery |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/core/settings/` | Get business settings |
| PATCH | `/api/core/settings/` | Update business settings |
| POST | `/api/core/backup/create/` | Create gzip database backup |
| GET | `/api/core/backup/list/` | List backups |
| POST | `/api/core/backup/restore/` | Restore from backup |
| GET | `/api/core/backup/download/{filename}/` | Download backup file |
| DELETE | `/api/core/backup/delete/{filename}/` | Delete backup file |

---

## Next Phase

→ [Phase 6 - Reports](./06-phase-6-reports.md)
