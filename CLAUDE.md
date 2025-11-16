# CLAUDE.md - AI Assistant Guide for Elka Invoice Management System

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Codebase Structure](#codebase-structure)
4. [Architecture & Design Patterns](#architecture--design-patterns)
5. [Development Workflows](#development-workflows)
6. [Key Conventions](#key-conventions)
7. [Testing Guidelines](#testing-guidelines)
8. [Deployment Process](#deployment-process)
9. [Critical Reminders for AI Assistants](#critical-reminders-for-ai-assistants)
10. [Quick Reference](#quick-reference)

---

## Project Overview

**Project Name:** Elka Invoice Management System
**Current Version:** 1.3.5
**Firebase Project ID:** elka-73bb6
**Database Location:** me-west1 (Middle East - Israel)
**Language:** Hebrew (RTL) + English code
**Type:** Single Page Application (SPA) with Firebase backend

### Purpose
A comprehensive invoice and project management system designed for managing clients, projects, invoices, suppliers, purchase orders, and work schedules (סידור עבודה). The system supports Hebrew language with right-to-left (RTL) layout.

### Key Features
- **Client Management** - CRUD operations for clients
- **Project & Invoice Management** - Track projects with multiple statuses and invoices
- **Supplier Management** - Manage supplier database with documents
- **Purchase Orders** - Create and track orders with auto-generated numbers
- **Work Schedule (סידור עבודה)** - Assign workers to projects with daily rates
- **PDF Generation** - Create invoices and orders with Hebrew font support
- **OCR Processing** - Extract text from images using Tesseract.js
- **File Management** - Upload and manage project attachments

---

## Technology Stack

### Frontend
- **Framework:** Vanilla JavaScript (ES6 modules, no framework)
- **UI Styling:** Tailwind CSS v3.4.17 (CDN)
- **HTML:** HTML5 with RTL support
- **Module System:** ES6 import/export

### Backend Services (Firebase)
- **Database:** Cloud Firestore (NoSQL)
- **Storage:** Cloud Storage (file uploads)
- **Authentication:** Firebase Authentication (Google Sign-In)
- **Hosting:** Firebase Hosting
- **Functions:** Cloud Functions (Node 22)

### Key Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| pdf-lib | v1.17.1 | PDF generation |
| Tesseract.js | v5 | OCR text recognition |
| PDF.js | v3.11.174 | PDF reading/parsing |
| Cropper.js | v1.6.1 | Image cropping |
| firebase-functions | v7.0.0 | Cloud Functions |
| firebase-admin | v12.6.0 | Admin SDK |

### Development Tools
- **Testing:** Jest v29.7.0
- **E2E Testing:** Puppeteer v24.29.1
- **Build Tool:** Firebase CLI
- **Package Manager:** npm
- **Node Version:** 22 (for Cloud Functions)

---

## Codebase Structure

```
/home/user/elka-master/
├── public/                          # Frontend application
│   ├── index.html                   # Main entry point (283KB)
│   ├── index-modular.html           # Modular version
│   ├── index-hybrid.html            # Hybrid version
│   └── js/
│       ├── app.js                   # Main coordinator (~400 lines)
│       ├── config.js                # Firebase configuration
│       ├── ocr.js                   # OCR functionality
│       ├── components/              # Feature modules
│       │   ├── clients.js           # Client management (303 lines)
│       │   ├── projects.js          # Projects & invoices (451 lines)
│       │   ├── suppliers.js         # Supplier management (267 lines)
│       │   ├── orders.js            # Order management (348 lines)
│       │   ├── sidur.js             # Work schedule (186 lines)
│       │   └── settings.js          # Settings management
│       ├── shared/                  # Shared modules
│       │   ├── constants.js         # App constants (35 lines)
│       │   ├── state.js             # Centralized state (92 lines)
│       │   └── utils.js             # Utility functions (167 lines)
│       ├── utils/                   # Utility helpers
│       │   ├── pdf-utils.js         # PDF generation utilities
│       │   └── file-utils.js        # File handling utilities
│       └── views/                   # Optional view renderers
│           └── clients-view.js
│
├── functions/                       # Cloud Functions
│   ├── package.json                 # Node 22 dependencies
│   └── index.js                     # Functions entry point
│
├── tests/                           # Test suite
│   ├── unit/                        # Unit tests
│   ├── integration/                 # Integration tests
│   └── ui/                          # UI/E2E tests
│
├── Configuration Files
│   ├── firebase.json                # Firebase project config
│   ├── firestore.rules              # Security rules
│   ├── firestore.indexes.json       # Database indexes
│   ├── storage.rules                # Storage security
│   ├── .firebaserc                  # Project ID
│   └── package.json                 # Root dependencies
│
└── Documentation (16 files)
    ├── QUICK_START.md               # 2-minute setup
    ├── ARCHITECTURE.md              # System architecture
    ├── COMPONENT_STRUCTURE.md       # Component reference
    ├── SIDUR_README.md              # Work schedule docs
    ├── CHANGELOG.md                 # Version history
    └── ... (more docs)
```

### Firestore Collections Structure
```
elka-73bb6 (Firebase project)
├── clients/
│   └── {clientId}/
│       └── projects/ (subcollection)
│           └── {projectId}/
│               └── invoices/ (subcollection)
├── suppliers/
├── orders/
├── orderCounter/
├── workAssignments/
└── workerExpenses/
```

---

## Architecture & Design Patterns

### System Architecture

```
┌─────────────────────────────────────────┐
│         Browser / User                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         index.html                       │
│     (UI Structure & Rendering)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         app.js                           │
│     (Main Coordinator)                   │
│  • Initializes Firebase                  │
│  • Creates app context                   │
│  • Initializes components                │
│  • Manages authentication                │
└───┬───────────────────────────────────┬──┘
    │                                   │
    ├─── Components ───────────────────┤
    │                                   │
    ▼           ▼          ▼           ▼
┌─────────┐ ┌────────┐ ┌─────────┐ ┌────────┐
│clients  │ │projects│ │suppliers│ │orders  │
│  .js    │ │  .js   │ │  .js    │ │  .js   │
└─────────┘ └────────┘ └─────────┘ └────────┘
    │            │           │          │
    └────────────┴───────────┴──────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │   Shared Modules         │
    │  • constants.js          │
    │  • state.js              │
    │  • utils.js              │
    └───────────┬──────────────┘
                │
                ▼
    ┌─────────────────────────┐
    │   Firebase Services      │
    │  • Firestore (Database)  │
    │  • Storage (Files)       │
    │  • Auth (Login)          │
    └──────────────────────────┘
```

### Component Pattern

**Every component follows this structure:**

```javascript
/**
 * Component Name - Brief description
 *
 * Responsibilities:
 * - Feature 1
 * - Feature 2
 *
 * Exported functions:
 * - function1() - Description
 * - function2() - Description
 */

export function initComponentName(context) {
    const { state, db, firebase, storage, render } = context;

    // Private helper functions
    async function privateHelperFunction() {
        // Implementation
    }

    // Public API functions
    async function publicFunction() {
        try {
            // 1. Validate input
            // 2. Firebase operation
            // 3. Update state
            // 4. Call render()
        } catch (error) {
            console.error('Error:', error);
            alert('שגיאה בעברית');
        }
    }

    // Export only public functions
    return {
        publicFunction,
        // ... other public functions
    };
}
```

### Data Flow Pattern

```
User Action (click/submit)
    ↓
UI Event Handler
    ↓
window.appHandlers.componentName.functionName()
    ↓
1. Validate Input
    ↓
2. Firebase Operation (db.add/update/delete)
    ↓
3. Update state
    ↓
4. Call render()
    ↓
UI Updated ✅
```

### State Management Pattern

```javascript
// Centralized state (window.state)
const state = {
    view: 'clients',              // Current view
    selectedClient: null,         // Selected client ID
    selectedProject: null,        // Selected project ID
    clients: [],                  // Loaded clients
    projects: [],                 // Loaded projects
    invoices: [],                 // Loaded invoices
    suppliers: [],                // Loaded suppliers
    orders: [],                   // Loaded orders
    workAssignments: [],          // Work schedule data
    // ... more state properties
};

// Update pattern
state.selectedClient = clientId;
state.view = 'projects';
render(); // Always render after state changes
```

---

## Development Workflows

### Git Workflow

**Branch Naming Convention:**
- Feature branches: `feature-name` or `add-feature-name`
- Bug fixes: `fix-bug-description`
- Main branch: Protected, requires approval

**Standard Development Cycle:**

```bash
# 1. Create feature branch
git checkout -b feature-client-search

# 2. Make changes and commit
git add .
git commit -m "Add client search functionality"

# 3. Push to remote
git push -u origin feature-client-search

# 4. Deploy feature branch to production for testing
firebase deploy

# 5. Manual testing on production
# - Open production URL
# - Test the feature thoroughly
# - Verify functionality

# 6. After testing passes, wait for user approval

# 7. After approval, merge to main
git checkout main
git merge feature-client-search
git push origin main

# 8. Deploy stable main branch
firebase deploy
```

**CRITICAL Git Rules:**
- ⚠️ **NEVER commit directly to main branch**
- ⚠️ **ALWAYS wait for user approval before merging to main**
- ⚠️ **ALWAYS test on deployed feature branch before merging**
- ✅ Footer must show current version and branch name

### Firebase Deployment

**Commands:**
```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Local development with emulators
firebase emulators:start
```

**Emulator Ports:**
- Auth: 9099
- Firestore: 8080
- Storage: 9199
- Emulator UI: 4000

### Testing Workflow

```bash
# Run all tests
npm test

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test
npm test -- --testNamePattern="pattern"
```

---

## Key Conventions

### 1. CRITICAL: index.html Best Practices

**⚠️ APPLY INTELLIGENTLY - This is the most important convention!**

**Purpose of index.html:**
- ✅ UI structure and layout
- ✅ Navigation elements
- ✅ Rendering and DOM manipulation
- ✅ Event listener bindings (that delegate to components)

**❌ AVOID in index.html:**
- Business logic (belongs in component files)
- Data processing functions (belongs in components or utils)
- Firebase operations (belongs in components)
- Complex calculations (belongs in utils or components)
- Feature-specific code (belongs in respective component files)

**Decision Matrix:**
```
"Where does this code belong?"

Client-specific logic          → components/clients.js
Order processing               → components/orders.js
Project calculations           → components/projects.js
Shared utility function        → shared/utils.js
Just rendering UI from state   → index.html ✅
```

**Goal:** Prevent monolithic app. Keep index.html lean and focused.

### 2. File Location Guide

| Task | File Location |
|------|---------------|
| Add client functionality | `components/clients.js` |
| Add project functionality | `components/projects.js` |
| Add order functionality | `components/orders.js` |
| Add supplier functionality | `components/suppliers.js` |
| Add work schedule functionality | `components/sidur.js` |
| Add settings functionality | `components/settings.js` |
| Add shared constants | `shared/constants.js` |
| Add helper/utility function | `shared/utils.js` |
| Modify state structure | `shared/state.js` |
| App initialization changes | `app.js` |
| **UI/Rendering/Navigation ONLY** | `index.html` |

### 3. Naming Conventions

**JavaScript:**
- Constants: `UPPERCASE_WITH_UNDERSCORES`
- Functions: `camelCase`
- Variables: `camelCase`
- File names: `kebab-case.js`
- Component init functions: `initComponentName()`

**Hebrew UI Text:**
- All user-facing text must be in Hebrew
- Error messages in Hebrew
- Button labels in Hebrew
- Status names in Hebrew

**Common Hebrew Terms:**
```javascript
// Status values
'פתוח'      // Open
'אומדן'     // Estimate
'הזמנה'     // Order
'בביצוע'    // In Progress
'חשבון'     // Invoice
'לתשלום'    // For Payment
'שולם'      // Paid

// UI Labels
'הוסף לקוח'       // Add client
'פרויקט חדש'      // New project
'הזמנת רכש'       // Purchase order
'סידור עבודה'     // Work schedule
'חשבונית'         // Invoice
```

### 4. Firebase Patterns

**Always use async/await:**
```javascript
async function addClient() {
    try {
        const docRef = await db.collection('clients').add(data);
        state.clients.push({ id: docRef.id, ...data });
        render();
    } catch (error) {
        console.error('Error adding client:', error);
        alert('שגיאה בהוספת לקוח');
    }
}
```

**Subcollection Pattern:**
```javascript
// Projects are subcollections of clients
db.collection('clients').doc(clientId)
  .collection('projects').doc(projectId)

// Invoices are subcollections of projects
db.collection('clients').doc(clientId)
  .collection('projects').doc(projectId)
  .collection('invoices').doc(invoiceId)
```

### 5. State Update Pattern

```javascript
// ALWAYS follow this sequence:
// 1. Perform operation
// 2. Update state
// 3. Call render()

async function updateClient(clientId, updates) {
    await db.collection('clients').doc(clientId).update(updates);

    // Update local state
    const client = state.clients.find(c => c.id === clientId);
    Object.assign(client, updates);

    // Render UI
    render();
}
```

### 6. Error Handling

```javascript
// Always wrap async operations in try-catch
try {
    await firestoreOperation();
    state.update();
    render();
} catch (error) {
    console.error('Descriptive error message:', error);
    alert('Hebrew error message for user');
}
```

### 7. Date Handling

```javascript
// Use Israeli locale for dates
const date = new Date().toLocaleDateString('he-IL');

// Or use utility functions
import { formatDate } from './shared/utils.js';
const formatted = formatDate(new Date());

// Store dates in ISO format
const isoDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
```

### 8. Currency Formatting

```javascript
import { formatCurrency } from './shared/utils.js';

// Format with ₪ symbol and commas
const formatted = formatCurrency(10000); // "₪10,000"
```

### 9. Worker IDs and Names

```javascript
// Worker ID mapping (from constants.js)
const WORKERS = {
    'a': 'יאסר',
    'b': 'פריד',
    'c': 'חמודי',
    'd': 'סלימאן',
    'e': 'מישל'
};
```

### 10. Component Export Pattern

```javascript
// Always export component initialization function
export function initComponentName(context) {
    // ... implementation

    return {
        functionName1,
        functionName2,
        // Only export functions that need to be public
    };
}
```

---

## Testing Guidelines

### Test Organization

```
tests/
├── unit/                    # Unit tests (isolated functions)
│   ├── state.test.js
│   ├── calculations.test.js
│   ├── date-handling.test.js
│   └── validation.test.js
├── integration/             # Integration tests (Firebase)
│   ├── firebase.test.js
│   ├── simple-firebase.test.js
│   └── app-flow.test.js
└── ui/                      # UI/E2E tests (Puppeteer)
    ├── rendering.test.js
    ├── simple-rendering.test.js
    └── interactions.test.js
```

### Writing Tests

```javascript
// Unit test example
describe('calculateTotals', () => {
    it('should calculate project profit correctly', () => {
        const project = { /* test data */ };
        const result = calculateTotals(project, state);
        expect(result.profit).toBe(expected);
    });
});

// Integration test example
describe('Firebase operations', () => {
    it('should add client to Firestore', async () => {
        const data = { name: 'Test Client' };
        const docRef = await db.collection('clients').add(data);
        expect(docRef.id).toBeDefined();
    });
});
```

### Test Mocking

Tests use mocks for:
- Firebase Firestore operations
- Firebase Storage operations
- DOM environment (jsdom)
- Browser APIs (localStorage, fetch)

---

## Deployment Process

### Pre-Deployment Checklist

- [ ] All tests pass (`npm test`)
- [ ] No console errors in browser
- [ ] Firebase emulators work correctly
- [ ] Code follows conventions (business logic in components, not index.html)
- [ ] Hebrew text is correct
- [ ] Footer shows correct version and branch
- [ ] Git commit messages are descriptive

### Deployment Steps

1. **Test locally:**
   ```bash
   firebase emulators:start
   ```

2. **Deploy to production:**
   ```bash
   firebase deploy
   ```

3. **Manual testing on production:**
   - Open production URL
   - Test all modified features
   - Verify data persistence
   - Check mobile responsiveness

4. **Monitor for errors:**
   - Check Firebase Console for errors
   - Monitor browser console
   - Check Firestore for data integrity

### Rollback Procedure

```bash
# If deployment has issues, rollback:
git revert HEAD
git push origin main
firebase deploy
```

---

## Critical Reminders for AI Assistants

### 🚨 ALWAYS Remember

1. **Business logic goes in component files, NOT index.html**
   - Before adding code to index.html, ask: "Is this business logic?"
   - If yes → move it to the appropriate component file

2. **Never commit directly to main**
   - Always create feature branches
   - Always wait for user approval before merging

3. **Test before merging**
   - Deploy feature branch to production
   - Manually test all functionality
   - Verify no regressions

4. **Update state before rendering**
   - Pattern: Operation → Update State → render()
   - Never forget to call `render()` after state changes

5. **Use Hebrew for all UI text**
   - Error messages in Hebrew
   - Button labels in Hebrew
   - Status text in Hebrew

6. **Follow the component pattern**
   - Export `initComponentName(context)` function
   - Return object with public functions
   - Use try-catch for async operations

7. **Maintain modular architecture**
   - Each component handles ONE domain
   - Share code via `shared/` directory
   - Avoid code duplication

8. **Handle errors gracefully**
   - Always wrap async operations in try-catch
   - Show user-friendly Hebrew error messages
   - Log errors to console for debugging

### ❌ Common Mistakes to Avoid

1. **Adding business logic to index.html** ← Most common mistake!
2. Forgetting to call `render()` after state updates
3. Committing directly to main branch
4. Using English text in UI
5. Not handling Firebase errors
6. Creating duplicate state objects
7. Skipping tests before deployment
8. Not updating version in footer

### ✅ Best Practices

1. **Always read existing code before modifying**
   - Understand the current pattern
   - Follow the existing style
   - Don't introduce new patterns without reason

2. **Keep components focused**
   - Single responsibility principle
   - Clear separation of concerns
   - Easy to test and maintain

3. **Document your changes**
   - Add comments for complex logic
   - Update CHANGELOG.md
   - Update relevant documentation

4. **Test thoroughly**
   - Write tests for new features
   - Test edge cases
   - Test on actual Firebase (not just emulators)

5. **Think about team collaboration**
   - This modular architecture prevents merge conflicts
   - Keep features in their respective files
   - Don't modify multiple components unnecessarily

---

## Quick Reference

### Common Commands

```bash
# Development
npm test                      # Run tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report
npm run serve                # Firebase emulators
firebase emulators:start     # Same as above

# Deployment
firebase deploy              # Deploy everything
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules

# Git
git checkout -b feature-name # Create branch
git add .                    # Stage changes
git commit -m "message"      # Commit
git push -u origin branch    # Push branch
```

### File Locations Cheat Sheet

```
Client code      → components/clients.js
Project code     → components/projects.js
Order code       → components/orders.js
Supplier code    → components/suppliers.js
Work schedule    → components/sidur.js
Settings         → components/settings.js
Constants        → shared/constants.js
Utilities        → shared/utils.js
State structure  → shared/state.js
App init         → app.js
UI/Rendering     → index.html (ONLY for UI!)
```

### Important State Properties

```javascript
state.view                // Current view
state.selectedClient      // Selected client ID
state.selectedProject     // Selected project ID
state.clients            // All clients
state.projects           // All projects
state.invoices           // All invoices
state.suppliers          // All suppliers
state.orders             // All orders
state.workAssignments    // Work schedule data
```

### Utility Functions (shared/utils.js)

```javascript
formatDate(date)                    // Format date for display
formatCurrency(amount)              // Format with ₪ symbol
getStatusColorClass(status)         // Get Tailwind color classes
getHebrewDayName(date)             // Hebrew day names
getHebrewMonthName(date)           // Hebrew month names
calculateTotals(project, state)    // Calculate project financials
```

### Firebase Collections

```
clients                  // Client records
clients/{id}/projects    // Projects (subcollection)
clients/{id}/projects/{id}/invoices  // Invoices (subcollection)
suppliers               // Supplier records
orders                  // Purchase orders
orderCounter            // Order number counter
workAssignments         // Work schedule
workerExpenses          // Worker expense tracking
```

---

## Additional Resources

### Documentation Files

- `QUICK_START.md` - 2-minute setup guide
- `ARCHITECTURE.md` - Detailed system architecture (29KB)
- `COMPONENT_STRUCTURE.md` - Component reference guide
- `REFACTORING_COMPLETE.md` - Refactoring summary
- `SIDUR_README.md` - Work schedule feature docs
- `CHANGELOG.md` - Version history
- `tests/README.md` - Testing documentation

### Cursor Rules (.cursor/rules/)

The project includes detailed cursor rules that provide context-aware guidance:
- `architecture.mdc` - Architecture patterns
- `patterns-examples.mdc` - Code patterns and examples
- `firebase-patterns.mdc` - Firebase best practices
- `state-management.mdc` - State handling patterns
- `hebrew-rtl.mdc` - Hebrew/RTL conventions
- `quick-reference.mdc` - Quick reference guide

---

## Version History

**Current Version:** 1.3.5

### Recent Changes
- Modular architecture refactoring (v1.3.5)
- Settings component with worker rates and PDF templates
- PDF utilities extraction
- Footer version and branch display
- Sidur (work schedule) calendar improvements
- Date handling fixes

See `CHANGELOG.md` for complete version history.

---

## Contact & Support

For questions about this codebase:
1. Read the documentation files first
2. Check the `.cursor/rules/` directory for specific guidance
3. Review `ARCHITECTURE.md` for system design
4. Consult `COMPONENT_STRUCTURE.md` for component details

---

## Final Checklist for AI Assistants

Before completing any task, verify:

- [ ] Business logic is in component files, NOT index.html
- [ ] State is updated before calling `render()`
- [ ] All UI text is in Hebrew
- [ ] Error handling with try-catch blocks
- [ ] Tests are written and passing
- [ ] Code follows the component pattern
- [ ] Documentation is updated if needed
- [ ] Git workflow is followed (feature branch → test → approve → merge)
- [ ] Footer shows correct version and branch
- [ ] No console errors in browser

**Remember:** This modular architecture was created to prevent merge conflicts and enable team collaboration. Keep it that way by always putting business logic in the appropriate component files!

---

*Last Updated: 2025-11-16*
*Document Version: 1.0*
