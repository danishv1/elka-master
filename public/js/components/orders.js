// ===== ORDERS COMPONENT =====
// Handles all order-related functionality

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
        removeEditingOrderItem
    };
}

