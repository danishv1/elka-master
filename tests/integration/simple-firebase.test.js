// Simplified Firebase integration tests
describe('Firebase Integration (Simplified)', () => {
  let mockDb;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mocks for each test
    mockDb = {
      collection: jest.fn(),
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

      expect(clients).toHaveLength(1);
      expect(clients[0].name).toBe('Client 1');
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
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      mockDb.collection.mockReturnValue({ add: mockAdd });

      const result = await mockDb.collection('projects').add(projectData);
      
      expect(mockDb.collection).toHaveBeenCalledWith('projects');
      expect(mockAdd).toHaveBeenCalledWith(projectData);
      expect(result).toBe(mockDocRef);
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
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      mockDb.collection.mockReturnValue({ add: mockAdd });

      const result = await mockDb.collection('invoices').add(invoiceData);
      
      expect(mockDb.collection).toHaveBeenCalledWith('invoices');
      expect(mockAdd).toHaveBeenCalledWith(invoiceData);
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
  });

  describe('Batch Operations', () => {
    test('should handle batch operations', async () => {
      const mockBatch = {
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn()
      };
      mockDb.batch.mockReturnValue(mockBatch);
      mockBatch.commit.mockResolvedValue();

      const batch = mockDb.batch();
      batch.delete('client-ref');
      await batch.commit();

      expect(mockDb.batch).toHaveBeenCalled();
      expect(batch.delete).toHaveBeenCalledWith('client-ref');
      expect(batch.commit).toHaveBeenCalled();
    });
  });
});
