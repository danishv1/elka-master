import { state } from '../state.js';

export function renderOCRApprovalModal() {
    if (!state.ocrResults) return '';
    
    return `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="event.target === this && cancelOCRResults()">
            <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <h3 class="text-xl font-bold mb-4">אישור נתוני חשבונית</h3>
                <p class="text-sm text-gray-600 mb-4">בדוק את הנתונים שחולצו ותקן במידת הצורך</p>
                
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">ספק</label>
                        <input type="text" value="${state.ocrResults.supplier || ''}" 
                            onchange="window.appState.ocrResults.supplier = this.value"
                            class="w-full p-2 border rounded"/>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">תאריך</label>
                        <input type="date" value="${state.ocrResults.date || ''}" 
                            onchange="window.appState.ocrResults.date = this.value"
                            class="w-full p-2 border rounded"/>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">פריטים</label>
                        ${(state.ocrResults.items || []).map((item, index) => `
                            <div class="flex gap-2 mb-2">
                                <input type="text" placeholder="תיאור" value="${item.description || ''}"
                                    onchange="window.appState.ocrResults.items[${index}].description = this.value"
                                    class="flex-1 p-2 border rounded text-sm"/>
                                <input type="number" placeholder="סכום" value="${item.amount || ''}"
                                    onchange="window.appState.ocrResults.items[${index}].amount = this.value"
                                    class="w-32 p-2 border rounded text-sm"/>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button onclick="approveOCRResults()" 
                        class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        ✓ אשר והוסף
                    </button>
                    <button onclick="cancelOCRResults()" 
                        class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                        ✕ ביטול
                    </button>
                </div>
            </div>
        </div>
    `;
}

