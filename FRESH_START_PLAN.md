# Fresh Start: React + Vite + TypeScript + Tailwind + Zustand
## Complete Implementation Plan for Elka Invoice Management System

**Date:** 2025-11-16
**Strategy:** Build from scratch (not migration)
**Timeline:** 2-3 weeks
**Status:** Ready to implement

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Setup](#project-setup)
3. [Architecture Design](#architecture-design)
4. [TypeScript Types & Interfaces](#typescript-types--interfaces)
5. [Zustand Store Structure](#zustand-store-structure)
6. [Component Hierarchy](#component-hierarchy)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Development Workflow](#development-workflow)

---

## Executive Summary

### Why Fresh Start is Better

| Aspect | Migration | Fresh Start |
|--------|-----------|-------------|
| **Timeline** | 4-6 weeks | 2-3 weeks ⚡ |
| **Code Quality** | Carries tech debt | Clean from day 1 ✅ |
| **TypeScript** | Gradual adoption | 100% from start ✅ |
| **Testing** | Complex (old vs new) | Simple, focused ✅ |
| **Architecture** | Must maintain compat | Best practices ✅ |
| **Risk** | Higher (2 codebases) | Lower (1 codebase) ✅ |

### What We Keep
- ✅ Firebase project & configuration
- ✅ Firestore data (no changes)
- ✅ Storage files (no changes)
- ✅ Business logic understanding (from old code)
- ✅ UI/UX patterns (improve them)

### What We Build New
- ✅ React components (TypeScript)
- ✅ Zustand stores (type-safe)
- ✅ Tailwind styles (modern)
- ✅ Vite build (optimized)
- ✅ Testing suite (comprehensive)

---

## Project Setup

### Step 1: Initialize Vite Project

```bash
# Create new React + TypeScript project
npm create vite@latest elka-react -- --template react-ts

cd elka-react

# Install core dependencies
npm install
```

### Step 2: Install Dependencies

```bash
# Core
npm install react react-dom
npm install react-router-dom   # Routing
npm install zustand             # State management
npm install immer               # Immutable state updates

# Firebase
npm install firebase
npm install react-firebase-hooks # Firebase React hooks

# UI & Styling
npm install tailwindcss postcss autoprefixer
npm install clsx                # Conditional classes
npm install date-fns            # Date utilities
npm install lucide-react        # Icons

# PDF & Files
npm install pdf-lib             # PDF generation
npm install tesseract.js        # OCR (optional)
npm install cropperjs           # Image cropping (optional)

# Dev Dependencies
npm install -D @types/react @types/react-dom
npm install -D @vitejs/plugin-react
npm install -D typescript
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier prettier-plugin-tailwindcss
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
```

### Step 3: Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

**src/styles/globals.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* RTL Support */
* {
  direction: rtl;
}

/* Custom scrollbar (optional) */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

### Step 4: Configure TypeScript

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 5: Configure Vite

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': [
            'firebase/app',
            'firebase/firestore',
            'firebase/auth',
            'firebase/storage',
          ],
          'pdf-vendor': ['pdf-lib'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### Step 6: Set Up Firebase

**.env.example:**
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=elka-73bb6
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**src/lib/firebase/config.ts:**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

---

## Architecture Design

### Project Structure

```
elka-react/
├── public/
│   └── fonts/                   # Hebrew fonts
│
├── src/
│   ├── main.tsx                 # App entry point
│   ├── App.tsx                  # Root component
│   ├── vite-env.d.ts           # Vite types
│   │
│   ├── components/              # Reusable UI components
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   └── shared/
│   │       ├── ErrorBoundary.tsx
│   │       ├── ProtectedRoute.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── features/                # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── AuthGuard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── types.ts
│   │   │   └── authStore.ts
│   │   │
│   │   ├── clients/
│   │   │   ├── components/
│   │   │   │   ├── ClientsList.tsx
│   │   │   │   ├── ClientCard.tsx
│   │   │   │   ├── ClientForm.tsx
│   │   │   │   └── DeleteClientDialog.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useClients.ts
│   │   │   ├── types.ts
│   │   │   └── clientsStore.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── components/
│   │   │   │   ├── ProjectsList.tsx
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectForm.tsx
│   │   │   │   ├── ProjectDetails.tsx
│   │   │   │   ├── InvoiceForm.tsx
│   │   │   │   ├── InvoicesList.tsx
│   │   │   │   └── InvoiceCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useProjects.ts
│   │   │   │   └── useInvoices.ts
│   │   │   ├── types.ts
│   │   │   └── projectsStore.ts
│   │   │
│   │   ├── suppliers/
│   │   │   ├── components/
│   │   │   │   ├── SuppliersList.tsx
│   │   │   │   ├── SupplierCard.tsx
│   │   │   │   ├── SupplierForm.tsx
│   │   │   │   └── SupplierDocuments.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSuppliers.ts
│   │   │   ├── types.ts
│   │   │   └── suppliersStore.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── components/
│   │   │   │   ├── OrdersList.tsx
│   │   │   │   ├── OrderCard.tsx
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   └── OrderItemsTable.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useOrders.ts
│   │   │   ├── utils/
│   │   │   │   └── generateOrderPDF.ts
│   │   │   ├── types.ts
│   │   │   └── ordersStore.ts
│   │   │
│   │   ├── sidur/
│   │   │   ├── components/
│   │   │   │   ├── WorkCalendar.tsx
│   │   │   │   ├── WorkAssignmentForm.tsx
│   │   │   │   ├── WorkerExpensesCard.tsx
│   │   │   │   └── ProjectExpensesCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useWorkAssignments.ts
│   │   │   ├── types.ts
│   │   │   └── sidurStore.ts
│   │   │
│   │   └── settings/
│   │       ├── components/
│   │       │   ├── WorkerRatesForm.tsx
│   │       │   └── PDFTemplateUpload.tsx
│   │       ├── hooks/
│   │       │   └── useSettings.ts
│   │       ├── types.ts
│   │       └── settingsStore.ts
│   │
│   ├── lib/                     # Utilities
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── firestore.ts     # Firestore helpers
│   │   │   ├── storage.ts       # Storage helpers
│   │   │   └── auth.ts          # Auth helpers
│   │   │
│   │   ├── pdf/
│   │   │   ├── generator.ts     # PDF generation
│   │   │   ├── fonts.ts         # Hebrew fonts
│   │   │   └── templates.ts     # PDF templates
│   │   │
│   │   └── utils/
│   │       ├── date.ts          # Date formatting
│   │       ├── currency.ts      # Currency formatting
│   │       ├── calculations.ts  # Business calculations
│   │       └── validation.ts    # Form validation
│   │
│   ├── hooks/                   # Global hooks
│   │   ├── useFirebase.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   │
│   ├── store/                   # Global Zustand store
│   │   ├── index.ts             # Main store
│   │   └── slices/
│   │       └── uiSlice.ts       # UI state
│   │
│   ├── types/                   # Global types
│   │   ├── index.ts
│   │   ├── models.ts            # Data models
│   │   └── enums.ts             # Enums
│   │
│   ├── constants/               # Constants
│   │   ├── index.ts
│   │   ├── workers.ts
│   │   ├── categories.ts
│   │   ├── statuses.ts
│   │   └── units.ts
│   │
│   ├── styles/                  # Styles
│   │   ├── globals.css
│   │   └── rtl.css
│   │
│   └── pages/                   # Page components
│       ├── Dashboard.tsx
│       ├── ClientsPage.tsx
│       ├── ProjectsPage.tsx
│       ├── SuppliersPage.tsx
│       ├── OrdersPage.tsx
│       ├── SidurPage.tsx
│       ├── SettingsPage.tsx
│       └── NotFoundPage.tsx
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## TypeScript Types & Interfaces

**src/types/models.ts:**
```typescript
import { Timestamp } from 'firebase/firestore';

// ===== CLIENT =====
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Timestamp;
  userId: string;
}

export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'userId'>;

// ===== PROJECT =====
export type ProjectStatus =
  | 'פתוח'      // Open
  | 'אומדן'     // Estimate
  | 'הזמנה'     // Order
  | 'בביצוע'    // In Progress
  | 'חשבון'     // Invoice
  | 'לתשלום'    // For Payment
  | 'שולם';     // Paid

export interface Project {
  id: string;
  clientId: string;
  name: string;
  revenue: number;
  status: ProjectStatus;
  description?: string;
  activeInSchedule: boolean;
  createdAt: Timestamp;
  userId: string;
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'userId'>;

export interface ProjectWithCalculations extends Project {
  calculations: ProjectCalculations;
}

export interface ProjectCalculations {
  totalExpenses: number;
  ordersExpenses: number;
  workerExpenses: number;
  profit: number;
  profitMargin: number;
}

// ===== INVOICE =====
export type Category =
  | 'בטון ומוצריו'
  | 'כבלים'
  | 'כלים כבדים'
  | 'נותני שירות'
  | 'עמודים'
  | 'פנסים'
  | 'צינורות'
  | 'קבלני משנה'
  | 'שונות';

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  clientId: string;
  supplier: string;
  invoiceNumber?: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: Category;
  attachments: Attachment[];
  createdAt: Timestamp;
  userId: string;
}

export type InvoiceInput = Omit<Invoice, 'id' | 'createdAt' | 'userId' | 'attachments'>;

export interface InvoiceFormData {
  supplier: string;
  invoiceNumber?: string;
  date: string;
  items: InvoiceItemInput[];
  files: File[];
}

export interface InvoiceItemInput {
  description: string;
  amount: number;
  category: Category;
}

// ===== SUPPLIER =====
export interface SupplierDocument {
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  paymentConditions?: string;
  documents: SupplierDocument[];
  createdAt: Timestamp;
  userId: string;
}

export type SupplierInput = Omit<Supplier, 'id' | 'createdAt' | 'userId' | 'documents'>;

// ===== ORDER =====
export type Unit =
  | 'יח\''
  | 'מטר'
  | 'מ"ר'
  | 'מ"ק'
  | 'ק"ג'
  | 'טון'
  | 'שעה'
  | 'יום'
  | 'קומפלט';

export interface OrderItem {
  description: string;
  unit: Unit;
  quantity: number;
  price: number;
  sum: number; // auto: quantity × price
}

export interface Order {
  id: string;
  orderNumber: string; // YY/XXX
  projectId: string;
  projectName: string; // denormalized
  supplierId: string;
  supplierName: string; // denormalized
  items: OrderItem[];
  totalSum: number; // auto: sum of item sums
  orderDate: string; // YYYY-MM-DD
  comments?: string;
  deliveryAddress?: string;
  orderedBy?: string;
  createdAt: Timestamp;
  userId: string;
}

export type OrderInput = Omit<
  Order,
  'id' | 'orderNumber' | 'projectName' | 'supplierName' | 'totalSum' | 'createdAt' | 'userId'
>;

// ===== WORK ASSIGNMENT =====
export interface Worker {
  id: string; // a, b, c, d, e
  name: string; // Hebrew name
}

export interface WorkAssignment {
  id: string;
  workerId: string;
  projectId: string;
  projectName: string; // denormalized
  clientId: string; // denormalized
  clientName: string; // denormalized
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
  userId: string;
}

export type WorkAssignmentInput = Omit<
  WorkAssignment,
  'id' | 'projectName' | 'clientName' | 'createdAt' | 'userId'
>;

export interface WorkerDayAllocation {
  projectId: string;
  projectName: string;
  allocation: number; // fraction (0-1)
  allocationPercent: number; // percentage (0-100)
}

export interface ProjectWorkerExpenseDetail {
  workerId: string;
  workerName: string;
  totalDays: number;
  allocations: Array<{
    date: string;
    allocation: number;
    allocationPercent: number;
    cost: number;
  }>;
  cost: number;
}

// ===== SETTINGS =====
export interface WorkerRates {
  [workerId: string]: number; // daily rate
}

export interface Settings {
  workerDailyRates: WorkerRates;
  pdfTopMargin?: number;
  pdfTemplateUrl?: string;
}
```

**src/types/enums.ts:**
```typescript
export const PROJECT_STATUSES = [
  'פתוח',
  'אומדן',
  'הזמנה',
  'בביצוע',
  'חשבון',
  'לתשלום',
  'שולם',
] as const;

export const CATEGORIES = [
  'בטון ומוצריו',
  'כבלים',
  'כלים כבדים',
  'נותני שירות',
  'עמודים',
  'פנסים',
  'צינורות',
  'קבלני משנה',
  'שונות',
] as const;

export const UNITS = [
  'יח\'',
  'מטר',
  'מ"ר',
  'מ"ק',
  'ק"ג',
  'טון',
  'שעה',
  'יום',
  'קומפלט',
] as const;

export const WORKERS = [
  { id: 'a', name: 'יאסר' },
  { id: 'b', name: 'פריד' },
  { id: 'c', name: 'חמודי' },
  { id: 'd', name: 'סלימאן' },
  { id: 'e', name: 'מישל' },
] as const;
```

---

## Zustand Store Structure

### Feature Store Pattern

Each feature has its own Zustand store with this pattern:

```typescript
// Example: src/features/clients/clientsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Client, ClientInput } from '@/types/models';

interface ClientsState {
  // Data
  clients: Client[];
  selectedClient: Client | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  loadClients: () => Promise<void>;
  addClient: (data: ClientInput) => Promise<void>;
  updateClient: (id: string, data: Partial<ClientInput>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  selectClient: (client: Client | null) => void;
  clearError: () => void;
}

export const useClientsStore = create<ClientsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      clients: [],
      selectedClient: null,
      isLoading: false,
      error: null,

      // Load clients
      loadClients: async () => {
        set({ isLoading: true, error: null });
        try {
          const snapshot = await getDocs(collection(db, 'clients'));
          const clients = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Client[];

          // Sort by creation date (newest first)
          clients.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

          set({ clients, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'שגיאה בטעינת לקוחות',
            isLoading: false,
          });
        }
      },

      // Add client
      addClient: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const docRef = await addDoc(collection(db, 'clients'), {
            ...data,
            createdAt: serverTimestamp(),
          });

          const newClient = {
            id: docRef.id,
            ...data,
            createdAt: { seconds: Date.now() / 1000 } as any,
          } as Client;

          set((state) => {
            state.clients.unshift(newClient);
            state.isLoading = false;
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'שגיאה בהוספת לקוח',
            isLoading: false,
          });
          throw error;
        }
      },

      // Update client
      updateClient: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          await updateDoc(doc(db, 'clients', id), data);

          set((state) => {
            const index = state.clients.findIndex((c) => c.id === id);
            if (index !== -1) {
              state.clients[index] = { ...state.clients[index], ...data };
            }
            if (state.selectedClient?.id === id) {
              state.selectedClient = { ...state.selectedClient, ...data };
            }
            state.isLoading = false;
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'שגיאה בעדכון לקוח',
            isLoading: false,
          });
          throw error;
        }
      },

      // Delete client
      deleteClient: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Cascade delete projects and invoices
          await deleteDoc(doc(db, 'clients', id));

          set((state) => {
            state.clients = state.clients.filter((c) => c.id !== id);
            if (state.selectedClient?.id === id) {
              state.selectedClient = null;
            }
            state.isLoading = false;
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'שגיאה במחיקת לקוח',
            isLoading: false,
          });
          throw error;
        }
      },

      // Select client
      selectClient: (client) => {
        set({ selectedClient: client });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }))
  )
);
```

### Custom Hook Pattern

```typescript
// src/features/clients/hooks/useClients.ts
import { useEffect, useMemo } from 'react';
import { useClientsStore } from '../clientsStore';

export function useClients() {
  const store = useClientsStore();

  // Load clients on mount
  useEffect(() => {
    if (store.clients.length === 0) {
      store.loadClients();
    }
  }, []);

  // Derived state: active clients
  const activeClients = useMemo(
    () => store.clients.filter((c) => c.name.trim() !== ''),
    [store.clients]
  );

  return {
    // Data
    clients: store.clients,
    activeClients,
    selectedClient: store.selectedClient,

    // UI State
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    addClient: store.addClient,
    updateClient: store.updateClient,
    deleteClient: store.deleteClient,
    selectClient: store.selectClient,
    clearError: store.clearError,
    reload: store.loadClients,
  };
}
```

---

## Component Hierarchy

### App Structure

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ClientsPage } from '@/pages/ClientsPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { SidurPage } from '@/pages/SidurPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/clients" replace />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/sidur" element={<SidurPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

### Example Page Component

```tsx
// src/pages/ClientsPage.tsx
import { ClientsList } from '@/features/clients/components/ClientsList';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export function ClientsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">לקוחות</h1>
        <Button onClick={() => setShowForm(true)}>
          + לקוח חדש
        </Button>
      </div>

      <ClientsList />

      {showForm && (
        <ClientForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
```

### Example Feature Component

```tsx
// src/features/clients/components/ClientsList.tsx
import { useClients } from '../hooks/useClients';
import { ClientCard } from './ClientCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export function ClientsList() {
  const { clients, isLoading, error } = useClients();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        אין לקוחות. הוסף לקוח ראשון!
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}
```

---

## Implementation Roadmap

### Week 1: Foundation (Days 1-5)

**Day 1: Project Setup**
- ✅ Initialize Vite + React + TypeScript
- ✅ Install all dependencies
- ✅ Configure Tailwind CSS with RTL
- ✅ Set up TypeScript paths
- ✅ Configure ESLint + Prettier
- ✅ Create folder structure
- ✅ Set up Firebase configuration

**Day 2: UI Components**
- ✅ Build base UI components:
  - Button
  - Input
  - Select
  - Modal
  - Card
  - Table
  - Badge
  - LoadingSpinner
  - ErrorMessage
- ✅ Test RTL layout
- ✅ Create Storybook (optional)

**Day 3: Layout & Routing**
- ✅ Create Layout component (Header, Sidebar, Footer)
- ✅ Set up React Router
- ✅ Create all page shells
- ✅ Implement navigation
- ✅ Test routing

**Day 4: Authentication**
- ✅ Build LoginForm component
- ✅ Implement Firebase Auth
- ✅ Create ProtectedRoute
- ✅ Add email whitelist check
- ✅ Test login flow

**Day 5: Clients Module (Part 1)**
- ✅ Define Client types
- ✅ Create clientsStore
- ✅ Build ClientsList component
- ✅ Build ClientCard component
- ✅ Test data loading

### Week 2: Core Features (Days 6-10)

**Day 6: Clients Module (Part 2)**
- ✅ Build ClientForm (add/edit)
- ✅ Implement delete with confirmation
- ✅ Add form validation
- ✅ Test full CRUD

**Day 7: Projects Module (Part 1)**
- ✅ Define Project types
- ✅ Create projectsStore
- ✅ Build ProjectsList component
- ✅ Build ProjectCard with status badges
- ✅ Build ProjectForm
- ✅ Test project CRUD

**Day 8: Projects Module (Part 2) + Invoices**
- ✅ Define Invoice types
- ✅ Build InvoiceForm (multiple items)
- ✅ Build InvoicesList
- ✅ Implement file upload
- ✅ Calculate project totals
- ✅ Test invoice management

**Day 9: Suppliers Module**
- ✅ Define Supplier types
- ✅ Create suppliersStore
- ✅ Build SuppliersList
- ✅ Build SupplierForm
- ✅ Implement document upload
- ✅ Test supplier CRUD

**Day 10: Orders Module (Part 1)**
- ✅ Define Order types
- ✅ Create ordersStore
- ✅ Build OrdersList
- ✅ Build OrderForm (multiple items)
- ✅ Implement order number generation
- ✅ Auto-calculate sums
- ✅ Test order creation

### Week 3: Advanced Features (Days 11-15)

**Day 11: Orders Module (Part 2) - PDF**
- ✅ Implement PDF generation with pdf-lib
- ✅ Load Hebrew fonts
- ✅ Create beautiful PDF template
- ✅ Test PDF download

**Day 12: Work Schedule (Sidur) Module**
- ✅ Define WorkAssignment types
- ✅ Create sidurStore
- ✅ Build WorkCalendar component
- ✅ Build WorkAssignmentForm
- ✅ Implement worker allocation logic
- ✅ Calculate expenses

**Day 13: Settings Module**
- ✅ Build WorkerRatesForm
- ✅ Build PDFTemplateUpload
- ✅ Implement settings persistence
- ✅ Test settings management

**Day 14: Polish & Testing**
- ✅ Write unit tests (Vitest)
- ✅ Write integration tests
- ✅ Fix bugs
- ✅ Improve UI/UX
- ✅ Add loading states
- ✅ Add error handling

**Day 15: Deployment**
- ✅ Build production bundle
- ✅ Test production build
- ✅ Update Firebase hosting config
- ✅ Deploy to Firebase
- ✅ Final testing on production

---

## Development Workflow

### Daily Workflow

```bash
# Start dev server
npm run dev

# In parallel terminal: Run tests
npm run test:watch

# Format code
npm run format

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Git Workflow

```bash
# Work on feature branch
git checkout -b feature-clients-module

# Make commits
git add .
git commit -m "Add clients list component"

# Push to remote
git push -u origin feature-clients-module

# Deploy to test
npm run build
firebase deploy

# After testing and approval, merge to main
git checkout main
git merge feature-clients-module
git push origin main
```

### Firebase Deployment

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Success Metrics

### Performance Targets
- **Build time:** < 10 seconds
- **Bundle size:** < 300KB (gzipped)
- **First load:** < 2 seconds
- **Route change:** < 100ms

### Code Quality Targets
- **TypeScript coverage:** 100%
- **Test coverage:** > 80%
- **ESLint errors:** 0
- **Bundle analysis:** No duplicate dependencies

### User Experience Targets
- **Mobile responsive:** 100%
- **RTL support:** Perfect
- **Accessibility:** WCAG AA
- **Error handling:** Graceful

---

## Next Steps

**Ready to start? Let's begin with Day 1!**

I can immediately:
1. Initialize the Vite project
2. Set up all configurations
3. Create the folder structure
4. Build the first components

**Should I start building?** 🚀

