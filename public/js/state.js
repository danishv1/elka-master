// Global application state
export const state = {
    clients: [],
    projects: [],
    selectedClient: null,
    selectedProject: null,
    showNewClient: false,
    showNewProject: false,
    showNewInvoice: false,
    editingClient: null,
    editingProject: null,
    editingInvoice: null,
    viewingAttachment: null,
    view: 'clients',
    projectStatusFilter: 'all',
    user: null,
    loading: true,
    newClient: { name: '', email: '', phone: '', notes: '' },
    newProject: { 
        name: '', 
        revenue: '', 
        status: 'פתוח', 
        creationDate: new Date().toISOString().split('T')[0], 
        description: '' 
    },
    newInvoice: {
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ description: '', amount: '', category: 'שונות' }],
        attachments: []
    },
    // OCR state
    ocrProcessing: false,
    ocrProgress: 0,
    ocrResults: null,
    ocrMethod: 'tesseract'
};

