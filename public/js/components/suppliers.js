// ===== SUPPLIERS COMPONENT =====
// Handles all supplier-related functionality

export function initSuppliersComponent(context) {
    const { state, db, firebase, storage, render, updateHistory } = context;

    // ===== SUPPLIER FUNCTIONS =====
    
    async function loadSuppliers() {
        if (!state.user) {
            console.log('Cannot load suppliers: user not authenticated');
            return;
        }
        if (state.loadingSuppliers) {
            console.log('Already loading suppliers, skipping...');
            return;
        }
        try {
            state.loadingSuppliers = true;
            console.log('Loading suppliers...');
            const snapshot = await db.collection('suppliers').get();
            state.suppliers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            state.suppliers.sort((a, b) => {
                const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
                const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
                return bTime - aTime;
            });
            console.log('Loaded suppliers:', state.suppliers.length);
            state.suppliersLoaded = true;
            state.loadingSuppliers = false;
            render();
        } catch (error) {
            console.error('Error loading suppliers:', error);
            state.loadingSuppliers = false;
            if (state.user) {
                alert('שגיאה בטעינת ספקים: ' + error.message);
            }
        }
    }

    async function addSupplier() {
        if (!state.newSupplier.name) {
            alert('יש להזין שם ספק');
            return;
        }
        
        try {
            console.log('Adding supplier:', state.newSupplier.name);
            
            const supplierData = {
                name: state.newSupplier.name,
                contactName: state.newSupplier.contactName || '',
                contactPhone: state.newSupplier.contactPhone || '',
                contactEmail: state.newSupplier.contactEmail || '',
                paymentConditions: state.newSupplier.paymentConditions || '',
                documents: state.newSupplier.documents || [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: state.user.uid
            };
            
            const docRef = await db.collection('suppliers').add(supplierData);
            console.log('✅ Supplier added successfully:', docRef.id);
            
            // Initialize suppliers array if not exists
            if (!state.suppliers) {
                state.suppliers = [];
            }
            
            state.suppliers.unshift({
                id: docRef.id,
                ...supplierData,
                createdAt: new Date()
            });
            
            state.newSupplier = {
                name: '',
                contactName: '',
                contactPhone: '',
                contactEmail: '',
                paymentConditions: '',
                documents: []
            };
            state.showNewSupplier = false;
            render();
            
            alert('ספק נוסף בהצלחה!');
        } catch (error) {
            console.error('❌ Error adding supplier:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            let errorMsg = 'שגיאה בהוספת ספק';
            if (error.code === 'permission-denied') {
                errorMsg += ': אין הרשאות לכתיבה';
            } else {
                errorMsg += ': ' + error.message;
            }
            alert(errorMsg);
        }
    }

    async function updateSupplier(supplierId) {
        if (!state.editingSupplier.name) {
            alert('יש להזין שם ספק');
            return;
        }
        
        try {
            const updates = {
                name: state.editingSupplier.name,
                contactName: state.editingSupplier.contactName,
                contactPhone: state.editingSupplier.contactPhone,
                contactEmail: state.editingSupplier.contactEmail,
                paymentConditions: state.editingSupplier.paymentConditions,
                documents: state.editingSupplier.documents
            };
            
            await db.collection('suppliers').doc(supplierId).update(updates);
            
            state.suppliers = state.suppliers.map(s =>
                s.id === supplierId ? { ...s, ...updates } : s
            );
            
            state.editingSupplier = null;
            render();
        } catch (error) {
            console.error('Error updating supplier:', error);
            alert('שגיאה בעדכון ספק: ' + error.message);
        }
    }

    async function deleteSupplier(supplierId) {
        if (!confirm('האם למחוק את הספק?')) return;
        
        try {
            // Check if supplier has orders
            const ordersSnapshot = await db.collection('orders')
                .where('supplierId', '==', supplierId)
                .limit(1)
                .get();
            
            if (!ordersSnapshot.empty) {
                alert('לא ניתן למחוק ספק שיש לו הזמנות');
                return;
            }
            
            await db.collection('suppliers').doc(supplierId).delete();
            
            state.suppliers = state.suppliers.filter(s => s.id !== supplierId);
            render();
        } catch (error) {
            console.error('Error deleting supplier:', error);
            alert('שגיאה במחיקת ספק: ' + error.message);
        }
    }

    async function uploadSupplierDocument(supplierId, file) {
        try {
            const storageRef = storage.ref(`supplier-documents/${supplierId}/${file.name}`);
            await storageRef.put(file);
            const url = await storageRef.getDownloadURL();
            
            // Update supplier documents array
            const supplier = state.suppliers.find(s => s.id === supplierId);
            const documents = supplier.documents || [];
            documents.push({ name: file.name, url: url, uploadedAt: new Date() });
            
            await db.collection('suppliers').doc(supplierId).update({ documents });
            
            supplier.documents = documents;
            render();
            
            return url;
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('שגיאה בהעלאת קובץ: ' + error.message);
            throw error;
        }
    }

    async function removeSupplierDocument(supplierId, docIndex) {
        try {
            const supplier = state.suppliers.find(s => s.id === supplierId);
            const documents = [...supplier.documents];
            documents.splice(docIndex, 1);
            
            await db.collection('suppliers').doc(supplierId).update({ documents });
            
            supplier.documents = documents;
            render();
        } catch (error) {
            console.error('Error removing document:', error);
            alert('שגיאה במחיקת קובץ: ' + error.message);
        }
    }

    function showSuppliersView() {
        state.view = 'suppliers';
        state.selectedClient = null;
        state.selectedProject = null;
        updateHistory();
        loadSuppliers();
    }

    // Helper functions for UI interactions
    function showNewSupplierForm() {
        state.showNewSupplier = true;
        render();
    }

    function cancelNewSupplier() {
        state.showNewSupplier = false;
        state.newSupplier = {
            name: '',
            contactName: '',
            contactPhone: '',
            contactEmail: '',
            paymentConditions: '',
            documents: []
        };
        render();
    }

    function updateNewSupplier(field, value) {
        state.newSupplier[field] = value;
    }

    function editSupplier(supplierId) {
        const supplier = state.suppliers.find(s => s.id === supplierId);
        if (supplier) {
            state.editingSupplier = { ...supplier };
            render();
        }
    }

    function cancelEdit() {
        state.editingSupplier = null;
        render();
    }

    function updateEditingSupplier(field, value) {
        state.editingSupplier[field] = value;
    }

    async function handleDocumentUpload(supplierId, event) {
        const file = event.target.files[0];
        if (file) {
            await uploadSupplierDocument(supplierId, file);
        }
    }

    // Return public API
    return {
        loadSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        uploadSupplierDocument,
        removeSupplierDocument,
        showSuppliersView,
        showNewSupplierForm,
        cancelNewSupplier,
        updateNewSupplier,
        editSupplier,
        cancelEdit,
        updateEditingSupplier,
        handleDocumentUpload
    };
}

