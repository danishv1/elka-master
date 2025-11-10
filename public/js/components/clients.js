// ===== CLIENT COMPONENT =====
// Handles all client-related functionality

export function initClientsComponent(context) {
    const { state, db, firebase, render, updateHistory } = context;

    // ===== CLIENT FUNCTIONS =====
    
    async function loadClients() {
        if (!state.user) {
            console.log('Cannot load clients: user not authenticated');
            return;
        }
        try {
            console.log('Loading clients...');
            const snapshot = await db.collection('clients').get();
            state.clients = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            state.clients.sort((a, b) => {
                const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
                const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
                return bTime - aTime;
            });
            console.log('Loaded clients:', state.clients.length);
            console.log('Clients data:', state.clients);
            render();
        } catch (error) {
            console.error('Error loading clients:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack,
                user: state.user,
                isDevelopment: context.isDevelopment
            });
            
            // Only show error if user is authenticated (not during initial load)
            if (state.user) {
                let errorMsg = 'שגיאה בטעינת לקוחות';
                if (error.code === 'permission-denied') {
                    errorMsg += ': אין הרשאות לגישה. אנא ודא שאתה מחובר עם חשבון מורשה.';
                } else if (error.code === 'unavailable') {
                    errorMsg += ': שירות Firestore לא זמין. אנא בדוק את החיבור לאינטרנט.';
                } else {
                    errorMsg += ': ' + (error.message || error.code || 'שגיאה לא ידועה');
                }
                alert(errorMsg);
            }
        }
    }

    async function addClient() {
        if (!state.newClient.name) {
            alert('יש להזין שם לקוח');
            return;
        }
        
        try {
            const clientData = {
                name: state.newClient.name,
                email: state.newClient.email,
                phone: state.newClient.phone,
                notes: state.newClient.notes,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await db.collection('clients').add(clientData);
            console.log('Client added:', docRef.id);
            
            state.clients.unshift({
                id: docRef.id,
                ...clientData,
                createdAt: new Date()
            });
            
            state.newClient = { name: '', email: '', phone: '', notes: '' };
            state.showNewClient = false;
            render();
        } catch (error) {
            console.error('Error adding client:', error);
            alert('שגיאה בהוספת לקוח: ' + error.message);
        }
    }

    async function deleteClient(clientId) {
        if (!confirm('האם למחוק את הלקוח? כל הפרויקטים והחשבוניות שלו יימחקו!')) return;
        
        try {
            // Delete all projects for this client
            const projectsSnapshot = await db.collection('projects')
                .where('clientId', '==', clientId).get();
            
            const batch = db.batch();
            
            // Delete all invoices for each project
            for (const projectDoc of projectsSnapshot.docs) {
                const invoicesSnapshot = await db.collection('invoices')
                    .where('projectId', '==', projectDoc.id).get();
                invoicesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
                batch.delete(projectDoc.ref);
            }
            
            // Delete client
            batch.delete(db.collection('clients').doc(clientId));
            await batch.commit();
            
            state.clients = state.clients.filter(c => c.id !== clientId);
            if (state.selectedClient?.id === clientId) {
                state.selectedClient = null;
                state.projects = [];
            }
            render();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('שגיאה במחיקת לקוח: ' + error.message);
        }
    }

    async function saveEditClient() {
        if (!state.editingClient.name) return;
        
        try {
            const updates = {
                name: state.editingClient.name,
                email: state.editingClient.email,
                phone: state.editingClient.phone,
                notes: state.editingClient.notes
            };
            
            await db.collection('clients').doc(state.editingClient.id).update(updates);
            
            state.clients = state.clients.map(c =>
                c.id === state.editingClient.id ? { ...c, ...updates } : c
            );
            
            if (state.selectedClient?.id === state.editingClient.id) {
                state.selectedClient = { ...state.selectedClient, ...updates };
            }
            
            state.editingClient = null;
            render();
        } catch (error) {
            console.error('Error updating client:', error);
            alert('שגיאה בעדכון לקוח: ' + error.message);
        }
    }

    async function selectClient(clientId) {
        const client = state.clients.find(c => c.id === clientId);
        if (!client) return;
        
        state.selectedClient = client;
        state.view = 'projects';
        updateHistory();
        await context.loadProjectsForClient(clientId);
    }

    // ===== CLIENT VIEW RENDERING =====
    
    function renderClientsView() {
        return `
            <div class="max-w-6xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-bold text-gray-800">לקוחות</h2>
                    <button onclick="window.appHandlers.clients.showNewClientForm()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                        + לקוח חדש
                    </button>
                </div>
                
                ${state.showNewClient ? `
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 class="text-xl font-semibold mb-4">לקוח חדש</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input type="text" placeholder="שם לקוח" value="${state.newClient.name}" 
                                onchange="window.appHandlers.clients.updateNewClient('name', this.value)"
                                class="border rounded px-3 py-2">
                            <input type="email" placeholder="אימייל" value="${state.newClient.email}"
                                onchange="window.appHandlers.clients.updateNewClient('email', this.value)"
                                class="border rounded px-3 py-2">
                            <input type="tel" placeholder="טלפון" value="${state.newClient.phone}"
                                onchange="window.appHandlers.clients.updateNewClient('phone', this.value)"
                                class="border rounded px-3 py-2">
                            <textarea placeholder="הערות" value="${state.newClient.notes}"
                                onchange="window.appHandlers.clients.updateNewClient('notes', this.value)"
                                class="border rounded px-3 py-2"></textarea>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.appHandlers.clients.addClient()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                שמור
                            </button>
                            <button onclick="window.appHandlers.clients.cancelNewClient()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                                ביטול
                            </button>
                        </div>
                    </div>
                ` : ''}
                
                <div class="grid gap-4">
                    ${state.clients.map(client => `
                        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                            ${state.editingClient?.id === client.id ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input type="text" value="${state.editingClient.name}" 
                                        onchange="window.appHandlers.clients.updateEditingClient('name', this.value)"
                                        class="border rounded px-3 py-2">
                                    <input type="email" value="${state.editingClient.email}"
                                        onchange="window.appHandlers.clients.updateEditingClient('email', this.value)"
                                        class="border rounded px-3 py-2">
                                    <input type="tel" value="${state.editingClient.phone}"
                                        onchange="window.appHandlers.clients.updateEditingClient('phone', this.value)"
                                        class="border rounded px-3 py-2">
                                    <textarea value="${state.editingClient.notes}"
                                        onchange="window.appHandlers.clients.updateEditingClient('notes', this.value)"
                                        class="border rounded px-3 py-2"></textarea>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="window.appHandlers.clients.saveEditClient()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                        שמור
                                    </button>
                                    <button onclick="window.appHandlers.clients.cancelEdit()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                                        ביטול
                                    </button>
                                </div>
                            ` : `
                                <div class="flex justify-between items-start">
                                    <div class="flex-1 cursor-pointer" onclick="window.appHandlers.clients.selectClient('${client.id}')">
                                        <h3 class="text-xl font-semibold text-gray-800">${client.name}</h3>
                                        ${client.email ? `<p class="text-gray-600">📧 ${client.email}</p>` : ''}
                                        ${client.phone ? `<p class="text-gray-600">📞 ${client.phone}</p>` : ''}
                                        ${client.notes ? `<p class="text-gray-500 mt-2">${client.notes}</p>` : ''}
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="event.stopPropagation(); window.appHandlers.clients.editClient('${client.id}')" 
                                            class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50">
                                            ✏️ ערוך
                                        </button>
                                        <button onclick="event.stopPropagation(); window.appHandlers.clients.deleteClient('${client.id}')" 
                                            class="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600 hover:bg-red-50">
                                            🗑️ מחק
                                        </button>
                                    </div>
                                </div>
                            `}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Helper functions for UI interactions
    function showNewClientForm() {
        state.showNewClient = true;
        render();
    }

    function cancelNewClient() {
        state.showNewClient = false;
        state.newClient = { name: '', email: '', phone: '', notes: '' };
        render();
    }

    function updateNewClient(field, value) {
        state.newClient[field] = value;
    }

    function editClient(clientId) {
        const client = state.clients.find(c => c.id === clientId);
        if (client) {
            state.editingClient = { ...client };
            render();
        }
    }

    function cancelEdit() {
        state.editingClient = null;
        render();
    }

    function updateEditingClient(field, value) {
        state.editingClient[field] = value;
    }

    // Return public API
    return {
        loadClients,
        addClient,
        deleteClient,
        saveEditClient,
        selectClient,
        renderClientsView,
        showNewClientForm,
        cancelNewClient,
        updateNewClient,
        editClient,
        cancelEdit,
        updateEditingClient
    };
}

