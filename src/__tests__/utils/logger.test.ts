import { Platform } from 'react-native';
import { logger, AuthErrorCode } from '../../utils/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs debug messages with correct format', () => {
    const message = 'Test debug message';
    const details = { key: 'value' };

    logger.debug(message, details);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG]'),
      expect.stringContaining(message),
      expect.objectContaining(details)
    );
  });

  it('logs info messages with correct format', () => {
    const message = 'Test info message';
    const details = { key: 'value' };

    logger.info(message, details);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      expect.stringContaining(message),
      expect.objectContaining(details)
    );
  });

  it('logs warning messages with correct format', () => {
    const message = 'Test warning message';
    const details = { key: 'value' };

    logger.warn(message, details);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WARN]'),
      expect.stringContaining(message),
      expect.objectContaining(details)
    );
  });

  it('logs error messages with correct format', () => {
    const message = 'Test error message';
    const code = AuthErrorCode.INVALID_CREDENTIALS;
    const details = { key: 'value' };

    logger.error(message, code, details);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      expect.stringContaining(message),
      expect.objectContaining(details)
    );
  });

  it('includes timestamp in log messages', () => {
    const message = 'Test message';
    
    logger.info(message);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      expect.any(String)
    );
  });

  it('includes platform information in log messages', () => {
    const message = 'Test message';
    
    logger.info(message);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining(Platform.OS),
      expect.any(String)
    );
  });

  it('maintains log history within size limit', () => {
    const maxLogs = 100;
    for (let i = 0; i < maxLogs + 10; i++) {
      logger.info(`Test message ${i}`);
    }

    const logs = logger.getLogs();
    expect(logs.length).toBeLessThanOrEqual(maxLogs);
    expect(logs[logs.length - 1].message).toContain('Test message');
  });

  it('clears log history', () => {
    logger.info('Test message');
    logger.clearLogs();

    const logs = logger.getLogs();
    expect(logs).toHaveLength(0);
  });

  it('filters logs by level', () => {
    logger.info('Info message');
    logger.error('Error message');
    logger.warn('Warning message');

    const errorLogs = logger.getLogsByLevel('error');
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].message).toBe('Error message');
  });

  it('formats auth errors correctly', () => {
    const error = new Error('Invalid credentials');
    const formattedError = logger.formatAuthError(error);

    expect(formattedError).toEqual({
      code: AuthErrorCode.UNKNOWN,
      message: error.message,
      details: expect.any(Object),
    });
  });

  it('creates user-friendly error messages', () => {
    const message = logger.formatUserErrorMessage(AuthErrorCode.INVALID_CREDENTIALS);
    expect(message).toBe('Invalid email or password. Please try again.');
  });
}); 