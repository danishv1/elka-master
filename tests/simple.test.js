// Simple test to verify Jest setup works
describe('Simple Test', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have mocked Firebase', () => {
    expect(global.firebase).toBeDefined();
    expect(global.firebase.firestore).toBeDefined();
    expect(global.firebase.storage).toBeDefined();
  });

  test('should have mocked DOM', () => {
    expect(global.document).toBeDefined();
    expect(global.window).toBeDefined();
  });

  test('should have mocked console', () => {
    expect(global.console.log).toBeDefined();
    expect(global.alert).toBeDefined();
    expect(global.confirm).toBeDefined();
  });
});
