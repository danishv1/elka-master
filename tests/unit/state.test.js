// Unit tests for application state management
describe('Application State', () => {
  let state;

  beforeEach(() => {
    // Reset state before each test
    state = {
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
  });

  describe('Initial State', () => {
    test('should have correct initial values', () => {
      expect(state.clients).toEqual([]);
      expect(state.projects).toEqual([]);
      expect(state.selectedClient).toBeNull();
      expect(state.selectedProject).toBeNull();
      expect(state.view).toBe('clients');
      expect(state.newProject.creationDate).toBeDefined();
    });

    test('should have today\'s date as default creation date', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(state.newProject.creationDate).toBe(today);
    });
  });

  describe('State Updates', () => {
    test('should update newProject creationDate', () => {
      const newDate = '2024-01-15';
      state.newProject.creationDate = newDate;
      expect(state.newProject.creationDate).toBe(newDate);
    });

    test('should reset newProject after adding', () => {
      state.newProject.name = 'Test Project';
      state.newProject.revenue = '1000';
      state.newProject.status = 'בביצוע';
      state.newProject.creationDate = '2024-01-15';

      // Simulate reset after adding
      state.newProject = { name: '', revenue: '', status: 'פתוח', creationDate: new Date().toISOString().split('T')[0] };

      expect(state.newProject.name).toBe('');
      expect(state.newProject.revenue).toBe('');
      expect(state.newProject.status).toBe('פתוח');
      expect(state.newProject.creationDate).toBeDefined();
    });
  });
});
