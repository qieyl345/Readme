require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit'); // <--- 1. Import Rate Limit

const { connectDB } = require('./config/database');
const swaggerSpecs = require('./config/swagger');
const sessionMiddleware = require('./middleware/session');

// Import our advanced security middleware
const { securityHeaders, enforceHTTPS, xssProtection, sqlInjectionProtection, corsOptions, requestSizeLimit } = require('./middleware/security');
const { rateLimiters } = require('./middleware/rateLimiter');

const app = express();

// --- 🛡️ MODULE 2: ADVANCED SECURITY MIDDLEWARE ---

// 1. Security Headers (Helmet with custom CSP)
app.use(securityHeaders);

// 2. HTTPS Enforcement (for production)
app.use(enforceHTTPS);

// 3. Request Size Limiting
app.use(requestSizeLimit);

// 4. XSS Protection
app.use(xssProtection);

// 5. SQL Injection Protection
app.use(sqlInjectionProtection);

// 6. Enhanced CORS Configuration
app.use(cors(corsOptions));

// 7. Advanced Rate Limiting
// Apply different rate limits to different endpoints
app.use('/api/auth/login', rateLimiters.login);
app.use('/api/auth/register', rateLimiters.register);
app.use('/api/auth/otp', rateLimiters.otp);
app.use('/api/auth/forgot-password', rateLimiters.passwordReset);
app.use('/api/upload', rateLimiters.upload);
app.use('/api/admin', rateLimiters.admin);
app.use('/api/properties', rateLimiters.search); // Allow more searches
app.use('/api', rateLimiters.general); // General API protection
// --------------------------------------------------------

// Ngrok and proxy handling middleware
app.use((req, res, next) => {
  // Trust ngrok proxy
  app.set('trust proxy', true);

  // Handle ngrok headers
  if (req.headers['x-forwarded-proto']) {
    req.protocol = req.headers['x-forwarded-proto'];
  }

  if (req.headers['x-forwarded-host']) {
    req.headers.host = req.headers['x-forwarded-host'];
  }

  next();
});

// Connect to database
connectDB();

// Middleware - Enhanced security setup
app.use(morgan('combined', {
  skip: (req, res) => process.env.NODE_ENV === 'production' && req.url === '/health'
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware (required for OAuth)
app.use(sessionMiddleware);

// Static files
app.use(express.static('public'));

// Serve uploaded PDFs from uploads directory with proper security
const path = require('path');
app.use(
  '/api/files/pdfs',
  express.static(path.join(__dirname, '../uploads/pdfs'), {
    // Only allow PDF files
    setHeaders: (res, path, stat) => {
      if (path.endsWith('.pdf')) {
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', 'inline'); // Display in browser instead of download
        res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      } else {
        res.status(404).end(); // Block non-PDF files
      }
    },
  })
);

// Swagger UI setup
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1976d2 }
      .server-info { 
        background: #e3f2fd; 
        padding: 10px; 
        border-radius: 5px; 
        margin: 10px 0;
        border-left: 4px solid #1976d2;
      }
    `,
    customSiteTitle: 'Rentverse API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      servers: [
        {
          url:
            process.env.NGROK_URL ||
            `http://localhost:${process.env.PORT || 3005}`,
          description: process.env.NGROK_URL
            ? `🌐 Ngrok Tunnel: ${process.env.NGROK_URL}`
            : `🏠 Local Server: http://localhost:${process.env.PORT || 3005}`,
        },
        {
          url: `http://localhost:${process.env.PORT || 3005}`,
          description: '🏠 Local Development Server',
        },
      ],
    },
  })
);

// Import routes
const authRoutes = require('./routes/auth');
const authTestRoutes = require('./routes/auth-test');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./modules/users/users.routes');
const propertyRoutes = require('./modules/properties/properties.routes');
const bookingRoutes = require('./modules/bookings/bookings.routes');
const propertyTypeRoutes = require('./modules/propertyTypes/propertyTypes.routes');
const amenityRoutes = require('./modules/amenities/amenities.routes');
const predictionRoutes = require('./modules/predictions/predictions.routes');
const userSettingsRoutes = require('./modules/userSettings/userSettings.routes');
const adminRoutes = require('./modules/admin/admin.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/property-types', propertyTypeRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/admin', adminRoutes);

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Rentverse Backend API',
    version: '1.0.0',
    docs: 'Visit /docs for API documentation',
    database: 'Connected to PostgreSQL via Prisma',
    environment: process.env.NODE_ENV || 'development',
    cors: 'CORS configured for development',
    ngrok: process.env.NGROK_URL || 'No ngrok URL configured',
    baseUrl: process.env.BASE_URL || 'http://localhost:3005',
    security: '🛡️ Advanced security middleware enabled',
  });
});

app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful!',
    origin: req.headers.origin,
    host: req.headers.host,
    forwardedHost: req.headers['x-forwarded-host'],
    forwardedProto: req.headers['x-forwarded-proto'],
    timestamp: new Date().toISOString(),
  });
});

app.post('/cors-test', (req, res) => {
  res.json({
    message: 'CORS POST test successful!',
    body: req.body,
    origin: req.headers.origin,
    host: req.headers.host,
    forwardedHost: req.headers['x-forwarded-host'],
    forwardedProto: req.headers['x-forwarded-proto'],
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req, res) => {
  try {
    const { prisma } = require('./config/database');

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      security: '🛡️ Advanced security middleware active',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message,
      uptime: process.uptime(),
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Global error handler:', err.stack);

  // Handle Prisma errors
  if (err.code?.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      message: 'A database error occurred',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.message,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication error',
      message: 'Invalid token',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong!'
        : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;