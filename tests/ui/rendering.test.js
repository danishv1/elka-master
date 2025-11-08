// UI tests for rendering functions
describe('UI Rendering', () => {
  let mockState;
  let mockDocument;

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

    mockDocument = document;
  });

  describe('Client View Rendering', () => {
    test('should render empty clients view', () => {
      const html = renderClientsView();
      
      expect(html).toContain('מערכת ניהול פרויקטים');
      expect(html).toContain('לקוחות');
      expect(html).toContain('עדיין לא הוספת לקוחות');
    });

    test('should render clients list', () => {
      mockState.clients = [
        {
          id: 'client-1',
          name: 'Test Client 1',
          email: 'client1@example.com',
          phone: '123456789',
          notes: 'Test notes'
        },
        {
          id: 'client-2',
          name: 'Test Client 2',
          email: 'client2@example.com',
          phone: '987654321',
          notes: ''
        }
      ];

      const html = renderClientsView();
      
      expect(html).toContain('Test Client 1');
      expect(html).toContain('Test Client 2');
      expect(html).toContain('client1@example.com');
      expect(html).toContain('client2@example.com');
    });

    test('should render new client form when showNewClient is true', () => {
      mockState.showNewClient = true;

      const html = renderClientsView();
      
      expect(html).toContain('לקוח חדש');
      expect(html).toContain('name="text"');
      expect(html).toContain('placeholder="שם הלקוח *"');
      expect(html).toContain('placeholder="אימייל"');
      expect(html).toContain('placeholder="טלפון"');
    });

    test('should render client editing form', () => {
      mockState.editingClient = {
        id: 'client-1',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123456789',
        notes: 'Test notes'
      };

      const html = renderClientsView();
      
      expect(html).toContain('value="Test Client"');
      expect(html).toContain('value="test@example.com"');
      expect(html).toContain('value="123456789"');
    });
  });

  describe('Project View Rendering', () => {
    test('should render empty projects view', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.projects = [];

      const html = renderProjectsView();
      
      expect(html).toContain('Test Client');
      expect(html).toContain('פרויקטים');
      expect(html).toContain('עדיין לא הוספת פרויקטים ללקוח זה');
    });

    test('should render projects list with calculations', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.projects = [
        {
          id: 'project-1',
          name: 'Test Project 1',
          revenue: 10000,
          status: 'פתוח',
          createdAt: { toDate: () => new Date('2024-01-15') },
          invoices: [
            { amount: 2000 },
            { amount: 1500 }
          ]
        },
        {
          id: 'project-2',
          name: 'Test Project 2',
          revenue: 5000,
          status: 'בביצוע',
          createdAt: { toDate: () => new Date('2024-01-10') },
          invoices: [
            { amount: 1000 }
          ]
        }
      ];

      const html = renderProjectsView();
      
      expect(html).toContain('Test Project 1');
      expect(html).toContain('Test Project 2');
      expect(html).toContain('₪10,000'); // Revenue display
      expect(html).toContain('₪3,500'); // Expenses display
      expect(html).toContain('₪6,500'); // Profit display
    });

    test('should render new project form with creation date field', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.showNewProject = true;
      mockState.newProject.creationDate = '2024-01-15';

      const html = renderProjectsView();
      
      expect(html).toContain('פרויקט חדש');
      expect(html).toContain('placeholder="שם הפרויקט"');
      expect(html).toContain('placeholder="הכנסה מהלקוח (₪)"');
      expect(html).toContain('type="date"');
      expect(html).toContain('value="2024-01-15"');
    });

    test('should render project editing form', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.editingProject = {
        id: 'project-1',
        name: 'Test Project',
        revenue: 5000,
        status: 'פתוח'
      };

      const html = renderProjectsView();
      
      expect(html).toContain('value="Test Project"');
      expect(html).toContain('value="5000"');
    });
  });

  describe('Invoice View Rendering', () => {
    test('should render empty invoices view', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.selectedProject = {
        id: 'project-1',
        name: 'Test Project',
        revenue: 10000,
        invoices: []
      };

      const html = renderInvoiceView();
      
      expect(html).toContain('Test Client');
      expect(html).toContain('Test Project');
      expect(html).toContain('חשבוניות');
      expect(html).toContain('עדיין לא הוספת חשבוניות לפרויקט זה');
    });

    test('should render invoices with totals', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.selectedProject = {
        id: 'project-1',
        name: 'Test Project',
        revenue: 10000,
        invoices: [
          {
            id: 'invoice-1',
            supplier: 'Supplier 1',
            amount: 2000,
            date: '2024-01-15',
            description: 'Test invoice 1',
            category: 'שונות'
          },
          {
            id: 'invoice-2',
            supplier: 'Supplier 2',
            amount: 1500,
            date: '2024-01-10',
            description: 'Test invoice 2',
            category: 'בטון ומוצריו'
          }
        ]
      };

      const html = renderInvoiceView();
      
      expect(html).toContain('Supplier 1');
      expect(html).toContain('Supplier 2');
      expect(html).toContain('₪3,500'); // Total expenses
      expect(html).toContain('₪10,000'); // Revenue
      expect(html).toContain('₪6,500'); // Profit
    });

    test('should render new invoice form', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.selectedProject = { id: 'project-1', name: 'Test Project', revenue: 10000, invoices: [] };
      mockState.showNewInvoice = true;

      const html = renderInvoiceView();
      
      expect(html).toContain('חשבונית חדשה');
      expect(html).toContain('placeholder="שם הספק"');
      expect(html).toContain('type="date"');
      expect(html).toContain('placeholder="תיאור"');
      expect(html).toContain('placeholder="סכום (₪)"');
    });

    test('should render invoice editing form', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.selectedProject = { id: 'project-1', name: 'Test Project', revenue: 10000, invoices: [] };
      mockState.editingInvoice = {
        id: 'invoice-1',
        supplier: 'Test Supplier',
        amount: 1000,
        date: '2024-01-15',
        description: 'Test description',
        category: 'שונות',
        attachments: []
      };

      const html = renderInvoiceView();
      
      expect(html).toContain('עריכת חשבונית');
      expect(html).toContain('value="Test Supplier"');
      expect(html).toContain('value="1000"');
      expect(html).toContain('value="2024-01-15"');
    });
  });

  describe('Attachment Modal Rendering', () => {
    test('should render image attachment modal', () => {
      mockState.viewingAttachment = {
        name: 'test-image.jpg',
        url: 'https://example.com/image.jpg',
        type: 'image/jpeg'
      };

      const html = renderAttachmentModal();
      
      expect(html).toContain('test-image.jpg');
      expect(html).toContain('src="https://example.com/image.jpg"');
      expect(html).toContain('img');
    });

    test('should render PDF attachment modal', () => {
      mockState.viewingAttachment = {
        name: 'test-document.pdf',
        url: 'https://example.com/document.pdf',
        type: 'application/pdf'
      };

      const html = renderAttachmentModal();
      
      expect(html).toContain('test-document.pdf');
      expect(html).toContain('src="https://example.com/document.pdf"');
      expect(html).toContain('iframe');
    });
  });

  describe('Navigation Rendering', () => {
    test('should render back to clients button', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.view = 'projects';

      const html = renderProjectsView();
      
      expect(html).toContain('חזרה ללקוחות');
      expect(html).toContain('onclick="backToClients()"');
    });

    test('should render back to projects button', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.selectedProject = { id: 'project-1', name: 'Test Project' };

      const html = renderInvoiceView();
      
      expect(html).toContain('חזרה לפרויקטים');
      expect(html).toContain('onclick="backToProjects()"');
    });
  });

  describe('Status Rendering', () => {
    test('should render project status with correct styling', () => {
      mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
      mockState.projects = [
        {
          id: 'project-1',
          name: 'Test Project',
          revenue: 10000,
          status: 'שולם',
          createdAt: { toDate: () => new Date('2024-01-15') },
          invoices: []
        }
      ];

      const html = renderProjectsView();
      
      expect(html).toContain('שולם');
      expect(html).toContain('bg-green-100 text-green-800');
    });

    test('should render different status styles', () => {
      const statuses = [
        { status: 'פתוח', expectedClass: 'bg-gray-100 text-gray-800' },
        { status: 'בביצוע', expectedClass: 'bg-blue-100 text-blue-800' },
        { status: 'לתשלום', expectedClass: 'bg-yellow-100 text-yellow-800' },
        { status: 'שולם', expectedClass: 'bg-green-100 text-green-800' }
      ];

      statuses.forEach(({ status, expectedClass }) => {
        mockState.selectedClient = { id: 'client-1', name: 'Test Client' };
        mockState.projects = [{
          id: 'project-1',
          name: 'Test Project',
          revenue: 10000,
          status: status,
          createdAt: { toDate: () => new Date('2024-01-15') },
          invoices: []
        }];

        const html = renderProjectsView();
        expect(html).toContain(expectedClass);
      });
    });
  });
});
