// Simple Jest setup file for testing (without jsdom issues)
// Mock DOM environment
global.window = {
  location: { href: 'http://localhost' },
  navigator: { userAgent: 'jest' },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.document = {
  getElementById: jest.fn(() => ({
    innerHTML: '',
    onclick: null,
    onchange: null
  })),
  createElement: jest.fn(() => ({
    innerHTML: '',
    onclick: null,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  body: {
    innerHTML: '',
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

global.navigator = {
  userAgent: 'jest'
};

// Mock Firebase
global.firebase = {
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
      get: jest.fn(),
      doc: jest.fn(() => ({
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn(() => ({
        get: jest.fn()
      }))
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn()
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date())
    }
  })),
  storage: jest.fn(() => ({
    ref: jest.fn(() => ({
      putString: jest.fn(() => Promise.resolve()),
      getDownloadURL: jest.fn(() => Promise.resolve('mock-url'))
    }))
  }))
};

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock alert and confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Mock JSON methods
global.JSON = {
  ...JSON,
  stringify: jest.fn(JSON.stringify),
  parse: jest.fn(JSON.parse)
};
