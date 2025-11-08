// Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyBcTVHDCONaXRN7cDkYcTMLNS9rVcIQFjw",
    authDomain: "elka-73bb6.firebaseapp.com",
    projectId: "elka-73bb6",
    storageBucket: "elka-73bb6.firebasestorage.app",
    messagingSenderId: "922263387717",
    appId: "1:922263387717:web:f64a6703fd27b82db5ad2c",
    measurementId: "G-K075PYBHVG"
};

// Google Cloud Vision API key (to be configured)
export const GOOGLE_VISION_API_KEY = 'YOUR_API_KEY_HERE';

// OCR configuration
export const OCR_CONFIG = {
    defaultMethod: 'tesseract',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
};

// Session management
export const SESSION_DURATION_DAYS = 7; // 1 week
export const INACTIVITY_TIMEOUT_HOURS = 24; // 24 hours

// Authentication restrictions
export const ALLOWED_DOMAIN = 'elka-hashmal.co.il';
export const EMAIL_WHITELIST = [
    'admin@elka-hashmal.co.il',
    'manager@elka-hashmal.co.il',
    // Add more whitelisted emails here
];

// App constants
export const categories = [
    'בטון ומוצריו',
    'כבלים',
    'צנרת',
    'חשמל',
    'מים',
    'ביוב',
    'עבודות עפר',
    'שונות'
];

export const projectStatuses = ['פתוח', 'אומדן', 'הזמנה', 'בביצוע', 'חשבון', 'לתשלום', 'שולם'];

// Development mode detection
export const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

