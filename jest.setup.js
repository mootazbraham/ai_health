// Jest setup file
// Mock environment variables for tests
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-characters-long'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-32-characters-long'
process.env.NODE_ENV = 'test'

// Suppress console logs in tests unless DEBUG=true
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}




