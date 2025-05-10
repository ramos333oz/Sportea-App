/**
 * Logger utility for better debugging, especially in emulators
 */

// Set to true to enable detailed logging
const DEBUG_MODE = true;

// Log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  WARN: 'WARN',
  ERROR: 'ERROR',
  AUTH: 'AUTH' // Special level for auth-related logs
};

/**
 * Log a message with proper formatting and level
 * @param {string} message - The message to log
 * @param {string} level - The log level
 * @param {any} data - Optional data to log
 */
const log = (message, level = LOG_LEVELS.INFO, data = null) => {
  if (!DEBUG_MODE && level === LOG_LEVELS.DEBUG) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  
  if (data) {
    try {
      const dataString = typeof data === 'object' 
        ? JSON.stringify(data, null, 2)
        : data;
      console.log(`${prefix} ${message}`, dataString);
    } catch (error) {
      console.log(`${prefix} ${message} (Data not stringifiable)`, data);
    }
  } else {
    console.log(`${prefix} ${message}`);
  }
};

// Exported logging functions
export const logger = {
  info: (message, data) => log(message, LOG_LEVELS.INFO, data),
  debug: (message, data) => log(message, LOG_LEVELS.DEBUG, data),
  warn: (message, data) => log(message, LOG_LEVELS.WARN, data),
  error: (message, data) => log(message, LOG_LEVELS.ERROR, data),
  auth: (message, data) => log(message, LOG_LEVELS.AUTH, data),
};

export default logger; 