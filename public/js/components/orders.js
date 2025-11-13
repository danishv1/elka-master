// ===== ORDERS COMPONENT =====
// Handles all order-related functionality

import { 
    loadHebrewFont, 
    loadHebrewBoldFont, 
    reverseHebrewText,
    splitHebrewAndNumbers,
    formatNumber, 
    wrapText,
    pdfColors 
} from '../utils/pdf-utils.js?v=3.2.0';

export function initOrdersComponent(context) {
    const { state, db, firebase, render, updateHistory } = context;

    // ===== ORDER FUNCTIONS =====

    async function loadOrders() {
        if (!state.user) {
            console.log('Cannot load orders: user not authenticated');
            return;
        }
        if (state.loadingOrders) {
            console.log('Already loading orders, skipping...');
            return;
        }
        try {
            state.loadingOrders = true;
            console.log('Loading orders...');
            const snapshot = await db.collection('orders').get();
            state.orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            state.orders.sort((a, b) => {
                const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
                const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
                return bTime - aTime;
            });
            console.log('Loaded orders:', state.orders.length);
            state.ordersLoaded = true;
            state.loadingOrders = false;
            render();
        } catch (error) {
            console.error('Error loading orders:', error);
            state.loadingOrders = false;
            if (state.user) {
                alert('שגיאה בטעינת הזמנות: ' + error.message);
            }
        }
    }

    async function generateOrderNumber() {
        const currentYear = new Date().getFullYear();
        const yearShort = String(currentYear).slice(-2); // e.g., "25" for 2025
        
        try {
            const counterRef = db.collection('orderCounter').doc(yearShort);
            
            // Use Firestore transaction for atomic increment
            const orderNumber = await db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                
                let counter = 1;
                if (counterDoc.exists) {
                    counter = counterDoc.data().counter + 1;
                    transaction.update(counterRef, { counter: counter });
                } else {
                    transaction.set(counterRef, { year: yearShort, counter: counter });
                }
                
                // Format: YY/XXX (e.g., 25/001)
                return `${yearShort}/${String(counter).padStart(3, '0')}`;
            });
            
            return orderNumber;
        } catch (error) {
            console.error('Error generating order number:', error);
            throw error;
        }
    }

    async function addOrder() {
        if (!state.newOrder.projectId) {
            alert('יש לבחור פרויקט');
            return;
        }
        
        if (!state.newOrder.supplierId) {
            alert('יש לבחור ספק');
            return;
        }
        
        const validItems = state.newOrder.items.filter(item => 
            item.description && item.quantity && item.price && 
            parseFloat(item.quantity) > 0 && parseFloat(item.price) > 0
        );
        
        if (validItems.length === 0) {
            alert('יש להוסיף לפחות פריט אחד עם כמות ומחיר');
            return;
        }
        
        try {
            // Calculate sums
            const itemsWithSum = validItems.map(item => ({
                ...item,
                quantity: parseFloat(item.quantity),
                price: parseFloat(item.price),
                sum: parseFloat(item.quantity) * parseFloat(item.price)
            }));
            
            const totalSum = itemsWithSum.reduce((acc, item) => acc + item.sum, 0);
            
            // Generate order number
            const orderNumber = await generateOrderNumber();
            
            // Get project and supplier names
            const project = state.allProjects.find(p => p.id === state.newOrder.projectId);
            const supplier = state.suppliers.find(s => s.id === state.newOrder.supplierId);
            
            if (!project || !supplier) {
                console.error('Project or supplier not found:', { 
                    projectId: state.newOrder.projectId, 
                    supplierId: state.newOrder.supplierId,
                    allProjects: state.allProjects,
                    suppliers: state.suppliers
                });
                alert('פרויקט או ספק לא נמצאו');
                return;
            }
            
            const orderData = {
                orderNumber: orderNumber,
                projectId: state.newOrder.projectId,
                projectName: project.name,
                supplierId: state.newOrder.supplierId,
                supplierName: supplier.name,
                items: itemsWithSum,
                totalSum: totalSum,
                orderDate: state.newOrder.orderDate,
                comments: state.newOrder.comments,
                deliveryAddress: state.newOrder.deliveryAddress,
                orderedBy: state.newOrder.orderedBy,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: state.user.uid
            };
            
            const docRef = await db.collection('orders').add(orderData);
            console.log('Order added:', docRef.id);
            
            state.orders.unshift({
                id: docRef.id,
                ...orderData,
                createdAt: new Date()
            });
            
            state.newOrder = {
                selectedClientId: '',
                projectId: '',
                supplierId: '',
                items: [{ description: '', unit: 'יח\'', quantity: '', price: '', sum: 0 }],
                orderDate: new Date().toISOString().split('T')[0],
                comments: '',
                deliveryAddress: '',
                orderedBy: ''
            };
            state.showNewOrder = false;
            render();
        } catch (error) {
            console.error('Error adding order:', error);
            alert('שגיאה בהוספת הזמנה: ' + error.message);
        }
    }

    async function updateOrder(orderId) {
        if (!state.editingOrder.projectId || !state.editingOrder.supplierId) {
            alert('יש לבחור פרויקט וספק');
            return;
        }
        
        const validItems = state.editingOrder.items.filter(item => 
            item.description && item.price && parseFloat(item.price) > 0
        );
        
        if (validItems.length === 0) {
            alert('יש להוסיף לפחות פריט אחד');
            return;
        }
        
        try {
            const itemsWithSum = validItems.map(item => ({
                ...item,
                price: parseFloat(item.price),
                sum: parseFloat(item.price)
            }));
            
            const totalSum = itemsWithSum.reduce((acc, item) => acc + item.sum, 0);
            
            const project = state.clients.flatMap(c => state.projects).find(p => p.id === state.editingOrder.projectId);
            const supplier = state.suppliers.find(s => s.id === state.editingOrder.supplierId);
            
            const updates = {
                projectId: state.editingOrder.projectId,
                projectName: project?.name || '',
                supplierId: state.editingOrder.supplierId,
                supplierName: supplier?.name || '',
                items: itemsWithSum,
                totalSum: totalSum,
                comments: state.editingOrder.comments,
                deliveryAddress: state.editingOrder.deliveryAddress,
                orderedBy: state.editingOrder.orderedBy
            };
            
            await db.collection('orders').doc(orderId).update(updates);
            
            state.orders = state.orders.map(o =>
                o.id === orderId ? { ...o, ...updates } : o
            );
            
            state.editingOrder = null;
            render();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('שגיאה בעדכון הזמנה: ' + error.message);
        }
    }

    async function deleteOrder(orderId) {
        if (!confirm('האם למחוק את ההזמנה?')) return;
        
        try {
            await db.collection('orders').doc(orderId).delete();
            state.orders = state.orders.filter(o => o.id !== orderId);
            render();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('שגיאה במחיקת הזמנה: ' + error.message);
        }
    }

    function calculateOrderTotals() {
        // Auto-calculate sums for order items in the form
        state.newOrder.items = state.newOrder.items.map(item => ({
            ...item,
            sum: item.price ? parseFloat(item.price) : 0
        }));
        render();
    }

    function addOrderItem() {
        state.newOrder.items.push({ description: '', unit: 'יח\'', quantity: '', price: '', sum: 0 });
        render();
    }

    function removeOrderItem(index) {
        if (state.newOrder.items.length > 1) {
            state.newOrder.items.splice(index, 1);
            render();
        }
    }

    function showOrdersView() {
        state.view = 'orders';
        state.selectedClient = null;
        state.selectedProject = null;
        updateHistory();
        loadOrders();
    }

    // Helper functions for UI interactions
    function showNewOrderForm() {
        state.showNewOrder = true;
        render();
    }

    function cancelNewOrder() {
        state.showNewOrder = false;
        state.newOrder = {
            selectedClientId: '',
            projectId: '',
            supplierId: '',
            items: [{ description: '', unit: 'יח\'', quantity: '', price: '', sum: 0 }],
            orderDate: new Date().toISOString().split('T')[0],
            comments: '',
            deliveryAddress: '',
            orderedBy: ''
        };
        render();
    }

    function updateNewOrder(field, value) {
        state.newOrder[field] = value;
        if (field === 'selectedClientId') {
            // Reset project when client changes
            state.newOrder.projectId = '';
        }
        render();
    }

    function updateNewOrderItem(index, field, value) {
        state.newOrder.items[index][field] = value;
        // Auto-calculate sum
        if (field === 'quantity' || field === 'price') {
            const item = state.newOrder.items[index];
            item.sum = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        }
        render();
    }

    function editOrder(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            state.editingOrder = { ...order };
            render();
        }
    }

    function cancelEdit() {
        state.editingOrder = null;
        render();
    }

    function updateEditingOrder(field, value) {
        state.editingOrder[field] = value;
    }

    function updateEditingOrderItem(index, field, value) {
        state.editingOrder.items[index][field] = value;
        // Auto-calculate sum
        if (field === 'quantity' || field === 'price') {
            const item = state.editingOrder.items[index];
            item.sum = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        }
        render();
    }

    function addEditingOrderItem() {
        state.editingOrder.items.push({ description: '', unit: 'יח\'', quantity: '', price: '', sum: 0 });
        render();
    }

    function removeEditingOrderItem(index) {
        if (state.editingOrder.items.length > 1) {
            state.editingOrder.items.splice(index, 1);
            render();
        }
    }

    // ===== PDF GENERATION =====

    // NEW: HTML-based PDF generation using html2pdf.js
    async function generateOrderPDFHTML(orderId) {
        try {
            console.log('🔍 Starting PDF generation for order:', orderId);

            const order = state.orders.find(o => o.id === orderId);
            if (!order) {
                console.error('❌ Order not found:', orderId);
                alert('הזמנה לא נמצאה');
                return;
            }
            console.log('✅ Order found:', order);

            const supplier = state.suppliers.find(s => s.id === order.supplierId);
            console.log('✅ Supplier:', supplier);
            const orderDateObj = order.orderDate ? new Date(order.orderDate) : new Date();
            const orderDate = `${String(orderDateObj.getDate()).padStart(2, '0')}/${String(orderDateObj.getMonth() + 1).padStart(2, '0')}/${orderDateObj.getFullYear()}`;

            // Helper function to preserve spaces in HTML
            const preserveSpaces = (text) => {
                if (!text) return '';
                return text.replace(/ /g, '&nbsp;');
            };

            // Helper function to format numbers with thousand separators
            const formatNumberLocal = (num) => {
                if (typeof num !== 'number' || isNaN(num)) return '0.00';
                return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };

            // Pre-format all numbers before building HTML
            const formattedItems = order.items.map(item => ({
                ...item,
                formattedPrice: formatNumberLocal(parseFloat(item.price) || 0),
                formattedSum: formatNumberLocal(parseFloat(item.sum) || 0)
            }));
            const formattedTotal = formatNumberLocal(parseFloat(order.totalSum) || 0);

            // Create HTML content with proper RTL and Unicode direction marks
            const htmlContent = `
                <!DOCTYPE html>
                <html dir="rtl" lang="he">
                <head>
                    <meta charset="UTF-8">
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        * { box-sizing: border-box; }
                        body { 
                            font-family: 'Noto Sans Hebrew', Arial, sans-serif; 
                            direction: rtl;
                            padding: 0;
                            margin: 0;
                            font-size: 12px;
                            line-height: 1.6;
                            box-sizing: border-box;
                            max-width: 100%;
                            overflow: hidden;
                        }
                        .header { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center; 
                            margin-bottom: 30px;
                            position: relative;
                        }
                        .header-title { 
                            font-size: 16px; 
                            font-weight: bold; 
                            direction: rtl; 
                            unicode-bidi: embed;
                            white-space: pre;
                            position: absolute;
                            left: 50%;
                            transform: translateX(-50%);
                        }
                        .header-date { 
                            font-size: 11px;
                            position: absolute;
                            left: 0;
                        }
                        .info-box { 
                            border: 1px solid black; 
                            padding: 12px; 
                            margin-bottom: 5px; 
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .info-cell { 
                            flex: 1;
                            padding: 0 5px;
                            direction: rtl;
                            unicode-bidi: embed;
                            white-space: pre;
                        }
                        .info-cell:first-child { text-align: right; }
                        .info-cell:last-child { text-align: left; }
                        .project { 
                            border: 1px solid black; 
                            padding: 12px; 
                            margin-bottom: 5px; 
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-size: 14px;
                        }
                        .project-cell { 
                            flex: 1;
                            padding: 0 10px;
                            direction: rtl;
                            unicode-bidi: embed;
                            white-space: pre;
                            font-weight: bold;
                        }
                        .project-cell:first-child { text-align: right; }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-bottom: 20px; 
                            font-size: 10px;
                            direction: rtl;
                        }
                        th { 
                            background: #e5e5e5; 
                            font-weight: bold; 
                            border: 1px solid black; 
                            padding: 8px; 
                            text-align: right;
                            white-space: pre;
                        }
                        td { 
                            border: 1px solid black; 
                            padding: 6px; 
                            text-align: right;
                            direction: rtl;
                            unicode-bidi: embed;
                            white-space: pre;
                        }
                        .total-box { 
                            border: 1px solid black; 
                            padding: 10px; 
                            display: inline-block; 
                            margin-bottom: 40px; 
                            float: left;
                            direction: rtl;
                            unicode-bidi: embed;
                            white-space: pre;
                        }
                        .clear { clear: both; }
                        .section { 
                            margin-bottom: 20px; 
                            text-align: right;
                            direction: rtl;
                            unicode-bidi: embed;
                        }
                        .section-title { 
                            font-weight: bold; 
                            margin-bottom: 8px;
                            white-space: pre;
                        }
                        .section-content { 
                            font-size: 10px; 
                            white-space: pre-wrap;
                            direction: rtl;
                            unicode-bidi: embed;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="header-title">${preserveSpaces(' :\'הזמנת רכש מס')} ${order.orderNumber}&#x202C;</div>
                        <div class="header-date">${orderDate}</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-cell"><strong>${preserveSpaces(' :שם הספק')}</strong>&nbsp;${preserveSpaces(order.supplierName || 'ספק')}</div>
                        <div class="info-cell"><strong>${preserveSpaces(' :תנאי תשלום')}</strong>&nbsp;&#x202B;${preserveSpaces(order.paymentTerms || 'שוטף +30')}&#x202C;</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-cell"><strong>${preserveSpaces(' :איש קשר')}</strong>&nbsp;${preserveSpaces(supplier?.contactName || '')}</div>
                        <div class="info-cell"><strong>${preserveSpaces(' :דוא״ל')}</strong>&nbsp;${supplier?.email || ''}</div>
                    </div>
                    
                    <div class="project">
                        <div class="project-cell"><strong>${preserveSpaces(' :פרויקט')}</strong>&nbsp;${preserveSpaces(order.projectName || 'פרויקט')}</div>
                        <div class="project-cell"></div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>מס"ד</th>
                                <th>${preserveSpaces('תיאור פריט')}</th>
                                <th>יח׳</th>
                                <th>כמות</th>
                                <th>מחיר</th>
                                <th>סה״כ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${formattedItems.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>&#x202B;${preserveSpaces(item.description || '')}&#x202C;</td>
                                    <td>${preserveSpaces(item.unit || 'יח׳')}</td>
                                    <td>${item.quantity || 1}</td>
                                    <td>${item.formattedPrice}</td>
                                    <td>${item.formattedSum}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="total-box">
                        <strong>&nbsp;סה״כ&nbsp;</strong>&nbsp;₪${formattedTotal}
                    </div>
                    <div class="clear"></div>
                    
                    ${order.comments ? `
                    <div class="section">
                        <div class="section-title">הערות</div>
                        <div class="section-content">&#x202B;${preserveSpaces(order.comments)}&#x202C;</div>
                    </div>
                    ` : ''}
                    
                    ${order.deliveryAddress ? `
                    <div class="section">
                        <div class="section-title">${preserveSpaces(' :כתובת משלוח')}</div>
                        <div class="section-content">&#x202B;${preserveSpaces(order.deliveryAddress)}&#x202C;</div>
                    </div>
                    ` : ''}
                    
                    ${(order.orderedBy && order.orderedBy.trim() !== '') ? `
                    <div class="section">
                        <strong>מזמין:</strong>&nbsp;${order.orderedBy}
                    </div>
                    ` : ''}
                    
                    <!-- DEBUG: orderedBy = "${order.orderedBy || 'EMPTY'}" -->
                </body>
                </html>
            `;

            console.log('✅ HTML content length:', htmlContent.length);
            console.log('✅ Formatted items count:', formattedItems.length);
            console.log('✅ Sample formatted item:', formattedItems[0]);

            // Check if html2pdf is available
            if (typeof html2pdf === 'undefined') {
                console.error('❌ html2pdf library not loaded!');
                alert('שגיאה: ספריית PDF לא נטענה. אנא רענן את הדף.');
                return;
            }
            console.log('✅ html2pdf library loaded');

            // Clean up any existing temp elements first
            const existingTemps = document.querySelectorAll('.pdf-temp-element, .pdf-backdrop');
            existingTemps.forEach(el => el.remove());
            console.log('✅ Cleaned up', existingTemps.length, 'existing temp elements');

            // Create backdrop to block interaction during PDF generation
            const backdrop = document.createElement('div');
            backdrop.className = 'pdf-backdrop';
            backdrop.style.position = 'fixed';
            backdrop.style.top = '0';
            backdrop.style.left = '0';
            backdrop.style.width = '100vw';
            backdrop.style.height = '100vh';
            backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            backdrop.style.zIndex = '9998';
            backdrop.style.display = 'flex';
            backdrop.style.alignItems = 'center';
            backdrop.style.justifyContent = 'center';
            document.body.appendChild(backdrop);

            // Create temporary element ON SCREEN (html2canvas needs visible elements)
            const element = document.createElement('div');
            element.className = 'pdf-temp-element';
            element.style.position = 'fixed';
            element.style.top = '50%';
            element.style.left = '50%';
            element.style.transform = 'translate(-50%, -50%)';
            element.style.width = '210mm'; // A4 width
            element.style.backgroundColor = 'white';
            element.style.zIndex = '9999';
            element.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
            element.style.maxHeight = '90vh';
            element.style.overflow = 'auto';
            element.innerHTML = htmlContent;
            document.body.appendChild(element);
            console.log('✅ Temp element created and appended ON SCREEN');
            console.log('✅ Element children count:', element.children.length);

            // Wait longer for fonts to load (increased from 500ms to 1000ms)
            console.log('⏳ Waiting for fonts to load...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Font wait complete');

            // Generate PDF
            const opt = {
                margin: [10, 10, 10, 10], // [top, left, bottom, right] in mm - 1cm all sides
                filename: `Order_${order.orderNumber.replace('/', '-')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            console.log('✅ PDF options:', opt);

            console.log('⏳ Starting html2pdf conversion...');
            await html2pdf().set(opt).from(element).save();
            console.log('✅ html2pdf conversion complete');

            // Clean up - remove both element and backdrop
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
                console.log('✅ Cleanup complete');
            }, 100);

            console.log('✅ HTML PDF generated successfully');

        } catch (error) {
            console.error('❌ Error generating HTML PDF:', error);
            alert('שגיאה ביצירת PDF: ' + error.message);
        }
    }

    // OLD: pdf-lib based generation (kept for fallback)
    async function generateOrderPDF(orderId) {
        try {
            const order = state.orders.find(o => o.id === orderId);
            if (!order) {
                alert('הזמנה לא נמצאה');
                return;
            }

            // Create PDF
            const pdfDoc = await PDFLib.PDFDocument.create();
            pdfDoc.registerFontkit(fontkit);
            let page = pdfDoc.addPage([595, 842]); // A4
            const { width, height } = page.getSize();

            // Load fonts
            let font, boldFont;
            try {
                const fontBytes = await loadHebrewFont();
                const boldFontBytes = await loadHebrewBoldFont();
                font = await pdfDoc.embedFont(fontBytes);
                boldFont = await pdfDoc.embedFont(boldFontBytes);
            } catch (error) {
                console.error('Font error:', error);
                font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
                boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            }

            // Colors
            const black = PDFLib.rgb(0, 0, 0);

            // Margins
            const marginTop = 4 * 28.35;
            const marginBottom = 2 * 28.35;
            const marginSide = 1.5 * 28.35;
            let y = height - marginTop;

            // Get data
            const supplier = state.suppliers.find(s => s.id === order.supplierId);
            const orderDateObj = order.orderDate ? new Date(order.orderDate) : new Date();
            const orderDate = `${String(orderDateObj.getDate()).padStart(2, '0')}/${String(orderDateObj.getMonth() + 1).padStart(2, '0')}/${orderDateObj.getFullYear()}`;

            // ===== HEADER: Order Number + "הזמנת רכש מס'" + Date =====
            // RAW text without reversal
            const orderNumberWidth = boldFont.widthOfTextAtSize(order.orderNumber, 14);
            const spaceWidth = boldFont.widthOfTextAtSize(' ', 14);
            const headerLabel = 'הזמנת רכש מס\'';
            const headerLabelWidth = boldFont.widthOfTextAtSize(headerLabel, 14);
            
            // Draw order number first (not reversed, LTR)
            page.drawText(order.orderNumber, {
                x: width - marginSide - 200,
                y,
                size: 14,
                font: boldFont,
                color: black
            });
            
            // Draw space
            page.drawText(' ', {
                x: width - marginSide - 200 + orderNumberWidth,
                y,
                size: 14,
                font: boldFont,
                color: black
            });
            
            // Draw Hebrew label (reversed) after the number
            page.drawText(headerLabel, {
                x: width - marginSide - 200 + orderNumberWidth + spaceWidth,
                y,
                size: 14,
                font: boldFont,
                color: black
            });

            page.drawText(orderDate, {
                x: marginSide,
                y,
                size: 11,
                font,
                color: black
            });

            y -= 35;

            // ===== BOX 1: Supplier Name / Payment Conditions =====
            const box1Height = 25;
            page.drawRectangle({
                x: marginSide,
                y: y - box1Height,
                width: width - 2 * marginSide,
                height: box1Height,
                borderColor: black,
                borderWidth: 1
            });

            // Supplier name (right-aligned)
            const supplierName = order.supplierName || 'ספק';
            const supplierText = 'שם הספק: ' + supplierName;
            const supplierTextWidth = boldFont.widthOfTextAtSize(supplierText, 10);
            page.drawText(supplierText, {
                x: width - marginSide - 10 - supplierTextWidth,
                y: y - 17,
                size: 10,
                font,
                color: black
            });

            // Payment conditions (left) - RAW text
            const paymentLabel = 'תנאי תשלום: ';
            const paymentHebrewPart = 'שוטף ';
            const paymentPlusPart = '+';
            const paymentNumberPart = '30';
            
            const paymentLabelWidth = font.widthOfTextAtSize(paymentLabel, 10);
            const paymentHebrewWidth = font.widthOfTextAtSize(paymentHebrewPart, 10);
            const paymentPlusWidth = font.widthOfTextAtSize(paymentPlusPart, 10);
            const paymentNumberWidth = font.widthOfTextAtSize(paymentNumberPart, 10);
            
            // Calculate total width and start position
            const totalPaymentWidth = paymentLabelWidth + paymentHebrewWidth + paymentPlusWidth + paymentNumberWidth;
            
            // Position from right to left (RTL)
            let paymentX = marginSide + 10 + totalPaymentWidth;
            
            // Draw from right to left
            // 1. Number (30) - rightmost
            paymentX -= paymentNumberWidth;
            page.drawText(paymentNumberPart, {
                x: paymentX,
                y: y - 17,
                size: 10,
                font,
                color: black
            });
            
            // 2. Plus sign (+)
            paymentX -= paymentPlusWidth;
            page.drawText(paymentPlusPart, {
                x: paymentX,
                y: y - 17,
                size: 10,
                font,
                color: black
            });
            
            // 3. Hebrew part (שוטף)
            paymentX -= paymentHebrewWidth;
            page.drawText(paymentHebrewPart, {
                x: paymentX,
                y: y - 17,
                size: 10,
                font,
                color: black
            });
            
            // 4. Label (תנאי תשלום:) - leftmost
            paymentX -= paymentLabelWidth;
            page.drawText(paymentLabel, {
                x: paymentX,
                y: y - 17,
                size: 10,
                font,
                color: black
            });

            y -= box1Height + 5;

            // ===== BOX 2: Contact Person / Email =====
            const box2Height = 25;
            page.drawRectangle({
                x: marginSide,
                y: y - box2Height,
                width: width - 2 * marginSide,
                height: box2Height,
                borderColor: black,
                borderWidth: 1
            });

            // Contact person (right-aligned)
            const contactPerson = supplier?.contactName || '';
            if (contactPerson) {
                const contactText = 'איש קשר: ' + contactPerson;
                const contactTextWidth = font.widthOfTextAtSize(contactText, 10);
                page.drawText(contactText, {
                    x: width - marginSide - 10 - contactTextWidth,
                    y: y - 17,
                    size: 10,
                    font,
                    color: black
                });
            }

            // Email (left) - Hebrew label
            const email = supplier?.email || '';
            if (email) {
                const emailLabel = 'דוא״ל: ';
                const emailLabelWidth = font.widthOfTextAtSize(emailLabel, 10);
                
                page.drawText(emailLabel, {
                    x: marginSide + 10,
                    y: y - 17,
                    size: 10,
                    font,
                    color: black
                });
                
                page.drawText(email, {
                    x: marginSide + 10 + emailLabelWidth,
                    y: y - 17,
                    size: 10,
                    font,
                    color: black
                });
            }

            y -= box2Height + 25;

            // ===== PROJECT LINE ===== (right-aligned, bold, larger)
            const projectName = order.projectName || 'פרויקט';
            const projectText = 'פרויקט: ' + projectName;
            const projectTextWidth = boldFont.widthOfTextAtSize(projectText, 14);
            page.drawText(projectText, {
                x: width - marginSide - 10 - projectTextWidth,
                y,
                size: 14,
                font: boldFont,
                color: black
            });

            y -= 25;

            // ===== TABLE =====
            const tableTop = y;
            const rowHeight = 20;
            const headerHeight = 25;
            
            // Table header
            page.drawRectangle({
                x: marginSide,
                y: tableTop - headerHeight,
                width: width - 2 * marginSide,
                height: headerHeight,
                borderColor: black,
                borderWidth: 1,
                color: PDFLib.rgb(0.9, 0.9, 0.9)
            });

            // Column positions (RTL: Serial rightmost, Total leftmost)
            const colSerial = width - marginSide - 10;      // Rightmost - מ"ס
            const colDesc = width - marginSide - 60;        // תיאור פריט
            const colUnit = marginSide + 200;               // יח'
            const colQty = marginSide + 140;                // כמות
            const colPrice = marginSide + 80;               // מחיר
            const colTotal = marginSide + 5;                // Leftmost - סה"כ

            // Column headers - RAW text
            const serialHeaderWidth = boldFont.widthOfTextAtSize('מ"ס', 10);
            page.drawText('מ"ס', { x: colSerial - serialHeaderWidth, y: tableTop - 17, size: 10, font: boldFont, color: black });
            
            const descHeaderWidth = boldFont.widthOfTextAtSize('תיאור פריט', 10);
            page.drawText('תיאור פריט', { x: colDesc - descHeaderWidth, y: tableTop - 17, size: 10, font: boldFont, color: black });
            
            const unitHeaderWidth = boldFont.widthOfTextAtSize('יח\'', 10);
            page.drawText('יח\'', { x: colUnit - unitHeaderWidth, y: tableTop - 17, size: 10, font: boldFont, color: black });
            
            const qtyHeaderWidth = boldFont.widthOfTextAtSize('כמות', 10);
            page.drawText('כמות', { x: colQty - qtyHeaderWidth, y: tableTop - 17, size: 10, font: boldFont, color: black });
            
            const priceHeaderWidth = boldFont.widthOfTextAtSize('מחיר', 10);
            page.drawText('מחיר', { x: colPrice - priceHeaderWidth, y: tableTop - 17, size: 10, font: boldFont, color: black });
            
            page.drawText('סה"כ', { x: colTotal, y: tableTop - 17, size: 10, font: boldFont, color: black });

            y = tableTop - headerHeight;

            // Table rows
            order.items.forEach((item, index) => {
                y -= rowHeight;
                
                // Check if new page needed
                if (y < marginBottom + 50) {
                    page = pdfDoc.addPage([595, 842]);
                    y = height - marginTop;
                }
                
                // Draw row border
                page.drawRectangle({
                    x: marginSide,
                    y,
                    width: width - 2 * marginSide,
                    height: rowHeight,
                    borderColor: black,
                    borderWidth: 0.5
                });

                // Serial number (rightmost, right-aligned)
                const serialText = String(index + 1);
                const serialWidth = font.widthOfTextAtSize(serialText, 9);
                page.drawText(serialText, { x: colSerial - serialWidth, y: y + 5, size: 9, font, color: black });
                
                // Description (right-aligned) - handle mixed Hebrew+numbers
                const desc = item.description || '';
                const maxDescLength = 70;
                const truncatedDesc = desc.substring(0, maxDescLength);
                
                // For now, draw as-is without reverseHebrewText to prevent number reversal
                // The Hebrew font will handle RTL automatically
                const descWidth = font.widthOfTextAtSize(truncatedDesc, 9);
                page.drawText(truncatedDesc, { x: colDesc - descWidth, y: y + 5, size: 9, font, color: black });
                
                // Unit (right-aligned) - RAW text
                const unitText = item.unit || 'יח\'';
                const unitWidth = font.widthOfTextAtSize(unitText, 9);
                page.drawText(unitText, { x: colUnit - unitWidth, y: y + 5, size: 9, font, color: black });
                
                // Quantity (right-aligned)
                const qtyText = String(item.quantity || 1);
                const qtyWidth = font.widthOfTextAtSize(qtyText, 9);
                page.drawText(qtyText, { x: colQty - qtyWidth, y: y + 5, size: 9, font, color: black });
                
                // Price (right-aligned)
                const priceText = formatNumber(item.price || 0);
                const priceWidth = font.widthOfTextAtSize(priceText, 9);
                page.drawText(priceText, { x: colPrice - priceWidth, y: y + 5, size: 9, font, color: black });
                
                // Total (leftmost)
                page.drawText(formatNumber(item.sum || 0), { x: colTotal, y: y + 5, size: 9, font, color: black });
            });

            y -= 30;

            // ===== TOTAL SUM ===== (box aligned to left)
            const sumBoxWidth = 150;
            const sumBoxX = marginSide;  // Align to left margin
            page.drawRectangle({
                x: sumBoxX,
                y: y - 25,
                width: sumBoxWidth,
                height: 25,
                borderColor: black,
                borderWidth: 1
            });

            // "סה"כ" on the right side of box - RAW text
            const sumLabelText = 'גחדדחגדח"כ:';
            const sumLabelWidth = boldFont.widthOfTextAtSize(sumLabelText, 11);
            page.drawText(sumLabelText, {
                x: sumBoxX + sumBoxWidth - 10 - sumLabelWidth,
                y: y - 17,
                size: 11,
                font: boldFont,
                color: black
            });
            
            // Number on the left side of box
            const sumValueText = `₪${formatNumber(order.totalSum || 0)}`;
            page.drawText(sumValueText, {
                x: sumBoxX + 10,
                y: y - 17,
                size: 11,
                font: boldFont,
                color: black
            });

            y -= 60;

            // ===== COMMENTS ===== (right-aligned) - RAW text
            if (order.comments) {
                const commentsLabelText = 'הערות:';
                const commentsLabelWidth = boldFont.widthOfTextAtSize(commentsLabelText, 10);
                page.drawText(commentsLabelText, {
                    x: width - marginSide - 10 - commentsLabelWidth,
                    y,
                    size: 10,
                    font: boldFont,
                    color: black
                });
                y -= 15;
                
                const commentLines = wrapText(order.comments, width - 2 * marginSide - 20, font, 9);
                for (const line of commentLines) {
                    const lineWidth = font.widthOfTextAtSize(line, 9);
                    page.drawText(line, {
                        x: width - marginSide - 10 - lineWidth,
                        y,
                        size: 9,
                        font,
                        color: black
                    });
                    y -= 12;
                }
                y -= 10;
            }

            // ===== ADDRESS ===== (right-aligned) - RAW text
            if (order.deliveryAddress) {
                const addressLabelText = 'כתובת משלוח:';
                const addressLabelWidth = boldFont.widthOfTextAtSize(addressLabelText, 10);
                page.drawText(addressLabelText, {
                    x: width - marginSide - 10 - addressLabelWidth,
                    y,
                    size: 10,
                    font: boldFont,
                    color: black
                });
                y -= 15;
                
                const addressWidth = font.widthOfTextAtSize(order.deliveryAddress, 9);
                page.drawText(order.deliveryAddress, {
                    x: width - marginSide - 10 - addressWidth,
                    y,
                    size: 9,
                    font,
                    color: black
                });
                y -= 20;
            }

            // ===== ORDERING PERSON (מזמין) ===== (right-aligned) - RAW text
            if (order.orderedBy) {
                const ordererText = 'מזמין: ' + order.orderedBy;
                const ordererWidth = boldFont.widthOfTextAtSize(ordererText, 10);
                page.drawText(ordererText, {
                    x: width - marginSide - 10 - ordererWidth,
                    y,
                    size: 10,
                    font: boldFont,
                    color: black
                });
            }

            // Save and download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Order_${order.orderNumber.replace('/', '-')}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            console.log('✅ PDF generated successfully');

        } catch (error) {
            console.error('❌ Error generating PDF:', error);
            alert('שגיאה ביצירת PDF: ' + error.message);
        }

    }

    // Return public API
    return {
        loadOrders,
        generateOrderNumber,
        addOrder,
        updateOrder,
        deleteOrder,
        calculateOrderTotals,
        addOrderItem,
        removeOrderItem,
        showOrdersView,
        showNewOrderForm,
        cancelNewOrder,
        updateNewOrder,
        updateNewOrderItem,
        editOrder,
        cancelEdit,
        updateEditingOrder,
        updateEditingOrderItem,
        addEditingOrderItem,
        removeEditingOrderItem,
        generateOrderPDF,
        generateOrderPDFHTML  // NEW: HTML-based PDF generation
    };
}

