// ===== PDF UTILITIES =====
// Shared utilities for PDF generation

// Cache for Hebrew fonts
let hebrewFontBytes = null;
let hebrewBoldFontBytes = null;

/**
 * Load Hebrew Regular font (Noto Sans Hebrew)
 * Fetches from Google Fonts CSS API which returns the actual font URL
 */
export async function loadHebrewFont() {
    if (hebrewFontBytes) {
        console.log('Using cached Hebrew font');
        return hebrewFontBytes;
    }

    try {
        console.log('Fetching Hebrew font (Noto Sans Hebrew Regular)...');
        
        // Fetch the CSS file from Google Fonts
        const cssUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400&display=swap';
        const cssResponse = await fetch(cssUrl);
        const cssText = await cssResponse.text();
        
        // Extract the font URL from the CSS using regex
        // Look for url(...) in the @font-face rule
        const fontUrlMatch = cssText.match(/url\(([^)]+)\)/);
        
        if (fontUrlMatch && fontUrlMatch[1]) {
            const fontUrl = fontUrlMatch[1].replace(/['"]/g, ''); // Remove quotes
            console.log('Found font URL from Google Fonts CSS:', fontUrl);
            
            // Fetch the actual font file
            const fontResponse = await fetch(fontUrl);
            if (fontResponse.ok) {
                hebrewFontBytes = await fontResponse.arrayBuffer();
                console.log('Hebrew font (Regular) loaded successfully');
                return hebrewFontBytes;
            }
        }
        
        throw new Error('Failed to extract or fetch Hebrew font from Google Fonts');
    } catch (error) {
        console.error('Error loading Hebrew font:', error);
        throw error;
    }
}

/**
 * Load Hebrew Bold font (Noto Sans Hebrew Bold)
 * Fetches from Google Fonts CSS API which returns the actual font URL
 */
export async function loadHebrewBoldFont() {
    if (hebrewBoldFontBytes) {
        console.log('Using cached Hebrew Bold font');
        return hebrewBoldFontBytes;
    }

    try {
        console.log('Fetching Hebrew Bold font (Noto Sans Hebrew Bold)...');
        
        // Fetch the CSS file from Google Fonts
        const cssUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@700&display=swap';
        const cssResponse = await fetch(cssUrl);
        const cssText = await cssResponse.text();
        
        // Extract the font URL from the CSS using regex
        // Look for url(...) in the @font-face rule
        const fontUrlMatch = cssText.match(/url\(([^)]+)\)/);
        
        if (fontUrlMatch && fontUrlMatch[1]) {
            const fontUrl = fontUrlMatch[1].replace(/['"]/g, ''); // Remove quotes
            console.log('Found font URL from Google Fonts CSS:', fontUrl);
            
            // Fetch the actual font file
            const fontResponse = await fetch(fontUrl);
            if (fontResponse.ok) {
                hebrewBoldFontBytes = await fontResponse.arrayBuffer();
                console.log('Hebrew font (Bold) loaded successfully');
                return hebrewBoldFontBytes;
            }
        }
        
        throw new Error('Failed to extract or fetch Hebrew Bold font from Google Fonts');
    } catch (error) {
        console.error('Error loading Hebrew Bold font:', error);
        throw error;
    }
}

/**
 * Reverse Hebrew text for RTL display while preserving numbers and punctuation
 */
export function reverseHebrewText(text) {
    if (!text) return '';
    
    const segments = [];
    let currentSegment = '';
    let currentType = null;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charCode = char.charCodeAt(0);
        let charType;
        
        if ((charCode >= 0x0590 && charCode <= 0x05FF) || 
            (charCode >= 0xFB1D && charCode <= 0xFB4F)) {
            charType = 'hebrew';
        } else if (char >= '0' && char <= '9') {
            charType = 'number';
        } else {
            charType = 'other';
        }

        if (currentType !== null && currentType !== charType) {
            segments.push({ text: currentSegment, type: currentType });
            currentSegment = char;
            currentType = charType;
        } else {
            currentSegment += char;
            currentType = charType;
        }
    }

    if (currentSegment) {
        segments.push({ text: currentSegment, type: currentType });
    }

    segments.reverse();
    const result = segments.map(seg => {
        if (seg.type === 'hebrew') {
            return seg.text.split('').reverse().join('');
        }
        return seg.text;
    }).join('');

    return result;
}

/**
 * Format numbers with thousand separators
 */
export function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0.00';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Wrap text to fit within a given width
 */
export function wrapText(text, maxWidth, font, fontSize) {
    if (!text) return [];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
}

/**
 * Define professional color scheme
 */
export const pdfColors = {
    primary: { r: 0.2, g: 0.4, b: 0.7 },        // Professional blue
    secondary: { r: 0.95, g: 0.95, b: 0.95 },   // Light gray
    darkGray: { r: 0.3, g: 0.3, b: 0.3 },       // Dark gray
    black: { r: 0, g: 0, b: 0 },                // Black
    white: { r: 1, g: 1, b: 1 }                 // White
};


