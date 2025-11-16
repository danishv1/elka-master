# React Migration Plan
## Elka Invoice Management System → React + Vite + Zustand + TypeScript

**Date:** 2025-11-16
**Current Version:** 1.3.5 (Vanilla JS)
**Target Stack:** React 18 + Vite + Zustand + TypeScript
**Estimated Timeline:** 4-6 weeks
**Status:** Planning Phase

---

## Table of Contents
1. [Migration Overview](#migration-overview)
2. [New Tech Stack](#new-tech-stack)
3. [Project Structure](#project-structure)
4. [Zustand Store Architecture](#zustand-store-architecture)
5. [Component Hierarchy](#component-hierarchy)
6. [Migration Roadmap](#migration-roadmap)
7. [Implementation Details](#implementation-details)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Strategy](#deployment-strategy)
10. [Rollback Plan](#rollback-plan)

---

## Migration Overview

### Why React + Vite + Zustand?

**React:**
- ✅ Component reusability
- ✅ Huge ecosystem
- ✅ Excellent TypeScript support
- ✅ Easy to hire developers
- ✅ Strong Firebase integration (react-firebase-hooks)

**Vite:**
- ✅ Fastest build tool (uses esbuild)
- ✅ Instant HMR (Hot Module Replacement)
- ✅ Built-in TypeScript support
- ✅ Optimized production builds
- ✅ Official React template

**Zustand:**
- ✅ Simplest state management (100 lines of code)
- ✅ No boilerplate (unlike Redux)
- ✅ TypeScript-first
- ✅ React hooks-based
- ✅ DevTools support
- ✅ Perfect for Firebase integration

**TypeScript:**
- ✅ Catch errors at compile time
- ✅ Better IntelliSense
- ✅ Self-documenting code
- ✅ Easier refactoring
- ✅ Industry standard

### Migration Strategy: Fresh Start

**Approach:** Create new React app alongside existing code

```
Strategy:
├── Keep existing app running (public/)
├── Create new React app (src/)
├── Migrate components one by one
├── Test thoroughly
├── Switch firebase.json to new build output
└── Deploy when ready
```

**Benefits:**
- ✅ No downtime
- ✅ Can compare old vs new
- ✅ Easy rollback
- ✅ Gradual testing

---

## New Tech Stack

### Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.2",
    "firebase": "^11.0.2",
    "react-firebase-hooks": "^5.1.1",
    "react-router-dom": "^7.1.1",
    "pdf-lib": "^1.17.1",
    "tesseract.js": "^5.1.0",
    "cropperjs": "^1.6.1",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.11",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "vitest": "^2.1.8",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "eslint": "^9.17.0",
    "prettier": "^3.4.2"
  }
}
```

### File Size Comparison

```
Current (Vanilla JS):
├── index.html: 283KB
├── Total JS: ~8,594 lines
└── No bundling, no optimization

After (React + Vite):
├── Initial bundle: ~150-200KB (gzipped)
├── Code-split chunks: ~50-100KB each
├── Total size: Smaller with lazy loading
└── Optimized, minified, tree-shaken
```

---

## Project Structure

### New Directory Structure

```
elka-react/
├── public/                          # Static assets
│   ├── fonts/                       # Hebrew fonts
│   └── images/
│
├── src/
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Root component
│   ├── vite-env.d.ts               # Vite types
│   │
│   ├── components/                  # Reusable components
│   │   ├── ui/                      # UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Table.tsx
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   └── shared/                  # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── features/                    # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── AuthGuard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   └── authStore.ts
│   │   │
│   │   ├── clients/
│   │   │   ├── components/
│   │   │   │   ├── ClientsList.tsx
│   │   │   │   ├── ClientCard.tsx
│   │   │   │   ├── ClientForm.tsx
│   │   │   │   └── ClientDetails.tsx
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
│   │   │   │   ├── InvoiceForm.tsx
│   │   │   │   └── InvoicesList.tsx
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
│   │   │   │   └── OrderItems.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useOrders.ts
│   │   │   ├── types.ts
│   │   │   └── ordersStore.ts
│   │   │
│   │   └── sidur/
│   │       ├── components/
│   │       │   ├── WorkCalendar.tsx
│   │       │   ├── WorkAssignmentForm.tsx
│   │       │   ├── WorkerCard.tsx
│   │       │   └── ExpensesSummary.tsx
│   │       ├── hooks/
│   │       │   └── useWorkAssignments.ts
│   │       ├── types.ts
│   │       └── sidurStore.ts
│   │
│   ├── lib/                         # Utilities & libraries
│   │   ├── firebase/
│   │   │   ├── config.ts            # Firebase initialization
│   │   │   ├── firestore.ts         # Firestore helpers
│   │   │   ├── storage.ts           # Storage helpers
│   │   │   └── auth.ts              # Auth helpers
│   │   │
│   │   ├── pdf/
│   │   │   ├── generator.ts         # PDF generation
│   │   │   ├── templates.ts         # PDF templates
│   │   │   └── utils.ts             # PDF utilities
│   │   │
│   │   ├── ocr/
│   │   │   └── processor.ts         # OCR processing
│   │   │
│   │   └── utils/
│   │       ├── date.ts              # Date utilities
│   │       ├── currency.ts          # Currency formatting
│   │       ├── validation.ts        # Form validation
│   │       └── helpers.ts           # General helpers
│   │
│   ├── hooks/                       # Global hooks
│   │   ├── useFirebase.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   │
│   ├── store/                       # Global Zustand store
│   │   ├── index.ts                 # Main store
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   └── settingsSlice.ts
│   │   └── middleware/
│   │       └── logger.ts
│   │
│   ├── types/                       # Global TypeScript types
│   │   ├── index.ts
│   │   ├── models.ts                # Data models
│   │   └── enums.ts                 # Enums & constants
│   │
│   ├── constants/                   # Constants
│   │   ├── index.ts
│   │   ├── workers.ts               # Worker definitions
│   │   ├── categories.ts            # Item categories
│   │   └── statuses.ts              # Project statuses
│   │
│   ├── styles/                      # Global styles
│   │   ├── globals.css              # Global CSS + Tailwind
│   │   └── rtl.css                  # RTL-specific styles
│   │
│   └── pages/                       # Page components
│       ├── Dashboard.tsx
│       ├── Clients.tsx
│       ├── Projects.tsx
│       ├── Suppliers.tsx
│       ├── Orders.tsx
│       ├── Sidur.tsx
│       ├── Settings.tsx
│       └── NotFound.tsx
│
├── tests/                           # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example                     # Environment variables template
├── .eslintrc.json                   # ESLint config
├── .prettierrc                      # Prettier config
├── index.html                       # HTML entry point
├── package.json
├── postcss.config.js                # PostCSS config
├── tailwind.config.js               # Tailwind config
├── tsconfig.json                    # TypeScript config
├── tsconfig.node.json               # TypeScript config for Vite
├── vite.config.ts                   # Vite configuration
└── vitest.config.ts                 # Vitest configuration
```

### Key Differences from Current Structure

```
Old (Vanilla JS):
public/
├── index.html (283KB - everything!)
└── js/
    ├── components/
    ├── shared/
    └── app.js

New (React):
src/
├── features/           ← Feature-based organization
│   ├── clients/       ← Self-contained modules
│   ├── projects/
│   └── ...
├── components/         ← Reusable UI components
├── lib/               ← Utilities
└── store/             ← Zustand state management
```

---

## Zustand Store Architecture

### Store Philosophy

**Zustand Pattern:**
- Minimal boilerplate
- Direct state mutations (uses Immer under the hood)
- No actions/reducers separation (simpler than Redux)
- TypeScript-first

### Main Store Structure

```typescript
// src/store/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import slices
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';

// Combined store type
export type AppStore = AuthSlice & UiSlice & SettingsSlice;

// Create store
export const useStore = create<AppStore>()(
  devtools(
    persist(
      immer((...args) => ({
        ...createAuthSlice(...args),
        ...createUiSlice(...args),
        ...createSettingsSlice(...args),
      })),
      {
        name: 'elka-storage',
        partialize: (state) => ({
          // Only persist certain parts
          settings: state.settings,
        }),
      }
    )
  )
);
```

### Feature-specific Stores

Each feature module has its own store:

```typescript
// src/features/clients/clientsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Client } from './types';

interface ClientsState {
  // State
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  selectClient: (client: Client | null) => void;
}

export const useClientsStore = create<ClientsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      clients: [],
      selectedClient: null,
      isLoading: false,
      error: null,

      // Actions
      loadClients: async () => {
        set({ isLoading: true, error: null });
        try {
          const snapshot = await getDocs(collection(db, 'clients'));
          const clients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Client[];
          set({ clients, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'שגיאה בטעינת לקוחות',
            isLoading: false
          });
        }
      },

      addClient: async (clientData) => {
        set({ isLoading: true, error: null });
        try {
          const docRef = await addDoc(collection(db, 'clients'), clientData);
          const newClient = { id: docRef.id, ...clientData };
          set((state) => {
            state.clients.push(newClient);
            state.isLoading = false;
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'שגיאה בהוספת לקוח',
            isLoading: false
          });
        }
      },

      updateClient: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          await updateDoc(doc(db, 'clients', id), updates);
          set((state) => {
            const index = state.clients.findIndex(c => c.id === id);
            if (index !== -1) {
              state.clients[index] = { ...state.clients[index], ...updates };
            }
            state.isLoading = false;
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'שגיאה בעדכון לקוח',
            isLoading: false
          });
        }
      },

      deleteClient: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await deleteDoc(doc(db, 'clients', id));
          set((state) => {
            state.clients = state.clients.filter(c => c.id !== id);
            if (state.selectedClient?.id === id) {
              state.selectedClient = null;
            }
            state.isLoading = false;
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'שגיאה במחיקת לקוח',
            isLoading: false
          });
        }
      },

      selectClient: (client) => {
        set({ selectedClient: client });
      },
    }))
  )
);
```

### UI State Management

```typescript
// src/store/slices/uiSlice.ts
import { StateCreator } from 'zustand';

export interface UiSlice {
  currentView: 'clients' | 'projects' | 'suppliers' | 'orders' | 'sidur' | 'settings';
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;

  setView: (view: UiSlice['currentView']) => void;
  toggleSidebar: () => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  currentView: 'clients',
  isSidebarOpen: true,
  isModalOpen: false,
  modalContent: null,

  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),
});
```

---

## Component Hierarchy

### App Component Tree

```
<App>
  ├── <ErrorBoundary>
  │   └── <Router>
  │       ├── <AuthGuard>
  │       │   └── <Layout>
  │       │       ├── <Header>
  │       │       ├── <Sidebar>
  │       │       ├── <Routes>
  │       │       │   ├── /dashboard → <Dashboard>
  │       │       │   ├── /clients → <Clients>
  │       │       │   │   ├── <ClientsList>
  │       │       │   │   │   └── <ClientCard> (multiple)
  │       │       │   │   └── <ClientForm> (modal)
  │       │       │   │
  │       │       │   ├── /projects → <Projects>
  │       │       │   │   ├── <ProjectsList>
  │       │       │   │   │   └── <ProjectCard> (multiple)
  │       │       │   │   ├── <ProjectForm> (modal)
  │       │       │   │   └── <InvoicesList>
  │       │       │   │       └── <InvoiceCard> (multiple)
  │       │       │   │
  │       │       │   ├── /suppliers → <Suppliers>
  │       │       │   ├── /orders → <Orders>
  │       │       │   ├── /sidur → <Sidur>
  │       │       │   └── /settings → <Settings>
  │       │       │
  │       │       └── <Footer>
  │       │
  │       └── /login → <LoginForm>
  │
  └── <GlobalModal>
```

### Component Patterns

**1. Container/Presenter Pattern:**

```typescript
// Container (connected to store)
export function ClientsListContainer() {
  const { clients, isLoading, loadClients } = useClientsStore();

  useEffect(() => {
    loadClients();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return <ClientsList clients={clients} />;
}

// Presenter (pure component)
interface ClientsListProps {
  clients: Client[];
}

export function ClientsList({ clients }: ClientsListProps) {
  return (
    <div className="grid gap-4">
      {clients.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}
```

**2. Custom Hooks Pattern:**

```typescript
// src/features/clients/hooks/useClients.ts
export function useClients() {
  const store = useClientsStore();

  // Derived state
  const activeClients = useMemo(
    () => store.clients.filter(c => c.active),
    [store.clients]
  );

  // Combined actions
  const handleAddClient = useCallback(async (data: ClientFormData) => {
    await store.addClient(data);
    // Additional logic (notifications, navigation, etc.)
  }, [store]);

  return {
    clients: store.clients,
    activeClients,
    isLoading: store.isLoading,
    error: store.error,
    addClient: handleAddClient,
    updateClient: store.updateClient,
    deleteClient: store.deleteClient,
    selectClient: store.selectClient,
  };
}
```

---

## Migration Roadmap

### Phase 1: Foundation (Week 1)

**Goals:**
- ✅ Set up React + Vite + TypeScript project
- ✅ Configure Tailwind CSS with RTL
- ✅ Set up Firebase integration
- ✅ Create Zustand store structure
- ✅ Build layout components

**Tasks:**
```bash
1. Initialize Vite project
   npm create vite@latest elka-react -- --template react-ts

2. Install dependencies
   npm install zustand firebase react-firebase-hooks react-router-dom
   npm install -D tailwindcss postcss autoprefixer

3. Configure Tailwind
   npx tailwindcss init -p

4. Set up Firebase
   - Copy firebase config from old project
   - Create lib/firebase/config.ts
   - Initialize Firestore, Auth, Storage

5. Create base Zustand stores
   - authSlice
   - uiSlice
   - settingsSlice

6. Create layout components
   - Layout.tsx
   - Header.tsx
   - Sidebar.tsx
   - Footer.tsx

7. Set up routing
   - React Router v7
   - Protected routes
   - Navigation

8. Test build
   npm run build
```

**Deliverable:** Working React app with navigation and Firebase connection

---

### Phase 2: Authentication (Week 1)

**Goals:**
- ✅ Implement Firebase Authentication
- ✅ Create login/logout flow
- ✅ Protected routes
- ✅ Auth state management

**Components:**
```
src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── AuthGuard.tsx
│   └── UserMenu.tsx
├── hooks/
│   └── useAuth.ts
└── authStore.ts
```

**Tasks:**
1. Create LoginForm component
2. Implement Google Sign-In
3. Email whitelist checking
4. Protected route wrapper
5. Auth persistence

**Deliverable:** Working authentication system

---

### Phase 3: Clients Module (Week 2)

**Goals:**
- ✅ Migrate clients functionality
- ✅ CRUD operations
- ✅ Client selection
- ✅ Client details view

**Components:**
```
src/features/clients/
├── components/
│   ├── ClientsList.tsx
│   ├── ClientCard.tsx
│   ├── ClientForm.tsx
│   └── ClientDetails.tsx
├── hooks/
│   └── useClients.ts
├── types.ts
└── clientsStore.ts
```

**Migration Map:**
```javascript
// Old: public/js/components/clients.js
loadClients()           → useClientsStore().loadClients()
addClient()             → useClientsStore().addClient()
editClient()            → useClientsStore().updateClient()
deleteClient()          → useClientsStore().deleteClient()
selectClient()          → useClientsStore().selectClient()
```

**Tasks:**
1. Define Client TypeScript types
2. Create clientsStore with Zustand
3. Build ClientsList component
4. Build ClientCard component
5. Build ClientForm component (add/edit)
6. Implement delete with confirmation
7. Test all CRUD operations

**Deliverable:** Fully functional clients module

---

### Phase 4: Projects Module (Week 2-3)

**Goals:**
- ✅ Migrate projects functionality
- ✅ Projects CRUD
- ✅ Invoices management
- ✅ File attachments
- ✅ Status management

**Components:**
```
src/features/projects/
├── components/
│   ├── ProjectsList.tsx
│   ├── ProjectCard.tsx
│   ├── ProjectForm.tsx
│   ├── ProjectDetails.tsx
│   ├── InvoiceForm.tsx
│   ├── InvoicesList.tsx
│   └── FileUploader.tsx
├── hooks/
│   ├── useProjects.ts
│   └── useInvoices.ts
├── types.ts
└── projectsStore.ts
```

**Migration Map:**
```javascript
// Old: public/js/components/projects.js
loadProjectsForClient() → useProjectsStore().loadProjectsForClient()
loadAllProjects()       → useProjectsStore().loadAllProjects()
addProject()            → useProjectsStore().addProject()
addInvoice()            → useProjectsStore().addInvoice()
uploadInvoiceFile()     → useProjectsStore().uploadFile()
```

**Tasks:**
1. Define Project and Invoice types
2. Create projectsStore
3. Handle subcollection structure (clients/{id}/projects)
4. Build ProjectsList component
5. Build ProjectCard with status badges
6. Build ProjectForm with validation
7. Build InvoicesList component
8. Build InvoiceForm component
9. Implement file upload with Firebase Storage
10. Calculate totals (expenses, profit, margin)

**Deliverable:** Fully functional projects and invoices module

---

### Phase 5: Suppliers Module (Week 3)

**Goals:**
- ✅ Migrate suppliers functionality
- ✅ Suppliers CRUD
- ✅ Document management
- ✅ Contact information

**Components:**
```
src/features/suppliers/
├── components/
│   ├── SuppliersList.tsx
│   ├── SupplierCard.tsx
│   ├── SupplierForm.tsx
│   └── SupplierDocuments.tsx
├── hooks/
│   └── useSuppliers.ts
├── types.ts
└── suppliersStore.ts
```

**Deliverable:** Fully functional suppliers module

---

### Phase 6: Orders Module (Week 4)

**Goals:**
- ✅ Migrate orders functionality
- ✅ Order number generation
- ✅ Items management
- ✅ PDF generation

**Components:**
```
src/features/orders/
├── components/
│   ├── OrdersList.tsx
│   ├── OrderCard.tsx
│   ├── OrderForm.tsx
│   └── OrderItems.tsx
├── hooks/
│   └── useOrders.ts
├── types.ts
└── ordersStore.ts
```

**Migration Map:**
```javascript
// Old: public/js/components/orders.js
loadOrders()            → useOrdersStore().loadOrders()
addOrder()              → useOrdersStore().addOrder()
generateOrderNumber()   → useOrdersStore().getNextOrderNumber()
```

**Deliverable:** Fully functional orders module

---

### Phase 7: Sidur (Work Schedule) Module (Week 4)

**Goals:**
- ✅ Migrate work schedule functionality
- ✅ Calendar view
- ✅ Worker assignments
- ✅ Expense tracking

**Components:**
```
src/features/sidur/
├── components/
│   ├── WorkCalendar.tsx
│   ├── WorkAssignmentForm.tsx
│   ├── WorkerCard.tsx
│   └── ExpensesSummary.tsx
├── hooks/
│   └── useWorkAssignments.ts
├── types.ts
└── sidurStore.ts
```

**Deliverable:** Fully functional work schedule module

---

### Phase 8: PDF & OCR (Week 5)

**Goals:**
- ✅ Migrate PDF generation
- ✅ Migrate OCR functionality
- ✅ Lazy loading for heavy libraries

**Implementation:**
```typescript
// src/lib/pdf/generator.ts
import { lazy } from 'react';

// Lazy load PDF library
export const generatePDF = async (data: InvoiceData) => {
  const { PDFDocument, rgb } = await import('pdf-lib');
  // PDF generation logic
};

// src/lib/ocr/processor.ts
export const processOCR = async (image: File) => {
  const Tesseract = await import('tesseract.js');
  // OCR processing logic
};
```

**Deliverable:** Working PDF and OCR features

---

### Phase 9: Settings & Polish (Week 5)

**Goals:**
- ✅ Settings page
- ✅ Worker rates management
- ✅ PDF templates
- ✅ UI polish and refinements

**Deliverable:** Complete, polished application

---

### Phase 10: Testing & Deployment (Week 6)

**Goals:**
- ✅ Comprehensive testing
- ✅ E2E tests
- ✅ Performance optimization
- ✅ Production deployment

**Tasks:**
1. Write unit tests (Vitest)
2. Write integration tests
3. Write E2E tests (Playwright)
4. Performance audit (Lighthouse)
5. Build optimization
6. Firebase deployment
7. Production testing
8. Rollback plan verification

**Deliverable:** Production-ready React application

---

## Implementation Details

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
          'pdf-vendor': ['pdf-lib'],
          'ocr-vendor': ['tesseract.js'],
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

### Tailwind Configuration with RTL

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        hebrew: ['Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... more shades
        },
      },
    },
  },
  plugins: [
    // RTL support
    function ({ addUtilities }) {
      addUtilities({
        '.dir-rtl': {
          direction: 'rtl',
        },
        '.text-start': {
          'text-align': 'start',
        },
      });
    },
  ],
};
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@features/*": ["./src/features/*"],
      "@lib/*": ["./src/lib/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@store/*": ["./src/store/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Firebase Configuration

```typescript
// src/lib/firebase/config.ts
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

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

### Environment Variables

```bash
# .env.example
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=elka-73bb6
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Testing Strategy

### Testing Stack

```
Unit Tests:        Vitest + Testing Library
Integration Tests: Vitest + Firebase Emulators
E2E Tests:         Playwright
```

### Test Structure

```typescript
// Example: ClientsList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientsList } from './ClientsList';

describe('ClientsList', () => {
  it('renders list of clients', async () => {
    render(<ClientsList />);

    await waitFor(() => {
      expect(screen.getByText('לקוח 1')).toBeInTheDocument();
    });
  });

  it('adds new client', async () => {
    const user = userEvent.setup();
    render(<ClientsList />);

    await user.click(screen.getByRole('button', { name: /הוסף לקוח/i }));
    await user.type(screen.getByLabelText(/שם/i), 'לקוח חדש');
    await user.click(screen.getByRole('button', { name: /שמור/i }));

    await waitFor(() => {
      expect(screen.getByText('לקוח חדש')).toBeInTheDocument();
    });
  });
});
```

### Coverage Goals

```
Target Coverage:
├── Statements: > 80%
├── Branches: > 75%
├── Functions: > 80%
└── Lines: > 80%
```

---

## Deployment Strategy

### Build Configuration

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "deploy": "npm run build && firebase deploy"
  }
}
```

### Firebase Hosting Configuration

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Deployment Steps

```bash
# 1. Build production bundle
npm run build

# 2. Test production build locally
npm run preview

# 3. Deploy to Firebase
firebase deploy --only hosting

# 4. Verify deployment
# Open production URL and test
```

---

## Rollback Plan

### If Migration Fails

**Step 1: Keep old code**
```bash
# Old vanilla JS code stays in public/
# New React code in dist/ (from src/)
# Can switch between them easily
```

**Step 2: Firebase configuration switch**
```json
// Switch back to old version
{
  "hosting": {
    "public": "public",  // Back to old code
    "ignore": ["firebase.json"]
  }
}
```

**Step 3: Redeploy**
```bash
firebase deploy --only hosting
```

**Recovery Time:** < 5 minutes

---

## Success Metrics

### Performance Targets

```
Lighthouse Scores:
├── Performance: > 90
├── Accessibility: > 95
├── Best Practices: > 95
└── SEO: > 90

Load Times:
├── First Contentful Paint: < 1.5s
├── Time to Interactive: < 3s
├── Largest Contentful Paint: < 2.5s
└── Total Bundle Size: < 300KB (gzipped)
```

### Development Metrics

```
Code Quality:
├── TypeScript coverage: 100%
├── Test coverage: > 80%
├── ESLint errors: 0
└── Build warnings: 0

Developer Experience:
├── Build time: < 10s
├── HMR update: < 100ms
├── Type checking: < 5s
└── Test execution: < 30s
```

---

## Timeline Summary

```
Week 1: Foundation + Auth
├── Vite + React + TypeScript setup
├── Tailwind + RTL configuration
├── Firebase integration
├── Zustand store setup
├── Layout components
└── Authentication

Week 2: Clients + Projects (start)
├── Clients module (complete)
└── Projects module (50%)

Week 3: Projects (finish) + Suppliers
├── Projects module (complete)
├── Invoices functionality
└── Suppliers module

Week 4: Orders + Sidur
├── Orders module
├── Order number generation
└── Work schedule module

Week 5: PDF + OCR + Settings
├── PDF generation
├── OCR processing
├── Settings page
└── UI polish

Week 6: Testing + Deployment
├── Unit tests
├── Integration tests
├── E2E tests
├── Performance optimization
└── Production deployment

Total: 4-6 weeks (depends on team size and availability)
```

---

## Next Steps

1. **Review this plan** - Discuss with team
2. **Approve migration** - Get sign-off
3. **Set up environment** - Install tools
4. **Start Week 1** - Foundation work
5. **Daily standups** - Track progress
6. **Weekly demos** - Show progress

---

## Questions to Decide

Before we start, please confirm:

1. **Timeline:** Is 4-6 weeks acceptable?
2. **Team size:** How many developers?
3. **Testing priority:** How comprehensive?
4. **Migration approach:** Big bang or gradual?
5. **Feature freeze:** Can we pause new features during migration?
6. **TypeScript:** 100% TS or allow some JS?
7. **Component library:** Use headless UI (Radix, Headless UI) or build from scratch?

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Status:** Awaiting approval to start

