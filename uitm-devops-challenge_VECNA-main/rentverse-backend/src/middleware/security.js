const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss');

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null,
    },
  },
  crossOriginEmbedderPolicy: false, // For development
});

// HTTPS enforcement middleware
const enforceHTTPS = (req, res, next) => {
  // Skip HTTPS enforcement in development or if behind a proxy
  if (process.env.NODE_ENV === 'development' || req.headers['x-forwarded-proto'] === 'https' || req.secure) {
    return next();
  }

  // Check if the request is for a static file or API that should be secured
  const securePaths = ['/api/', '/admin/', '/account/', '/auth/', '/property/'];
  const shouldSecure = securePaths.some(path => req.originalUrl.startsWith(path));

  if (shouldSecure) {
    console.log(`🔒 HTTPS enforcement: Redirecting ${req.ip} from ${req.protocol} to https`);
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  next();
};

// XSS Protection middleware
const xssProtection = (req, res, next) => {
  // Remove any null bytes from request
  if (req.body) {
    req.body = JSON.parse(JSON.stringify(req.body, (key, value) => {
      if (typeof value === 'string' && value.includes('\0')) {
        console.log(`🛡️  XSS Protection: Removing null bytes from ${key}`);
        return value.replace(/\0/g, '');
      }
      return value;
    }));
  }
  next();
};

// SQL Injection Protection middleware
const sqlInjectionProtection = (req, res, next) => {
  const dangerousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
    /(\%3B)|(;)/gi,
    /(\%3D)|(=)/gi,
    /(\%27)|(\')/gi,
    /\w*((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
    /\w*((\%27)|(\'))union[^\w]*((\%27)|(\'))/gi
  ];

  const checkForSQL = (obj) => {
    if (typeof obj === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(checkForSQL);
    }
    return false;
  };

  if (req.body && checkForSQL(req.body)) {
    console.log(`🚨 SQL Injection attempt detected from IP: ${req.ip} - ${req.originalUrl}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid request format detected',
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
  }

  next();
};

// CORS Security Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://rentverse-frontend.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🌐 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-API-Key'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 // 24 hours
};

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    console.log(`🔑 API request without key from IP: ${req.ip} - ${req.originalUrl}`);
    return res.status(401).json({
      success: false,
      message: 'API key required',
      timestamp: new Date().toISOString()
    });
  }

  // In production, validate against stored API keys
  // For now, we'll just log it
  console.log(`🔑 API request with key from IP: ${req.ip} - ${req.originalUrl}`);
  next();
};

// Request size limit middleware
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    console.log(`📦 Large request detected from IP: ${req.ip} - Size: ${contentLength} bytes`);
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      maxSize: `${maxSize / (1024 * 1024)}MB`,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = {
  securityHeaders,
  enforceHTTPS,
  xssProtection,
  sqlInjectionProtection,
  corsOptions,
  validateApiKey,
  requestSizeLimit,
};