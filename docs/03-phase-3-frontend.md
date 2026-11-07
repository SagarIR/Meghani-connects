# Phase 3 – Frontend Folder Structure

## Objective

Organize Next.js frontend with App Router, reusable components, and API integration.

---

## Directory Structure

```
frontend/
│
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local
│
├── public/                   → Static assets
│   ├── logo.png
│   ├── favicon.ico
│   └── icons/
│
├── src/
│   ├── app/                  → Next.js App Router
│   │   ├── layout.tsx        → Root layout
│   │   ├── page.tsx          → Dashboard (home)
│   │   ├── globals.css       → Global styles
│   │   │
│   │   ├── (auth)/           → Auth group (no sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/      → Dashboard group (with sidebar)
│   │   │   ├── layout.tsx    → Dashboard layout with sidebar
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── sales/
│   │   │   │   ├── page.tsx  → POS System
│   │   │   │   └── history/
│   │   │   │       └── page.tsx
│   │   │   ├── repairs/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/              → API routes (if needed)
│   │       └── auth/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── PageWrapper.tsx
│   │   │
│   │   ├── ui/               → Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   └── Loading.tsx
│   │   │
│   │   ├── charts/
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── AreaChart.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── ProductForm.tsx
│   │   │   ├── RepairForm.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── ExpenseForm.tsx
│   │   │
│   │   └── features/
│   │       ├── pos/
│   │       │   ├── POSCart.tsx
│   │       │   ├── ProductSearch.tsx
│   │       │   └── PaymentModal.tsx
│   │       ├── dashboard/
│   │       │   ├── StatsCard.tsx
│   │       │   ├── RecentSales.tsx
│   │       │   └── RepairQueue.tsx
│   │       └── reports/
│   │           ├── SalesReport.tsx
│   │           └── ExpenseReport.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── services/
│   │   ├── api.ts            → Axios instance
│   │   ├── auth.service.ts
│   │   ├── products.service.ts
│   │   ├── sales.service.ts
│   │   ├── repairs.service.ts
│   │   ├── customers.service.ts
│   │   ├── expenses.service.ts
│   │   └── reports.service.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── sale.ts
│   │   ├── repair.ts
│   │   └── customer.ts
│   │
│   ├── lib/
│   │   ├── utils.ts          → Helper functions
│   │   ├── constants.ts      → App constants
│   │   └── validations.ts    → Yup schemas
│   │
│   └── styles/
│       └── globals.css
│
└── .env.local
```

---

## Environment Variables (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=Meghani Connect 360
```

---

## Key Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview with charts & stats |
| `/login` | Login | User authentication |
| `/products` | Products | Product listing with search |
| `/products/new` | Add Product | Product creation form |
| `/products/[id]` | Edit Product | Product edit form |
| `/sales` | POS | Point of Sale interface |
| `/sales/history` | Sales History | Past transactions |
| `/repairs` | Repairs | Repair jobs listing |
| `/repairs/new` | New Repair | Create repair job |
| `/customers` | Customers | CRM - Customer list |
| `/customers/[id]` | Customer Detail | Customer profile & history |
| `/expenses` | Expenses | Expense logging |
| `/reports` | Reports | Analytics & exports |
| `/settings` | Settings | User preferences & backup |

---

## package.json Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "axios": "^1.6",
    "react-hook-form": "^7.49",
    "@hookform/resolvers": "^3.3",
    "yup": "^1.3",
    "recharts": "^2.10",
    "lucide-react": "^0.300",
    "date-fns": "^3.0",
    "react-hot-toast": "^2.4",
    "jspdf": "^2.5",
    "xlsx": "^0.18"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "tailwindcss": "^3.4",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

---

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          500: '#6366f1',
        },
      },
    },
  },
  plugins: [],
}
```

---

## Next Phase

→ [Phase 4 - Database Schema](./04-phase-4-database.md)
