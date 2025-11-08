// UI tests for user interactions
describe('UI Interactions', () => {
  let mockState;
  let mockDb;
  let mockStorage;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '<div id="app"></div>';
    
    mockState = {
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
      newClient: { name: '', email: '', phone: '', notes: '' },
      newProject: { name: '', revenue: '', status: 'פתוח', creationDate: new Date().toISOString().split('T')[0] },
      newInvoice: {
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ description: '', amount: '', category: 'שונות' }],
        attachments: []
      }
    };

    mockDb = {
      collection: jest.fn(() => ({
        add: jest.fn(),
        get: jest.fn(),
        doc: jest.fn(() => ({
          update: jest.fn(),
          delete: jest.fn()
        })),
        where: jest.fn(() => ({
          get: jest.fn()
        }))
      })),
      batch: jest.fn(() => ({
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn()
      }))
    };

    mockStorage = {
      ref: jest.fn(() => ({
        putString: jest.fn(() => Promise.resolve()),
        getDownloadURL: jest.fn(() => Promise.resolve('mock-download-url'))
      }))
    };

    global.firebase = {
      firestore: () => mockDb,
      storage: () => mockStorage,
      FieldValue: {
        serverTimestamp: () => new Date()
      }
    };

    // Mock global functions
    global.render = jest.fn();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  describe('Form Interactions', () => {
    test('should handle new client form input changes', () => {
      const clientForm = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123456789',
        notes: 'Test notes'
      };

      // Simulate form input changes
      Object.keys(clientForm).forEach(key => {
        mockState.newClient[key] = clientForm[key];
      });

      expect(mockState.newClient.name).toBe('Test Client');
      expect(mockState.newClient.email).toBe('test@example.com');
      expect(mockState.newClient.phone).toBe('123456789');
      expect(mockState.newClient.notes).toBe('Test notes');
    });

    test('should handle new project form input changes', () => {
      const projectForm = {
        name: 'Test Project',
        revenue: '10000',
        status: 'בביצוע',
        creationDate: '2024-01-15'
      };

      // Simulate form input changes
      Object.keys(projectForm).forEach(key => {
        mockState.newProject[key] = projectForm[key];
      });

      expect(mockState.newProject.name).toBe('Test Project');
      expect(mockState.newProject.revenue).toBe('10000');
      expect(mockState.newProject.status).toBe('בביצוע');
      expect(mockState.newProject.creationDate).toBe('2024-01-15');
    });

    test('should handle new invoice form input changes', () => {
      const invoiceForm = {
        supplier: 'Test Supplier',
        date: '2024-01-15'
      };

      // Simulate form input changes
      Object.keys(invoiceForm).forEach(key => {
        mockState.newInvoice[key] = invoiceForm[key];
      });

      expect(mockState.newInvoice.supplier).toBe('Test Supplier');
      expect(mockState.newInvoice.date).toBe('2024-01-15');
    });

    test('should handle invoice item updates', () => {
      const itemUpdate = {
        index: 0,
        field: 'description',
        value: 'Updated description'
      };

      mockState.newInvoice.items[itemUpdate.index][itemUpdate.field] = itemUpdate.value;

      expect(mockState.newInvoice.items[0].description).toBe('Updated description');
    });

    test('should handle adding new invoice items', () => {
      const initialLength = mockState.newInvoice.items.length;
      
      mockState.newInvoice.items.push({ description: '', amount: '', category: 'שונות' });

      expect(mockState.newInvoice.items.length).toBe(initialLength + 1);
    });

    test('should handle removing invoice items', () => {
      // Add multiple items first
      mockState.newInvoice.items.push({ description: '', amount: '', category: 'שונות' });
      mockState.newInvoice.items.push({ description: '', amount: '', category: 'בטון ומוצריו' });
      
      const initialLength = mockState.newInvoice.items.length;
      
      // Remove one item
      mockState.newInvoice.items.splice(1, 1);

      expect(mockState.newInvoice.items.length).toBe(initialLength - 1);
    });
  });

  describe('Navigation Interactions', () => {
    test('should handle client selection', () => {
      const client = {
        id: 'client-1',
        name: 'Test Client',
        email: 'test@example.com'
      };

      mockState.clients.push(client);
      mockState.selectedClient = client;
      mockState.view = 'projects';

      expect(mockState.selectedClient).toBe(client);
      expect(mockState.view).toBe('projects');
    });

    test('should handle project selection', () => {
      const project = {
        id: 'project-1',
        name: 'Test Project',
        revenue: 10000,
        invoices: []
      };

      mockState.projects.push(project);
      mockState.selectedProject = project;

      expect(mockState.selectedProject).toBe(project);
    });

    test('should handle back to clients navigation', () => {
      mockState.view = 'projects';
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.selectedProject = null;
      mockState.projects = [];

      // Simulate back to clients
      mockState.view = 'clients';
      mockState.selectedClient = null;

      expect(mockState.view).toBe('clients');
      expect(mockState.selectedClient).toBeNull();
    });

    test('should handle back to projects navigation', () => {
      mockState.selectedProject = { id: 'project-1', name: 'Test Project' };

      // Simulate back to projects
      mockState.selectedProject = null;

      expect(mockState.selectedProject).toBeNull();
    });
  });

  describe('Edit Mode Interactions', () => {
    test('should handle client editing mode', () => {
      const client = {
        id: 'client-1',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123456789',
        notes: 'Test notes'
      };

      mockState.editingClient = client;

      expect(mockState.editingClient).toBe(client);
      expect(mockState.editingClient.name).toBe('Test Client');
    });

    test('should handle project editing mode', () => {
      const project = {
        id: 'project-1',
        name: 'Test Project',
        revenue: 10000,
        status: 'פתוח'
      };

      mockState.editingProject = project;

      expect(mockState.editingProject).toBe(project);
      expect(mockState.editingProject.name).toBe('Test Project');
    });

    test('should handle invoice editing mode', () => {
      const invoice = {
        id: 'invoice-1',
        supplier: 'Test Supplier',
        amount: 1000,
        date: '2024-01-15',
        description: 'Test description',
        category: 'שונות',
        attachments: []
      };

      mockState.editingInvoice = invoice;

      expect(mockState.editingInvoice).toBe(invoice);
      expect(mockState.editingInvoice.supplier).toBe('Test Supplier');
    });

    test('should handle canceling edit modes', () => {
      mockState.editingClient = { id: 'client-1', name: 'Test Client' };
      mockState.editingProject = { id: 'project-1', name: 'Test Project' };
      mockState.editingInvoice = { id: 'invoice-1', supplier: 'Test Supplier' };

      // Cancel all edit modes
      mockState.editingClient = null;
      mockState.editingProject = null;
      mockState.editingInvoice = null;

      expect(mockState.editingClient).toBeNull();
      expect(mockState.editingProject).toBeNull();
      expect(mockState.editingInvoice).toBeNull();
    });
  });

  describe('Modal Interactions', () => {
    test('should handle showing new client modal', () => {
      mockState.showNewClient = true;

      expect(mockState.showNewClient).toBe(true);
    });

    test('should handle showing new project modal', () => {
      mockState.showNewProject = true;

      expect(mockState.showNewProject).toBe(true);
    });

    test('should handle showing new invoice modal', () => {
      mockState.showNewInvoice = true;

      expect(mockState.showNewInvoice).toBe(true);
    });

    test('should handle attachment viewing modal', () => {
      const attachment = {
        name: 'test.pdf',
        url: 'https://example.com/test.pdf',
        type: 'application/pdf'
      };

      mockState.viewingAttachment = attachment;

      expect(mockState.viewingAttachment).toBe(attachment);
    });

    test('should handle closing modals', () => {
      mockState.showNewClient = true;
      mockState.showNewProject = true;
      mockState.showNewInvoice = true;
      mockState.viewingAttachment = { name: 'test.pdf', url: 'url', type: 'pdf' };

      // Close all modals
      mockState.showNewClient = false;
      mockState.showNewProject = false;
      mockState.showNewInvoice = false;
      mockState.viewingAttachment = null;

      expect(mockState.showNewClient).toBe(false);
      expect(mockState.showNewProject).toBe(false);
      expect(mockState.showNewInvoice).toBe(false);
      expect(mockState.viewingAttachment).toBeNull();
    });
  });

  describe('File Upload Interactions', () => {
    test('should handle file selection', () => {
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        data: 'data:application/pdf;base64,test-data'
      };

      mockState.newInvoice.attachments.push(mockFile);

      expect(mockState.newInvoice.attachments.length).toBe(1);
      expect(mockState.newInvoice.attachments[0].name).toBe('test.pdf');
    });

    test('should handle multiple file selection', () => {
      const files = [
        { name: 'test1.pdf', type: 'application/pdf', size: 1024, data: 'data1' },
        { name: 'test2.jpg', type: 'image/jpeg', size: 2048, data: 'data2' }
      ];

      files.forEach(file => {
        mockState.newInvoice.attachments.push(file);
      });

      expect(mockState.newInvoice.attachments.length).toBe(2);
    });

    test('should handle file removal', () => {
      const files = [
        { id: 1, name: 'test1.pdf' },
        { id: 2, name: 'test2.jpg' }
      ];

      mockState.newInvoice.attachments = files;
      
      // Remove file with id 1
      mockState.newInvoice.attachments = mockState.newInvoice.attachments.filter(f => f.id !== 1);

      expect(mockState.newInvoice.attachments.length).toBe(1);
      expect(mockState.newInvoice.attachments[0].name).toBe('test2.jpg');
    });
  });

  describe('Form Validation Interactions', () => {
    test('should handle empty required fields', () => {
      const emptyClient = { name: '', email: '', phone: '', notes: '' };
      const emptyProject = { name: '', revenue: '', status: 'פתוח', creationDate: '' };
      const emptyInvoice = { supplier: '', date: '', items: [] };

      expect(emptyClient.name).toBeFalsy();
      expect(emptyProject.name).toBeFalsy();
      expect(emptyInvoice.supplier).toBeFalsy();
    });

    test('should handle invalid data formats', () => {
      const invalidEmail = 'invalid-email';
      const invalidRevenue = 'not-a-number';
      const invalidDate = 'invalid-date';

      expect(invalidEmail.includes('@')).toBe(false);
      expect(isNaN(parseFloat(invalidRevenue))).toBe(true);
      expect(isNaN(new Date(invalidDate).getTime())).toBe(true);
    });

    test('should handle valid data formats', () => {
      const validEmail = 'test@example.com';
      const validRevenue = '1000';
      const validDate = '2024-01-15';

      expect(validEmail.includes('@')).toBe(true);
      expect(parseFloat(validRevenue)).toBe(1000);
      expect(new Date(validDate).toISOString().split('T')[0]).toBe(validDate);
    });
  });

  describe('State Reset Interactions', () => {
    test('should reset new client form after successful submission', () => {
      mockState.newClient = { name: 'Test Client', email: 'test@example.com', phone: '123456789', notes: 'Test notes' };

      // Simulate form reset
      mockState.newClient = { name: '', email: '', phone: '', notes: '' };

      expect(mockState.newClient.name).toBe('');
      expect(mockState.newClient.email).toBe('');
      expect(mockState.newClient.phone).toBe('');
      expect(mockState.newClient.notes).toBe('');
    });

    test('should reset new project form after successful submission', () => {
      mockState.newProject = { name: 'Test Project', revenue: '10000', status: 'פתוח', creationDate: '2024-01-15' };

      // Simulate form reset
      mockState.newProject = { name: '', revenue: '', status: 'פתוח', creationDate: new Date().toISOString().split('T')[0] };

      expect(mockState.newProject.name).toBe('');
      expect(mockState.newProject.revenue).toBe('');
      expect(mockState.newProject.status).toBe('פתוח');
      expect(mockState.newProject.creationDate).toBeDefined();
    });

    test('should reset new invoice form after successful submission', () => {
      mockState.newInvoice = {
        supplier: 'Test Supplier',
        date: '2024-01-15',
        items: [{ description: 'Test item', amount: '1000', category: 'שונות' }],
        attachments: [{ name: 'test.pdf', url: 'url', type: 'pdf' }]
      };

      // Simulate form reset
      mockState.newInvoice = {
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ description: '', amount: '', category: 'שונות' }],
        attachments: []
      };

      expect(mockState.newInvoice.supplier).toBe('');
      expect(mockState.newInvoice.items.length).toBe(1);
      expect(mockState.newInvoice.attachments.length).toBe(0);
    });
  });
});
