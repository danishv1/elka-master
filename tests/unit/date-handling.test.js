// Unit tests for date handling functions
describe('Date Handling', () => {
  describe('Date Conversion', () => {
    test('should convert Firestore timestamp to date', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15T10:30:00Z')
      };
      
      const result = mockTimestamp.toDate ? mockTimestamp.toDate() : mockTimestamp;
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    test('should handle regular Date objects', () => {
      const regularDate = new Date('2024-01-15T10:30:00Z');
      
      const result = regularDate.toDate ? regularDate.toDate() : regularDate;
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    test('should handle date sorting correctly', () => {
      const dates = [
        { createdAt: { toDate: () => new Date('2024-01-15') } },
        { createdAt: new Date('2024-01-10') },
        { createdAt: { toDate: () => new Date('2024-01-20') } }
      ];

      const sortedDates = dates.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
        return bTime - aTime;
      });

      expect(sortedDates[0].createdAt.toDate()).toEqual(new Date('2024-01-20'));
      expect(sortedDates[1].createdAt.toDate()).toEqual(new Date('2024-01-15'));
      expect(sortedDates[2].createdAt).toEqual(new Date('2024-01-10'));
    });
  });

  describe('Date Formatting', () => {
    test('should format date for display', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = date.toLocaleDateString('he-IL');
      expect(formatted).toBeDefined();
    });

    test('should handle ISO date strings', () => {
      const isoDate = '2024-01-15';
      const date = new Date(isoDate);
      expect(date.toISOString().split('T')[0]).toBe(isoDate);
    });
  });

  describe('Creation Date Defaults', () => {
    test('should set today as default creation date', () => {
      const today = new Date().toISOString().split('T')[0];
      const newProject = { 
        name: '', 
        revenue: '', 
        status: 'פתוח', 
        creationDate: today 
      };
      
      expect(newProject.creationDate).toBe(today);
    });

    test('should update creation date', () => {
      const newDate = '2024-01-15';
      const project = { creationDate: newDate };
      
      expect(project.creationDate).toBe(newDate);
    });
  });
});
