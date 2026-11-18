# Meghani Connect 360 – Luxury Retail ERP/POS UI/UX Design System

**Document Version:** 1.0.0  
**Effective Date:** November 18, 2026  
**Target Applications:** Meghani Watch Co. In-Store ERP/POS Staff Portal (`/(dashboard)` & `/(auth)` routes)  
**Author:** Principal Product Designer & Frontend Engineering Lead  

---

## 1. Executive Summary & Design Vision

Meghani Connect 360 serves **Meghani Watch Co. (Est. 1984, Vadodara, Gujarat)**, a premier luxury horology boutique dealing in haute horlogerie, vintage collectible timepieces, precision repair atelier services, and high-net-worth client relations.

The design philosophy transcends generic SaaS and administrative templates by establishing a bespoke **Haute Horlogerie Operations Desk**:
- **Aesthetic:** Dark luxury salon aesthetic inspired by boutique showcases, Swiss horology workshops, and brushed gold watch movements.
- **Tone:** Refined, restrained, dignified, and tactile.
- **Ergonomics:** Designed for high-speed, zero-friction POS checkout during peak boutique traffic, keyboard-wedge barcode scanning (<120ms), quick split payments, and instant client CRM lookup.
- **Security & Privacy:** Built-in Role-Based Access Control (RBAC) ensuring sensitive cost prices, supplier wholesale margins, and management actions are strictly masked for front-desk sales staff.

---

## 2. Design Tokens & Color Palette

### 2.1 Core Palette

| Token | Hex Value | Semantic Role | Tailwind Utility Class |
|:---|:---:|:---|:---|
| **Midnight Black** | `#0B0B0A` | Deepest root canvas, page background | `bg-[#0B0B0A]` / `bg-boutique-midnight` |
| **Charcoal Surface** | `#171613` | Primary cards, table bodies, modal containers | `bg-[#171613]` / `bg-boutique-charcoal` |
| **Elevated Dark** | `#1F1E1A` | Hover states, pill badges, nested matrix containers | `bg-[#1F1E1A]` / `bg-boutique-elevated` |
| **Deep Canvas** | `#12110F` | Input fields, search bars, textarea backgrounds | `bg-[#12110F]` |
| **Boutique Border** | `#2A261F` | Subtle borders, table dividers, card boundaries | `border-[#2A261F]` / `border-boutique-border` |
| **Border Active** | `#3D382E` | Hovered borders, active pill outlines | `border-[#3D382E]` |
| **Champagne Gold** | `#C9A45C` | Primary brand accent, CTA buttons, active indicators | `text-[#C9A45C]`, `bg-[#C9A45C]` |
| **Soft Gold** | `#E8D5A7` | Secondary accent, highlight numbers, badge fills | `text-[#E8D5A7]` |
| **Warm Ivory** | `#F3EFE6` | Primary headings, prominent numerals, high-contrast text | `text-[#F3EFE6]` / `text-boutique-ivory` |
| **Muted Grey** | `#8D8980` | Secondary labels, timestamps, metadata captions | `text-[#8D8980]` / `text-boutique-muted` |

### 2.2 Functional & Status Accents

| State | Background | Border | Text | Context |
|:---|:---|:---|:---|:---|
| **Gold / Luxury** | `rgba(201, 164, 92, 0.12)` | `#C9A45C`/40 | `#E8D5A7` | Platinum/Gold loyalty, active routes, key metrics |
| **Emerald / Success** | `rgba(16, 185, 129, 0.12)` | `rgba(16, 185, 129, 0.3)` | `#34D399` | In-stock, paid invoices, delivered repairs, revenue gain |
| **Amber / Warning** | `rgba(245, 158, 11, 0.12)` | `rgba(245, 158, 11, 0.3)` | `#FBBF24` | Low stock, pending collection, partial split balance |
| **Rose / Danger** | `rgba(239, 68, 68, 0.12)` | `rgba(239, 68, 68, 0.3)` | `#F87171` | Out of stock, cancelled jobs, overdue invoices, destructive actions |
| **Cyan / Information** | `rgba(6, 182, 212, 0.12)` | `rgba(6, 182, 212, 0.3)` | `#22D3EE` | Intake logged, inquiry leads, system notifications |

---

## 3. Typography Architecture

- **Primary Headings & Display:** `Cormorant Garamond`, `Playfair Display`, serif.  
  Used for executive page titles, luxury timepiece titles, milestone numbers, and module headers. Conveys heritage and horological prestige.
- **Interface, Controls & Body Text:** `Inter`, sans-serif.  
  Used for UI controls, inputs, data tables, metadata, status badges, and body copy. Ensures high legibility and operational clarity under varied lighting.
- **Financial & Numeric Figures:** `JetBrains Mono` / Tabular Numerals.  
  Monospace alignment for currency values (`₹1,24,500`), barcode strings (`MWC-RLX-SUB-01`), invoice reference numbers (`INV-20261118-0042`), and repair docket identifiers.

---

## 4. Reusable Standardized Component Library

### 4.1 Button (`src/components/ui/Button.tsx`)
- **Variants:**
  - `primary`: Linear gradient `from-[#C9A45C] to-[#B38E46]`, text `#0B0B0A`, font-semibold.
  - `secondary`: Deep charcoal surface `#171613`, border `#2A261F`, hover border `#C9A45C`, text `#F3EFE6`.
  - `outline`: Transparent with gold border `#C9A45C`, text `#C9A45C`, hover background `#C9A45C`/10.
  - `ghost`: Transparent with text `#8D8980`, hover text `#F3EFE6`, hover background `#1F1E1A`.
  - `danger`: Dark crimson background `rgba(239, 68, 68, 0.15)`, border `rgba(239, 68, 68, 0.35)`, text `#F87171`.
  - `success`: Dark emerald background `rgba(16, 185, 129, 0.15)`, border `rgba(16, 185, 129, 0.35)`, text `#34D399`.
  - `luxury`: Champagne gold border, warm ivory text, subtle gold glow on hover.
- **Sizes:** `xs`, `sm`, `md`, `lg`. Supports `isLoading` state with animated spinning ring.

### 4.2 Badge (`src/components/ui/Badge.tsx`)
- Pill-shaped indicator with subtle translucent backgrounds and crisp 1px borders.
- Supported variants: `default`, `primary`, `secondary`, `success`, `warning`, `danger`, `info`, `gold`.

### 4.3 Input & Form Controls (`src/components/ui/Input.tsx`)
- Background: `#12110F` (Deep Canvas).
- Border: `#2A261F`, transitioning to `#C9A45C` with `ring-1 ring-[#C9A45C]/40` on focus.
- Text: `#F3EFE6`, Placeholder: `#5A564E`.
- Label: `#8D8980` with optional required asterisk. Error message rendered in `#F87171`.

### 4.4 Modal & Confirmation Dialogs (`src/components/ui/Modal.tsx`)
- Backdrop: `rgba(0, 0, 0, 0.85)` with backdrop blur `backdrop-blur-sm`.
- Container: Charcoal `#171613`, border `#2A261F`, shadow-2xl.
- Sizes: `sm`, `md`, `lg`, `xl`, `full`.
- Accessible dismiss via Escape key or backdrop click. Includes standardized `ConfirmModal` for destructive actions.

### 4.5 Data Presentation & Navigation Tools
- **ExportButton (`src/components/ui/ExportButton.tsx`):** Luxury dropdown supporting instant Excel (.xlsx) and CSV exports with loading indicator.
- **BulkImport (`src/components/features/BulkImport.tsx`):** Drag-and-drop file dropzone with sample template download, validation error reporting, and batch progress tracking.
- **SortableHeader (`src/components/ui/SortableHeader.tsx`):** Interactive table column headers with ascending/descending gold arrow indicators.
- **Pagination (`src/components/ui/Pagination.tsx`):** Accessible page switcher with item count summaries and gold active page pills.
- **GlobalSearch (`src/components/ui/GlobalSearch.tsx`):** Spotlight-style command palette modal triggered by `/` or top bar search.
- **KeyboardShortcutsModal (`src/components/ui/KeyboardShortcutsModal.tsx`):** Boutique desk cheat-sheet modal triggered by `?` or top bar icon.

---

## 5. Application Shell Architecture

### 5.1 Collapsible Sidebar (`src/components/layout/Sidebar.tsx`)
- Structured into three distinct operational domains:
  1. **Operations Desk:** Dashboard, Point of Sale, Product Catalog, Sales History, Repair Atelier.
  2. **Clientele & Finance:** Customer CRM, Operating Expenses, Reports & Analytics.
  3. **Digital & Admin:** Website CMS, System Settings, Dispatch Desk.
- Highlights active route with Champagne Gold left accent border and soft gold background.
- Bottom footer contains authenticated staff profile card showing user initials, username, and role badge (`ADMIN`, `MANAGER`, `STAFF`, `VIEWER`).

### 5.2 Command Header (`src/components/layout/Header.tsx`)
- Dynamic route breadcrumbs with serif current page indicator.
- Live register status badge ("REGISTER ACTIVE • READY").
- High-visibility "POS Checkout" quick launcher button with barcode icon.
- Global Search launcher (`/`) and Shortcuts cheat sheet (`?`).
- Staff dropdown menu with direct links to profile, security, and one-click logout.

---

## 6. Role-Based Access Control (RBAC) UI Implementation

Sensitive operational and financial data is strictly gated according to user role:

| Module / Data Element | Admin / Manager | Sales Staff / Viewer |
|:---|:---:|:---:|
| **Product Cost Price (Wholesale)** | Full numeric visibility | Displayed as `Confidential` or `Masked` |
| **Gross Margin / Profit Metrics** | Unrestricted access | Masked as `Confidential` |
| **Inventory Valuation (Cost Basis)** | Full report access | Blocked / Masked |
| **Financial P&L Statements** | Full report access | Blocked / Masked |
| **Delete Product / Expense / Record** | Enabled with confirmation | Disabled / Hidden |
| **User Role Management** | Full CRUD access | Hidden / Read-only self profile |

Implementation Pattern:
```tsx
const { user } = useAuth();
const isManagement = user?.role === 'admin' || user?.role === 'manager';

// Example UI rendering:
<span className="font-mono text-xs text-[#8D8980]">
  Cost: {isManagement ? formatCurrency(product.cost_price) : 'Confidential'}
</span>
```

---

## 7. Responsiveness & Device Adaptations

- **Desktop ($\ge 1280\text{px}$):** Full persistent sidebar, multi-column split views, comprehensive data tables with inline actions.
- **Laptop / Tablet ($768\text{px} - 1279\text{px}$):** Collapsible sidebar, horizontal scroll-safe tables, adaptive KPI 2x2 grids.
- **Mobile Handheld ($< 768\text{px}$):** Off-canvas slide-out sidebar drawer, full-width touch-friendly POS checkout buttons, single-column KPI stacks, and modal-based dossier views.
