// Jest setup file for testing
const { JSDOM } = require('jsdom');

// Polyfill TextEncoder and TextDecoder for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Additional polyfills for jsdom compatibility
global.URL = require('url').URL;
global.URLSearchParams = require('url').URLSearchParams;

// Create a DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <head></head>
    <body>
      <div id="app"></div>
    </body>
  </html>
`, {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

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
