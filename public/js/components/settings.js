// ===== SETTINGS COMPONENT =====
// Handles all application settings and configuration

export function initSettingsComponent(context) {
    const { state, db, firebase, storage, render, updateHistory, workers } = context;

    // ===== SETTINGS FUNCTIONS =====

    async function loadSettings() {
        if (!state.user) {
            console.log('Cannot load settings: user not authenticated');
            return;
        }
        
        try {
            console.log('Loading settings...');
            
            // Load PDF template URL
            try {
                const storageRef = storage.ref('templates/order_template.pdf');
                const url = await storageRef.getDownloadURL();
                state.pdfTemplate = url;
                console.log('PDF template loaded:', url);
            } catch (error) {
                if (error.code === 'storage/object-not-found') {
                    console.log('No PDF template uploaded yet');
                    state.pdfTemplate = null;
                } else {
                    console.error('Error loading PDF template:', error);
                }
            }
            
            // Load general settings (PDF top margin, etc.)
            const settingsDoc = await db.collection('settings').doc('general').get();
            if (settingsDoc.exists) {
                const data = settingsDoc.data();
                if (data.pdfTopMargin !== undefined) {
                    state.pdfTopMargin = data.pdfTopMargin;
                }
            }
            
            // Load worker daily rates
            const ratesDoc = await db.collection('settings').doc('workerRates').get();
            if (ratesDoc.exists) {
                const data = ratesDoc.data();
                if (data.workerDailyRates) {
                    state.workerDailyRates = data.workerDailyRates;
                }
            }
            
            console.log('Settings loaded successfully');
            render();
        } catch (error) {
            console.error('Error loading settings:', error);
            if (state.user) {
                alert('שגיאה בטעינת הגדרות: ' + error.message);
            }
        }
    }

    async function uploadPDFTemplate(file) {
        if (!file) return;
        
        console.log('Uploading:', file.name);
        
        // Upload to Firebase Storage
        const storageRef = storage.ref('templates/order_template.pdf');
        await storageRef.put(file);
        
        // Get URL
        const url = await storageRef.getDownloadURL();
        
        // Save to Firestore
        await db.collection('settings').doc('pdfTemplate').set({ url });
        
        // Update state
        state.pdfTemplate = url;
        render();
        
        alert('הועלה בהצלחה!');
    }

    async function removePDFTemplate() {
        if (!confirm('האם למחוק את תבנית ה-PDF?')) return;
        
        try {
            const storageRef = storage.ref('templates/order_template.pdf');
            await storageRef.delete();
            state.pdfTemplate = null;
            console.log('PDF template removed');
            alert('תבנית PDF נמחקה בהצלחה');
            render();
        } catch (error) {
            console.error('Error removing PDF template:', error);
            alert('שגיאה במחיקת תבנית PDF: ' + error.message);
        }
    }

    async function updatePDFTopMargin(margin) {
        try {
            const marginValue = parseInt(margin) || 180;
            state.pdfTopMargin = marginValue;
            
            // Save to Firestore
            await db.collection('settings').doc('general').set({
                pdfTopMargin: marginValue
            }, { merge: true });
            
            console.log('PDF top margin updated:', marginValue);
            render();
        } catch (error) {
            console.error('Error updating PDF top margin:', error);
            alert('שגיאה בעדכון שולי PDF: ' + error.message);
        }
    }

    async function updateWorkerDailyRate(workerId, rate) {
        try {
            const rateValue = parseFloat(rate) || 0;
            
            // Update local state
            if (!state.workerDailyRates) {
                state.workerDailyRates = {};
            }
            state.workerDailyRates[workerId] = rateValue;
            
            // Save to Firestore
            const updates = {};
            updates[`workerDailyRates.${workerId}`] = rateValue;
            
            await db.collection('settings').doc('workerRates').set(updates, { merge: true });
            
            console.log(`Worker ${workerId} daily rate updated:`, rateValue);
            render();
        } catch (error) {
            console.error('Error updating worker daily rate:', error);
            alert('שגיאה בעדכון תעריף יומי: ' + error.message);
        }
    }

    async function saveAllWorkerRates() {
        try {
            // Save all worker rates at once
            await db.collection('settings').doc('workerRates').set({
                workerDailyRates: state.workerDailyRates
            });
            
            console.log('All worker rates saved');
            alert('כל התעריפים נשמרו בהצלחה');
            state.editingWorkerRates = false;
            render();
        } catch (error) {
            console.error('Error saving worker rates:', error);
            alert('שגיאה בשמירת תעריפים: ' + error.message);
        }
    }

    function toggleEditWorkerRates() {
        state.editingWorkerRates = !state.editingWorkerRates;
        render();
    }

    function showSettingsView() {
        state.view = 'settings';
        state.selectedClient = null;
        state.selectedProject = null;
        updateHistory();
        loadSettings();
    }

    // Return public API
    return {
        loadSettings,
        uploadPDFTemplate,
        removePDFTemplate,
        updatePDFTopMargin,
        updateWorkerDailyRate,
        saveAllWorkerRates,
        toggleEditWorkerRates,
        showSettingsView
    };
}

