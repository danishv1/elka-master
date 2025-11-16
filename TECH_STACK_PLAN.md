# Tech Stack Planning & Scaling Strategy
## Elka Invoice Management System

**Date:** 2025-11-16
**Current Version:** 1.3.5
**Purpose:** Strategic plan for scaling the application with new features

---

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Critical Issues & Technical Debt](#critical-issues--technical-debt)
3. [Short-term Recommendations (0-3 months)](#short-term-recommendations-0-3-months)
4. [Medium-term Roadmap (3-6 months)](#medium-term-roadmap-3-6-months)
5. [Long-term Vision (6-12 months)](#long-term-vision-6-12-months)
6. [Tech Stack Options](#tech-stack-options)
7. [Migration Strategy](#migration-strategy)
8. [Risk Assessment](#risk-assessment)
9. [Decision Matrix](#decision-matrix)

---

## Current State Analysis

### ✅ What's Working Well

| Aspect | Status | Notes |
|--------|--------|-------|
| **Modular Architecture** | ✅ Implemented | Components separated into `clients.js`, `projects.js`, etc. |
| **Firebase Backend** | ✅ Solid | Firestore, Storage, Auth working well |
| **Hebrew/RTL Support** | ✅ Good | Proper RTL layout and Hebrew text |
| **Testing Setup** | ✅ In Place | Jest configured with unit/integration tests |
| **PDF Generation** | ✅ Working | pdf-lib handling invoices |
| **OCR Processing** | ✅ Functional | Tesseract.js for text extraction |
| **Team Collaboration** | ✅ Improved | Modular structure reduces merge conflicts |

### ⚠️ Current Challenges

| Challenge | Impact | Severity |
|-----------|--------|----------|
| **index.html is 283KB** | High | 🔴 Critical |
| **~8,594 total lines of code** | Medium | 🟡 Warning |
| **No build process** | Medium | 🟡 Warning |
| **CDN dependencies** | Medium | 🟡 Warning |
| **No TypeScript** | Low | 🟢 Minor |
| **Manual state management** | Medium | 🟡 Warning |
| **No component framework** | Medium | 🟡 Warning |
| **Limited code splitting** | High | 🔴 Critical |

### Current Tech Stack

```
Frontend:
├── Language: Vanilla JavaScript (ES6)
├── UI Framework: None (Plain HTML)
├── Styling: Tailwind CSS v3.4.17 (CDN)
├── Module System: ES6 modules
└── Build Tool: None

Backend:
├── Database: Firestore (NoSQL)
├── Storage: Firebase Storage
├── Auth: Firebase Authentication
├── Functions: Cloud Functions (Node 22)
└── Hosting: Firebase Hosting

Libraries:
├── pdf-lib: v1.17.1 (PDF generation)
├── Tesseract.js: v5 (OCR)
├── PDF.js: v3.11.174 (PDF parsing)
├── Cropper.js: v1.6.1 (Image cropping)
└── All loaded via CDN (no bundling)

Development:
├── Testing: Jest v29.7.0
├── E2E: Puppeteer v24.29.1
└── Version Control: Git
```

### Performance Metrics

```
Current Load Time (estimated):
├── index.html: 283KB
├── Tailwind CSS CDN: ~3MB (uncompressed)
├── Firebase SDK: ~200KB
├── pdf-lib: ~500KB
├── Tesseract.js: ~2MB+ (with worker files)
└── Total Initial Load: ~6-7MB

Performance Issues:
❌ No code splitting - everything loads upfront
❌ No lazy loading - all components loaded immediately
❌ No caching strategy - fresh load every time
❌ CDN dependencies - multiple HTTP requests
❌ No minification - code served as-is
```

---

## Critical Issues & Technical Debt

### 🔴 Priority 1: Immediate Action Required

#### 1. **index.html is Still Monolithic (283KB)**
**Problem:** Despite modular architecture, index.html contains too much code.

**Impact:**
- Slow initial page load
- Hard to maintain
- Large bundle size
- Poor mobile performance

**Recommendation:**
```javascript
// Move ALL business logic from index.html to components
// index.html should ONLY contain:
// 1. HTML structure
// 2. Minimal initialization code
// 3. Event listener bindings

// Target: Reduce index.html to <50KB
```

#### 2. **No Build Process**
**Problem:** Using CDN links and no bundling/minification.

**Impact:**
- Multiple HTTP requests
- No tree-shaking
- No code optimization
- Larger bundle sizes
- No environment variables

**Recommendation:**
```bash
# Implement a build tool:
# Option A: Vite (fastest, modern)
# Option B: Webpack (mature, full-featured)
# Option C: Parcel (zero-config)
```

#### 3. **No Code Splitting**
**Problem:** All JavaScript loads on initial page load.

**Impact:**
- Slow Time to Interactive (TTI)
- Wasted bandwidth for unused features
- Poor mobile experience

**Recommendation:**
```javascript
// Implement lazy loading:
// - Load components on demand
// - Split routes/views
// - Dynamic imports for heavy features (OCR, PDF)
```

### 🟡 Priority 2: Important but Not Urgent

#### 4. **Manual State Management**
**Problem:** Using plain objects and manual render() calls.

**Impact:**
- Easy to forget render() calls
- No reactive updates
- Hard to debug state changes
- No time-travel debugging

**Current:**
```javascript
// Manual pattern
state.clients.push(newClient);
render(); // Easy to forget!
```

**Better Approach:**
```javascript
// Reactive pattern with Proxy or framework
state.clients.push(newClient); // Auto-renders
```

#### 5. **No TypeScript**
**Problem:** Plain JavaScript with no type safety.

**Impact:**
- Runtime errors that TypeScript would catch
- No autocomplete/IntelliSense
- Harder refactoring
- More bugs in production

**Example of preventable bugs:**
```javascript
// Current (JS): Easy to make mistakes
function calculateTotal(project) {
    return project.amount * project.quantity; // What if project is null?
}

// With TypeScript: Catches errors at compile time
function calculateTotal(project: Project): number {
    return project.amount * project.quantity; // TypeScript validates
}
```

### 🟢 Priority 3: Nice to Have

#### 6. **Component Framework Consideration**
**Problem:** Manually managing DOM updates and component lifecycle.

**When to consider:**
- Team grows beyond 2-3 developers
- UI becomes more complex
- Need better developer experience

---

## Short-term Recommendations (0-3 months)

### Phase 1: Clean Up index.html (Week 1-2)

**Goal:** Reduce index.html from 283KB to <50KB

**Action Items:**
```
1. Audit index.html for business logic
2. Move ALL logic to appropriate component files:
   ├── Client logic → components/clients.js
   ├── Project logic → components/projects.js
   ├── Order logic → components/orders.js
   ├── Supplier logic → components/suppliers.js
   └── Work schedule → components/sidur.js

3. Keep ONLY in index.html:
   ├── HTML structure
   ├── <div> placeholders for content
   ├── <script type="module"> imports
   └── Minimal initialization (call app.init())

4. Target: index.html = ~500 lines, ~30-50KB
```

**Expected Impact:**
- ✅ Faster initial load
- ✅ Easier to maintain
- ✅ Better code organization
- ✅ Reduced merge conflicts

### Phase 2: Implement Build Process (Week 3-4)

**Recommendation: Start with Vite**

**Why Vite?**
```
✅ Fastest build tool (uses esbuild)
✅ Zero config for simple projects
✅ Built-in dev server with HMR
✅ Supports TypeScript out of the box
✅ Great for Firebase projects
✅ Easy to adopt gradually
✅ Excellent documentation
```

**Implementation:**

```bash
# 1. Install Vite
npm install -D vite

# 2. Update package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}

# 3. Create vite.config.js
export default {
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
}

# 4. Update firebase.json
{
  "hosting": {
    "public": "dist",  // Changed from "public"
    "ignore": [...]
  }
}
```

**Benefits:**
- ✅ Code minification
- ✅ Tree-shaking (remove unused code)
- ✅ Fast Hot Module Replacement (HMR)
- ✅ Environment variables (.env support)
- ✅ Optimized production builds
- ✅ Better developer experience

### Phase 3: Implement Code Splitting (Week 5-6)

**Strategy:**

```javascript
// 1. Split by route/view
// app.js
async function showView(viewName) {
    switch(viewName) {
        case 'clients':
            const { initClientsComponent } = await import('./components/clients.js');
            break;
        case 'projects':
            const { initProjectsComponent } = await import('./components/projects.js');
            break;
        // etc.
    }
}

// 2. Lazy load heavy libraries
async function performOCR(image) {
    // Only load Tesseract when needed
    const Tesseract = await import('tesseract.js');
    return Tesseract.recognize(image);
}

// 3. Lazy load PDF generation
async function generatePDF() {
    const { PDFDocument } = await import('pdf-lib');
    // Generate PDF
}
```

**Expected Impact:**
```
Before:
├── Initial Load: 6-7MB
├── Time to Interactive: ~5-8 seconds
└── Mobile Performance: Poor

After:
├── Initial Load: 500KB-1MB
├── Time to Interactive: ~1-2 seconds
├── Mobile Performance: Good
└── Features load on-demand
```

---

## Medium-term Roadmap (3-6 months)

### Option A: Continue with Vanilla JS + Enhancements

**When to choose:**
- Team is small (1-3 developers)
- Feature set is relatively stable
- Performance is acceptable with optimizations
- No budget for learning curve

**Enhancements:**
```
✅ Add reactive state management (simple Proxy-based)
✅ Implement TypeScript (gradual migration)
✅ Add proper build pipeline (Vite)
✅ Implement code splitting
✅ Add e2e testing (Playwright)
✅ Improve caching strategy
```

**Tech Stack:**
```
Frontend:
├── Language: TypeScript (gradually migrate)
├── UI: Vanilla JS (enhanced with utilities)
├── Styling: Tailwind CSS (via PostCSS)
├── Build: Vite
├── State: Custom reactive (Proxy-based)
└── Testing: Jest + Playwright

Backend: (No change)
├── Firebase (Firestore, Storage, Auth, Functions)
```

**Pros:**
- ✅ No learning curve
- ✅ Keep existing code
- ✅ Gradual improvements
- ✅ Lower risk

**Cons:**
- ❌ Still manual DOM management
- ❌ Less tooling support
- ❌ Harder to hire developers

### Option B: Migrate to React

**When to choose:**
- Team is growing (3+ developers)
- Need rich, interactive UI
- Want component reusability
- Budget for learning curve
- Long-term scalability important

**Tech Stack:**
```
Frontend:
├── Framework: React 18+
├── Language: TypeScript
├── Styling: Tailwind CSS + CSS Modules
├── Build: Vite
├── State Management:
│   ├── Option 1: Zustand (simple, lightweight)
│   ├── Option 2: Jotai (atomic state)
│   └── Option 3: Redux Toolkit (enterprise)
├── Routing: React Router v6
├── Forms: React Hook Form
└── Testing: Vitest + Testing Library + Playwright

Backend: (No change)
├── Firebase (use React Firebase Hooks)
```

**Migration Path:**
```javascript
// 1. Start small - convert one component
// clients.js → ClientsList.tsx

// Before (Vanilla JS):
export function initClientsComponent(context) {
    function renderClients() {
        const html = state.clients.map(c => `<div>...</div>`).join('');
        document.getElementById('clients').innerHTML = html;
    }
}

// After (React):
export function ClientsList() {
    const [clients, setClients] = useState([]);

    return (
        <div>
            {clients.map(c => (
                <ClientCard key={c.id} client={c} />
            ))}
        </div>
    );
}

// 2. Gradually convert other components
// 3. Eventually remove index.html entirely
```

**Pros:**
- ✅ Huge ecosystem
- ✅ Component reusability
- ✅ Declarative UI
- ✅ Great tooling
- ✅ Easy to hire developers
- ✅ Server-side rendering possible

**Cons:**
- ❌ Learning curve
- ❌ Migration effort (2-3 months)
- ❌ Need to rewrite components
- ❌ Larger bundle size initially

### Option C: Migrate to Vue 3

**When to choose:**
- Want framework benefits but easier learning curve
- Team prefers template-based syntax
- Want progressive enhancement
- Similar to current HTML structure

**Tech Stack:**
```
Frontend:
├── Framework: Vue 3 (Composition API)
├── Language: TypeScript
├── Styling: Tailwind CSS + Scoped CSS
├── Build: Vite (official Vue support)
├── State Management: Pinia (official store)
├── Routing: Vue Router v4
├── Forms: VeeValidate
└── Testing: Vitest + Vue Test Utils + Playwright

Backend: (No change)
├── Firebase (use VueFire)
```

**Migration Path:**
```vue
<!-- Before (index.html) -->
<div id="clients">
    <!-- Rendered by JS -->
</div>

<!-- After (ClientsList.vue) -->
<template>
    <div class="clients-container">
        <ClientCard
            v-for="client in clients"
            :key="client.id"
            :client="client"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { collection, getDocs } from 'firebase/firestore';

const clients = ref([]);

onMounted(async () => {
    const snapshot = await getDocs(collection(db, 'clients'));
    clients.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
});
</script>
```

**Pros:**
- ✅ Easier learning curve than React
- ✅ Great documentation
- ✅ Progressive adoption
- ✅ Excellent TypeScript support
- ✅ Official Firebase integration (VueFire)
- ✅ Smaller bundle size than React

**Cons:**
- ❌ Smaller ecosystem than React
- ❌ Fewer developers available
- ❌ Migration effort (2-3 months)

### Option D: Migrate to Svelte

**When to choose:**
- Want smallest bundle size
- Team is small and agile
- Performance is critical
- Like compile-time optimization

**Tech Stack:**
```
Frontend:
├── Framework: Svelte 4 / SvelteKit
├── Language: TypeScript
├── Styling: Tailwind CSS + Svelte CSS
├── Build: Vite
├── State Management: Svelte stores
├── Routing: SvelteKit (built-in)
└── Testing: Vitest + Testing Library + Playwright

Backend: (No change)
├── Firebase
```

**Pros:**
- ✅ Smallest bundle size
- ✅ Simplest syntax
- ✅ No virtual DOM overhead
- ✅ Built-in reactivity
- ✅ Great performance

**Cons:**
- ❌ Smallest ecosystem
- ❌ Hardest to hire for
- ❌ Less mature tooling
- ❌ Fewer libraries/integrations

---

## Long-term Vision (6-12 months)

### Advanced Features to Consider

#### 1. **Offline Support (PWA)**
```javascript
// Service Worker for offline functionality
// - Cache Firebase data locally
// - Sync when back online
// - Work without internet

Tech:
├── Service Worker
├── IndexedDB
├── Firebase Offline Persistence
└── Background Sync API
```

#### 2. **Real-time Collaboration**
```javascript
// Multiple users editing simultaneously
// Firebase Realtime Database or Firestore snapshots

Features:
├── Live updates across devices
├── Presence indicators
├── Conflict resolution
└── Change notifications
```

#### 3. **Advanced PDF Features**
```javascript
// - Custom templates
// - Batch generation
// - Email integration
// - Digital signatures

Libraries:
├── pdf-lib (current)
├── jsPDF (alternative)
└── pdfmake (templates)
```

#### 4. **Analytics & Reporting**
```javascript
// Business intelligence
// - Revenue tracking
// - Project profitability
// - Worker productivity
// - Client analysis

Tools:
├── Firebase Analytics
├── Google Analytics 4
├── Custom dashboards (Chart.js)
└── Data exports
```

#### 5. **Mobile App**
```javascript
// Native mobile apps

Options:
├── React Native (if using React)
├── Capacitor (web → native)
├── Flutter (separate codebase)
└── PWA (simplest, current tech)
```

#### 6. **Multi-language Support**
```javascript
// Expand beyond Hebrew

Libraries:
├── i18next
├── vue-i18n (if Vue)
└── react-i18next (if React)

Languages:
├── Hebrew (current)
├── English
├── Arabic (RTL)
└── Russian
```

#### 7. **Advanced Security**
```javascript
// - Role-based access control (RBAC)
// - Audit logs
// - Data encryption
// - Two-factor authentication

Firebase Features:
├── Custom Claims
├── Security Rules
├── App Check
└── Firebase Auth MFA
```

---

## Tech Stack Options Summary

### Comparison Matrix

| Factor | Vanilla JS+ | React | Vue 3 | Svelte |
|--------|------------|-------|-------|--------|
| **Learning Curve** | None (current) | Medium | Low-Medium | Low |
| **Migration Effort** | Low (1 week) | High (2-3 months) | Medium (2 months) | Medium (2 months) |
| **Bundle Size** | Medium | Large | Medium | Small |
| **Performance** | Good | Good | Great | Excellent |
| **Ecosystem** | Limited | Huge | Large | Small |
| **Hiring** | Hard | Easy | Medium | Hard |
| **TypeScript** | Need to add | Excellent | Excellent | Good |
| **State Mgmt** | Custom | Many options | Pinia | Built-in |
| **Tooling** | Basic | Excellent | Great | Good |
| **Long-term** | Risky | Solid | Solid | Growing |
| **Firebase Integration** | Manual | Good | VueFire | Manual |
| **RTL Support** | Current ✅ | Need CSS | Need CSS | Need CSS |
| **Cost** | $0 | $0 | $0 | $0 |

### Recommendation by Team Size

```
1-2 Developers:
└── Vanilla JS + TypeScript + Vite
    Reason: Keep it simple, avoid framework overhead

3-5 Developers:
└── Vue 3 + TypeScript + Vite
    Reason: Best balance of power vs. complexity

5+ Developers or Enterprise:
└── React + TypeScript + Vite
    Reason: Best ecosystem, easiest hiring

Performance-Critical:
└── Svelte + TypeScript + Vite
    Reason: Smallest bundles, best performance
```

---

## Migration Strategy

### Gradual Migration (Recommended)

**Phase 1: Foundation (Month 1)**
```bash
Week 1-2: Clean up index.html
Week 3-4: Add Vite build process
```

**Phase 2: Optimization (Month 2)**
```bash
Week 1-2: Implement code splitting
Week 3-4: Add TypeScript (start with new files)
```

**Phase 3: Framework Decision (Month 3)**
```bash
Week 1: Team evaluation and decision
Week 2-4: Convert 1-2 components to chosen framework
```

**Phase 4: Full Migration (Month 4-6)**
```bash
Convert remaining components one by one
Run old and new versions in parallel
Full cutover when ready
```

### Big Bang Migration (Not Recommended)

```
❌ Stop all feature development
❌ Rewrite everything at once
❌ High risk of bugs
❌ Long downtime
❌ Difficult to test
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Framework choice regret** | Medium | High | Gradual migration, easy to reverse |
| **Migration bugs** | High | Medium | Comprehensive testing, parallel running |
| **Performance regression** | Low | High | Benchmarking before/after |
| **Breaking Firebase integration** | Low | High | Thorough integration tests |
| **Developer learning curve** | Medium | Medium | Training, documentation |
| **Bundle size increase** | Medium | Medium | Code splitting, lazy loading |
| **Loss of RTL/Hebrew support** | Low | High | Early testing of RTL in framework |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Feature development slowdown** | High | High | Gradual migration, keep shipping |
| **Cost increase** | Medium | Low | Open source tools, cloud costs same |
| **Team resistance** | Medium | Medium | Involve team in decision |
| **Timeline overrun** | High | Medium | Buffer time, MVP approach |

---

## Decision Matrix

### When to Stay with Vanilla JS

```
✅ Choose Vanilla JS+ if:
├── Team is 1-2 developers
├── Feature set is mostly stable
├── No budget for migration
├── Current performance is acceptable
├── No plans to hire more developers
└── Prefer simplicity over tooling
```

### When to Choose React

```
✅ Choose React if:
├── Team is 3+ developers (or growing)
├── Planning many UI features
├── Need to hire developers easily
├── Want best ecosystem/tooling
├── Building for scale
├── Considering mobile app (React Native)
└── Have 2-3 months for migration
```

### When to Choose Vue

```
✅ Choose Vue if:
├── Team size is 2-5 developers
├── Want framework benefits without React complexity
├── Prefer template-based syntax
├── Want official Firebase integration (VueFire)
├── Team has some framework experience
├── Want progressive enhancement
└── Have 2-3 months for migration
```

### When to Choose Svelte

```
✅ Choose Svelte if:
├── Team is small and agile
├── Performance is top priority
├── Bundle size is critical (mobile users)
├── Team enjoys learning new tech
├── Building new features from scratch
└── Have 2-3 months for migration
```

---

## Immediate Action Plan (Next 2 Weeks)

### Week 1: Assessment & Cleanup

**Tasks:**
```
1. [ ] Audit index.html line by line
2. [ ] Create list of functions to move
3. [ ] Move client functions to clients.js
4. [ ] Move project functions to projects.js
5. [ ] Test thoroughly after each move
6. [ ] Target: index.html < 1000 lines
```

**Success Criteria:**
- ✅ index.html reduced by 50%
- ✅ All tests passing
- ✅ No regressions

### Week 2: Build Process

**Tasks:**
```
1. [ ] Install Vite
2. [ ] Configure vite.config.js
3. [ ] Update firebase.json to use dist/
4. [ ] Test dev server: npm run dev
5. [ ] Test production build: npm run build
6. [ ] Deploy and verify
```

**Success Criteria:**
- ✅ Build completes successfully
- ✅ Production bundle is smaller
- ✅ All features work in production
- ✅ Firebase deployment works

---

## Cost Analysis

### Current Costs

```
Infrastructure:
├── Firebase Hosting: Free (< 10GB, 360MB/day)
├── Cloud Firestore: Free (< 1GB, 50K reads/day)
├── Cloud Storage: $0.026/GB (minimal usage)
├── Cloud Functions: Free (125K invocations/month)
└── Total: ~$0-5/month

Development:
├── No build tools: $0
├── No paid services: $0
└── Total: $0/month
```

### Estimated Costs After Optimization

```
Infrastructure: (No change)
├── Firebase: ~$0-5/month

Development Tools: (All free/open source)
├── Vite: $0 (open source)
├── TypeScript: $0 (open source)
├── Testing: $0 (open source)
├── Framework (React/Vue/Svelte): $0 (open source)
└── Total: $0/month

Time Investment:
├── Vite setup: ~4-8 hours
├── TypeScript migration: ~20-40 hours (gradual)
├── Framework migration: ~80-120 hours (if chosen)
└── Training: ~40-80 hours per developer
```

---

## Conclusion & Recommendation

### My Recommendation: **Staged Approach**

**Immediate (Next 2 weeks):**
```
1. Clean up index.html → Move all logic to components
2. Add Vite build process → Get modern tooling
3. Implement code splitting → Better performance
```

**Short-term (1-3 months):**
```
4. Add TypeScript gradually → Better DX and fewer bugs
5. Implement reactive state management → Simpler code
6. Improve testing coverage → More confidence
```

**Medium-term (3-6 months) - DECISION POINT:**
```
Evaluate:
├── Team size
├── Feature roadmap
├── Performance requirements
└── Budget/timeline

Then choose:
├── Stay with enhanced Vanilla JS (team < 3)
├── Migrate to Vue 3 (team 2-5, best balance)
└── Migrate to React (team 5+, enterprise needs)
```

### Why This Approach?

```
✅ Low risk - incremental improvements
✅ Fast ROI - immediate benefits
✅ Flexibility - decide on framework later
✅ No downtime - continuous deployment
✅ Learning curve - spread over time
✅ Reversible - can back out at any stage
```

### Success Metrics

```
After 2 weeks:
├── index.html: < 1000 lines (from current)
├── Build time: < 10 seconds
├── Bundle size: 30-50% reduction
└── Developer happiness: Improved

After 3 months:
├── TypeScript coverage: > 50%
├── Test coverage: > 70%
├── Page load time: < 2 seconds
├── Lighthouse score: > 90
└── Zero regression bugs

After 6 months:
├── Framework decision: Made and validated
├── Team productivity: 2x improvement
├── Onboarding time: 50% reduction
└── Feature velocity: Increased
```

---

## Next Steps

1. **Review this document with your team**
2. **Make decision on immediate actions (Week 1-2)**
3. **Set up tracking for success metrics**
4. **Schedule framework evaluation meeting (Month 3)**
5. **Create detailed migration plan based on chosen path**

---

## Resources

### Learning Resources

**Vite:**
- Official Docs: https://vitejs.dev
- Firebase + Vite: https://firebase.google.com/docs/hosting/frameworks/vite

**TypeScript:**
- Official Handbook: https://www.typescriptlang.org/docs/
- TypeScript with Firebase: https://firebase.google.com/docs/reference/js

**React (if chosen):**
- Official Docs: https://react.dev
- React + Firebase: https://github.com/CSFrequency/react-firebase-hooks

**Vue (if chosen):**
- Official Docs: https://vuejs.org
- VueFire: https://vuefire.vuejs.org

**Svelte (if chosen):**
- Official Docs: https://svelte.dev
- SvelteKit: https://kit.svelte.dev

### Tools

- Lighthouse: Performance auditing
- Bundle Analyzer: Visualize bundle size
- Chrome DevTools: Debugging
- Firebase Emulators: Local development

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Next Review:** After Week 2 cleanup

