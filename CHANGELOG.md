# Changelog

All notable changes to the Invoice Manager project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

