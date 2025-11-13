# Changelog

All notable changes to the Invoice Manager project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.10] - 2025-11-13

### Added
- Comprehensive debug logging for PDF generation to identify issues
- html2pdf library availability check
- Font loading wait time (500ms) before PDF generation
- Detailed console logging at each step of PDF process

### Changed
- Enhanced error handling with specific error messages

---

## [2.1.9] - 2025-11-13

### Fixed
- **CRITICAL FIX**: Resolved blank PDF generation issue
- Fixed formatNumber() function calls in HTML template
- Numbers now properly formatted before HTML generation instead of during
- PDF generation now works correctly with proper number formatting

---

## [1.3.5] - 2025-11-11

### Fixed
- Removed worker rate editing from project view
- Worker rates now completely read-only in project view
- Added helpful link to Settings for editing rates
- Enforced Settings as the ONLY place to edit worker rates

### Changed
- Project view now shows informational message about rate management
- Replaced edit button with link to Settings page
- Improved UX by guiding users to the correct location for rate editing

---

## [1.3.4] - 2025-11-11

### Fixed
- Fixed modular components initialization by exposing global variables
- Exposed `window.db`, `window.storage`, `window.auth`, `window.state` etc.
- Settings component now properly initializes
- Edit worker rates button in Settings now works

---

## [1.3.3] - 2025-11-11

### Fixed
- Fixed edit button for worker rates not toggling edit mode
- Fixed state being reset when loadSettings() is called
- Preserved editing state across settings reloads
- Added comprehensive PDF upload validation (type, size)
- Added upload progress tracking with visual indicator
- Improved error handling for PDF uploads

### Improved
- Added console logging for debugging toggle state
- Better file validation before upload
- Real-time progress updates during PDF upload
- Success/error messages in Hebrew

---

## [1.3.2] - 2025-11-11

### Fixed
- Fixed settings view not rendering (was showing placeholder text)
- Fixed worker rate editing not working in settings page
- Fixed PDF template upload not working in settings page
- Added missing `renderSettingsView()` method to settings component
- Connected settings component renderer to main app render function

### Technical Changes
- Implemented full settings view rendering in `settings.js` component
- Updated `app.js` to call `appInstance.components.settings.renderSettingsView()`
- Settings view now fully functional with all features working

---

## [1.3.1] - 2025-11-11

### Fixed
- Removed ability to edit worker rates from project/schedule views
- Enforced Settings as the exclusive location for rate management
- Removed `updateWorkerDailyRate()` from sidur component's public API

### Changed
- Worker rates now read-only in project and schedule views
- Settings view is now the single source of truth for rate editing

---

## [1.3.0] - 2025-11-11

### Added - Global Settings for Worker Daily Rates

#### Features
- **Global Worker Rate Management**: Centralized settings page for managing worker daily rates
- **Settings View**: New dedicated settings section accessible from main navigation
- **Global Rate Storage**: Worker daily rates stored in Firestore settings collection
- **Automatic Cost Calculation**: Project worker expenses automatically calculated using global rates
- **Rate Editor**: Toggle-based editor for updating all worker rates with save functionality
#### Benefits
- **Single Source of Truth**: Worker rates managed in one place instead of per-project
- **Consistency**: All projects use the same worker rates for accurate cost calculations
- **Easy Updates**: Update a worker's rate once and it applies to all projects
- **No Manual Entry**: Eliminates need to manually enter costs in project view
- **Automatic Sync**: Rates loaded from Firebase on app startup
#### Technical Implementation
- Worker rates stored in `settings/workerRates` Firestore document
- Rates loaded into `state.workerDailyRates` object
- Functions in `sidur.js` use global rates for expense calculations:
  - `getWorkerTotalExpenses()` - Calculate total worker expenses
  - `getProjectWorkerExpenses()` - Calculate project-specific expenses with allocation
  - `getProjectWorkerExpensesDetailed()` - Detailed breakdown with allocations
- Settings component provides CRUD operations for rates
- Real-time updates across all views when rates change

#### UI/UX
- Settings accessible via navigation menu
- Clean rate editor with worker names and input fields
- Edit/Save toggle pattern for rate updates
- Success/error feedback for save operations
- Rates display with ₪ currency symbol
- Hebrew interface for all settings

---

## [1.1.0] - 2025-11-10

### Added - Sidur (Work Schedule) Enhancements

#### Features
- **Proportional Worker Allocation**: Workers assigned to multiple projects on the same day now have their time automatically split equally
- **Duplicate Prevention**: System prevents assigning the same worker to the same project twice on the same day
- **Visual Allocation Indicators**: Percentage badges (e.g., "50%", "33%") show in calendar when workers are split across projects
- **Detailed Cost Breakdowns**: Project details now show per-date allocation percentages with color coding
- **Accurate Cost Calculations**: Worker expenses calculated based on actual time allocation (e.g., ₪500 × 0.5 = ₪250)

#### UI Improvements
- Added percentage badges in calendar view for split allocations
- Added allocation breakdown in project worker expenses section
- Added info box explaining business rules in Hebrew
- Enhanced legend with visual examples
- Color-coded allocation details (orange for partial, green for full)
- Tooltips show when worker is assigned to multiple projects

#### Technical Improvements
- New calculation functions in `sidur.js`:
  - `getWorkerAllocationForProjectOnDate()` - Calculate allocation fraction
  - `getWorkerDayAllocation()` - Get all projects for worker on date
  - `getProjectWorkerExpensesDetailed()` - Detailed breakdown with allocations
- Updated `getWorkerTotalDays()` to count unique dates (not assignment count)
- Updated `getProjectWorkerExpenses()` to use proportional calculations
- Enhanced validation in `addWorkAssignment()` to prevent duplicates

#### Documentation
- Added `SIDUR_README.md` - Quick overview and getting started
- Added `SIDUR_IMPLEMENTATION.md` - Complete technical documentation
- Added `SIDUR_VISUAL_GUIDE.md` - Visual examples and UI mockups
- Added `SIDUR_TESTING_GUIDE.md` - Comprehensive test scenarios

### Changed
- Calendar view now displays allocation percentages when applicable
- Project worker expenses show fractional days (e.g., 1.83 days)
- Worker expense calculations now proportional instead of simple count

### Fixed
- Worker day counting now accurate (prevents double-counting same day)
- Project costs now correctly split when worker is on multiple projects

---

## [1.0.0] - 2024-11-XX

### Added - Initial Modular Architecture

#### Refactoring
- Split monolithic `index.html` into modular components
- Created component structure with separate files for each feature:
  - `clients.js` - Client management
  - `projects.js` - Projects and invoices
  - `suppliers.js` - Supplier management
  - `orders.js` - Order management
  - `sidur.js` - Work schedule
- Created shared utilities:
  - `constants.js` - Shared constants
  - `state.js` - Centralized state management
  - `utils.js` - Helper functions
- Created `app.js` as main coordinator

#### Documentation
- Added `FILE_STRUCTURE.txt` - Project structure overview
- Added `COMPONENT_STRUCTURE.md` - Component architecture guide
- Added `REFACTORING_COMPLETE.md` - Refactoring summary
- Added `REFACTORING_GUIDE.md` - Migration guide
- Added `QUICK_START.md` - Quick start guide
- Added `README_COMPONENTS.md` - Components overview
- Added `ARCHITECTURE.md` - System architecture

#### Features
- Maintained all original functionality
- Backwards compatible with existing data
- Improved code organization for parallel development
- Reduced merge conflicts with separated components

---

## Version History Summary

- **v1.1.0** - Sidur proportional allocation feature
- **v1.0.0** - Modular architecture refactoring
- **v0.x.x** - Original monolithic application (preserved in `index.html`)

---

## Upgrade Notes

### From 1.0.0 to 1.1.0
- No breaking changes
- Existing work assignments will work correctly
- New allocation calculations apply automatically
- Worker expenses may show different (more accurate) costs if workers were assigned to multiple projects on same days
- No data migration required
- All features backwards compatible

---

## Future Roadmap

### Planned for v1.2.0
- Custom allocation percentages (non-equal splits)
- Worker availability calendar
- Over-allocation warnings

### Planned for v1.3.0
- Excel export for schedules
- Time tracking integration
- Automated scheduling suggestions

### Planned for v2.0.0
- Mobile app
- Real-time collaboration
- Advanced reporting dashboard

---

## Contributors

Development Team - Invoice Manager Project

---

## License

Internal use - Company proprietary software

