# Meghani Connect 360 – Roadmap Reconciliation & Documentation Conflict Audit

**Role:** Principal Software Architect, Documentation Auditor & Technical Project Manager  
**Ecosystem:** Meghani Watch Co. (Public Boutique) | Saff (Staff) Portal | Meghani Connect 360 (Django DRF ERP/POS)  
**Date of Audit:** November 17, 2026  
**Document Location:** `docs/audits/PROJECT_RECONCILIATION_REPORT.md`  
**Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](../PROJECT_EXECUTION_TRACKER.md)  
**Architecture Reference:** [ARCHITECTURE_REPORT.md](../architecture/ARCHITECTURE_REPORT.md)  

---

## 1. Executive Summary

This report establishes the definitive technical reconciliation between the original eight-phase architectural roadmap ([00-overview.md](../00-overview.md)) and the chronological **Order 1–7 Implementation Sequence** utilized during iterative system development.

It also resolves documentation conflicts, catalogs duplicated specifications, identifies orphaned dead code, and provides binding recommendations for the engineering team and AI development agents.

---

## 2. Roadmap Reconciliation: Mapping Orders 1–7 to Technical Phases 1–8

The project documentation contains two structural representations of progress:
1. **The 8-Phase Technical Roadmap:** Architectural breakdown by system layers (Foundations, Backend, Frontend, Database, Modules, Reports, AI, Deployment).
2. **The Order 1–7 Implementation Sequence:** Chronological development milestones executed across git history.

The table below reconciles these two views into a unified execution framework without scope changes or duplicate effort:

| Implementation Order | Focus & Scope | Mapped Technical Phase(s) | Delivered Artifacts in Codebase | Reconciliation Status |
|:---|:---|:---|:---|:---:|
| **Order 1: Project Foundations & Environment** | Repository initialization, Django backend scaffolding, Next.js 14 client, CORS, base JWT settings. | **Phase 1 (Setup)**<br>[01-phase-1-setup.md](../01-phase-1-setup.md) | `backend/core/`, `frontend/package.json`, `.gitignore`, `backend/requirements.txt`. | **Reconciled & Complete** |
| **Order 2: Backend Architecture & Data Schema** | Modular Django apps, PostgreSQL/SQLite ORM models, migrations, serializers, and DRF ViewSets. | **Phase 2 (Backend Structure)** & **Phase 4 (Database Schema)**<br>[02-phase-2-backend.md](../02-phase-2-backend.md)<br>[04-phase-4-database.md](../04-phase-4-database.md) | 9 Django apps in `backend/apps/`, database models, 30 passing automated tests. | **Reconciled & Complete** |
| **Order 3: Point of Sale & Inventory Engine** | High-speed barcode scanning, cart calculation, atomic checkout (`@transaction.atomic`), thermal receipts, product CRUD. | **Phase 3 (Frontend Structure)** & **Phase 5 (Modules: POS & Inventory)**<br>[03-phase-3-frontend.md](../03-phase-3-frontend.md)<br>[05-phase-5-modules.md](../05-phase-5-modules.md) | `frontend/src/app/(dashboard)/sales/`, `products/`, `Invoice.tsx`, `ProductViewSet`, `SaleViewSet`. | **Reconciled & Complete** |
| **Order 4: Service Atelier & Customer CRM** | Watch repair intake tickets (`REP-YYYYMMDD-XXXX`), 5-stage status workflow, automated WhatsApp notification on "ready", loyalty point accrual/redemption. | **Phase 5 (Modules: Repairs & CRM)**<br>[05-phase-5-modules.md](../05-phase-5-modules.md) | `frontend/src/app/(dashboard)/repairs/`, `customers/`, `RepairViewSet`, `CustomerViewSet`, Twilio service. | **Reconciled & Complete** |
| **Order 5: Financial Operations, Expenses & Reporting** | Operating expense tracking with receipt upload, Net Profit aggregation, multi-format exports (CSV, Excel, PDF), ReportLab invoices. | **Phase 5 (Expenses)** & **Phase 6 (Reports & Visualization)**<br>[05-phase-5-modules.md](../05-phase-5-modules.md)<br>[06-phase-6-reports.md](../06-phase-6-reports.md) | `frontend/src/app/(dashboard)/expenses/`, `reports/`, `ExpenseViewSet`, `ReportExportView`, ReportLab engine. | **Reconciled & Complete** |
| **Order 6: AI Analytics & Background Automation** | Facebook Prophet 30-day sales forecasting, inventory stockout velocity predictor, Celery 5.3 + Redis task queue. | **Phase 7 (AI Automation Features)**<br>[07-phase-7-ai.md](../07-phase-7-ai.md) | `apps/analytics/services/forecasting.py`, `tasks.py`, `backend/core/celery.py`, `AIInsights.tsx`. | **Reconciled (Bug Fix Required in Tasks)** |
| **Order 7: Public Luxury Boutique, SEO & Production Deployment** | Customer-facing luxury showroom (`/(public)`), price shielding, Vadodara boutique coordinates, JSON-LD schemas, Website CMS, Docker configs. | **Phase 8 (Deployment)** + Public Storefront Extension<br>[08-phase-8-deployment.md](../08-phase-8-deployment.md) | `frontend/src/app/(public)/*`, `website-cms/`, `docker-compose.yml`, `sitemap.ts`, `robots.ts`. | **Reconciled (Hosting Verification Pending)** |

---

## 3. Comprehensive Documentation & Codebase Conflict Audit

### Conflict 1: The MERN Stack Documentation Divergence
* **Conflicting Documents:** `mern-docs/` (9 files) versus `docs/` (8 Phase files).
* **Description:** `mern-docs/` describes a JavaScript-only MERN architecture using Node.js, Express.js, MongoDB (Mongoose), and TensorFlow.js/Brain.js. In contrast, `docs/` specifies Python 3.11+, Django 4.2 LTS REST Framework, PostgreSQL, and Facebook Prophet.
* **Codebase Verification:** The repository contains zero Node.js backend files, zero Express routes, and zero MongoDB connections. The implementation is 100% Django REST Framework and Next.js 14.
* **Authoritative Ruling:** The Python/Django architecture defined in [docs/](../00-overview.md) is the sole authoritative standard. `mern-docs/` is moved to `docs/archive/legacy/mern-docs/` as **SUPERSEDED / HISTORICAL REFERENCE ONLY**.

### Conflict 2: "Saff Portal" Nomenclature
* **Conflicting Interpretations:** Ambiguity existed whether "Saff Portal" was a separate third-party repository, an external client, or an internal portal.
* **Codebase Verification:** Traced through git logs (`commit c370f2c`, `commit 58578de`), Next.js route groups (`/(dashboard)` and `/(auth)`), and `ARCHITECTURE_REPORT.md`. Confirmed as the in-house **Staff Portal** (referred to phonetically/regionally as "Saff Portal") serving store cashiers, sales personnel, repair watchmakers, and managers.
* **Authoritative Ruling:** "Saff Portal" refers specifically to the Next.js `(dashboard)` and `(auth)` application routes communicating with Meghani Connect 360 backend.

### Conflict 3: API Endpoint Contract Mismatches
1. **User Password Change (404 Error):**
   * *Frontend Call:* `POST /api/users/change-password/` (hyphenated) in [settings/page.tsx](../../frontend/src/app/(dashboard)/settings/page.tsx).
   * *Backend Route:* DefaultRouter registers `@action(detail=False, methods=['post']) def change_password` as `/api/users/change_password/` (underscored) in [apps/users/views.py](../../backend/apps/users/views.py).
   * *Resolution:* Add `url_path='change-password'` to the `@action` decorator in `backend/apps/users/views.py`.
2. **Customer Bulk Import (Missing Endpoint):**
   * *Frontend Call:* [BulkImport.tsx](../../frontend/src/components/features/BulkImport.tsx) offers "Customer Import" dispatching to `/customers/import/`.
   * *Backend Route:* No such endpoint exists in `apps/crm/urls.py`.
   * *Resolution:* Either implement `CustomerImportView` in `apps/crm/` or remove the customer tab from `BulkImport.tsx`.

### Conflict 4: Security & Privilege Escalation (Unapplied RBAC)
* **Location:** [backend/apps/users/permissions.py](../../backend/apps/users/permissions.py) vs [views.py](../../backend/apps/users/views.py).
* **Description:** Highly granular custom permission classes (`CanManageUsers`, `CanManageProducts`, `CanManageSales`, `CanManageRepairs`, `CanViewReports`) were authored. However, they were not applied to `UserViewSet`, `ProductViewSet`, or `SaleViewSet`. Because `DEFAULT_PERMISSION_CLASSES` is `IsAuthenticated`, any logged-in staff member can list, create, edit, or delete users and financial records.
* **Role Hierarchy Discrepancy:** `users/models.py` defines `ROLE_CHOICES = [('admin', 'Admin'), ('staff', 'Staff')]`, whereas `permissions.py` references four roles (`admin`, `manager`, `staff`, `viewer`).
* **Authoritative Ruling:**
  1. Synchronize `ROLE_CHOICES` in `apps/users/models.py` with `permissions.py`.
  2. Explicitly attach `permission_classes = [CanManageUsers]` to `UserViewSet`, `[CanManageProducts]` to `ProductViewSet`, and `[CanManageSales]` to `SaleViewSet`.

### Conflict 5: Celery Beat Model Field Mismatch
* **Location:** [backend/apps/analytics/tasks.py](../../backend/apps/analytics/tasks.py).
* **Description:** Background cron jobs for birthday greetings and warranty expiration instantiate `Notification.objects.create(..., notification_type='whatsapp', template_name=...)`. The `Notification` model defines `type` (not `notification_type`) and does not possess a `template_name` column. This raises a fatal `TypeError` at runtime.
* **Authoritative Ruling:** Update `tasks.py` kwargs to `type='whatsapp'` and remove `template_name`.

### Conflict 6: Missing Razorpay Implementation
* **Description:** Razorpay is listed in `backend/requirements.txt` and `backend/core/settings.py` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`). However, zero endpoint, view, or frontend payment trigger exists in the codebase.
* **Authoritative Ruling:** Razorpay is classified as **NOT STARTED / MISSING**. The in-store POS functions via cash, card, and UPI recording. If online customer prepayment or boutique reservation deposits are needed, a dedicated Razorpay order creation endpoint and webhook receiver must be constructed.

---

## 4. Technical Debt & Dead Code Inventory

| Category | File Path | Findings & Recommendation |
|:---|:---|:---|
| **Backend Dead Code** | `backend/common/` | Contains `exceptions.py`, `pagination.py`, `permissions.py`, and `utils.py`. Has 0 imports across the backend; superseded by `apps.core` and `apps.users`. Safely delete or archive. |
| **Frontend Dead Component**| `frontend/src/components/layout/Header.tsx` | Unused. Header was implemented directly inside `app/(dashboard)/layout.tsx`. |
| **Frontend Dead Component**| `frontend/src/components/print/InvoiceTemplate.tsx`| Unused. Duplicate component created alongside active `Invoice.tsx`. |
| **Frontend Dead Component**| `frontend/src/components/ui/BulkActionsBar.tsx` | Unused. 0 imports across the codebase. |
| **Frontend Dead Hook** | `frontend/src/hooks/useBulkSelection.ts` | Unused. 0 imports across the codebase. |
| **Frontend Dead Component**| `frontend/src/components/ui/FormField.tsx` | Unused. Forms use direct inputs or Tailwind field groups. |
| **Frontend Dead Component**| `frontend/src/components/ui/LoadingSpinner.tsx` | Unused. Only references itself recursively; pages use inline skeleton loaders. |
| **Twilio SMS Config Gap** | `backend/core/settings.py` | `TWILIO_SMS_NUMBER` is missing from `settings.py`, causing `apps/notifications/services/sms.py` to fail. |

---

## 5. Authoritative Recommendations & Action Order

To maintain stability and enable clean forward development, work should proceed in this verified sequence:

1. **Security & Defect Remediation (Immediate):**
   - Attach `CanManageUsers` to `UserViewSet` and role-specific permissions to `ProductViewSet` and `SaleViewSet`.
   - Fix URL pattern in `UserViewSet.change_password` by adding `url_path='change-password'`.
   - Fix keyword arguments in `apps/analytics/tasks.py` (`type='whatsapp'`).
   - Add `TWILIO_SMS_NUMBER = os.getenv('TWILIO_SMS_NUMBER')` in `backend/core/settings.py`.
2. **Business Data Dynamic Resolution:**
   - Connect ReportLab invoice generation in `apps/sales/invoice.py` to `BusinessSettings.get_settings()`.
3. **Dead Code Elimination:**
   - Remove orphaned components (`backend/common/`, `InvoiceTemplate.tsx`, `Header.tsx`, `BulkActionsBar.tsx`, `FormField.tsx`, `LoadingSpinner.tsx`, `useBulkSelection.ts`).
4. **Production Deployment Verification:**
   - Connect to live production PostgreSQL and verify Docker Compose / Cloud hosting.
