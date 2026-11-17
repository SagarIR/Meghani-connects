# Phase 4 – Database Schema

> **Current Status:** COMPLETED  
> **Progress:** 9 / 9 verified tasks  
> **Last Updated:** 2026-11-17  
> **Next Action:** Maintain schema integrity and protect foreign key constraints during future feature additions.  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md)

---

## Phase Progress Summary

| Task | Status | Evidence | Remaining Work |
|:---|:---:|:---|:---|
| Custom User Model & Auth Schema | **COMPLETED** | `apps/users/models.py` (`User` extending `AbstractBaseUser`). | None. |
| Product, Brand & Category Catalog Schema | **COMPLETED** | `apps/products/models.py` (`Product`, `Brand`, `Category`). Unique barcode indexing, soft delete flag (`is_active`). | None. |
| Sales & SaleItem Transaction Schema | **COMPLETED** | `apps/sales/models.py` (`Sale`, `SaleItem`). `on_delete=models.PROTECT` on product, sequential invoice numbers. | None. |
| Warranty Management Schema | **COMPLETED** | `apps/sales/models.py` (`Warranty`). Links to sale, product, customer; computes expiry date. | None. |
| Watch Repair Workshop Schema | **COMPLETED** | `apps/repairs/models.py` (`Repair`). Unique `ticket_number`, `on_delete=models.PROTECT` on customer, 5-stage status. | None. |
| Customer CRM & Loyalty Schema | **COMPLETED** | `apps/crm/models.py` (`Customer`, `Enquiry`). Unique phone, loyalty points counter, lifetime spend aggregation. | None. |
| Expense Bookkeeping Schema | **COMPLETED** | `apps/expenses/models.py` (`Expense`). 8 expense categories, receipt image attachment, date indexing. | None. |
| Core Settings, AuditLog & Notifications Schema | **COMPLETED** | `apps/core/models.py` (`BusinessSettings`, `AuditLog`, `GalleryItem`, `Milestone`, `Offer`, `Testimonial`); `apps/notifications/models.py`. | None. |
| Database Migrations & Initial Seed Data | **COMPLETED** | `python manage.py makemigrations --dry-run` reports `No changes detected`. SQLite seeded with 29 products, 110 sales, 277 items, 20 repairs. | None. |

---

## Completed Tasks
- [x] Defined and applied relational database schemas across all 9 domain apps.
- [x] Implemented relational integrity protection (`on_delete=models.PROTECT` on products and customers with historical sales/repairs).
- [x] Established unique indexes on barcodes, invoice numbers, ticket numbers, and phone numbers.
- [x] Verified zero pending migrations across the application (`No changes detected`).
- [x] Seeded development environment with comprehensive test data (29 products, 110 sales, 15 customers, 20 repairs, 18 expenses).

## Pending Tasks
*None. Phase is 100% verified complete.*

## Blocked Tasks
*None.*

## Completion Criteria
1. All ORM models reflect business domain requirements with strict types and nullability rules. *(PASSED)*
2. Foreign key deletion protections prevent orphaned financial or repair records. *(PASSED)*
3. Migrations dry-run confirms database schema is in complete synchronization with Python models. *(PASSED)*

## Next Action
Maintain schema synchronization when adding future domain entities (e.g. multi-image product galleries or supplier purchase orders).

---

## Original Technical Specifications & Schema Architecture

### Objective

Define PostgreSQL database schema with all tables, relationships, and constraints.

---

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   products   │       │  customers   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ name         │       │ name         │       │ name         │
│ username     │       │ brand        │       │ phone        │
│ password     │       │ category     │       │ address      │
│ role         │       │ cost_price   │       │ dob          │
│ phone        │       │ selling_price│       │ language     │
│ email        │       │ stock        │       │ loyalty_pts  │
│ language     │       │ barcode      │       │ created_at   │
└──────────────┘       │ supplier     │       └──────┬───────┘
       │               └──────┬───────┘              │
       │                      │                      │
       │               ┌──────┴───────┐              │
       │               │              │              │
       ▼               ▼              │              ▼
┌──────────────┐  ┌──────────────┐    │    ┌──────────────┐
│    sales     │  │  sale_items  │    │    │   repairs    │
├──────────────┤  ├──────────────┤    │    ├──────────────┤
│ id (PK)      │  │ id (PK)      │    │    │ id (PK)      │
│ customer_id  │◄─│ sale_id (FK) │    │    │ customer_id  │
│ total_amount │  │ product_id   │◄───┘    │ item_type    │
│ payment_mode │  │ quantity     │         │ issue        │
│ profit       │  │ unit_price   │         │ status       │
│ sale_date    │  │ subtotal     │         │ repair_charge│
│ created_by   │  └──────────────┘         └──────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   warranty   │  │   expenses   │  │ notifications│
├──────────────┤  ├──────────────┤  ├──────────────┤
│ id (PK)      │  │ id (PK)      │  │ id (PK)      │
│ sale_id (FK) │  │ category     │  │ customer_id  │
│ product_id   │  │ amount       │  │ message      │
│ expiry_date  │  │ date         │  │ type         │
│ notified     │  │ description  │  │ status       │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

### Table Schemas

#### 1. users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
    phone VARCHAR(15),
    email VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Django Model:**

```python
class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    ]
    
    name = models.CharField(max_length=100)
    username = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    language = models.CharField(max_length=10, default='en')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
```

---

#### 2. products

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(20) NOT NULL CHECK (category IN ('analog', 'digital', 'smart', 'wall', 'accessory')),
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    barcode VARCHAR(50) UNIQUE,
    supplier_name VARCHAR(100),
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Django Model:**

```python
class Product(models.Model):
    CATEGORY_CHOICES = [
        ('analog', 'Analog Watch'),
        ('digital', 'Digital Watch'),
        ('smart', 'Smart Watch'),
        ('wall', 'Wall Clock'),
        ('accessory', 'Accessory'),
    ]
    
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    barcode = models.CharField(max_length=50, unique=True, blank=True, null=True)
    supplier_name = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def profit_margin(self):
        return self.selling_price - self.cost_price
```

---

#### 3. customers

```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    address TEXT,
    date_of_birth DATE,
    language_preference VARCHAR(10) DEFAULT 'en',
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Django Model:**

```python
class Customer(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, unique=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    language_preference = models.CharField(max_length=10, default='en')
    loyalty_points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

#### 4. sales

```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'card', 'mixed')),
    profit DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);
```

---

#### 5. sale_items

```sql
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);
```

**Django Models:**

```python
class Sale(models.Model):
    PAYMENT_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('mixed', 'Mixed'),
    ]
    
    invoice_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    profit = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    sale_date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
```

---

#### 6. repairs

```sql
CREATE TABLE repairs (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    item_type VARCHAR(50) NOT NULL,
    brand VARCHAR(50),
    issue_description TEXT NOT NULL,
    estimated_cost DECIMAL(10, 2),
    repair_charge DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL CHECK (status IN ('received', 'in_repair', 'ready', 'delivered', 'cancelled')),
    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATE,
    notes TEXT,
    created_by INTEGER REFERENCES users(id)
);
```

**Django Model:**

```python
class Repair(models.Model):
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('in_repair', 'In Repair'),
        ('ready', 'Ready for Pickup'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    ticket_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT)
    item_type = models.CharField(max_length=50)
    brand = models.CharField(max_length=50, blank=True)
    issue_description = models.TextField()
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    repair_charge = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    received_date = models.DateTimeField(auto_now_add=True)
    delivery_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
```

---

#### 7. expenses

```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(30) NOT NULL CHECK (category IN ('rent', 'salary', 'utilities', 'maintenance', 'purchase', 'other')),
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    receipt VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### 8. warranty

```sql
CREATE TABLE warranty (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    customer_id INTEGER REFERENCES customers(id),
    warranty_months INTEGER NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### 9. notifications

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('whatsapp', 'sms', 'email')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    sent_on TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### 10. analytics_cache

```sql
CREATE TABLE analytics_cache (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(50) NOT NULL,
    metric_value JSONB NOT NULL,
    period VARCHAR(20),
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_repairs_customer ON repairs(customer_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_warranty_expiry ON warranty(expiry_date);
```

---

## Next Phase

→ [Phase 5 - Module Breakdown](./05-phase-5-modules.md)
