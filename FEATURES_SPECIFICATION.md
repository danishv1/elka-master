# Elka Invoice Management System - Complete Feature Specification

**Document Version:** 1.0
**Date:** 2025-11-16
**Purpose:** Complete documentation of all current features for React migration

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Features](#core-features)
3. [Data Models](#data-models)
4. [Business Rules](#business-rules)
5. [User Workflows](#user-workflows)
6. [Technical Requirements](#technical-requirements)

---

## System Overview

### Project Information
- **Name:** Elka Invoice Management System
- **Type:** Invoice and Project Management System
- **Language:** Hebrew (RTL)
- **Location:** Israel (me-west1)
- **Target Users:** Project managers, contractors

### Purpose
Comprehensive system for managing clients, projects, invoices, suppliers, purchase orders, and work schedules. Designed for construction/contracting businesses with Hebrew language support.

---

## Core Features

### 1. Authentication & Authorization

#### Features
- **Google Sign-In** - Firebase Authentication
- **Email Whitelist** - Only authorized emails can access
- **Session Persistence** - Users stay logged in
- **Auto Sign-Out** - For unauthorized emails

#### Business Rules
- Only whitelisted emails can access the system
- User must be authenticated for all operations
- All data is user-scoped (userId field)

#### User Flow
```
1. User visits app
2. If not authenticated → Show login screen
3. User clicks "Sign in with Google"
4. Firebase authenticates
5. Check email against whitelist
6. If authorized → Load app data
7. If not authorized → Sign out + show error
```

---

### 2. Client Management

#### Features
- **View All Clients** - List of all clients (newest first)
- **Add Client** - Create new client
- **Edit Client** - Update client information
- **Delete Client** - Remove client (with cascade delete warning)
- **Select Client** - View client's projects

#### Data Fields
```typescript
interface Client {
  id: string;              // Auto-generated
  name: string;            // Required
  email?: string;          // Optional
  phone?: string;          // Optional
  notes?: string;          // Optional
  createdAt: Timestamp;    // Auto-generated
  userId: string;          // Auto-set (current user)
}
```

#### Business Rules
- Name is required
- Email and phone are optional
- Deleting a client deletes all:
  - Projects linked to the client
  - Invoices linked to those projects
- Clients sorted by creation date (newest first)
- Confirmation required before delete

#### User Workflows

**Add Client:**
```
1. User clicks "+ לקוח חדש"
2. Form appears with fields: name, email, phone, notes
3. User fills name (required)
4. User clicks "שמור"
5. Client added to Firestore
6. Client appears at top of list
7. Form closes
```

**Edit Client:**
```
1. User clicks "ערוך" on client card
2. Fields become editable
3. User changes information
4. User clicks "שמור"
5. Client updated in Firestore
6. UI updates immediately
7. Edit mode closes
```

**Delete Client:**
```
1. User clicks "מחק" on client card
2. Confirmation dialog: "האם למחוק את הלקוח? כל הפרויקטים והחשבוניות שלו יימחקו!"
3. If confirmed:
   a. Find all projects for client
   b. For each project, delete all invoices
   c. Delete all projects
   d. Delete client
4. UI updates
```

**Select Client:**
```
1. User clicks on client card
2. State updates: selectedClient = client
3. View changes to "projects"
4. Load projects for client
5. Show projects view
```

---

### 3. Project Management

#### Features
- **View Projects** - For selected client or all projects
- **Add Project** - Create new project
- **Edit Project** - Update project details
- **Delete Project** - Remove project
- **Status Tracking** - Track project stages
- **Revenue Tracking** - Track project income
- **Expense Calculation** - Auto-calculate from orders + worker expenses
- **Profit Calculation** - Revenue - Expenses
- **Active in Schedule** - Toggle if project appears in work schedule

#### Data Fields
```typescript
interface Project {
  id: string;              // Auto-generated
  clientId: string;        // Required - link to client
  name: string;            // Required
  revenue: number;         // Default: 0
  status: ProjectStatus;   // Default: 'פתוח'
  description?: string;    // Optional
  activeInSchedule: boolean; // Default: true
  createdAt: Timestamp;    // Custom date or auto
  userId: string;          // Auto-set
}

type ProjectStatus =
  | 'פתוח'      // Open
  | 'אומדן'     // Estimate
  | 'הזמנה'     // Order
  | 'בביצוע'    // In Progress
  | 'חשבון'     // Invoice
  | 'לתשלום'    // For Payment
  | 'שולם';     // Paid
```

#### Calculated Fields (not stored)
```typescript
interface ProjectCalculations {
  totalExpenses: number;     // ordersExpenses + workerExpenses
  ordersExpenses: number;    // Sum of all order totalSums
  workerExpenses: number;    // Sum of worker daily rates × assignments
  profit: number;            // revenue - totalExpenses
  profitMargin: number;      // (profit / revenue) × 100
}
```

#### Business Rules
- Name and clientId are required
- Revenue can be 0
- Status color-coding:
  - **שולם** (Paid): Green
  - **לתשלום** (For Payment): Yellow
  - **בביצוע** (In Progress): Blue
  - **אומדן** (Estimate): Purple
  - **חשבון** (Invoice): Orange
  - **הזמנה** (Order): Cyan
  - **פתוח** (Open): Gray
- Creation date can be custom (for backdating projects)
- Active in schedule = false → project won't appear in work schedule dropdown
- Projects sorted by creation date (newest first)
- Deleting a project deletes all its invoices

#### User Workflows

**View Projects:**
```
1. User selects client
2. Load all projects where clientId = selectedClient.id
3. For each project:
   a. Load invoices
   b. Calculate expenses from orders
   c. Calculate worker expenses from assignments
   d. Calculate profit and margin
4. Display projects with status badges
```

**Add Project:**
```
1. User clicks "+ פרויקט חדש"
2. Form appears:
   - שם פרויקט (name) - required
   - הכנסה (revenue) - number
   - סטטוס (status) - dropdown
   - תאריך יצירה (creationDate) - date picker
   - תיאור (description) - textarea
   - פעיל בסידור (activeInSchedule) - checkbox
3. User fills data
4. User clicks "שמור"
5. Project added to Firestore
6. Project appears in list
```

---

### 4. Invoice Management

#### Features
- **View Invoices** - For selected project
- **Add Invoice** - With multiple items
- **Edit Invoice** - Update invoice details
- **Delete Invoice** - Remove invoice
- **File Attachments** - Upload multiple files
- **Category Tracking** - Categorize expenses
- **Supplier Tracking** - Link to suppliers

#### Data Fields
```typescript
interface Invoice {
  id: string;              // Auto-generated
  projectId: string;       // Required
  clientId: string;        // Required
  supplier: string;        // Required - supplier name
  invoiceNumber?: string;  // Optional - invoice #
  date: string;            // ISO date (YYYY-MM-DD)
  description: string;     // Item description
  amount: number;          // Required - expense amount
  category: Category;      // Default: 'שונות'
  attachments: Attachment[]; // File uploads
  createdAt: Timestamp;    // Auto
  userId: string;          // Auto
}

interface Attachment {
  name: string;            // File name
  url: string;             // Firebase Storage URL
  type: string;            // MIME type
}

type Category =
  | 'בטון ומוצריו'  // Concrete and products
  | 'כבלים'         // Cables
  | 'כלים כבדים'    // Heavy tools
  | 'נותני שירות'   // Service providers
  | 'עמודים'        // Poles
  | 'פנסים'         // Lights
  | 'צינורות'       // Pipes
  | 'קבלני משנה'    // Subcontractors
  | 'שונות';        // Miscellaneous
```

#### Business Rules
- Supplier is required
- Amount must be > 0
- One invoice form can create multiple invoices (one per item)
- All items share same: supplier, invoiceNumber, date, attachments
- Each item has its own: description, amount, category
- Files uploaded to Firebase Storage: `invoices/{projectId}/{timestamp}_{filename}`
- Invoices sorted by date (newest first)

#### User Workflows

**Add Invoice (Multiple Items):**
```
1. User clicks "+ הוסף חשבונית"
2. Form shows:
   - ספק (supplier) - text - shared
   - מספר חשבונית (invoiceNumber) - text - shared
   - תאריך (date) - date picker - shared
   - קבצים מצורפים (attachments) - file upload - shared
   - פריטים (items) - repeating group:
     * תיאור (description)
     * סכום (amount)
     * קטגוריה (category) - dropdown
3. User can add multiple items (+ הוסף פריט)
4. User can remove items (if more than 1)
5. User uploads files (optional)
6. User clicks "שמור"
7. For each item with amount > 0:
   a. Upload files to Storage (once, shared)
   b. Create invoice document in Firestore
8. Reload invoices for project
9. Form closes
```

**File Upload:**
```
1. User clicks file input
2. Selects one or more files
3. Files read as Data URLs
4. Stored in state.newInvoice.attachments
5. On save:
   a. For each file:
      - Upload to Storage: invoices/{projectId}/{timestamp}_{filename}
      - Get download URL
      - Add to uploadedFiles array
   b. All invoices get same uploadedFiles array
```

---

### 5. Supplier Management

#### Features
- **View All Suppliers** - List of suppliers
- **Add Supplier** - Create new supplier
- **Edit Supplier** - Update supplier info
- **Delete Supplier** - Remove supplier (with check)
- **Contact Management** - Track contact person
- **Payment Conditions** - Store payment terms
- **Document Management** - Upload supplier documents

#### Data Fields
```typescript
interface Supplier {
  id: string;              // Auto-generated
  name: string;            // Required
  contactName?: string;    // Optional - contact person
  contactPhone?: string;   // Optional - contact phone
  contactEmail?: string;   // Optional - contact email
  paymentConditions?: string; // Optional - payment terms
  documents: Document[];   // Uploaded files
  createdAt: Timestamp;    // Auto
  userId: string;          // Auto
}

interface Document {
  name: string;            // File name
  url: string;             // Firebase Storage URL
  uploadedAt: Date;        // Upload timestamp
}
```

#### Business Rules
- Name is required
- Cannot delete supplier if they have orders
- Documents stored in Storage: `supplier-documents/{supplierId}/{filename}`
- Suppliers sorted by creation date (newest first)

#### User Workflows

**Add Supplier:**
```
1. User clicks "+ ספק חדש"
2. Form appears with fields:
   - שם ספק (name) - required
   - איש קשר (contactName)
   - טלפון (contactPhone)
   - אימייל (contactEmail)
   - תנאי תשלום (paymentConditions)
3. User fills data
4. User clicks "שמור"
5. Supplier added to Firestore
6. Success message shown
7. Form closes
```

**Delete Supplier:**
```
1. User clicks "מחק"
2. Check if supplier has orders
3. If has orders → "לא ניתן למחוק ספק שיש לו הזמנות"
4. If no orders:
   a. Show confirmation
   b. If confirmed, delete supplier
   c. Update UI
```

**Upload Document:**
```
1. User clicks "העלה מסמך"
2. Selects file
3. Upload to Storage: supplier-documents/{supplierId}/{filename}
4. Get download URL
5. Add to supplier.documents array
6. Update supplier in Firestore
7. Document appears in list
```

---

### 6. Orders (Purchase Orders)

#### Features
- **View All Orders** - List of all orders
- **Add Order** - Create purchase order
- **Edit Order** - Update order details
- **Delete Order** - Remove order
- **Order Number Generation** - Auto YY/XXX format
- **Item Management** - Multiple items per order
- **PDF Generation** - Beautiful Hebrew PDF
- **Project Linking** - Link to project
- **Supplier Linking** - Link to supplier

#### Data Fields
```typescript
interface Order {
  id: string;              // Auto-generated
  orderNumber: string;     // Auto: YY/XXX (e.g., 25/001)
  projectId: string;       // Required - link to project
  projectName: string;     // Denormalized
  supplierId: string;      // Required - link to supplier
  supplierName: string;    // Denormalized
  items: OrderItem[];      // Required - at least 1
  totalSum: number;        // Auto-calculated
  orderDate: string;       // ISO date
  comments?: string;       // Optional
  deliveryAddress?: string; // Optional
  orderedBy?: string;      // Optional - name of person
  createdAt: Timestamp;    // Auto
  userId: string;          // Auto
}

interface OrderItem {
  description: string;     // Required
  unit: Unit;              // Default: 'יח''
  quantity: number;        // Required
  price: number;           // Required
  sum: number;             // Auto: quantity × price
}

type Unit =
  | 'יח\''       // Piece
  | 'מטר'        // Meter
  | 'מ"ר'        // Square meter
  | 'מ"ק'        // Cubic meter
  | 'ק"ג'        // Kilogram
  | 'טון'        // Ton
  | 'שעה'        // Hour
  | 'יום'        // Day
  | 'קומפלט';   // Complete set
```

#### Order Number Generation
```typescript
// Format: YY/XXX
// Example: 25/001, 25/002, ..., 25/999, 26/001

Algorithm:
1. Get current year (e.g., 2025)
2. Extract last 2 digits (25)
3. Look up counter in Firestore: orderCounter/{year}
4. If exists, increment counter
5. If not exists, start at 1
6. Format as: YY/XXX (pad to 3 digits)
7. Save counter back to Firestore
8. Use atomic transaction to prevent duplicates
```

#### Business Rules
- Project and supplier are required
- Must have at least 1 item with quantity > 0 and price > 0
- Item sum auto-calculates: quantity × price
- Total sum auto-calculates: sum of all item sums
- Order number is unique per year
- Orders sorted by creation date (newest first)
- Project name and supplier name are denormalized for performance

#### User Workflows

**Add Order:**
```
1. User clicks "+ הזמנה חדשה"
2. Form appears:
   - Select Client → loads client's projects
   - Select Project (dropdown)
   - Select Supplier (dropdown)
   - תאריך הזמנה (orderDate) - date picker
   - שם מזמין (orderedBy) - text
   - כתובת משלוח (deliveryAddress) - text
   - הערות (comments) - textarea
   - פריטים (items) - repeating:
     * תיאור (description)
     * יח' (unit) - dropdown
     * כמות (quantity) - number
     * מחיר (price) - number
     * סה"כ (sum) - calculated
3. User adds items (+ הוסף פריט)
4. Sums auto-calculate on quantity/price change
5. User clicks "שמור"
6. Generate unique order number
7. Calculate totalSum
8. Create order in Firestore
9. Order appears in list
```

**Generate PDF:**
```
1. User clicks "PDF" on order card
2. Load order data
3. Create PDF document (A4 size)
4. Load Hebrew fonts (if available, fallback to Helvetica)
5. Build PDF layout:
   - Header with title and company info
   - Order info box (order #, date, project, supplier)
   - Supplier details
   - Items table with headers
   - Row for each item (alternating colors)
   - Total box
   - Additional info (ordered by, delivery address, comments)
   - Footer
6. Save PDF
7. Download: Order_{orderNumber}_{projectName}.pdf
```

---

### 7. Work Schedule (סידור עבודה)

#### Features
- **Calendar View** - Week/Month views
- **Worker Assignment** - Assign workers to projects by date
- **Worker Allocation** - Split worker time across multiple projects
- **Expense Tracking** - Calculate worker costs
- **Daily Rates Management** - Set daily rate per worker
- **Project Expenses** - Calculate total worker cost per project

#### Data Fields
```typescript
interface WorkAssignment {
  id: string;              // Auto-generated
  workerId: string;        // Required - worker ID
  projectId: string;       // Required - project ID
  projectName: string;     // Denormalized
  clientId: string;        // Denormalized
  clientName: string;      // Denormalized
  date: string;            // ISO date (YYYY-MM-DD)
  createdAt: Timestamp;    // Auto
  userId: string;          // Auto
}

interface Worker {
  id: string;              // a, b, c, d, e
  name: string;            // יאסר, פריד, חמודי, סלימאן, מישל
}

// Stored in settings/workerRates
interface WorkerRates {
  workerDailyRates: {
    [workerId: string]: number; // Daily rate in ₪
  };
}
```

#### Worker Allocation Logic
```typescript
/*
If a worker is assigned to multiple projects on the same day,
their time (and cost) is split equally among projects.

Example:
- Worker 'a' (יאסר) assigned to Project X on 2025-01-15
- Worker 'a' assigned to Project Y on 2025-01-15
- Worker 'a' daily rate = ₪600

Allocation:
- Project X gets 0.5 day × ₪600 = ₪300
- Project Y gets 0.5 day × ₪600 = ₪300
- Total for worker = ₪600
*/

function getWorkerAllocation(workerId, projectId, date) {
  const assignments = getWorkerAssignmentsForDate(workerId, date);
  const totalProjects = assignments.length;
  return totalProjects > 0 ? 1 / totalProjects : 0;
}

function getProjectWorkerExpenses(projectId) {
  const assignments = getAssignmentsForProject(projectId);
  let total = 0;

  for (const assignment of assignments) {
    const dailyRate = workerDailyRates[assignment.workerId] || 0;
    const allocation = getWorkerAllocation(
      assignment.workerId,
      projectId,
      assignment.date
    );
    total += dailyRate * allocation;
  }

  return total;
}
```

#### Business Rules
- Cannot assign same worker to same project on same date twice
- Worker can be assigned to multiple projects on same date
- Time split equally across all assignments for a worker on a date
- Only projects with `activeInSchedule = true` appear in dropdown
- Date stored as ISO string (YYYY-MM-DD) to avoid timezone issues
- Worker daily rates stored in settings/workerRates
- Calendar shows today highlighted

#### User Workflows

**Assign Worker to Project:**
```
1. User in Work Schedule view
2. User selects date (calendar)
3. User selects worker (dropdown)
4. User selects project (dropdown - only active projects)
5. User clicks "הוסף שיבוץ"
6. Check if worker already assigned to this project on this date
7. If duplicate → error message
8. If OK:
   a. Create assignment
   b. Store with projectName, clientName (denormalized)
   c. Update UI
```

**View Worker Expenses:**
```
1. User views work assignments
2. For each worker:
   a. Get unique dates assigned
   b. Count = total days worked
   c. Cost = days × daily rate
3. Display per worker
```

**View Project Worker Expenses:**
```
1. User views project details
2. Get all assignments for projectId
3. For each assignment:
   a. Get worker daily rate
   b. Get allocation for (worker, project, date)
   c. Cost = rate × allocation
4. Sum all costs
5. Display total
```

---

### 8. Settings

#### Features
- **Worker Daily Rates** - Set/edit rates per worker
- **PDF Template Upload** - Custom order PDF template
- **PDF Top Margin** - Configure PDF spacing

#### Data Stored
```typescript
// settings/workerRates
interface WorkerRatesSettings {
  workerDailyRates: {
    [workerId: string]: number; // e.g., { 'a': 600, 'b': 550 }
  };
}

// settings/general
interface GeneralSettings {
  pdfTopMargin?: number;  // Top margin for PDF
}

// Firebase Storage: templates/order_template.pdf
// Optional custom PDF template
```

#### Business Rules
- Worker rates default to 0
- Settings are global (per user)
- PDF template optional
- Template must be PDF file
- Template max size: 10MB

#### User Workflows

**Edit Worker Rates:**
```
1. User goes to Settings
2. Clicks "ערוך תעריפים"
3. Input fields appear for each worker
4. User updates rates
5. User clicks "שמור"
6. Update settings/workerRates in Firestore
7. Exit edit mode
8. Reload settings
```

**Upload PDF Template:**
```
1. User clicks "העלה תבנית PDF"
2. Selects file
3. Validate: PDF only, max 10MB
4. Upload to Storage: templates/order_template.pdf
5. Show progress bar
6. On complete:
   a. Get download URL
   b. Store in state
   c. Show success message
```

---

## Data Models

### Firestore Collections

```
├── clients/
│   └── {clientId}
│       ├── name: string
│       ├── email?: string
│       ├── phone?: string
│       ├── notes?: string
│       ├── createdAt: Timestamp
│       └── userId: string
│
├── projects/
│   └── {projectId}
│       ├── clientId: string
│       ├── name: string
│       ├── revenue: number
│       ├── status: string
│       ├── description?: string
│       ├── activeInSchedule: boolean
│       ├── createdAt: Timestamp
│       └── userId: string
│
├── invoices/
│   └── {invoiceId}
│       ├── projectId: string
│       ├── clientId: string
│       ├── supplier: string
│       ├── invoiceNumber?: string
│       ├── date: string
│       ├── description: string
│       ├── amount: number
│       ├── category: string
│       ├── attachments: Attachment[]
│       ├── createdAt: Timestamp
│       └── userId: string
│
├── suppliers/
│   └── {supplierId}
│       ├── name: string
│       ├── contactName?: string
│       ├── contactPhone?: string
│       ├── contactEmail?: string
│       ├── paymentConditions?: string
│       ├── documents: Document[]
│       ├── createdAt: Timestamp
│       └── userId: string
│
├── orders/
│   └── {orderId}
│       ├── orderNumber: string
│       ├── projectId: string
│       ├── projectName: string
│       ├── supplierId: string
│       ├── supplierName: string
│       ├── items: OrderItem[]
│       ├── totalSum: number
│       ├── orderDate: string
│       ├── comments?: string
│       ├── deliveryAddress?: string
│       ├── orderedBy?: string
│       ├── createdAt: Timestamp
│       └── userId: string
│
├── orderCounter/
│   └── {year}
│       ├── year: string        // e.g., "25"
│       └── counter: number     // e.g., 142
│
├── workAssignments/
│   └── {assignmentId}
│       ├── workerId: string
│       ├── projectId: string
│       ├── projectName: string
│       ├── clientId: string
│       ├── clientName: string
│       ├── date: string          // YYYY-MM-DD
│       ├── createdAt: Timestamp
│       └── userId: string
│
└── settings/
    ├── workerRates
    │   └── workerDailyRates: { [id]: number }
    └── general
        └── pdfTopMargin?: number
```

### Firebase Storage Structure

```
├── invoices/
│   └── {projectId}/
│       └── {timestamp}_{filename}
│
├── supplier-documents/
│   └── {supplierId}/
│       └── {filename}
│
└── templates/
    └── order_template.pdf
```

---

## Business Rules Summary

### Validation Rules

| Field | Validation |
|-------|------------|
| Client name | Required, non-empty |
| Project name | Required, non-empty |
| Project clientId | Required, must exist |
| Invoice supplier | Required, non-empty |
| Invoice amount | Required, > 0 |
| Order projectId | Required, must exist |
| Order supplierId | Required, must exist |
| Order items | At least 1 item with quantity > 0 and price > 0 |
| Supplier name | Required, non-empty |
| Work assignment workerId | Required, valid worker ID |
| Work assignment projectId | Required, must exist |
| Work assignment date | Required, YYYY-MM-DD format |

### Cascade Delete Rules

| Entity | Cascade Effect |
|--------|----------------|
| Delete Client | → Deletes all Projects → Deletes all Invoices |
| Delete Project | → Deletes all Invoices |
| Delete Supplier | Blocked if has Orders |

### Auto-Calculation Rules

| Calculation | Formula |
|-------------|---------|
| Order item sum | quantity × price |
| Order total | Σ item sums |
| Project orders expense | Σ order totals for project |
| Project worker expense | Σ (daily rate × allocation) for all assignments |
| Project total expense | orders expense + worker expense |
| Project profit | revenue - total expense |
| Project margin | (profit / revenue) × 100 |

### Denormalization Rules

| Document | Denormalized Fields |
|----------|---------------------|
| Order | projectName, supplierName |
| WorkAssignment | projectName, clientName |

*Purpose: Avoid joins, improve query performance*

---

## User Workflows

### Complete User Journey Example

**Scenario: New Project from Start to Completion**

```
1. Add Client
   ├── User logs in
   ├── Goes to Clients view
   ├── Clicks "+ לקוח חדש"
   ├── Fills: name="בניין משה", phone="050-1234567"
   └── Saves → Client created

2. Add Project
   ├── User clicks on "בניין משה" client
   ├── Goes to Projects view
   ├── Clicks "+ פרויקט חדש"
   ├── Fills: name="קומה 3", revenue=150000, status="פתוח"
   └── Saves → Project created

3. Add Suppliers
   ├── User goes to Suppliers view
   ├── Clicks "+ ספק חדש"
   ├── Adds "ספק בטון" with contact info
   ├── Adds "ספק כבלים" with contact info
   └── Both saved

4. Create Purchase Orders
   ├── User goes to Orders view
   ├── Clicks "+ הזמנה חדשה"
   ├── Selects: Project="קומה 3", Supplier="ספק בטון"
   ├── Adds items:
   │   ├── Item 1: "בטון 30", 10 m³, ₪500/m³ = ₪5,000
   │   └── Item 2: "זיון", 2 טון, ₪3000/טון = ₪6,000
   ├── Total: ₪11,000
   ├── Saves → Order created with number "25/001"
   └── Generates PDF

5. Assign Workers
   ├── User goes to Work Schedule
   ├── Selects date: 2025-01-15
   ├── Assigns יאסר to "קומה 3"
   ├── Assigns פריד to "קומה 3"
   └── Both assignments saved

6. Track Progress
   ├── User views "קומה 3" project
   ├── Sees calculations:
   │   ├── Revenue: ₪150,000
   │   ├── Orders: ₪11,000
   │   ├── Workers: ₪1,200 (2 days × ₪600)
   │   ├── Total Expenses: ₪12,200
   │   ├── Profit: ₪137,800
   │   └── Margin: 91.9%
   └── Updates status to "בביצוע"

7. Add Invoice
   ├── User in project view
   ├── Clicks "+ הוסף חשבונית"
   ├── Fills: Supplier="ספק בטון", Date=today
   ├── Adds items matching order
   ├── Uploads invoice PDF
   └── Saves → Invoice created

8. Complete Project
   ├── User updates status to "שולם"
   ├── Project turns green
   └── Project complete!
```

---

## Technical Requirements

### Performance Requirements
- **Page Load:** < 3 seconds
- **Data Fetch:** < 1 second
- **PDF Generation:** < 5 seconds
- **File Upload:** Progress indicator required

### Browser Support
- **Chrome:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Safari:** Latest 2 versions
- **Edge:** Latest 2 versions
- **Mobile:** iOS Safari, Chrome Mobile

### Responsive Design
- **Desktop:** 1920×1080 and above
- **Tablet:** 768×1024
- **Mobile:** 375×667 minimum

### Accessibility
- **RTL Support:** Full right-to-left layout
- **Keyboard Navigation:** All forms and buttons
- **Screen Readers:** Semantic HTML

### Security
- **Authentication:** Firebase Auth required
- **Authorization:** Email whitelist
- **Data Access:** User-scoped (userId)
- **File Upload:** Validated (type, size)
- **XSS Prevention:** Input sanitization

### Data Integrity
- **Transactions:** Order number generation
- **Batch Operations:** Cascade deletes
- **Timestamps:** Server-side timestamps
- **Validation:** Client and server-side

---

## Appendix

### Hebrew Translations

| English | Hebrew |
|---------|--------|
| Clients | לקוחות |
| Projects | פרויקטים |
| Invoices | חשבוניות |
| Suppliers | ספקים |
| Orders | הזמנות |
| Work Schedule | סידור עבודה |
| Settings | הגדרות |
| Add | הוסף |
| Edit | ערוך |
| Delete | מחק |
| Save | שמור |
| Cancel | ביטול |
| Name | שם |
| Email | אימייל |
| Phone | טלפון |
| Notes | הערות |
| Revenue | הכנסה |
| Expenses | הוצאות |
| Profit | רווח |
| Margin | מרווח |
| Status | סטטוס |
| Date | תאריך |
| Amount | סכום |
| Total | סה"כ |
| Description | תיאור |
| Category | קטגוריה |
| Supplier | ספק |
| Worker | עובד |
| Project | פרויקט |
| Client | לקוח |

### Status Values (Hebrew)

| Status | Color | Meaning |
|--------|-------|---------|
| פתוח | Gray | Open |
| אומדן | Purple | Estimate |
| הזמנה | Cyan | Order placed |
| בביצוע | Blue | In progress |
| חשבון | Orange | Invoiced |
| לתשלום | Yellow | Awaiting payment |
| שולם | Green | Paid |

### Worker IDs

| ID | Name (Hebrew) |
|----|---------------|
| a | יאסר |
| b | פריד |
| c | חמודי |
| d | סלימאן |
| e | מישל |

---

**End of Feature Specification**

