/**
 * Enhanced Logging Service
 * Provides structured logging for the RentVerse application
 */

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };
  }

  /**
   * Log with timestamp and structured format
   */
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = this.colors[level] || '';
    const suffix = this.colors.reset;
    
    let logMessage = `${prefix}[${timestamp}] ${level.toUpperCase()}: ${message}${suffix}`;
    
    if (Object.keys(data).length > 0) {
      logMessage += ` ${JSON.stringify(data)}`;
    }
    
    return logMessage;
  }

  /**
   * Info level logging
   */
  info(message, data = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('blue', message, data));
    }
  }

  /**
   * Success level logging (special green styling)
   */
  success(message, data = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('green', message, data));
    }
  }

  /**
   * Warning level logging
   */
  warn(message, data = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('yellow', message, data));
    }
  }

  /**
   * Error level logging
   */
  error(message, data = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('red', message, data));
    }
  }

  /**
   * Debug level logging
   */
  debug(message, data = {}) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('magenta', message, data));
    }
  }

  /**
   * Security-specific logging
   */
  security(message, data = {}) {
    const securityData = {
      ...data,
      category: 'SECURITY',
      timestamp: new Date().toISOString()
    };
    
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('yellow', `🚨 SECURITY: ${message}`, securityData));
    }
  }

  /**
   * Authentication logging
   */
  auth(message, data = {}) {
    const authData = {
      ...data,
      category: 'AUTH',
      timestamp: new Date().toISOString()
    };
    
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('cyan', `🔐 AUTH: ${message}`, authData));
    }
  }

  /**
   * API logging
   */
  api(message, data = {}) {
    const apiData = {
      ...data,
      category: 'API',
      timestamp: new Date().toISOString()
    };
    
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('blue', `🌐 API: ${message}`, apiData));
    }
  }

  /**
   * Check if we should log based on level
   */
  shouldLog(level) {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.logLevel] || this.logLevel === 'all';
  }

  /**
   * Log security event with structured data
   */
  async log(eventType, userId = null, metadata = {}, ipAddress = 'unknown') {
    const logData = {
      eventType,
      userId,
      metadata,
      ipAddress,
      timestamp: new Date().toISOString(),
      userAgent: metadata.userAgent || 'unknown'
    };

    // Security events
    if (eventType.includes('FAILED') || eventType.includes('BLOCKED') || eventType.includes('SUSPICIOUS')) {
      this.security(`${eventType} event`, logData);
    } else {
      this.auth(`${eventType} event`, logData);
    }

    // In a real application, you might want to store these in a database
    // or send to a monitoring service like Datadog, New Relic, etc.
    
    return logData;
  }

  /**
   * Performance logging
   */
  performance(operation, duration, metadata = {}) {
    const perfData = {
      operation,
      duration: `${duration}ms`,
      ...metadata,
      timestamp: new Date().toISOString()
    };

    this.info(`⚡ Performance: ${operation}`, perfData);
  }

  /**
   * Database query logging
   */
  db(query, duration, metadata = {}) {
    const dbData = {
      query: query.substring(0, 100), // Truncate long queries
      duration: `${duration}ms`,
      ...metadata,
      timestamp: new Date().toISOString()
    };

    this.debug(`🗄️ Database: ${query.substring(0, 50)}...`, dbData);
  }

  /**
   * Email service logging
   */
  email(action, email, metadata = {}) {
    const emailData = {
      action,
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
      ...metadata,
      timestamp: new Date().toISOString()
    };

    this.info(`📧 Email: ${action}`, emailData);
  }
}

// Create and export singleton instance
const logger = new Logger();

module.exports = logger;