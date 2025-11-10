// ===== CLIENTS VIEW RENDERING =====

export function renderClientsView(state) {
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

