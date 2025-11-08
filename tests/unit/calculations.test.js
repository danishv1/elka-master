// Unit tests for calculation functions
describe('Calculation Functions', () => {
  // Mock calculateTotals function (extracted from the main app)
  function calculateTotals(project) {
    const invoices = project.invoices || [];
    const totalExpenses = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const profit = project.revenue - totalExpenses;
    const profitMargin = project.revenue > 0 ? (profit / project.revenue) * 100 : 0;
    return { totalExpenses, profit, profitMargin };
  }

  describe('calculateTotals', () => {
    test('should calculate correct totals for project with invoices', () => {
      const project = {
        revenue: 10000,
        invoices: [
          { amount: 2000 },
          { amount: 1500 },
          { amount: 500 }
        ]
      };

      const result = calculateTotals(project);
      expect(result.totalExpenses).toBe(4000);
      expect(result.profit).toBe(6000);
      expect(result.profitMargin).toBe(60);
    });

    test('should handle project with no invoices', () => {
      const project = {
        revenue: 5000,
        invoices: []
      };

      const result = calculateTotals(project);
      expect(result.totalExpenses).toBe(0);
      expect(result.profit).toBe(5000);
      expect(result.profitMargin).toBe(100);
    });

    test('should handle project with zero revenue', () => {
      const project = {
        revenue: 0,
        invoices: [{ amount: 1000 }]
      };

      const result = calculateTotals(project);
      expect(result.totalExpenses).toBe(1000);
      expect(result.profit).toBe(-1000);
      expect(result.profitMargin).toBe(0);
    });

    test('should handle negative profit', () => {
      const project = {
        revenue: 1000,
        invoices: [
          { amount: 800 },
          { amount: 500 }
        ]
      };

      const result = calculateTotals(project);
      expect(result.totalExpenses).toBe(1300);
      expect(result.profit).toBe(-300);
      expect(result.profitMargin).toBe(-30);
    });

    test('should handle undefined invoices', () => {
      const project = {
        revenue: 2000,
        invoices: undefined
      };

      const result = calculateTotals(project);
      expect(result.totalExpenses).toBe(0);
      expect(result.profit).toBe(2000);
      expect(result.profitMargin).toBe(100);
    });
  });
});
