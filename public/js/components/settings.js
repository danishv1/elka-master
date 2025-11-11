// ===== SETTINGS COMPONENT =====
// Handles all application settings and configuration

export function initSettingsComponent(context) {
    console.log('🔧 Initializing settings component...', context);
    const { state, db, firebase, storage, render, updateHistory, workers } = context;
    console.log('Settings component - workers:', workers);

    // ===== SETTINGS FUNCTIONS =====

    async function loadSettings() {
        if (!state.user) {
            console.log('Cannot load settings: user not authenticated');
            return;
        }
        
        try {
            console.log('Loading settings...');
            
            // Preserve editing state
            const wasEditing = state.editingWorkerRates;
            
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
            
            // Restore editing state
            state.editingWorkerRates = wasEditing;
            
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
        if (!file) {
            console.log('No file provided');
            return;
        }
        
        if (file.type !== 'application/pdf') {
            alert('יש להעלות קובץ PDF בלבד');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('גודל הקובץ חורג מ-10MB');
            return;
        }
        
        try {
            console.log('Uploading PDF:', file.name, 'Size:', file.size);
            
            state.uploadingPDFTemplate = true;
            state.pdfUploadProgress = 0;
            render();
            
            // Upload to Firebase Storage
            const storageRef = storage.ref('templates/order_template.pdf');
            const uploadTask = storageRef.put(file);
            
            // Monitor upload progress
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    state.pdfUploadProgress = Math.round(progress);
                    console.log('Upload progress:', state.pdfUploadProgress + '%');
                    render();
                },
                (error) => {
                    console.error('Upload error:', error);
                    state.uploadingPDFTemplate = false;
                    render();
                    alert('שגיאה בהעלאת קובץ: ' + error.message);
                },
                async () => {
                    // Upload completed successfully
                    console.log('Upload completed');
                    const url = await storageRef.getDownloadURL();
                    
                    // Save to Firestore
                    await db.collection('settings').doc('pdfTemplate').set({ url });
                    
                    // Update state
                    state.pdfTemplate = url;
                    state.uploadingPDFTemplate = false;
                    state.pdfUploadProgress = 0;
                    
                    render();
                    alert('תבנית PDF הועלתה בהצלחה! ✅');
                }
            );
        } catch (error) {
            console.error('Error uploading PDF template:', error);
            state.uploadingPDFTemplate = false;
            state.pdfUploadProgress = 0;
            render();
            alert('שגיאה בהעלאת תבנית PDF: ' + error.message);
        }
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
        console.log('Toggle worker rates editing:', state.editingWorkerRates);
        render();
    }

    function showSettingsView() {
        state.view = 'settings';
        state.selectedClient = null;
        state.selectedProject = null;
        updateHistory();
        loadSettings();
    }

    // ===== SETTINGS VIEW RENDERING =====
    
    function renderSettingsView() {
        return `
            <div class="max-w-6xl mx-auto">
                <h1 class="text-3xl font-bold text-gray-800 mb-6">הגדרות</h1>
                
                <div class="space-y-6">
                    <!-- PDF Template Section -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">תבנית PDF להזמנות</h2>
                        <p class="text-sm text-gray-600 mb-4">
                            העלה תבנית PDF שתשמש כרקע להזמנות. התוכן יוצב מעל התבנית.
                        </p>
                        
                        ${state.pdfTemplate ? `
                            <div class="space-y-4">
                                <div class="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <span class="text-3xl">✅</span>
                                        <div>
                                            <div class="font-semibold text-green-800">תבנית PDF הועלתה בהצלחה</div>
                                            <div class="text-sm text-green-600">התבנית מוכנה לשימוש</div>
                                        </div>
                                    </div>
                                    <button onclick="window.appHandlers.settings.removePDFTemplate()"
                                        class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm">
                                        🗑️ מחק תבנית
                                    </button>
                                </div>
                            </div>
                            
                            <!-- PDF Top Margin Setting -->
                            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    שולי עליון ב-PDF (נקודות):
                                </label>
                                <div class="flex items-center gap-3">
                                    <input type="number" 
                                        value="${state.pdfTopMargin || 180}" 
                                        onchange="window.appHandlers.settings.updatePDFTopMargin(this.value)"
                                        class="border border-gray-300 rounded px-3 py-2 w-24"
                                        min="0"
                                        max="500">
                                    <span class="text-sm text-gray-600">
                                        (ערך מומלץ: 180-200 נקודות)
                                    </span>
                                </div>
                                <p class="text-xs text-gray-500 mt-2">
                                    קובע את המרווח מראש הדף שבו יתחיל תוכן ההזמנה
                                </p>
                            </div>
                        ` : `
                            ${state.uploadingPDFTemplate ? `
                                <div class="text-center py-12">
                                    <div class="relative inline-block">
                                        <svg class="w-32 h-32" viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="54" fill="none" stroke="#E5E7EB" stroke-width="8"/>
                                            <circle cx="60" cy="60" r="54" fill="none" stroke="#3B82F6" stroke-width="8"
                                                stroke-dasharray="${Math.PI * 108}"
                                                stroke-dashoffset="${Math.PI * 108 * (1 - state.pdfUploadProgress / 100)}"
                                                stroke-linecap="round"
                                                transform="rotate(-90 60 60)"
                                                style="transition: stroke-dashoffset 0.3s ease"/>
                                        </svg>
                                        <div class="absolute inset-0 flex items-center justify-center">
                                            <span class="text-2xl font-bold text-blue-600">${state.pdfUploadProgress}%</span>
                                        </div>
                                    </div>
                                    <p class="text-gray-600 mt-4">מעלה קובץ PDF...</p>
                                </div>
                            ` : `
                                <div class="py-8">
                                    <!-- Drag and Drop Zone -->
                                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50"
                                        ondragover="event.preventDefault(); event.currentTarget.classList.add('border-blue-500', 'bg-blue-100');"
                                        ondragleave="event.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');"
                                        ondrop="event.preventDefault(); event.currentTarget.classList.remove('border-blue-500', 'bg-blue-100'); const file = event.dataTransfer.files[0]; if(file && file.type === 'application/pdf') window.appHandlers.settings.uploadPDFTemplate(file);">
                                        
                                        <div class="text-6xl mb-4">📄</div>
                                        <h3 class="text-xl font-semibold text-gray-700 mb-2">לא הועלתה תבנית PDF</h3>
                                        <p class="text-gray-600 mb-4">
                                            גרור ושחרר קובץ PDF כאן
                                        </p>
                                        <p class="text-gray-500 text-sm mb-6">או</p>
                                        <label class="cursor-pointer inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
                                            <span class="text-xl">📤</span>
                                            <span>בחר קובץ PDF</span>
                                            <input type="file" 
                                                accept="application/pdf" 
                                                class="hidden" 
                                                onchange="if(this.files[0]) window.appHandlers.settings.uploadPDFTemplate(this.files[0])"/>
                                        </label>
                                        <p class="text-xs text-gray-500 mt-4">קובץ PDF בלבד • עד 10MB</p>
                                    </div>
                                </div>
                            `}
                        `}
                    </div>

                    <!-- Worker Daily Rates Section -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-2xl font-bold text-gray-800">תעריפי עובדים יומיים</h2>
                            ${state.editingWorkerRates ? `
                                <div class="flex gap-2">
                                    <button onclick="event.preventDefault(); window.appHandlers.settings.saveAllWorkerRates(); return false;"
                                        class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                                        💾 שמור
                                    </button>
                                    <button onclick="event.preventDefault(); window.appHandlers.settings.toggleEditWorkerRates(); return false;"
                                        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                                        ✕ ביטול
                                    </button>
                                </div>
                            ` : `
                                <button onclick="event.preventDefault(); console.log('Edit button clicked!', window.appHandlers); window.appHandlers.settings.toggleEditWorkerRates(); return false;"
                                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                                    ✏️ ערוך תעריפים
                                </button>
                            `}
                        </div>
                        
                        <p class="text-sm text-gray-600 mb-4">
                            תעריף יומי בסיסי לכל עובד. ישמש לחישוב הוצאות עובדים בפרויקטים.
                        </p>

                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">שם עובד</th>
                                        <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">תעריף יומי (₪)</th>
                                        <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">ימי עבודה כוללים</th>
                                        <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700">סה"כ הוצאות</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    ${workers.map(worker => {
                                        const rate = state.workerDailyRates[worker.id] || 0;
                                        const totalDays = window.appHandlers?.sidur ? 
                                            window.appHandlers.sidur.getWorkerTotalDays(worker.id) : 0;
                                        const totalExpenses = rate * totalDays;
                                        
                                        return `
                                            <tr class="hover:bg-gray-50">
                                                <td class="px-6 py-4 text-right">
                                                    <div class="font-medium text-gray-800">${worker.name}</div>
                                                    <div class="text-xs text-gray-500">ID: ${worker.id}</div>
                                                </td>
                                                <td class="px-6 py-4 text-right">
                                                    ${state.editingWorkerRates ? `
                                                        <input type="number" 
                                                            value="${rate}" 
                                                            onchange="state.workerDailyRates['${worker.id}'] = parseFloat(this.value) || 0; render()"
                                                            class="border border-gray-300 rounded px-3 py-2 w-32"
                                                            min="0"
                                                            step="50">
                                                    ` : `
                                                        <span class="font-medium text-gray-800">₪${rate.toLocaleString()}</span>
                                                    `}
                                                </td>
                                                <td class="px-6 py-4 text-right">
                                                    <span class="text-gray-700">${totalDays}</span>
                                                </td>
                                                <td class="px-6 py-4 text-right">
                                                    <span class="font-medium text-gray-800">₪${totalExpenses.toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                                <tfoot class="bg-gray-50 font-bold">
                                    <tr>
                                        <td class="px-6 py-4 text-right" colspan="3">סה"כ הוצאות עובדים:</td>
                                        <td class="px-6 py-4 text-right text-blue-600">
                                            ₪${workers.reduce((sum, w) => {
                                                const rate = state.workerDailyRates[w.id] || 0;
                                                const days = window.appHandlers?.sidur ? 
                                                    window.appHandlers.sidur.getWorkerTotalDays(w.id) : 0;
                                                return sum + (rate * days);
                                            }, 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    // Return public API
    const api = {
        loadSettings,
        uploadPDFTemplate,
        removePDFTemplate,
        updatePDFTopMargin,
        updateWorkerDailyRate,
        saveAllWorkerRates,
        toggleEditWorkerRates,
        showSettingsView,
        renderSettingsView
    };
    console.log('✅ Settings component initialized, API:', Object.keys(api));
    return api;
}

