// This is the NEW restructured PDF generation based on the screenshot
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
        const gray = PDFLib.rgb(0.5, 0.5, 0.5);

        // Margins
        const marginTop = 4 * 28.35;
        const marginBottom = 2 * 28.35;
        const marginSide = 1.5 * 28.35;
        let y = height - marginTop;

        // Get data
        const supplier = state.suppliers.find(s => s.id === order.supplierId);
        const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString('he-IL') : new Date().toLocaleDateString('he-IL');

        // ===== HEADER: "הזמנת רכש מס' 25/XXX" =====
        page.drawText(`הזמנת רכש מס' ${order.orderNumber}`, {
            x: width - marginSide - 200,
            y,
            size: 16,
            font: boldFont,
            color: black
        });

        // Date on left
        page.drawText(orderDate, {
            x: marginSide,
            y,
            size: 12,
            font,
            color: black
        });

        y -= 30;

        // ===== SUPPLIER NAME / PAYMENT CONDITIONS =====
        // Draw border box
        page.drawRectangle({
            x: marginSide,
            y: y - 60,
            width: width - 2 * marginSide,
            height: 60,
            borderColor: black,
            borderWidth: 1
        });

        // Supplier name (right side)
        const supplierName = order.supplierName || 'ספק';
        page.drawText(`שם הספק: ${supplierName}`, {
            x: width - marginSide - 200,
            y: y - 20,
            size: 10,
            font: boldFont,
            color: black
        });

        // Payment conditions (left side)
        page.drawText('תנאי תשלום:', {
            x: marginSide + 10,
            y: y - 20,
            size: 10,
            font: boldFont,
            color: black
        });

        y -= 30;

        // Contact person (right side)
        const contactPerson = supplier?.contactName || '';
        if (contactPerson) {
            page.drawText(`איש קשר: ${contactPerson}`, {
                x: width - marginSide - 200,
                y: y - 20,
                size: 10,
                font,
                color: black
            });
        }

        // Email (left side)
        const email = supplier?.email || '';
        if (email) {
            page.drawText(`Email: ${email}`, {
                x: marginSide + 10,
                y: y - 20,
                size: 10,
                font,
                color: black
            });
        }

        y -= 70;

        // ===== PROJECT =====
        const projectName = order.projectName || 'פרויקט';
        page.drawText(`פרויקט: ${projectName}`, {
            x: marginSide + 10,
            y,
            size: 10,
            font: boldFont,
            color: black
        });

        y -= 30;

        // ===== TABLE =====
        // Table header
        const tableTop = y;
        const rowHeight = 20;
        
        page.drawRectangle({
            x: marginSide,
            y: tableTop - rowHeight,
            width: width - 2 * marginSide,
            height: rowHeight,
            borderColor: black,
            borderWidth: 1
        });

        // Column headers
        const colSerial = marginSide + 5;
        const colDesc = marginSide + 50;
        const colUnit = width - marginSide - 240;
        const colQty = width - marginSide - 180;
        const colPrice = width - marginSide - 120;
        const colTotal = width - marginSide - 60;

        page.drawText('מ"ס', { x: colSerial, y: tableTop - 15, size: 10, font: boldFont, color: black });
        page.drawText('פריט', { x: colDesc, y: tableTop - 15, size: 10, font: boldFont, color: black });
        page.drawText('יח\'', { x: colUnit, y: tableTop - 15, size: 10, font: boldFont, color: black });
        page.drawText('כמות', { x: colQty, y: tableTop - 15, size: 10, font: boldFont, color: black });
        page.drawText('מחיר יח\'', { x: colPrice, y: tableTop - 15, size: 10, font: boldFont, color: black });
        page.drawText('סה"כ', { x: colTotal, y: tableTop - 15, size: 10, font: boldFont, color: black });

        y = tableTop - rowHeight;

        // Table rows
        order.items.forEach((item, index) => {
            y -= rowHeight;
            
            // Draw row border
            page.drawRectangle({
                x: marginSide,
                y: y,
                width: width - 2 * marginSide,
                height: rowHeight,
                borderColor: black,
                borderWidth: 0.5
            });

            // Serial number
            page.drawText(String(index + 1), { x: colSerial, y: y + 5, size: 10, font, color: black });
            
            // Description
            const desc = item.description || '';
            page.drawText(desc.substring(0, 30), { x: colDesc, y: y + 5, size: 10, font, color: black });
            
            // Unit
            page.drawText(item.unit || 'יח\'', { x: colUnit, y: y + 5, size: 10, font, color: black });
            
            // Quantity
            page.drawText(String(item.quantity || 1), { x: colQty, y: y + 5, size: 10, font, color: black });
            
            // Price
            page.drawText(formatNumber(item.price || 0), { x: colPrice, y: y + 5, size: 10, font, color: black });
            
            // Total
            page.drawText(formatNumber(item.sum || 0), { x: colTotal, y: y + 5, size: 10, font, color: black });
        });

        y -= 30;

        // ===== TOTAL =====
        page.drawText('סה"כ:', {
            x: width - marginSide - 150,
            y,
            size: 12,
            font: boldFont,
            color: black
        });
        page.drawText(`₪${formatNumber(order.totalSum || 0)}`, {
            x: width - marginSide - 80,
            y,
            size: 12,
            font: boldFont,
            color: black
        });

        y -= 30;

        // ===== COMMENTS =====
        if (order.comments) {
            page.drawText('הערות:', {
                x: marginSide,
                y,
                size: 10,
                font: boldFont,
                color: black
            });
            y -= 15;
            page.drawText(order.comments, {
                x: marginSide,
                y,
                size: 10,
                font,
                color: black
            });
            y -= 20;
        }

        // ===== ADDRESS =====
        if (order.deliveryAddress) {
            page.drawText('כתובת:', {
                x: marginSide,
                y,
                size: 10,
                font: boldFont,
                color: black
            });
            y -= 15;
            page.drawText(order.deliveryAddress, {
                x: marginSide,
                y,
                size: 10,
                font,
                color: black
            });
            y -= 20;
        }

        // ===== ORDERING PERSON =====
        if (order.orderedBy) {
            page.drawText('מזמין:', {
                x: marginSide,
                y,
                size: 10,
                font: boldFont,
                color: black
            });
            page.drawText(order.orderedBy, {
                x: marginSide + 40,
                y,
                size: 10,
                font,
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

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('שגיאה ביצירת PDF');
    }
}
