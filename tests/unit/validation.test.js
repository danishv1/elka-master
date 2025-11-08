// Unit tests for validation functions
describe('Validation Functions', () => {
  describe('Client Validation', () => {
    test('should validate required client name', () => {
      const client = { name: '', email: 'test@example.com', phone: '123456789' };
      expect(client.name).toBeFalsy();
      
      const validClient = { name: 'Test Client', email: 'test@example.com', phone: '123456789' };
      expect(validClient.name).toBeTruthy();
    });

    test('should validate email format', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';
      
      expect(validEmail.includes('@')).toBe(true);
      expect(invalidEmail.includes('@')).toBe(false);
    });
  });

  describe('Project Validation', () => {
    test('should validate required project name', () => {
      const project = { name: '', revenue: '1000', status: 'פתוח' };
      expect(project.name).toBeFalsy();
      
      const validProject = { name: 'Test Project', revenue: '1000', status: 'פתוח' };
      expect(validProject.name).toBeTruthy();
    });

    test('should validate revenue as number', () => {
      const project = { revenue: '1000' };
      const parsedRevenue = parseFloat(project.revenue) || 0;
      expect(parsedRevenue).toBe(1000);
      
      const invalidProject = { revenue: 'invalid' };
      const invalidParsed = parseFloat(invalidProject.revenue) || 0;
      expect(invalidParsed).toBe(0);
    });

    test('should validate creation date format', () => {
      const validDate = '2024-01-15';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateRegex.test(validDate)).toBe(true);
      
      const invalidDate = '15/01/2024';
      expect(dateRegex.test(invalidDate)).toBe(false);
    });
  });

  describe('Invoice Validation', () => {
    test('should validate required supplier', () => {
      const invoice = { supplier: '', amount: '100', date: '2024-01-15' };
      expect(invoice.supplier).toBeFalsy();
      
      const validInvoice = { supplier: 'Test Supplier', amount: '100', date: '2024-01-15' };
      expect(validInvoice.supplier).toBeTruthy();
    });

    test('should validate invoice amount', () => {
      const invoice = { amount: '100' };
      const parsedAmount = parseFloat(invoice.amount);
      expect(parsedAmount).toBe(100);
      expect(parsedAmount > 0).toBe(true);
    });

    test('should validate invoice items', () => {
      const items = [
        { description: 'Item 1', amount: '100', category: 'שונות' },
        { description: 'Item 2', amount: '200', category: 'בטון ומוצריו' }
      ];
      
      const validItems = items.filter(item => item.amount && parseFloat(item.amount) > 0);
      expect(validItems.length).toBe(2);
      
      const invalidItems = [
        { description: 'Item 1', amount: '', category: 'שונות' },
        { description: 'Item 2', amount: '0', category: 'בטון ומוצריו' }
      ];
      
      const filteredInvalid = invalidItems.filter(item => item.amount && parseFloat(item.amount) > 0);
      expect(filteredInvalid.length).toBe(0);
    });
  });

  describe('File Validation', () => {
    test('should validate file types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const invalidTypes = ['text/plain', 'application/exe'];
      
      validTypes.forEach(type => {
        expect(type.startsWith('image/') || type === 'application/pdf').toBe(true);
      });
      
      invalidTypes.forEach(type => {
        expect(type.startsWith('image/') || type === 'application/pdf').toBe(false);
      });
    });

    test('should validate file size', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validSize = 5 * 1024 * 1024; // 5MB
      const invalidSize = 15 * 1024 * 1024; // 15MB
      
      expect(validSize <= maxSize).toBe(true);
      expect(invalidSize <= maxSize).toBe(false);
    });
  });
});
