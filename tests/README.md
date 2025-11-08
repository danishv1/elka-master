# Invoice Manager Test Suite

This directory contains comprehensive tests for the Invoice Manager application.

## Test Structure

### Unit Tests (`tests/unit/`)
- **`state.test.js`** - Tests for application state management
- **`calculations.test.js`** - Tests for calculation functions (totals, profits, margins)
- **`date-handling.test.js`** - Tests for date conversion and formatting
- **`validation.test.js`** - Tests for input validation functions

### Integration Tests (`tests/integration/`)
- **`firebase.test.js`** - Tests for Firebase operations (CRUD, batch operations)
- **`app-flow.test.js`** - Tests for complete application workflows

### UI Tests (`tests/ui/`)
- **`rendering.test.js`** - Tests for UI rendering functions
- **`interactions.test.js`** - Tests for user interactions and form handling

## Test Configuration

The test suite uses Jest with the following configuration:
- **Test Environment**: jsdom (for DOM testing)
- **Setup File**: `tests/setup.js` (mocks Firebase and DOM)
- **Coverage**: Includes all JavaScript files in `public/` and `functions/`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/unit/calculations.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="Date Handling"
```

## Test Coverage

The test suite covers:

### Core Functionality
- ✅ State management
- ✅ Data calculations (totals, profits, margins)
- ✅ Date handling and conversion
- ✅ Input validation
- ✅ Form interactions

### Firebase Operations
- ✅ Client CRUD operations
- ✅ Project CRUD operations
- ✅ Invoice CRUD operations
- ✅ File upload to storage
- ✅ Batch operations
- ✅ Error handling

### UI Components
- ✅ View rendering (clients, projects, invoices)
- ✅ Form rendering and interactions
- ✅ Modal handling
- ✅ Navigation
- ✅ Status display

### Application Flows
- ✅ Complete client-project-invoice workflow
- ✅ Data consistency
- ✅ Error handling
- ✅ State transitions

## Mocking

The test suite includes comprehensive mocks for:
- **Firebase Firestore** - Database operations
- **Firebase Storage** - File upload operations
- **DOM Environment** - Browser APIs
- **Global Functions** - Application functions

## Test Data

Tests use realistic mock data that matches the application's data structure:
- Client objects with name, email, phone, notes
- Project objects with revenue, status, creation date
- Invoice objects with supplier, amount, date, attachments
- File objects with name, type, size, data

## Best Practices

1. **Isolation** - Each test is independent and doesn't affect others
2. **Mocking** - External dependencies are properly mocked
3. **Coverage** - All critical paths are tested
4. **Realistic Data** - Tests use data that matches production
5. **Error Cases** - Both success and failure scenarios are tested

## Adding New Tests

When adding new functionality:

1. **Unit Tests** - Test individual functions in isolation
2. **Integration Tests** - Test complete workflows
3. **UI Tests** - Test user interactions and rendering
4. **Update Mocks** - Add new mocks as needed
5. **Update Coverage** - Ensure new code is covered

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with debug output
npm test -- --detectOpenHandles

# Run specific test with debug
npm test -- --testNamePattern="should calculate correct totals" --verbose
```

## Continuous Integration

The test suite is designed to run in CI environments:
- No external dependencies
- Deterministic results
- Fast execution
- Comprehensive coverage
