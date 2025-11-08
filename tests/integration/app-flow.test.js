// Integration tests for application flow
describe('Application Flow Integration', () => {
  let mockState;
  let mockDb;
  let mockStorage;

  beforeEach(() => {
    mockState = {
      clients: [],
      projects: [],
      selectedClient: null,
      selectedProject: null,
      showNewClient: false,
      showNewProject: false,
      showNewInvoice: false,
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
  });

  describe('Complete Client-Project-Invoice Flow', () => {
    test('should handle complete workflow from client creation to invoice', async () => {
      // Step 1: Add client
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123456789',
        notes: 'Test notes',
        createdAt: new Date()
      };

      const mockClientRef = { id: 'client-123' };
      mockDb.collection().add.mockResolvedValue(mockClientRef);

      const clientRef = await mockDb.collection('clients').add(clientData);
      mockState.clients.push({
        id: clientRef.id,
        ...clientData
      });

      expect(mockState.clients).toHaveLength(1);
      expect(mockState.clients[0].name).toBe('Test Client');

      // Step 2: Select client and add project
      mockState.selectedClient = mockState.clients[0];
      mockState.newProject = {
        name: 'Test Project',
        revenue: '10000',
        status: 'פתוח',
        creationDate: '2024-01-15'
      };

      const projectData = {
        clientId: mockState.selectedClient.id,
        name: mockState.newProject.name,
        revenue: parseFloat(mockState.newProject.revenue),
        status: mockState.newProject.status,
        createdAt: new Date(mockState.newProject.creationDate)
      };

      const mockProjectRef = { id: 'project-123' };
      mockDb.collection().add.mockResolvedValue(mockProjectRef);

      const projectRef = await mockDb.collection('projects').add(projectData);
      mockState.projects.push({
        id: projectRef.id,
        ...projectData,
        invoices: []
      });

      expect(mockState.projects).toHaveLength(1);
      expect(mockState.projects[0].name).toBe('Test Project');
      expect(mockState.projects[0].clientId).toBe('client-123');

      // Step 3: Select project and add invoice
      mockState.selectedProject = mockState.projects[0];
      mockState.newInvoice = {
        supplier: 'Test Supplier',
        date: '2024-01-15',
        items: [
          { description: 'Test item', amount: '1000', category: 'שונות' }
        ],
        attachments: []
      };

      const invoiceData = {
        projectId: mockState.selectedProject.id,
        supplier: mockState.newInvoice.supplier,
        amount: parseFloat(mockState.newInvoice.items[0].amount),
        date: mockState.newInvoice.date,
        description: mockState.newInvoice.items[0].description,
        category: mockState.newInvoice.items[0].category,
        attachments: [],
        createdAt: new Date()
      };

      const mockInvoiceRef = { id: 'invoice-123' };
      mockDb.collection().add.mockResolvedValue(mockInvoiceRef);

      const invoiceRef = await mockDb.collection('invoices').add(invoiceData);
      mockState.selectedProject.invoices.push({
        id: invoiceRef.id,
        ...invoiceData
      });

      expect(mockState.selectedProject.invoices).toHaveLength(1);
      expect(mockState.selectedProject.invoices[0].supplier).toBe('Test Supplier');
      expect(mockState.selectedProject.invoices[0].amount).toBe(1000);
    });

    test('should handle project creation with custom creation date', async () => {
      const client = {
        id: 'client-123',
        name: 'Test Client'
      };

      const projectData = {
        clientId: client.id,
        name: 'Test Project',
        revenue: 5000,
        status: 'פתוח',
        createdAt: new Date('2024-01-15') // Custom creation date
      };

      const mockProjectRef = { id: 'project-123' };
      mockDb.collection().add.mockResolvedValue(mockProjectRef);

      const projectRef = await mockDb.collection('projects').add(projectData);
      
      // Verify the creation date is preserved
      expect(projectData.createdAt).toEqual(new Date('2024-01-15'));
      expect(projectRef.id).toBe('project-123');
    });

    test('should handle file upload with invoice', async () => {
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        data: 'data:application/pdf;base64,test-data'
      };

      const projectId = 'project-123';
      const mockStorageRef = {
        putString: jest.fn(() => Promise.resolve()),
        getDownloadURL: jest.fn(() => Promise.resolve('mock-download-url'))
      };
      mockStorage.ref.mockReturnValue(mockStorageRef);

      // Simulate file upload
      const storageRef = mockStorage.ref(`invoices/${projectId}/${Date.now()}_${mockFile.name}`);
      await storageRef.putString(mockFile.data, 'data_url');
      const downloadURL = await storageRef.getDownloadURL();

      const invoiceData = {
        projectId: projectId,
        supplier: 'Test Supplier',
        amount: 1000,
        date: '2024-01-15',
        description: 'Test invoice',
        category: 'שונות',
        attachments: [
          {
            name: mockFile.name,
            url: downloadURL,
            type: mockFile.type
          }
        ],
        createdAt: new Date()
      };

      const mockInvoiceRef = { id: 'invoice-123' };
      mockDb.collection().add.mockResolvedValue(mockInvoiceRef);

      const invoiceRef = await mockDb.collection('invoices').add(invoiceData);

      expect(storageRef.putString).toHaveBeenCalledWith(mockFile.data, 'data_url');
      expect(storageRef.getDownloadURL).toHaveBeenCalled();
      expect(invoiceData.attachments[0].url).toBe('mock-download-url');
      expect(invoiceRef.id).toBe('invoice-123');
    });
  });

  describe('Error Handling Flow', () => {
    test('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockDb.collection().add.mockRejectedValue(error);

      try {
        await mockDb.collection('clients').add({ name: 'Test Client' });
      } catch (err) {
        expect(err).toBe(error);
        expect(err.message).toBe('Database connection failed');
      }
    });

    test('should handle file upload errors', async () => {
      const error = new Error('Storage upload failed');
      const mockStorageRef = {
        putString: jest.fn(() => Promise.reject(error)),
        getDownloadURL: jest.fn()
      };
      mockStorage.ref.mockReturnValue(mockStorageRef);

      try {
        await mockStorageRef.putString('test-data', 'data_url');
      } catch (err) {
        expect(err).toBe(error);
        expect(err.message).toBe('Storage upload failed');
      }
    });
  });

  describe('Data Consistency Flow', () => {
    test('should maintain data consistency when deleting client', async () => {
      // Setup: Client with projects and invoices
      const clientId = 'client-123';
      const projectId = 'project-123';
      const invoiceId = 'invoice-123';

      const mockBatch = {
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn()
      };
      mockDb.batch.mockReturnValue(mockBatch);
      mockBatch.commit.mockResolvedValue();

      // Mock project and invoice snapshots
      const mockProjectSnapshot = {
        docs: [{ id: projectId, ref: 'project-ref' }]
      };
      const mockInvoiceSnapshot = {
        docs: [{ id: invoiceId, ref: 'invoice-ref' }]
      };

      mockDb.collection().where().get
        .mockResolvedValueOnce(mockProjectSnapshot)
        .mockResolvedValueOnce(mockInvoiceSnapshot);

      // Simulate deletion process
      const batch = mockDb.batch();
      
      const projectsSnapshot = await mockDb.collection('projects')
        .where('clientId', '==', clientId)
        .get();
      
      for (const projectDoc of projectsSnapshot.docs) {
        const invoicesSnapshot = await mockDb.collection('invoices')
          .where('projectId', '==', projectDoc.id)
          .get();
        invoicesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        batch.delete(projectDoc.ref);
      }
      
      batch.delete(mockDb.collection('clients').doc(clientId));
      await batch.commit();

      // Verify all related data is deleted
      expect(batch.delete).toHaveBeenCalledTimes(3); // 1 client + 1 project + 1 invoice
      expect(batch.commit).toHaveBeenCalled();
    });
  });
});
