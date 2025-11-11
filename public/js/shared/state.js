// ===== SHARED STATE =====
// Centralized application state
// Version: 1.2.0
// Branch: feat-general-settings-stats-3ir4X

export const initialState = {
    appVersion: '1.2.0',
    appBranch: 'feat-general-settings-stats-3ir4X',
    clients: [],
    projects: [],
    allProjects: [], // All projects across all clients with full data
    suppliers: [],
    orders: [],
    selectedClient: null,
    selectedProject: null,
    selectedSupplier: null,
    showNewClient: false,
    showNewProject: false,
    showNewInvoice: false,
    showNewSupplier: false,
    showNewOrder: false,
    editingClient: null,
    editingProject: null,
    editingInvoice: null,
    editingSupplier: null,
    editingOrder: null,
    viewingAttachment: null,
    view: 'clients', // 'clients', 'projects', 'suppliers', 'orders', 'all-projects', 'workSchedule', 'settings'
    projectStatusFilter: 'all', // 'all' or specific status
    allProjectsStatusFilter: 'all', // Status filter for all-projects view
    ordersViewTab: 'all', // 'all' or 'by-project'
    user: null, // Firebase auth user
    loading: true, // Loading state
    newClient: { name: '', email: '', phone: '', notes: '' },
    newProject: { 
        name: '', 
        revenue: '', 
        status: 'פתוח', 
        creationDate: new Date().toISOString().split('T')[0], 
        description: '', 
        activeInSchedule: true 
    },
    newInvoice: {
        supplier: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ description: '', amount: '', category: 'שונות' }],
        attachments: []
    },
    newSupplier: {
        name: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        paymentConditions: '',
        documents: []
    },
    newOrder: {
        selectedClientId: '',
        projectId: '',
        supplierId: '',
        items: [{ description: '', unit: 'יח\'', quantity: '', price: '', sum: 0 }],
        orderDate: new Date().toISOString().split('T')[0],
        comments: '',
        deliveryAddress: '',
        orderedBy: ''
    },
    ocrProcessing: false,
    ocrProgress: 0,
    ocrResults: null,
    ocrMethod: 'tesseract',
    cropperInstance: null,
    showCropModal: false,
    pendingOCRFile: null,
    pdfTemplate: null, // URL to uploaded PDF template
    pdfTopMargin: 180, // Configurable top margin for PDF template (in points)
    uploadingPDFTemplate: false, // PDF template upload in progress
    pdfUploadProgress: 0, // PDF upload progress percentage (0-100)
    loadingSuppliers: false,
    loadingOrders: false,
    suppliersLoaded: false,
    ordersLoaded: false,
    // Work Schedule state
    workAssignments: [], // Array of {id, workerId, projectId, projectName, date, clientId, clientName}
    calendarViewMode: 'week', // 'week' or 'month'
    calendarDate: new Date(), // Current date being viewed
    draggedWorker: null, // Currently dragged worker
    loadingAssignments: false,
    assignmentsLoaded: false,
    // Worker daily rates (expenses calculated from work assignments)
    workerDailyRates: {
        'a': 500, // יאסר
        'b': 500, // פריד
        'c': 500, // חמודי
        'd': 500, // סלימאן
        'e': 500  // מישל
    },
    editingWorkerRates: false
};

// Create the state object
export const state = { ...initialState };

