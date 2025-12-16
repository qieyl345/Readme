const rateLimit = require('express-rate-limit');

// Rate limiting configurations for different security levels
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      console.log(`🚨 Rate limit exceeded for IP: ${req.ip} - ${req.originalUrl}`);

      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes',
        timestamp: new Date().toISOString(),
        ip: req.ip
      });
    }
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Using memory store (no Redis for simplicity)
  return rateLimit(finalOptions);
};

// Different rate limiting strategies
const rateLimiters = {
  // General API protection - Medium security
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
  }),

  // Login endpoints - High security (prevent brute force)
  login: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
  }),

  // Registration endpoints - High security
  register: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour
  }),

  // OTP/Verification - Very high security
  otp: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 OTP requests per 10 minutes
  }),

  // Admin endpoints - High security
  admin: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 admin requests per 15 minutes
  }),

  // Property uploads - Medium security with file size considerations
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    skipSuccessfulRequests: false,
  }),

  // Search endpoints - Allow more requests
  search: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 search requests per 15 minutes
  }),

  // Password reset - High security
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
  }),
};

module.exports = {
  rateLimiters,
  createRateLimiter,
};