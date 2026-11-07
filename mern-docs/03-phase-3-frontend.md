# Phase 3 – Frontend Folder Structure (MERN)

## Objective

Organize React + Vite frontend with component architecture, hooks, and API integration.

---

## Directory Structure

```
frontend/
│
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env
│
├── public/
│   ├── logo.png
│   ├── favicon.ico
│   └── icons/
│
└── src/
    ├── main.jsx              → Entry point
    ├── App.jsx               → Root component with routes
    ├── index.css             → Global styles (Tailwind)
    │
    ├── pages/
    │   ├── Dashboard.jsx     → Home dashboard
    │   ├── Login.jsx         → Login page
    │   ├── Products/
    │   │   ├── ProductList.jsx
    │   │   ├── ProductForm.jsx
    │   │   └── ProductDetail.jsx
    │   ├── Sales/
    │   │   ├── POS.jsx       → Point of Sale
    │   │   └── SalesHistory.jsx
    │   ├── Repairs/
    │   │   ├── RepairList.jsx
    │   │   ├── RepairForm.jsx
    │   │   └── RepairDetail.jsx
    │   ├── Customers/
    │   │   ├── CustomerList.jsx
    │   │   └── CustomerDetail.jsx
    │   ├── Expenses/
    │   │   └── ExpenseList.jsx
    │   ├── Reports/
    │   │   └── Reports.jsx
    │   └── Settings/
    │       └── Settings.jsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.jsx    → Main layout wrapper
    │   │   ├── Sidebar.jsx   → Navigation sidebar
    │   │   ├── Header.jsx    → Top header bar
    │   │   └── PrivateRoute.jsx → Auth route wrapper
    │   │
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Select.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Table.jsx
    │   │   ├── Card.jsx
    │   │   ├── Badge.jsx
    │   │   ├── Dropdown.jsx
    │   │   ├── Loading.jsx
    │   │   ├── Pagination.jsx
    │   │   └── SearchInput.jsx
    │   │
    │   ├── charts/
    │   │   ├── LineChart.jsx
    │   │   ├── BarChart.jsx
    │   │   ├── PieChart.jsx
    │   │   └── AreaChart.jsx
    │   │
    │   ├── forms/
    │   │   ├── ProductForm.jsx
    │   │   ├── RepairForm.jsx
    │   │   ├── CustomerForm.jsx
    │   │   └── ExpenseForm.jsx
    │   │
    │   └── features/
    │       ├── pos/
    │       │   ├── Cart.jsx
    │       │   ├── ProductSearch.jsx
    │       │   ├── CartItem.jsx
    │       │   └── PaymentModal.jsx
    │       ├── dashboard/
    │       │   ├── StatsCard.jsx
    │       │   ├── RecentSales.jsx
    │       │   ├── RepairQueue.jsx
    │       │   └── AIInsights.jsx
    │       └── reports/
    │           ├── SalesReport.jsx
    │           ├── ExpenseReport.jsx
    │           └── ExportButtons.jsx
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useFetch.js
    │   ├── useDebounce.js
    │   ├── useLocalStorage.js
    │   └── useCart.js
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── CartContext.jsx
    │   └── ThemeContext.jsx
    │
    ├── services/
    │   ├── api.js            → Axios instance
    │   ├── auth.service.js
    │   ├── products.service.js
    │   ├── sales.service.js
    │   ├── repairs.service.js
    │   ├── customers.service.js
    │   ├── expenses.service.js
    │   └── reports.service.js
    │
    ├── lib/
    │   ├── utils.js          → Helper functions
    │   ├── constants.js      → App constants
    │   └── validations.js    → Yup schemas
    │
    └── types/
        └── index.js          → JSDoc type definitions
```

---

## Environment Variables (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Meghani Connect 360
```

---

## Core Files

### main.jsx

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

### App.jsx

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/layout/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Products/ProductList';
import ProductForm from './pages/Products/ProductForm';
import POS from './pages/Sales/POS';
import SalesHistory from './pages/Sales/SalesHistory';
import RepairList from './pages/Repairs/RepairList';
import RepairForm from './pages/Repairs/RepairForm';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import ExpenseList from './pages/Expenses/ExpenseList';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          
          {/* Products */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductForm />} />
          
          {/* Sales */}
          <Route path="/sales" element={<POS />} />
          <Route path="/sales/history" element={<SalesHistory />} />
          
          {/* Repairs */}
          <Route path="/repairs" element={<RepairList />} />
          <Route path="/repairs/new" element={<RepairForm />} />
          <Route path="/repairs/:id" element={<RepairForm />} />
          
          {/* Customers */}
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          
          {/* Expenses */}
          <Route path="/expenses" element={<ExpenseList />} />
          
          {/* Reports */}
          <Route path="/reports" element={<Reports />} />
          
          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
```

---

### services/api.js

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### context/AuthContext.jsx

```jsx
import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

### context/CartContext.jsx

```jsx
import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null);

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setCustomer(null);
  };

  const total = items.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        customer,
        setCustomer,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
```

---

### components/layout/Layout.jsx

```jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
```

---

### components/layout/Sidebar.jsx

```jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wrench,
  Users,
  Receipt,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: ShoppingCart, label: 'Sales (POS)', path: '/sales' },
  { icon: Wrench, label: 'Repairs', path: '/repairs' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Meghani Connect</h1>
      </div>
      <nav className="mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${
                isActive ? 'bg-gray-800 border-l-4 border-blue-500' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
```

---

### components/ui/Button.jsx

```jsx
const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}) => {
  return (
    <button
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4\" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
```

---

## package.json

```json
{
  "name": "meghani-connect-ui",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.2",
    "@tanstack/react-query": "^5.14.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.2",
    "yup": "^1.3.2",
    "recharts": "^2.10.3",
    "lucide-react": "^0.300.0",
    "react-hot-toast": "^2.4.1",
    "date-fns": "^3.0.6",
    "jspdf": "^2.5.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.10",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## Next Phase

→ [Phase 4 - Database Schema](./04-phase-4-database.md)
