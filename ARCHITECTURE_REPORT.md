# Meghani Connect 360 – Architecture & Technical Analysis Report

**Role:** Senior Full-Stack Software Architect & Technical Analyst  
**Project:** Meghani Connect 360 (`Meghani Watch Co.`)  
**Date of Audit:** November 16, 2026  
**Scope:** Full-stack inspection of Frontend, Backend, Database, APIs, Integrations, Authentication, Admin Management System, and Public Digital Boutique.

---

## 1. Executive Summary: What is Meghani Connect 360?

**Meghani Connect 360** is a unified retail enterprise management system (ERP / POS) combined with a luxury digital boutique designed specifically for **Meghani Watch Co.**, an authorized luxury timepiece purveyor and master watchmaker atelier established in Gujarat in 1984.

The software addresses two complementary business objectives:
1. **Internal Store Operations (Staff & Management):** Streamlines daily in-store operations—including high-speed barcode checkout, watch repair tracking, inventory management with low-stock alerts, customer loyalty points, expense bookkeeping, AI-assisted sales forecasting, and automated WhatsApp / SMS customer communications.
2. **Public Digital Boutique (Retail Customers):** Provides an authorized luxury watch catalog showcasing timepieces from leading brands (Titan, Casio, Timex, Citizen, Fastrack, Sonata). It enforces strict price shielding ("Price on Request") and guides online visitors toward boutique viewings via direct WhatsApp concierge integration and appointment bookings.

---

## 2. System Architecture & Technology Stack

The project follows a decoupled client-server architecture with Next.js serving both public and staff-facing frontend experiences, backed by a Django REST Framework API engine.

```
┌────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                               │
├───────────────────────────────────┬────────────────────────────────────┤
│      Public Website Visitors      │      In-Store Staff & Admins       │
│     (Luxury Digital Boutique)     │    (Desktop POS & Admin System)    │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
                  ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                FRONTEND LAYER (Next.js 14 App Router)                  │
├───────────────────────────────────┬────────────────────────────────────┤
│  • Public Routes /(public)        │  • Dashboard Routes /(dashboard)   │
│  • Horological Luxury Dark Theme  │  • Fast Barcode POS Checkout       │
│  • WhatsApp Concierge CTA         │  • Repair Queue & Management       │
│  • Price Shielding Logic          │  • Recharts Analytics Visuals      │
├───────────────────────────────────┴────────────────────────────────────┤
│  • Next.js BFF API Routes: /api/catalogue, /api/enquiry, /api/upload   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Axios + JWT Bearer Tokens)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND LAYER (Django 4.2 LTS DRF)                   │
├────────────────────────────────────────────────────────────────────────┤
│  • Authentication: SimpleJWT (Token Rotation & Blacklisting)           │
│  • Apps: users, products, sales, repairs, crm, expenses,               │
│          analytics, notifications, core                                │
│  • Transaction Engine: @transaction.atomic for ACID POS Billing        │
│  • AI Engine: Facebook Prophet, Scikit-learn, Pandas                   │
│  • Document Generator: ReportLab (PDF Invoices & Repair Slips)         │
│  • Bulk File Engine: OpenPyXL & CSV (Import / Export)                  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        DATA & STORAGE LAYER          │  │     ASYNC TASK SCHEDULER     │
├──────────────────────────────────────┤  ├──────────────────────────────┤
│ • PostgreSQL 15 (Prod) / SQLite (Dev)│  │ • Celery 5.3 + Celery Beat   │
│ • Redis 7 (Broker & Result Backend)  │  │ • Redis 7 Message Queue      │
│ • Cloudinary / AWS S3 / Local Media  │  │ • Automated Daily Jobs       │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Technology Breakdown

| Component | Technology | Purpose & Implementation |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14** (App Router) + React 18 | Dual-purpose frontend providing Server-Side Rendering (SSR) for public SEO and Client Components for dynamic POS interactions. |
| **Language & Typing** | **TypeScript 5.3** | Strict type definitions across public catalog types and admin data structures. |
| **UI & Styling** | **Tailwind CSS 3.4** + **Framer Motion** | Responsive design with tailored styling: Dark Luxury (`#0B0B0A` with `#C9A45C` gold accents) for public pages and modern SaaS styling for the admin panel. |
| **Backend API** | **Python 3.11/3.13** + **Django 4.2** + **DRF** | RESTful API architecture implementing business logic, permissions, models, and serialization. |
| **Authentication** | **djangorestframework-simplejwt** | Stateless JWT authentication (12-hour access token, 7-day refresh token with automatic rotation). |
| **Database** | **PostgreSQL 15** (Prod) / **SQLite** (Dev) | Normalized relational database enforcing referential integrity and transaction safety. |
| **Background Tasks** | **Celery 5.3** + **Celery Beat** + **Redis 7** | Scheduled cron tasks (9:00 AM birthdays, 10:00 AM warranty expiry, 12:30 AM AI forecasts). |
| **Document Generation** | **ReportLab 4.0** | Server-side programmatic PDF generation for customer invoices and repair job receipts. |
| **Bulk Import / Export** | **OpenPyXL 3.1**, Python `csv`, SheetJS | Excel/CSV bulk import for product inventories and tabular export for accounting reports. |
| **AI / Machine Learning** | **Prophet 1.1**, **Scikit-learn 1.3**, **Pandas 2.0** | Predictive modeling for future sales trends, stock velocity, and inventory health. |
| **Image Storage** | **Cloudinary API** / **AWS S3** / Local Storage | Signed uploads for watch photos and receipt images with graceful local fallbacks. |
| **Communication Gateway**| **Twilio REST API** | Automated transactional WhatsApp messages and SMS alerts sent directly to customer phones. |

---

## 3. Directory Structure & Key Files

```
Meghani-Connects/
├── backend/                              # Django Application Root
│   ├── apps/
│   │   ├── analytics/                    # AI forecasting, KPI widgets, reports, Celery tasks
│   │   │   ├── services/                 # forecasting.py, stock_predictor.py, alerts.py, ai_insights.py
│   │   │   ├── models.py                 # AnalyticsCache model
│   │   │   ├── reports.py                # Sales, Product, Repair, Expense report generators
│   │   │   ├── tasks.py                  # Celery scheduled tasks
│   │   │   └── views.py                  # Analytics API endpoints
│   │   ├── core/                         # Base system configurations, health checks, settings
│   │   │   ├── backup_service.py         # Compressed JSON database backup & restore engine
│   │   │   ├── cloudinary_service.py     # Signed media upload service
│   │   │   ├── settings_models.py        # BusinessSettings & UserPreferences models
│   │   │   └── models.py                 # AuditLog model with AuditLogMixin
│   │   ├── crm/                          # Customer records, loyalty points, purchase history
│   │   │   ├── models.py                 # Customer model with point accrual/redemption
│   │   │   └── views.py                  # Customer search, loyalty, history views
│   │   ├── expenses/                     # Overhead tracking (rent, salary, utilities, etc.)
│   │   │   ├── models.py                 # Expense model
│   │   │   └── views.py                  # Expense categorization & summaries
│   │   ├── notifications/                # WhatsApp & SMS communication services
│   │   │   ├── services/                 # Twilio WhatsApp & SMS integration
│   │   │   └── models.py                 # Notification and MessageTemplate models
│   │   ├── products/                     # Inventory, catalog, pricing, bulk imports
│   │   │   ├── import_service.py         # OpenPyXL & CSV validation & import engine
│   │   │   ├── models.py                 # Product model with profit margin calculation
│   │   │   └── views.py                  # ProductViewSet & PublicProductViewSet
│   │   ├── repairs/                      # Watch service & atelier repair tracking
│   │   │   ├── models.py                 # Repair ticket model
│   │   │   └── views.py                  # Ticket lifecycle & WhatsApp notification trigger
│   │   ├── sales/                        # POS billing, cart checkout, warranties, PDF invoices
│   │   │   ├── invoice.py                # ReportLab PDF invoice and repair slip generators
│   │   │   ├── models.py                 # Sale, SaleItem, and Warranty models
│   │   │   └── serializers.py            # SaleCreateSerializer with atomic transaction logic
│   │   └── users/                        # Custom authentication, RBAC, language preferences
│   │       ├── models.py                 # User model (admin, staff)
│   │       └── permissions.py            # Role-based DRF permission classes
│   ├── core/                             # Django settings, WSGI, ASGI, Celery entry points
│   │   ├── settings.py                   # Environment configuration, database routing, CORS
│   │   ├── celery.py                     # Celery Beat schedule configuration
│   │   └── urls.py                       # Top-level API routing
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                             # Next.js Application Root
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/             # Staff login screen
│   │   │   ├── (dashboard)/              # Management dashboard routes
│   │   │   │   ├── dashboard/            # Overview KPIs, AI insight widgets, charts
│   │   │   │   ├── sales/                # Fast barcode POS billing counter
│   │   │   │   ├── sales/history/        # Past sales invoices & reprinting
│   │   │   │   ├── products/             # Inventory catalog & bulk Excel import modal
│   │   │   │   ├── repairs/              # Repair ticket queue & status workflow
│   │   │   │   ├── customers/            # CRM customer directory & loyalty management
│   │   │   │   ├── expenses/             # Expense tracking & financial records
│   │   │   │   ├── reports/              # Visual charts & tabular CSV/Excel/PDF exports
│   │   │   │   ├── notifications/        # WhatsApp messaging & campaign dispatch
│   │   │   │   └── settings/             # Business profile, prefixes, themes, backups
│   │   │   ├── (public)/                 # Customer-facing luxury digital boutique
│   │   │   │   ├── page.tsx              # Boutique homepage (Hero, brands, atelier story)
│   │   │   │   ├── shop/                 # Filterable watch catalog & search
│   │   │   │   ├── shop/[id]/            # Watch specifications & WhatsApp inquiry CTA
│   │   │   │   ├── brands/               # Authorized brand showcases
│   │   │   │   ├── categories/           # Curated category showcases
│   │   │   │   ├── about/                # Meghani heritage (since 1984)
│   │   │   │   ├── contact/              # Map, store hours, appointment booking
│   │   │   │   └── gallery/              # Horological workshop & restoration showcase
│   │   │   └── api/                      # Next.js BFF routes (catalogue, enquiry, upload)
│   │   ├── components/                   # Shared UI, layout, and feature components
│   │   ├── context/AuthContext.tsx       # User session state & JWT management
│   │   ├── services/api.ts               # Axios client with JWT refresh interceptors
│   │   ├── services/publicCatalogue.ts   # Public catalog data fetching & fallback seeds
│   │   └── types/                        # TypeScript interfaces (index.ts, public.ts)
│   ├── package.json
│   └── tailwind.config.js
│
├── docker-compose.yml                    # Multi-container production deployment
├── docker-compose.dev.yml                # Development container configuration
└── DEPLOY.md                             # Production deployment guide
```

---

## 4. Main Modules & Business Logic

### 4.1 Point of Sale (POS) & Billing (`apps.sales`)
* **Barcode & Instant Lookup:** Cashiers can scan physical barcodes using a USB hardware scanner or webcam, or search by name. The cart recalculates line subtotals, applied discounts, and net totals in real time.
* **Customer Attachment:** Sales can be linked to an existing registered customer (via phone lookup) or handled as an anonymous walk-in sale.
* **Atomic Checkout (`@transaction.atomic`):** When checkout is confirmed via `POST /api/sales/`:
  1. Validates real-time inventory for every cart item.
  2. Creates the parent `Sale` record with a sequential daily invoice number (`INV-YYYYMMDD-XXXX`).
  3. Records line items into `SaleItem`, permanently snapshotting the item's `cost_price` to lock in accurate historical profit calculations even if future product prices change.
  4. Automatically decrements inventory quantities in the `Product` table.
  5. Creates a `Warranty` record for each item with an active warranty period, calculating the exact expiration date.
  6. Computes customer loyalty points earned ($\lfloor\text{Sale Amount}/100\rfloor \times 1$) and credits them to the linked customer.
* **Receipt Printing & Invoicing:** Opens an on-screen preview capable of immediate thermal printer output or downloading an official ReportLab A4 PDF invoice.

### 4.2 Watch Repair Management (`apps.repairs`)
* **Service Intake Ticket:** Generates a unique tracking number (`REP-YYYYMMDD-XXXX`) recording the customer, brand, model number, serial number, item type, issue description, estimated cost, and advance deposit.
* **5-Stage Lifecycle:**
  $$\text{Received} \longrightarrow \text{In Repair} \longrightarrow \text{Ready for Pickup} \longrightarrow \text{Delivered} \quad (\text{or } \text{Cancelled})$$
* **Automated Ready Notification:** As soon as a technician updates a ticket's status to `ready`, a backend trigger automatically generates and sends a personalized WhatsApp message to the customer informing them their timepiece is ready for collection.
* **Financial Settlement:** Tracks the final `repair_charge`, deducts `advance_paid`, and computes `balance_due`. Generates printable repair intake vouchers and delivery receipts.

### 4.3 Inventory & Catalog (`apps.products`)
* **Product Classification:** Categorizes watches into `analog`, `digital`, `smart`, `wall`, and `accessory` across major authorized brands.
* **Financial Calculations:** Automatically calculates `profit_margin` ($\text{Selling Price} - \text{Cost Price}$) and `profit_percentage`. Cost and profit margins are strictly withheld from non-admin endpoints.
* **Price Shielding ("Price on Request"):** Provides an administrative toggle `price_visible`. If unchecked, or if the product is marked `on_request`, all customer-facing endpoints withhold the numerical price and display "Price on Request" with a WhatsApp inquiry link.
* **Bulk Import / Export:** Allows administrators to import product catalogs from Excel (`.xlsx`) or CSV files. It validates mandatory columns, provides line-by-line error reports, and can update existing stock levels by matching barcodes.
* **Low-Stock Detection:** Automatically tags items whose stock levels fall below the threshold (default: 5 units).

### 4.4 Customer Relationship Management (`apps.crm`)
* **Customer Profile:** Maintains names, phone numbers, email, physical addresses, language preferences (`en`, `hi`, `gu`), and dates of birth.
* **Purchase & Service Records:** Provides instant access to a customer's lifetime purchase history and repair tickets.
* **Loyalty Program:**
  * Accrues points automatically during POS checkout.
  * Allows point redemption directly at POS checkout to offset invoice totals (default: 1 point = ₹0.50 discount).
  * Automatically assigns loyalty tiers: Bronze, Silver, Gold, and Platinum.

### 4.5 Expense Tracking (`apps.expenses`)
* **Operational Expense Book:** Tracks overhead expenses across 8 categories: `rent`, `salary`, `utilities`, `maintenance`, `purchase`, `marketing`, `transport`, and `other`.
* **Vendor & Bill Receipts:** Attaches vendor information, descriptions, expense dates, and uploaded bill photos.
* **Net Profit Calculation:** Integrates with sales data to compute true store net profit:
  $$\text{Net Profit} = (\text{Sales Profit} + \text{Repair Revenue}) - \text{Total Operational Expenses}$$

### 4.6 AI Analytics Engine (`apps.analytics`)
* **Store KPIs:** Aggregates real-time metrics including daily sales, monthly profit, active repair queues, and low-stock warnings.
* **Predictive Sales Forecasting:** Uses Facebook Prophet (with a fallback to a 7-day weighted moving average) to model future 30-day demand curves based on historical sales.
* **Stockout Velocity Predictor:** Calculates product sales velocity to forecast the exact date stock will deplete, categorizing inventory items as `critical`, `warning`, or `healthy`.
* **Actionable Natural-Language Insights:** Automatically generates operational recommendations (e.g., *"Casio G-Shock inventory has reached 2 units; historical turnover suggests restocking 10 units before the weekend"*).

### 4.7 Omnichannel Notifications (`apps.notifications`)
* **WhatsApp & SMS Messaging:** Integrates with the Twilio REST API to dispatch transactional messages.
* **Dynamic Variable Merging:** Supports message templates with dynamic placeholders like `{{customer_name}}`, `{{ticket_number}}`, `{{item_type}}`.
* **Batch Broadcasts:** Supports sending targeted promotional announcements and festival offers to customer segments.

### 4.8 System Settings & Audit Logs (`apps.core`)
* **Business Settings Singleton:** Maintains store branding, physical address, GSTIN, PAN, receipt headers/footers, and loyalty conversion rates.
* **Audit Trail:** Tracks user actions (`create`, `update`, `delete`, `view`, `login`, `export`) along with IP addresses and user agents.
* **Gzip Backup Engine:** Generates compressed `.json.gz` database snapshots on demand with support for one-click restoration and retention cleanup.

---

## 5. Public Website Functionality

The public website (`frontend/src/app/(public)`) acts as Meghani Watch Co.'s authorized digital showroom:

* **Brand Aesthetic:** Features a luxury dark horological layout (`#0B0B0A` rich obsidian with `#C9A45C` champagne gold accents) tailored for fine watchmaking.
* **Shop & Filter Engine (`/shop`):**
  * Real-time search across watch names, brands, categories, descriptions, and reference codes.
  * Price range sliders, category pills, brand toggles, and availability filters (`in_stock`, `on_request`).
  * Grid and list viewing modes.
* **Brand Heritage Showcases (`/brands`):** Dedicated brand showcases highlighting authorized status and curated models for Titan, Casio, Timex, Citizen, Fastrack, and Sonata.
* **Watch Detail Experience (`/shop/[id]`):**
  * Displays high-resolution imagery, caliber movements, case diameters, water resistance ratings, sapphire crystal materials, and warranty information.
  * Direct WhatsApp Concierge CTA: Generates an automated message pre-populated with the exact watch name, brand, reference code, and boutique inquiry.
  * In-Store Consultation Booking: Allows visitors to request an in-person viewing at the boutique.
* **Master Atelier & Horology Workshop (`/about`, `/gallery`):** Educates customers on in-house repair capabilities (ultrasonic sanitization, Swiss timing diagnostics, battery testing, vintage restorations).
* **SEO & Social Optimization:** Pre-configured with JSON-LD `JewelryStore` Schema.org microdata, OpenGraph cards, dynamic meta titles, `sitemap.ts`, and `robots.ts`.

---

## 6. Database Models & Schema Design

```
Product (products)
├── id: AutoField (PK)
├── name: CharField(200)
├── brand: CharField(100)
├── category: CharField(20) [analog, digital, smart, wall, accessory]
├── cost_price: DecimalField(10,2)
├── selling_price: DecimalField(10,2)
├── price_visible: BooleanField(default=True)
├── availability: CharField(20) [in_stock, out_of_stock, on_request, discontinued]
├── stock: PositiveIntegerField(default=0)
├── barcode: CharField(50, unique=True, nullable)
├── supplier_name: CharField(100)
├── image: ImageField(upload_to='products/')
├── description: TextField
├── warranty_months: PositiveIntegerField(default=0)
└── is_active: BooleanField(default=True)

Customer (customers)
├── id: AutoField (PK)
├── name: CharField(100)
├── phone: CharField(15, unique=True)
├── email: EmailField
├── address: TextField
├── date_of_birth: DateField(nullable)
├── language_preference: CharField(10) [en, hi, gu]
├── loyalty_points: PositiveIntegerField(default=0)
└── notes: TextField

Sale (sales)
├── id: AutoField (PK)
├── invoice_number: CharField(20, unique=True)
├── customer: ForeignKey(Customer, SET_NULL, nullable)
├── total_amount: DecimalField(10,2)
├── discount: DecimalField(10,2)
├── tax: DecimalField(10,2)
├── payment_mode: CharField(20) [cash, upi, card, mixed]
├── profit: DecimalField(10,2)
├── notes: TextField
├── sale_date: DateTimeField(default=timezone.now)
└── created_by: ForeignKey(User, SET_NULL, nullable)

SaleItem (sale_items)
├── id: AutoField (PK)
├── sale: ForeignKey(Sale, CASCADE, related_name='items')
├── product: ForeignKey(Product, PROTECT, related_name='sale_items')
├── quantity: PositiveIntegerField
├── unit_price: DecimalField(10,2)
├── cost_price: DecimalField(10,2)
└── subtotal: DecimalField(10,2)

Repair (repairs)
├── id: AutoField (PK)
├── ticket_number: CharField(20, unique=True)
├── customer: ForeignKey(Customer, PROTECT, related_name='repairs')
├── item_type: CharField(50)
├── brand: CharField(50)
├── model_number: CharField(50)
├── serial_number: CharField(100)
├── issue_description: TextField
├── estimated_cost: DecimalField(10,2, nullable)
├── repair_charge: DecimalField(10,2, nullable)
├── advance_paid: DecimalField(10,2, default=0)
├── status: CharField(20) [received, in_repair, ready, delivered, cancelled]
├── received_date: DateTimeField(default=timezone.now)
├── expected_delivery: DateField(nullable)
├── delivered_date: DateTimeField(nullable)
└── created_by: ForeignKey(User, SET_NULL, nullable)

Warranty (warranties)
├── id: AutoField (PK)
├── sale: ForeignKey(Sale, CASCADE, related_name='warranties')
├── product: ForeignKey(Product, PROTECT)
├── customer: ForeignKey(Customer, PROTECT, related_name='warranties')
├── warranty_months: PositiveIntegerField
├── start_date: DateField
├── expiry_date: DateField
├── serial_number: CharField(100)
└── notified: BooleanField(default=False)

Expense (expenses)
├── id: AutoField (PK)
├── category: CharField(30) [rent, salary, utilities, maintenance, purchase, marketing, transport, other]
├── amount: DecimalField(10,2)
├── date: DateField(default=timezone.now)
├── description: TextField
├── vendor_name: CharField(100)
├── receipt: ImageField(upload_to='receipts/', nullable)
└── created_by: ForeignKey(User, SET_NULL, nullable)

Notification (notifications)
├── id: AutoField (PK)
├── customer: ForeignKey(Customer, CASCADE, related_name='notifications')
├── message: TextField
├── type: CharField(20) [whatsapp, sms, email]
├── status: CharField(20) [pending, sent, failed]
├── sent_on: DateTimeField(nullable)
└── error_message: TextField
```

---

## 7. User Roles & Security Model

The system uses JSON Web Tokens (JWT) issued by SimpleJWT. Roles are verified on the backend by DRF permission classes (`apps/users/permissions.py`) and on the frontend via Next.js navigation guards in `AuthContext.tsx`.

### Access Matrix

| Feature / Domain | Administrator | Store Staff | Public Visitor |
| :--- | :---: | :---: | :---: |
| **Browse Public Watch Catalog & Details** | Full Access | Full Access | Full Access |
| **Submit Online Concierge Inquiries** | Allowed | Allowed | Allowed |
| **POS Barcode Checkout & Sale Creation** | Full Access | Full Access | Denied |
| **View Past Sales Invoices & Print Slips**| Full Access | Full Access | Denied |
| **Create & Update Repair Tickets** | Full Access | Full Access | Denied |
| **Add / Edit Customers & Loyalty Points**| Full Access | Full Access | Denied |
| **Add / Edit Products & Adjust Quantities**| Full Access | View Only | Denied |
| **Soft Delete Products or Void Transactions**| Allowed | Denied | Denied |
| **Record Store Expenses & Receipts** | Full Access | Denied | Denied |
| **Access Financial Margins & Net Profit** | Full Access | Denied | Denied |
| **View AI Forecasts & Stockout Warnings**| Full Access | Denied | Denied |
| **Dispatch Bulk WhatsApp Announcements** | Allowed | Denied | Denied |
| **Manage Users & Perform Database Backups**| Full Access | Denied | Denied |

---

## 8. Third-Party Integrations & External Services

| Service | Protocol / Library | Implementation Purpose |
| :--- | :--- | :--- |
| **Twilio API** | REST API (`twilio` SDK) | Dispatches automated WhatsApp notifications when repairs are ready and sends promotional birthday greetings. |
| **Cloudinary** | Signed HTTPS Multi-part Upload | Stores watch catalog imagery and expense receipts securely without exposing private API secrets to client browsers. |
| **AWS S3** | `django-storages` + `boto3` | Enterprise cloud storage option for media files. |
| **Razorpay** | REST API (`razorpay` SDK) | Integrated backend credentials prepared for digital payment collections. |
| **Facebook Prophet** | Python C++/PyStan Model | Computes time-series sales forecasting accounting for seasonality. |
| **ReportLab** | Python PDF Engine | Generates pixel-perfect thermal receipts and A4 invoices on the fly. |
| **SheetJS (XLSX)** | Browser Library | Generates client-side Excel exports for reports and tabular views. |

---

## 9. End-to-End Operational Workflow Traces

### Workflow 1: POS Barcode Sale & Billing
```
1. Cashier scans barcode on /sales
   ├── Next.js calls GET /api/products/barcode/<code>/
   └── Product details populate cart with real-time stock verification

2. Customer phone lookup
   ├── Next.js calls GET /api/customers/?search=<phone>
   └── Attaches existing customer profile (or creates a quick walk-in profile)

3. Cashier confirms payment mode and submits
   └── Next.js sends payload to POST /api/sales/

4. Django @transaction.atomic execution
   ├── Validates available inventory for all items
   ├── Decrements stock in Product model
   ├── Generates sequential invoice number (INV-YYYYMMDD-XXXX)
   ├── Records item costs to lock in historical profit margins
   ├── Creates Warranty record if warranty_months > 0
   └── Adds loyalty points to customer profile (1 pt / ₹100)

5. Instant receipt rendering
   └── Displays thermal receipt modal with instant print and PDF download
```

### Workflow 2: Watch Repair Intake to Delivery
```
1. Customer brings in timepiece for servicing
   └── Staff completes intake on /repairs -> sends POST /api/repairs/

2. Ticket assignment & intake slip
   └── Generates ticket REP-YYYYMMDD-XXXX with issues, advance deposit, and due date

3. Workshop repair progression
   └── Technician moves status: received -> in_repair

4. Completion hook & automated alert
   ├── Technician updates status to ready
   └── Backend hook calls send_whatsapp_message() via Twilio:
       "Your timepiece is ready for pickup. Ticket: REP-YYYYMMDD-XXXX. Meghani Watch Co."

5. Final delivery & payment
   └── Customer settles remaining balance -> ticket updated to delivered
```

### Workflow 3: Online Visitor Inquiry to Boutique Sale
```
1. Visitor browses digital boutique at /shop
   └── Filters by "Analog" and "Titan"

2. Visitor selects watch model
   └── Reviews high-resolution photos, caliber specs, and water resistance

3. Visitor initiates inquiry
   └── Clicks "Inquire via WhatsApp"

4. Concierge link generation
   └── System creates pre-formatted WhatsApp message:
       "Hello Meghani Watch Co., I am interested in acquiring this timepiece:
        Titan Edge Ceramic • Ref Code: TIT-EDG-01 • Availability: IN STOCK..."

5. Conversion
   └── Boutique concierge coordinates an in-person viewing and finalizes the sale
```

---

## 10. Identified Technical Issues, Limitations & Improvement Opportunities

During this architectural review, five specific code discrepancies and four structural growth opportunities were identified:

### 10.1 Code Bugs & Discrepancies

1. **Celery Beat Scheduled Task Parameter Mismatch (High Priority):**
   * **Location:** `backend/apps/analytics/tasks.py` (lines 27–31 and 62–66).
   * **Issue:** Tasks `check_and_send_birthday_wishes` and `check_warranty_expiry_notifications` call:
     ```python
     Notification.objects.create(
         customer=customer,
         notification_type='whatsapp',  # Error: field is named 'type'
         template_name='birthday_wish',  # Error: field does not exist on model
         message=message,
         status='pending'
     )
     ```
   * **Impact:** When Celery Beat triggers these tasks at 9:00 AM and 10:00 AM, they crash with a `TypeError: Notification() got an unexpected keyword argument`.
   * **Remedy:** Update `tasks.py` to use `type='whatsapp'` and remove `template_name`.

2. **Hardcoded Placeholder Information in Invoices:**
   * **Location:** `backend/apps/sales/invoice.py` (lines 51–54, 196–199) and `backend/apps/sales/views.py` (lines 124–129).
   * **Issue:** PDF invoices and repair receipts contain hardcoded dummy text:
     `"Your Business Address, City - 000000 | Phone: +91 XXXXXXXXXX | GST: XXXXXXXXXXXXXXX"`.
   * **Impact:** Customer receipts show dummy text instead of the values configured in the `BusinessSettings` table.
   * **Remedy:** Fetch store details dynamically from `BusinessSettings.get_settings()`.

3. **User Role Hierarchy Discrepancy:**
   * **Location:** `backend/apps/users/models.py` vs. `backend/apps/users/permissions.py`.
   * **Issue:** The database `User` model only allows `[('admin', 'Admin'), ('staff', 'Staff')]`, whereas `permissions.py` defines a 4-tier hierarchy: `admin`, `manager`, `staff`, `viewer`.
   * **Impact:** Manager and Viewer roles cannot be assigned to user accounts via standard Django forms.
   * **Remedy:** Expand `ROLE_CHOICES` in `users/models.py` to include `manager` and `viewer`, then run migrations.

4. **Orphaned Utility Directory:**
   * **Location:** `backend/common/`.
   * **Issue:** Contains unreferenced legacy utilities (`pagination.py`, `permissions.py`, `utils.py`, `exceptions.py`).
   * **Impact:** Creates technical debt and onboarding ambiguity.
   * **Remedy:** Safely archive or remove this folder since the codebase uses `apps.core.pagination` and `apps.users.permissions`.

5. **Conflicting Documentation (`mern-docs/`):**
   * **Location:** `d:\ASC\Meghani-Connects\mern-docs\`.
   * **Issue:** Contains planning documents describing an Express.js + MongoDB stack, contradicting the actual Django + PostgreSQL implementation.
   * **Remedy:** Archive or clearly mark `mern-docs/` as a historical proposal to avoid developer confusion.

---

### 10.2 Architectural Growth Opportunities

1. **Offline-First Store POS:** Integrate browser-side IndexedDB caching and service workers so POS sales can be processed during local internet outages and synced once reconnected.
2. **Inbound WhatsApp Webhooks:** Add a webhook endpoint (`/api/notifications/webhook/`) to capture customer replies from Twilio directly in the CRM dashboard.
3. **Automated Supplier Reordering:** Expand low-stock alerts to generate downloadable Purchase Order (PO) PDFs for authorized distributors (Titan, Casio, etc.).
4. **Product Multi-Image Gallery:** Add a dedicated `ProductImage` table to allow uploading multiple high-resolution photos per watch model instead of a single image.

---

## 11. Final Assessment & Next Steps

Meghani Connect 360 is built on a solid foundation with clean separation of concerns, robust transaction guarantees, and an appealing luxury design. With the identified background task fixes and dynamic invoice adjustments in place, the application is ready for production deployment and future feature development.

*(Audit completed without modifying, moving, or deleting any existing project files.)*
