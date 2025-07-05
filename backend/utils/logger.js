const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
    this.logDir = path.join(__dirname, '../logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Get current timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Format log message
  formatMessage(level, message, data = {}) {
    return {
      timestamp: this.getTimestamp(),
      level: level.toUpperCase(),
      message,
      ...data,
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid
    };
  }

  // Write to log file
  writeToFile(level, message, data = {}) {
    const logEntry = this.formatMessage(level, message, data);
    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    
    try {
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Check if should log based on level
  shouldLog(level) {
    return LOG_LEVELS[level.toUpperCase()] <= LOG_LEVELS[this.logLevel.toUpperCase()];
  }

  // Log methods
  error(message, data = {}) {
    if (this.shouldLog('ERROR')) {
      const logEntry = this.formatMessage('ERROR', message, data);
      console.error('❌ ERROR:', logEntry);
      this.writeToFile('ERROR', message, data);
    }
  }

  warn(message, data = {}) {
    if (this.shouldLog('WARN')) {
      const logEntry = this.formatMessage('WARN', message, data);
      console.warn('⚠️  WARN:', logEntry);
      this.writeToFile('WARN', message, data);
    }
  }

  info(message, data = {}) {
    if (this.shouldLog('INFO')) {
      const logEntry = this.formatMessage('INFO', message, data);
      console.info('ℹ️  INFO:', logEntry);
      this.writeToFile('INFO', message, data);
    }
  }

  debug(message, data = {}) {
    if (this.shouldLog('DEBUG')) {
      const logEntry = this.formatMessage('DEBUG', message, data);
      console.debug('🔍 DEBUG:', logEntry);
      this.writeToFile('DEBUG', message, data);
    }
  }

  // Request logging
  logRequest(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        contentLength: res.get('Content-Length') || 0
      };

      if (res.statusCode >= 400) {
        this.error(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
      } else {
        this.info(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
      }
    });

    next();
  }

  // Error logging with context
  logError(error, req = null) {
    const errorData = {
      name: error.name,
      stack: error.stack,
      statusCode: error.statusCode,
      isOperational: error.isOperational
    };

    if (req) {
      errorData.request = {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };
    }

    this.error(error.message, errorData);
  }

  // Performance logging
  logPerformance(operation, duration, data = {}) {
    this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...data
    });
  }

  // Database operation logging
  logDatabaseOperation(operation, collection, duration, success = true) {
    const level = success ? 'INFO' : 'ERROR';
    const message = `Database ${operation} on ${collection}`;
    const data = {
      operation,
      collection,
      duration: `${duration}ms`,
      success
    };

    if (success) {
      this.info(message, data);
    } else {
      this.error(message, data);
    }
  }

  // File operation logging
  logFileOperation(operation, filePath, success = true, error = null) {
    const level = success ? 'INFO' : 'ERROR';
    const message = `File ${operation}: ${filePath}`;
    const data = {
      operation,
      filePath,
      success,
      error: error ? error.message : null
    };

    if (success) {
      this.info(message, data);
    } else {
      this.error(message, data);
    }
  }

  // Python script logging
  logPythonScript(scriptPath, success = true, stdout = '', stderr = '') {
    const message = `Python script execution: ${scriptPath}`;
    const data = {
      scriptPath,
      success,
      stdout: stdout.substring(0, 500), // Limit output length
      stderr: stderr.substring(0, 500)
    };

    if (success) {
      this.info(message, data);
    } else {
      this.error(message, data);
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger; 