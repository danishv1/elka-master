#!/usr/bin/env node

/**
 * Script to create hybrid index.html
 * Combines the modular imports with existing index.html content
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public', 'index.html');
const hybridTemplatePath = path.join(__dirname, 'public', 'index-hybrid.html');
const outputPath = path.join(__dirname, 'public', 'index-hybrid-complete.html');

console.log('📝 Reading files...');

// Read original index.html
const originalContent = fs.readFileSync(indexPath, 'utf8');

// Read hybrid template
const hybridTemplate = fs.readFileSync(hybridTemplatePath, 'utf8');

// Extract the script section from original (everything after line 44)
const scriptStart = originalContent.indexOf('    <script>\n        // Firebase Configuration');
const scriptContent = originalContent.substring(scriptStart);

// Find where to insert in template
const insertMarker = '    <script>\n        // Your existing Firebase';
const insertIndex = hybridTemplate.indexOf(insertMarker);

if (insertIndex === -1) {
    console.error('❌ Could not find insertion point in template');
    process.exit(1);
}

// Create the hybrid content
const beforeInsert = hybridTemplate.substring(0, insertIndex);
const afterInsert = '\n</body>\n</html>';

const hybridComplete = beforeInsert + scriptContent.trim() + '\n' + afterInsert;

// Write the complete hybrid file
fs.writeFileSync(outputPath, hybridComplete, 'utf8');

console.log('✅ Created:', outputPath);
console.log('📊 File size:');
console.log(`   Original: ${originalContent.length} chars`);
console.log(`   Hybrid: ${hybridComplete.length} chars`);
console.log('\n🎯 Next steps:');
console.log('1. Review: public/index-hybrid-complete.html');
console.log('2. Test locally');
console.log('3. If working, rename to index.html');
console.log('4. Deploy');

