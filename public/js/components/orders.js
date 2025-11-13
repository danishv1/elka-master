// ===== ORDERS COMPONENT =====
// Handles all order-related functionality

import { 
    loadHebrewFont, 
    loadHebrewBoldFont, 
    reverseHebrewText, 
    formatNumber, 
    wrapText,
    pdfColors 
} from '../utils/pdf-utils.js?v=3.0.0';

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

    async function generateOrderPDF(orderId) {
        try {
            const order = state.orders.find(o => o.id === orderId);
            if (!order) {
                alert('הזמנה לא נמצאה');
                return;
            }

            // Create a new PDF document
            const pdfDoc = await PDFLib.PDFDocument.create();
            let page = pdfDoc.addPage([595, 842]); // A4 size
            const { width, height } = page.getSize();

            // Load and embed Hebrew fonts
            let font, boldFont;
            try {
                const fontBytes = await loadHebrewFont();
                const boldFontBytes = await loadHebrewBoldFont();
                font = await pdfDoc.embedFont(fontBytes);
                boldFont = await pdfDoc.embedFont(boldFontBytes);
                console.log('✅ Hebrew fonts embedded successfully');
            } catch (error) {
                console.error('❌ Failed to load Hebrew fonts, using Helvetica fallback:', error);
                font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
                boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
                alert('שגיאה בטעינת פונט עברי. משתמש בפונט ברירת מחדל.');
            }

            // Define colors
            const primaryColor = PDFLib.rgb(pdfColors.primary.r, pdfColors.primary.g, pdfColors.primary.b);
            const secondaryColor = PDFLib.rgb(pdfColors.secondary.r, pdfColors.secondary.g, pdfColors.secondary.b);
            const darkGray = PDFLib.rgb(pdfColors.darkGray.r, pdfColors.darkGray.g, pdfColors.darkGray.b);
            const black = PDFLib.rgb(pdfColors.black.r, pdfColors.black.g, pdfColors.black.b);
            const white = PDFLib.rgb(pdfColors.white.r, pdfColors.white.g, pdfColors.white.b);

            // ===== HEADER SECTION =====
            const margin = 40;
            let yPos = height - 40;

            // Draw header background
            page.drawRectangle({
                x: 0,
                y: height - 120,
                width: width,
                height: 120,
                color: primaryColor,
            });

            // Company title
            page.drawText(reverseHebrewText('הזמנת רכש'), {
                x: width - margin - 150,
                y: height - 60,
                size: 28,
                font: boldFont,
                color: white
            });

            // Document subtitle
            page.drawText(reverseHebrewText('PURCHASE ORDER'), {
                x: margin,
                y: height - 60,
                size: 16,
                font: boldFont,
                color: white,
                opacity: 0.8
            });

            // ===== ORDER INFO BOX =====
            yPos = height - 150;
            const boxHeight = 110;
            
            // Draw info box with border
            page.drawRectangle({
                x: width - margin - 250,
                y: yPos - boxHeight,
                width: 250,
                height: boxHeight,
                borderColor: primaryColor,
                borderWidth: 2,
                color: white
            });

            // Order details in the box
            let boxY = yPos - 25;
            const boxX = width - margin - 235;

            page.drawText(reverseHebrewText(`הזמנה מס': ${order.orderNumber}`), {
                x: boxX,
                y: boxY,
                size: 14,
                font: boldFont,
                color: primaryColor
            });
            boxY -= 22;

            page.drawText(reverseHebrewText(`תאריך: ${order.orderDate || new Date().toLocaleDateString('he-IL')}`), {
                x: boxX,
                y: boxY,
                size: 11,
                font: font,
                color: darkGray
            });
            boxY -= 20;

            const projectDisplay = order.projectName || `פרויקט #${order.projectId.substring(0, 8)}`;
            page.drawText(reverseHebrewText(`פרויקט: ${projectDisplay}`), {
                x: boxX,
                y: boxY,
                size: 10,
                font: font,
                color: darkGray
            });
            boxY -= 18;

            const supplierDisplay = order.supplierName || `ספק #${order.supplierId.substring(0, 8)}`;
            page.drawText(reverseHebrewText(`ספק: ${supplierDisplay}`), {
                x: boxX,
                y: boxY,
                size: 10,
                font: font,
                color: darkGray
            });

            // Supplier additional info (left side)
            const supplier = state.suppliers.find(s => s.id === order.supplierId);
            let leftY = yPos - 25;
            const leftX = margin;

            page.drawText(reverseHebrewText('פרטי ספק'), {
                x: leftX,
                y: leftY,
                size: 12,
                font: boldFont,
                color: primaryColor
            });
            leftY -= 22;

            if (supplier) {
                if (supplier.contactName) {
                    page.drawText(reverseHebrewText(`איש קשר: ${supplier.contactName}`), {
                        x: leftX,
                        y: leftY,
                        size: 10,
                        font: font,
                        color: darkGray
                    });
                    leftY -= 18;
                }
                if (supplier.phone) {
                    page.drawText(`Phone: ${supplier.phone}`, {
                        x: leftX,
                        y: leftY,
                        size: 10,
                        font: font,
                        color: darkGray
                    });
                    leftY -= 18;
                }
                if (supplier.email) {
                    page.drawText(`Email: ${supplier.email}`, {
                        x: leftX,
                        y: leftY,
                        size: 9,
                        font: font,
                        color: darkGray
                    });
                }
            }

            // ===== ITEMS TABLE =====
            yPos = height - 280;

            // Table header background
            page.drawRectangle({
                x: margin,
                y: yPos - 5,
                width: width - 2 * margin,
                height: 25,
                color: primaryColor
            });

            // Column positions for RTL layout
            const colDesc = margin + 10;
            const colQty = width - margin - 240;
            const colUnit = width - margin - 185;
            const colPrice = width - margin - 130;
            const colSum = width - margin - 60;

            // Table headers
            page.drawText(reverseHebrewText('תיאור'), {
                x: colDesc,
                y: yPos + 3,
                size: 11,
                font: boldFont,
                color: white
            });
            page.drawText(reverseHebrewText('כמות'), {
                x: colQty,
                y: yPos + 3,
                size: 11,
                font: boldFont,
                color: white
            });
            page.drawText(reverseHebrewText('יח\''), {
                x: colUnit,
                y: yPos + 3,
                size: 11,
                font: boldFont,
                color: white
            });
            page.drawText(reverseHebrewText('מחיר'), {
                x: colPrice,
                y: yPos + 3,
                size: 11,
                font: boldFont,
                color: white
            });
            page.drawText(reverseHebrewText('סה"כ'), {
                x: colSum,
                y: yPos + 3,
                size: 11,
                font: boldFont,
                color: white
            });

            yPos -= 30;
            let rowIndex = 0;

            // Items
            for (const item of order.items) {
                // Check if we need a new page
                if (yPos < 180) {
                    page = pdfDoc.addPage([595, 842]);
                    yPos = height - 40;
                    rowIndex = 0;
                }

                // Alternating row background
                if (rowIndex % 2 === 0) {
                    page.drawRectangle({
                        x: margin,
                        y: yPos - 15,
                        width: width - 2 * margin,
                        height: 20,
                        color: secondaryColor
                    });
                }

                // Description
                const descText = item.description || `פריט ${order.items.indexOf(item) + 1}`;
                const descLines = wrapText(descText, 280, font, 10);
                
                page.drawText(reverseHebrewText(descLines[0] || ''), {
                    x: colDesc,
                    y: yPos - 3,
                    size: 10,
                    font: font,
                    color: black
                });

                // Quantity
                const qtyValue = typeof item.quantity === 'number' ? item.quantity : (parseFloat(item.quantity) || 1);
                page.drawText(String(qtyValue), {
                    x: colQty,
                    y: yPos - 3,
                    size: 10,
                    font: font,
                    color: black
                });

                // Unit
                const unitDisplay = reverseHebrewText(item.unit || 'יח\'');
                page.drawText(unitDisplay, {
                    x: colUnit,
                    y: yPos - 3,
                    size: 10,
                    font: font,
                    color: black
                });

                // Price
                const priceValue = typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 0);
                page.drawText(formatNumber(priceValue), {
                    x: colPrice,
                    y: yPos - 3,
                    size: 10,
                    font: font,
                    color: black
                });

                // Sum
                const sumValue = typeof item.sum === 'number' ? item.sum : (parseFloat(item.sum) || 0);
                page.drawText(formatNumber(sumValue), {
                    x: colSum,
                    y: yPos - 3,
                    size: 10,
                    font: font,
                    color: black
                });

                yPos -= 20;
                rowIndex++;

                // Handle multi-line descriptions
                for (let i = 1; i < descLines.length; i++) {
                    if (yPos < 180) {
                        page = pdfDoc.addPage([595, 842]);
                        yPos = height - 40;
                    }
                    page.drawText(reverseHebrewText(descLines[i]), {
                        x: colDesc,
                        y: yPos - 3,
                        size: 10,
                        font: font,
                        color: black
                    });
                    yPos -= 20;
                }
            }

            // ===== TOTAL SECTION =====
            yPos -= 10;
            
            // Draw total box
            page.drawRectangle({
                x: width - margin - 200,
                y: yPos - 35,
                width: 200,
                height: 35,
                color: primaryColor
            });

            const totalValue = typeof order.totalSum === 'number' ? order.totalSum : (parseFloat(order.totalSum) || 0);
            const totalText = `${formatNumber(totalValue)} ₪`;
            
            page.drawText(reverseHebrewText('סה"כ'), {
                x: width - margin - 180,
                y: yPos - 18,
                size: 14,
                font: boldFont,
                color: white
            });

            page.drawText(reverseHebrewText(totalText), {
                x: width - margin - 100,
                y: yPos - 18,
                size: 14,
                font: boldFont,
                color: white
            });

            // ===== ADDITIONAL INFO =====
            yPos -= 60;

            if (order.orderedBy) {
                page.drawText(reverseHebrewText(`שם המזמין: ${order.orderedBy}`), {
                    x: margin,
                    y: yPos,
                    size: 10,
                    font: font,
                    color: darkGray
                });
                yPos -= 18;
            }

            if (order.deliveryAddress) {
                const addressLines = wrapText(`כתובת משלוח: ${order.deliveryAddress}`, 400, font, 10);
                for (const line of addressLines) {
                    if (yPos < 100) {
                        page = pdfDoc.addPage([595, 842]);
                        yPos = height - 40;
                    }
                    page.drawText(reverseHebrewText(line), {
                        x: margin,
                        y: yPos,
                        size: 10,
                        font: font,
                        color: darkGray
                    });
                    yPos -= 18;
                }
            }

            if (order.comments) {
                yPos -= 5;
                page.drawText(reverseHebrewText('הערות:'), {
                    x: margin,
                    y: yPos,
                    size: 11,
                    font: boldFont,
                    color: primaryColor
                });
                yPos -= 18;

                const commentLines = wrapText(order.comments, 500, font, 10);
                for (const line of commentLines) {
                    if (yPos < 100) {
                        page = pdfDoc.addPage([595, 842]);
                        yPos = height - 40;
                    }
                    page.drawText(reverseHebrewText(line), {
                        x: margin,
                        y: yPos,
                        size: 10,
                        font: font,
                        color: darkGray
                    });
                    yPos -= 16;
                }
            }

            // ===== FOOTER =====
            const footerY = 40;
            page.drawLine({
                start: { x: margin, y: footerY + 20 },
                end: { x: width - margin, y: footerY + 20 },
                thickness: 1,
                color: primaryColor,
                opacity: 0.5
            });

            page.drawText(reverseHebrewText('תודה על ההזמנה!'), {
                x: width / 2 - 40,
                y: footerY,
                size: 10,
                font: font,
                color: darkGray
            });

            // Save and download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `Order_${order.orderNumber.replace('/', '-')}_${order.projectName || 'Unknown'}.pdf`;
            link.click();

            URL.revokeObjectURL(url);
            console.log('✅ Beautiful PDF generated and downloaded successfully');
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
        generateOrderPDF
    };
}

