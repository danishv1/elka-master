import { state } from './state.js';
import { OCR_CONFIG, GOOGLE_VISION_API_KEY } from './config.js';
import { fileToBase64 } from './utils/file-utils.js';

/**
 * Process invoice image with selected OCR method
 */
export async function processInvoiceWithOCR(file, method = 'tesseract') {
    state.ocrProcessing = true;
    state.ocrProgress = 0;
    
    try {
        console.log('Starting OCR processing with method:', method);
        let extractedText;
        
        if (method === 'google') {
            extractedText = await processWithGoogleVision(file);
        } else {
            extractedText = await processWithTesseract(file);
        }
        
        console.log('Extracted text:', extractedText);
        const invoiceData = parseInvoiceText(extractedText);
        console.log('Parsed invoice data:', invoiceData);
        
        state.ocrResults = invoiceData;
        state.ocrProcessing = false;
    } catch (error) {
        console.error('OCR Error:', error);
        state.ocrProcessing = false;
        alert('שגיאה בסריקת החשבונית: ' + error.message);
    }
}

/**
 * Process with Tesseract.js (free, client-side)
 */
async function processWithTesseract(file) {
    console.log('Processing with Tesseract.js...');
    
    const worker = await Tesseract.createWorker('heb+eng', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                state.ocrProgress = Math.round(m.progress * 100);
                console.log(`OCR Progress: ${state.ocrProgress}%`);
            }
        }
    });
    
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
}

/**
 * Process with Google Cloud Vision API (premium, more accurate)
 */
async function processWithGoogleVision(file) {
    console.log('Processing with Google Cloud Vision...');
    
    if (GOOGLE_VISION_API_KEY === 'YOUR_API_KEY_HERE') {
        throw new Error('Google Vision API key not configured. Please add your API key in config.js');
    }
    
    const base64 = await fileToBase64(file);
    
    const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: base64 },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
                }]
            })
        }
    );
    
    const data = await response.json();
    
    if (data.responses[0].error) {
        throw new Error(data.responses[0].error.message);
    }
    
    return data.responses[0].fullTextAnnotation?.text || '';
}

/**
 * Parse extracted text to structured invoice data
 */
function parseInvoiceText(text) {
    const invoiceData = {
        supplier: '',
        date: '',
        items: [],
        total: ''
    };
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract supplier (first meaningful line)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        // Skip lines that look like phone numbers or addresses
        if (!line.match(/\d{2,3}-\d{7}/) && !line.match(/^[\d\s-]+$/) && line.length > 3) {
            invoiceData.supplier = line;
            break;
        }
    }
    
    // Extract date (Israeli format DD/MM/YYYY or DD.MM.YYYY)
    const dateRegex = /(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{2,4})/;
    for (const line of lines) {
        const dateMatch = line.match(dateRegex);
        if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            let year = dateMatch[3];
            if (year.length === 2) year = '20' + year;
            invoiceData.date = `${year}-${month}-${day}`;
            break;
        }
    }
    
    // Extract amounts (numbers with ₪ or numbers followed by currency indicators)
    const amountRegex = /[\d,]+\.?\d*\s*₪|₪\s*[\d,]+\.?\d*/g;
    const amounts = [];
    
    for (const line of lines) {
        const matches = line.match(amountRegex);
        if (matches) {
            matches.forEach(match => {
                const cleanAmount = match.replace(/[₪,\s]/g, '');
                const amount = parseFloat(cleanAmount);
                if (amount > 0) amounts.push(amount);
            });
        }
    }
    
    // Create items from amounts
    if (amounts.length > 0) {
        amounts.sort((a, b) => b - a);
        invoiceData.total = amounts[0].toString();
        
        if (amounts.length > 1) {
            invoiceData.items = amounts.slice(1, 4).map((amount, index) => ({
                description: `פריט ${index + 1}`,
                amount: amount.toString(),
                category: 'שונות'
            }));
        } else {
            invoiceData.items = [{
                description: 'חשבונית',
                amount: amounts[0].toString(),
                category: 'שונות'
            }];
        }
    }
    
    // If no items found, create a default one
    if (invoiceData.items.length === 0) {
        invoiceData.items = [{
            description: '',
            amount: '',
            category: 'שונות'
        }];
    }
    
    return invoiceData;
}

/**
 * Handle OCR file upload
 */
export function handleOCRUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('יש לבחור קובץ תמונה (JPG, PNG, וכו\')');
        return;
    }
    
    // Validate file size
    if (file.size > OCR_CONFIG.maxFileSize) {
        alert(`גודל הקובץ חורג מ-${OCR_CONFIG.maxFileSize / (1024 * 1024)}MB`);
        return;
    }
    
    processInvoiceWithOCR(file, state.ocrMethod);
}

/**
 * Approve OCR results and fill invoice form
 */
export function approveOCRResults() {
    if (!state.ocrResults) return;
    
    state.newInvoice.supplier = state.ocrResults.supplier;
    state.newInvoice.date = state.ocrResults.date;
    state.newInvoice.items = state.ocrResults.items;
    
    state.ocrResults = null;
}

/**
 * Cancel OCR results
 */
export function cancelOCRResults() {
    state.ocrResults = null;
}

