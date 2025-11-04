// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Different port for testing
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.API_SECRET = 'test-api-secret-key';
process.env.ATTENDANCE_API_TOKEN = 'test-attendance-token';

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test helpers
global.testHelpers = {
  createMockEmployee: () => ({
    employee_id: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    department: 'IT',
    position: 'Developer',
    hire_date: '2024-01-01',
    status: 'active'
  }),
  
  createMockAttendance: () => ({
    employee_id: 'EMP001',
    date: '2024-01-01',
    check_in: '2024-01-01T09:00:00Z',
    check_out: '2024-01-01T17:00:00Z',
    status: 'present'
  }),
  
  getAuthHeaders: () => ({
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  }),
  
  getApiKeyHeaders: () => ({
    'X-API-Key': 'test-attendance-token',
    'Content-Type': 'application/json'
  })
};

// Cleanup after tests
afterAll(async () => {
  // Close any open connections, clear timers, etc.
  if (global.server) {
    await global.server.close();
  }
});