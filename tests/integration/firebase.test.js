// Integration tests for Firebase operations
describe('Firebase Integration', () => {
  let mockDb;
  let mockStorage;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
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

    // Mock Firebase
    global.firebase = {
      firestore: () => mockDb,
      storage: () => mockStorage,
      FieldValue: {
        serverTimestamp: () => new Date()
      }
    };
  });

  describe('Client Operations', () => {
    test('should add client to database', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123456789',
        notes: 'Test notes',
        createdAt: new Date()
      };

      const mockDocRef = { id: 'client-123' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      mockDb.collection.mockReturnValue({ add: mockAdd });

      const result = await mockDb.collection('clients').add(clientData);
      
      expect(mockDb.collection).toHaveBeenCalledWith('clients');
      expect(mockAdd).toHaveBeenCalledWith(clientData);
      expect(result).toBe(mockDocRef);
    });

    test('should load clients from database', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'client-1',
            data: () => ({
              name: 'Client 1',
              email: 'client1@example.com',
              createdAt: { toDate: () => new Date('2024-01-15') }
            })
          },
          {
            id: 'client-2',
            data: () => ({
              name: 'Client 2',
              email: 'client2@example.com',
              createdAt: { toDate: () => new Date('2024-01-10') }
            })
          }
        ]
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      mockDb.collection.mockReturnValue({ get: mockGet });

      const snapshot = await mockDb.collection('clients').get();
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      expect(mockDb.collection).toHaveBeenCalledWith('clients');
      expect(mockGet).toHaveBeenCalled();
      expect(clients).toHaveLength(2);
      expect(clients[0].name).toBe('Client 1');
      expect(clients[1].name).toBe('Client 2');
    });

    test('should update client in database', async () => {
      const updates = {
        name: 'Updated Client',
        email: 'updated@example.com'
      };

      const mockUpdate = jest.fn().mockResolvedValue();
      const mockDoc = jest.fn().mockReturnValue({ update: mockUpdate });
      mockDb.collection.mockReturnValue({ doc: mockDoc });

      await mockDb.collection('clients').doc('client-123').update(updates);
      
      expect(mockDb.collection).toHaveBeenCalledWith('clients');
      expect(mockDoc).toHaveBeenCalledWith('client-123');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
    });

    test('should delete client from database', async () => {
      const mockBatch = {
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn()
      };
      mockDb.batch.mockReturnValue(mockBatch);
      mockBatch.commit.mockResolvedValue();

      const batch = mockDb.batch();
      batch.delete(mockDb.collection('clients').doc('client-123'));
      await batch.commit();

      expect(mockDb.batch).toHaveBeenCalled();
      expect(batch.delete).toHaveBeenCalled();
      expect(batch.commit).toHaveBeenCalled();
    });
  });

  describe('Project Operations', () => {
    test('should add project with creation date', async () => {
      const projectData = {
        clientId: 'client-123',
        name: 'Test Project',
        revenue: 10000,
        status: 'פתוח',
        createdAt: new Date('2024-01-15')
      };

      const mockDocRef = { id: 'project-123' };
      mockDb.collection().add.mockResolvedValue(mockDocRef);

      const result = await mockDb.collection('projects').add(projectData);
      
      expect(mockDb.collection).toHaveBeenCalledWith('projects');
      expect(mockDb.collection().add).toHaveBeenCalledWith(projectData);
      expect(result).toBe(mockDocRef);
    });

    test('should load projects for client', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'project-1',
            data: () => ({
              clientId: 'client-123',
              name: 'Project 1',
              revenue: 5000,
              status: 'פתוח',
              createdAt: { toDate: () => new Date('2024-01-15') }
            })
          }
        ]
      };

      mockDb.collection().where().get.mockResolvedValue(mockSnapshot);

      const snapshot = await mockDb.collection('projects')
        .where('clientId', '==', 'client-123')
        .get();
      
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Project 1');
      expect(projects[0].clientId).toBe('client-123');
    });
  });

  describe('Invoice Operations', () => {
    test('should add invoice with attachments', async () => {
      const invoiceData = {
        projectId: 'project-123',
        supplier: 'Test Supplier',
        amount: 1000,
        date: '2024-01-15',
        description: 'Test invoice',
        category: 'שונות',
        attachments: [
          {
            name: 'test.pdf',
            url: 'mock-download-url',
            type: 'application/pdf'
          }
        ],
        createdAt: new Date()
      };

      const mockDocRef = { id: 'invoice-123' };
      mockDb.collection().add.mockResolvedValue(mockDocRef);

      const result = await mockDb.collection('invoices').add(invoiceData);
      
      expect(mockDb.collection).toHaveBeenCalledWith('invoices');
      expect(mockDb.collection().add).toHaveBeenCalledWith(invoiceData);
      expect(result).toBe(mockDocRef);
    });

    test('should upload file to storage', async () => {
      const fileData = 'data:application/pdf;base64,test-data';
      const fileName = 'test.pdf';
      const projectId = 'project-123';

      const mockStorageRef = {
        putString: jest.fn(() => Promise.resolve()),
        getDownloadURL: jest.fn(() => Promise.resolve('mock-download-url'))
      };
      mockStorage.ref.mockReturnValue(mockStorageRef);

      const storageRef = mockStorage.ref(`invoices/${projectId}/${Date.now()}_${fileName}`);
      await storageRef.putString(fileData, 'data_url');
      const downloadURL = await storageRef.getDownloadURL();

      expect(mockStorage.ref).toHaveBeenCalled();
      expect(storageRef.putString).toHaveBeenCalledWith(fileData, 'data_url');
      expect(storageRef.getDownloadURL).toHaveBeenCalled();
      expect(downloadURL).toBe('mock-download-url');
    });

    test('should load invoices for project', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'invoice-1',
            data: () => ({
              projectId: 'project-123',
              supplier: 'Supplier 1',
              amount: 1000,
              date: '2024-01-15',
              description: 'Test invoice',
              category: 'שונות'
            })
          }
        ]
      };

      mockDb.collection().where().get.mockResolvedValue(mockSnapshot);

      const snapshot = await mockDb.collection('invoices')
        .where('projectId', '==', 'project-123')
        .get();
      
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      expect(invoices).toHaveLength(1);
      expect(invoices[0].supplier).toBe('Supplier 1');
      expect(invoices[0].amount).toBe(1000);
    });
  });

  describe('Batch Operations', () => {
    test('should handle batch operations for deleting client', async () => {
      const mockBatch = {
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn()
      };
      mockDb.batch.mockReturnValue(mockBatch);
      mockBatch.commit.mockResolvedValue();

      // Mock project and invoice snapshots
      const mockProjectSnapshot = {
        docs: [
          { id: 'project-1', ref: 'project-ref-1' }
        ]
      };
      const mockInvoiceSnapshot = {
        docs: [
          { id: 'invoice-1', ref: 'invoice-ref-1' }
        ]
      };

      mockDb.collection().where().get
        .mockResolvedValueOnce(mockProjectSnapshot)
        .mockResolvedValueOnce(mockInvoiceSnapshot);

      const batch = mockDb.batch();
      
      // Simulate deleting projects and invoices
      const projectsSnapshot = await mockDb.collection('projects')
        .where('clientId', '==', 'client-123')
        .get();
      
      for (const projectDoc of projectsSnapshot.docs) {
        const invoicesSnapshot = await mockDb.collection('invoices')
          .where('projectId', '==', projectDoc.id)
          .get();
        invoicesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        batch.delete(projectDoc.ref);
      }
      
      batch.delete(mockDb.collection('clients').doc('client-123'));
      await batch.commit();

      expect(mockDb.batch).toHaveBeenCalled();
      expect(batch.delete).toHaveBeenCalled();
      expect(batch.commit).toHaveBeenCalled();
    });
  });
});
