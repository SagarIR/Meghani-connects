# Phase 6 – Reports & Visualization

> **Current Status:** PARTIALLY COMPLETED  
> **Progress:** 5 / 6 verified tasks  
> **Last Updated:** 2026-11-17  
> **Next Action:** Connect ReportLab PDF invoice generation to `BusinessSettings` singleton to eliminate hardcoded dummy store metadata.  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md)

---

## Phase Progress Summary

| Task | Status | Evidence | Remaining Work |
|:---|:---:|:---|:---|
| Sales Summary & Trend Analytics Engine | **COMPLETED** | `apps/analytics/views.py` (`SalesSummaryReportView`). Date range filters, payment breakdown, daily aggregations. | None. |
| Product Performance & Inventory Turnover Reports | **COMPLETED** | `ProductPerformanceReportView`. Identifies top-selling timepieces and slow-moving inventory. | None. |
| Profit & Loss Statement Aggregation | **COMPLETED** | `ProfitReportView`. Revenue vs Cost of Goods Sold vs Operating Expenses -> Net Profit calculation. | None. |
| Stock Valuation & Gross Margin Estimation | **COMPLETED** | `InventoryValuationReportView`. Total units, cost valuation, retail valuation, gross margin projection. | None. |
| Multi-Format Report Export Service (CSV, Excel, PDF) | **COMPLETED** | `ReportExportView` (`openpyxl` for Excel, Python `csv`, ReportLab for PDF). Verified in `frontend/src/app/(dashboard)/reports/page.tsx`. | None. |
| Dynamic A4 Thermal / ReportLab Invoice Customization | **PARTIALLY COMPLETED (DEFECT)** | `apps/sales/invoice.py` generates ReportLab PDF invoices. Store address, phone, GSTIN are hardcoded dummy text (`Your Business Address...`). | Resolve store metadata dynamically from `BusinessSettings.get_settings()`. |

---

## Completed Tasks
- [x] Sales performance analytics engine aggregating transactions by date, payment tender, and staff associate.
- [x] Product turnover reports identifying high-velocity watches and stagnant stock.
- [x] Comprehensive Profit & Loss calculations integrating revenue, COGS, and operating expenses.
- [x] Real-time inventory valuation assessing total cost vs anticipated retail realization.
- [x] Multi-format export engine streaming CSV, Excel (`.xlsx`), and ReportLab PDF documents with dynamic HTTP disposition headers.

## Pending Tasks
- [ ] Connect `generate_invoice_pdf` in `apps/sales/invoice.py` to `BusinessSettings.get_settings()` to dynamically populate boutique address, GSTIN, and contact details.

## Blocked Tasks
*None.*

## Completion Criteria
1. Report queries execute performantly against aggregated database records without full-table scan bottlenecks. *(PASSED)*
2. ReportLab PDF and OpenPyXL Excel downloads generate valid, uncorrupted binary streams. *(PASSED)*
3. Official invoice documents render verified legal and tax details from the active business configuration. *(PENDING DYNAMIC BINDING)*

## Next Action
Inject dynamic `BusinessSettings` data into [backend/apps/sales/invoice.py](../backend/apps/sales/invoice.py).

---

## Original Technical Specifications & Reports Architecture

### Objective

Define report types, data structures, and export formats for business analytics.

---

### Report Types

#### 1. Sales Summary Report

**Purpose**: Overview of sales performance for a given period.

**Filters**:
- Date Range (from - to)
- Payment Mode
- Staff Member

**Data Fields**:

| Field | Description |
|-------|-------------|
| Total Sales | Sum of all sale amounts |
| Total Profit | Sum of all profits |
| Transaction Count | Number of sales |
| Average Sale Value | Total Sales / Transaction Count |
| Payment Breakdown | Sales by payment mode |
| Daily Breakdown | Sales per day |

**API Endpoint**:

```
GET /api/reports/sales-summary/
?start_date=2026-01-01&end_date=2026-01-31&payment_mode=all
```

**Response**:

```json
{
  "period": { "start": "2026-01-01", "end": "2026-01-31" },
  "summary": {
    "total_sales": 485000,
    "total_profit": 98500,
    "transaction_count": 156,
    "average_sale": 3109.62
  },
  "by_payment_mode": {
    "cash": 180000,
    "upi": 220000,
    "card": 85000
  },
  "daily_data": [
    { "date": "2026-01-01", "sales": 15000, "profit": 3200, "count": 5 }
  ]
}
```

---

#### 2. Product Performance Report

**Purpose**: Identify best and worst selling products.

**Filters**:
- Date Range
- Category
- Brand

**Data Fields**:

| Field | Description |
|-------|-------------|
| Top Sellers | Products with highest sales quantity |
| Slow Movers | Products with lowest/no sales |
| Revenue by Product | Total revenue per product |
| Stock vs Sales | Current stock vs units sold |

**API Endpoint**:

```
GET /api/reports/product-performance/
?start_date=2026-01-01&end_date=2026-01-31&category=analog
```

**Response**:

```json
{
  "top_sellers": [
    { "id": 12, "name": "Titan Raga", "brand": "Titan", "sold": 45, "revenue": 157500 }
  ],
  "slow_movers": [
    { "id": 28, "name": "Casio G-Shock", "brand": "Casio", "sold": 0, "stock": 15 }
  ],
  "by_category": {
    "analog": { "sold": 120, "revenue": 380000 },
    "digital": { "sold": 85, "revenue": 210000 }
  }
}
```

---

#### 3. Repair Income Report

**Purpose**: Track repair service revenue.

**Filters**:
- Date Range
- Status
- Item Type

**Data Fields**:

| Field | Description |
|-------|-------------|
| Total Repairs | Number of repair jobs |
| Completed Repairs | Delivered repairs |
| Pending Repairs | In-progress repairs |
| Total Revenue | Sum of repair charges |
| Average Repair Value | Revenue / Completed |

**API Endpoint**:

```
GET /api/reports/repair-income/
?start_date=2026-01-01&end_date=2026-01-31
```

---

#### 4. Expense Report

**Purpose**: Track business expenses and calculate net profit.

**Filters**:
- Date Range
- Category

**Data Fields**:

| Field | Description |
|-------|-------------|
| Total Expenses | Sum of all expenses |
| By Category | Breakdown by expense category |
| Daily Trend | Expenses per day |
| Net Profit | Sales Profit - Total Expenses |

**API Endpoint**:

```
GET /api/reports/expenses/
?start_date=2026-01-01&end_date=2026-01-31
```

**Response**:

```json
{
  "total_expenses": 125000,
  "by_category": {
    "rent": 30000,
    "salary": 60000,
    "utilities": 8000,
    "maintenance": 12000,
    "other": 15000
  },
  "sales_profit": 98500,
  "net_profit": -26500
}
```

---

#### 5. Customer Loyalty Report

**Purpose**: Analyze customer engagement and loyalty.

**Filters**:
- Date Range
- Minimum Purchases

**Data Fields**:

| Field | Description |
|-------|-------------|
| Total Customers | Active customer count |
| New Customers | Customers added this period |
| Top Customers | Highest spending customers |
| Loyalty Points | Total points earned/redeemed |
| Repeat Rate | % customers with multiple purchases |

**API Endpoint**:

```
GET /api/reports/customer-loyalty/
?start_date=2026-01-01&end_date=2026-01-31
```

---

#### 6. Inventory Report

**Purpose**: Current stock status and valuation.

**Data Fields**:

| Field | Description |
|-------|-------------|
| Total Products | Active product count |
| Total Stock Value | Sum of (stock × cost_price) |
| Potential Revenue | Sum of (stock × selling_price) |
| Low Stock Items | Products below threshold |
| Out of Stock | Products with 0 stock |
| By Category | Stock distribution |

**API Endpoint**:

```
GET /api/reports/inventory/
```

---

#### 7. Warranty Expiry Report

**Purpose**: Track upcoming warranty expirations.

**Filters**:
- Days Ahead (7, 30, 90)

**Data Fields**:

| Field | Description |
|-------|-------------|
| Expiring Soon | Warranties expiring in period |
| Customer Details | Contact info for notification |
| Product Info | Product under warranty |

---

### Charts & Visualization

#### Dashboard Charts

| Chart Type | Data | Library |
|------------|------|---------|
| Line Chart | Sales trend over time | Recharts |
| Bar Chart | Sales by category | Recharts |
| Pie Chart | Payment mode distribution | Recharts |
| Area Chart | Profit margins | Recharts |

#### Chart Components

```tsx
// SalesLineChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function SalesLineChart({ data }) {
  return (
    <LineChart width={800} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="sales" stroke="#3b82f6" />
      <Line type="monotone" dataKey="profit" stroke="#10b981" />
    </LineChart>
  );
}
```

---

### Export Formats

#### PDF Export

Using ReportLab for Django:

```python
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph

def generate_sales_pdf(report_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    
    # Add title
    elements.append(Paragraph("Sales Summary Report", styles['Title']))
    
    # Add table
    table_data = [['Date', 'Sales', 'Profit', 'Transactions']]
    for row in report_data['daily_data']:
        table_data.append([row['date'], row['sales'], row['profit'], row['count']])
    
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(table)
    
    doc.build(elements)
    return buffer.getvalue()
```

#### Excel Export

Using openpyxl:

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

def generate_sales_excel(report_data):
    wb = Workbook()
    ws = wb.active
    ws.title = "Sales Summary"
    
    # Headers
    headers = ['Date', 'Sales', 'Profit', 'Transactions']
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = Font(bold=True)
        cell.fill = PatternFill(start_color="3b82f6", fill_type="solid")
    
    # Data
    for row_num, row in enumerate(report_data['daily_data'], 2):
        ws.cell(row=row_num, column=1, value=row['date'])
        ws.cell(row=row_num, column=2, value=row['sales'])
        ws.cell(row=row_num, column=3, value=row['profit'])
        ws.cell(row=row_num, column=4, value=row['count'])
    
    buffer = BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
```

#### CSV Export

```python
import csv
from io import StringIO

def generate_sales_csv(report_data):
    output = StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Date', 'Sales', 'Profit', 'Transactions'])
    for row in report_data['daily_data']:
        writer.writerow([row['date'], row['sales'], row['profit'], row['count']])
    
    return output.getvalue()
```

---

### Report API Response Headers

```python
# PDF
response = HttpResponse(pdf_content, content_type='application/pdf')
response['Content-Disposition'] = 'attachment; filename="sales_report.pdf"'

# Excel
response = HttpResponse(excel_content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
response['Content-Disposition'] = 'attachment; filename="sales_report.xlsx"'

# CSV
response = HttpResponse(csv_content, content_type='text/csv')
response['Content-Disposition'] = 'attachment; filename="sales_report.csv"'
```

---

## Next Phase

→ [Phase 7 - AI Features](./07-phase-7-ai.md)
