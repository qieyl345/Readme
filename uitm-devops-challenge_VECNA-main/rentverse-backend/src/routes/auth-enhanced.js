/**
 * MODULE 1: SECURE LOGIN & MFA - ENHANCED VERSION
 * Comprehensive Authentication Routes with Fast OTP Integration
 * 
 * FEATURES:
 * - Fast OTP with Redis/Memory caching
 * - Parallel email/SMS delivery
 * - Performance monitoring and analytics
 * - Enhanced security with rate limiting
 * - Real-time delivery status tracking
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { passport, handleAppleSignIn } = require('../config/passport');

// Import Enhanced Services
const otpService = require('../services/otpService');
const fastOTPService = require('../services/fastOTPService');
const aiService = require('../services/aiIntegration.service');
const logger = require('../services/activityLogger');

// Import Middleware
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Initialize Passport
router.use(passport.initialize());

// ====================================================================
// ENHANCED LOGIN WITH FAST OTP
// ====================================================================

/**
 * @swagger
 * /api/auth/enhanced-login:
 *   post:
 *     summary: Enhanced login with fast OTP delivery
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               enableSMS:
 *                 type: boolean
 *                 description: Enable SMS backup delivery
 *     responses:
 *       200:
 *         description: Fast OTP sent successfully
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/enhanced-login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password, enableSMS = true } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      console.log(`🚀 Enhanced login attempt for ${email} from ${ipAddress}`);

      // Find user with comprehensive data
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true, email: true, password: true, role: true, isActive: true,
          phone: true, firstName: true, lastName: true, name: true,
          lastLoginAt: true, lastLoginIp: true, loginAttempts: true
        },
      });

      if (!user || !user.isActive) {
        await logger.log('LOGIN_FAILED', null, {
          email, reason: 'User not found or inactive', ipAddress, userAgent
        }, ipAddress);

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await logger.log('LOGIN_FAILED', user.id, {
          email, reason: 'Invalid password', ipAddress, userAgent
        }, ipAddress);

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // AI Anomaly Detection
      const isSuspicious = await aiService.detectLoginAnomaly({
        userId: user.id,
        ip: ipAddress,
        timestamp: new Date().toISOString(),
        userAgent,
      });

      if (isSuspicious) {
        await logger.log('SUSPICIOUS_LOGIN', user.id, {
          action: 'MFA_ENFORCED', ipAddress, userAgent, riskLevel: 'HIGH'
        }, ipAddress);
      }

      // Generate Fast OTP
      const otpData = await fastOTPService.generateOTP(email);
      
      console.log(`⚡ Fast OTP generated in ${otpData.generationTime}ms for ${email}`);

      // Send OTP via enhanced delivery service
      const deliveryResult = await fastOTPService.sendOTP(email, otpData.token, {
        sendSMS: enableSMS && !!user.phone,
        phoneNumber: user.phone
      });

      const totalTime = Date.now() - startTime;
      
      console.log(`📧 Enhanced delivery completed in ${deliveryResult.totalDeliveryTime}ms (Total: ${totalTime}ms)`);

      // Log OTP sent with detailed metrics
      await logger.log('OTP_SENT', user.id, {
        email, method: deliveryResult.emailDelivered ? 'email' : 'failed',
        smsMethod: deliveryResult.smsDelivered ? 'sms' : 'not_used',
        deliveryTime: deliveryResult.totalDeliveryTime,
        generationTime: otpData.generationTime,
        totalProcessingTime: totalTime,
        deliveryId: deliveryResult.deliveryId,
        enableSMS, ipAddress, userAgent
      }, ipAddress);

      res.json({
        success: true,
        message: 'Fast OTP sent successfully via multiple channels',
        requireOTP: true,
        data: {
          email: email,
          deliveryId: deliveryResult.deliveryId,
          deliveryStatus: {
            email: deliveryResult.emailDelivered ? 'delivered' : 'failed',
            sms: deliveryResult.smsDelivered ? 'delivered' : 'not_used',
            totalTime: deliveryResult.totalDeliveryTime
          },
          performance: {
            generationTime: otpData.generationTime,
            deliveryTime: deliveryResult.totalDeliveryTime,
            totalTime: totalTime
          }
        },
      });

    } catch (error) {
      console.error('❌ Enhanced login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ====================================================================
// ENHANCED OTP VERIFICATION WITH CACHING
// ====================================================================

/**
 * @swagger
 * /api/auth/enhanced-verify-otp:
 *   post:
 *     summary: Enhanced OTP verification with fast caching
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post(
  '/enhanced-verify-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
      .isNumeric().withMessage('OTP must contain only numbers'),
  ],
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, otp } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

      console.log(`🔐 Enhanced OTP verification for ${email}`);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true, email: true, role: true, isActive: true,
          firstName: true, lastName: true, name: true
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Validate OTP using Fast OTP Service
      const validationResult = await fastOTPService.validateOTP(email, otp);
      
      console.log(`⚡ OTP validation completed in ${validationResult.validationTime}ms: ${validationResult.reason}`);

      if (!validationResult.valid) {
        // Log failed validation attempt
        await logger.log(
          validationResult.reason === 'OTP_EXPIRED' ? 'OTP_FAILED_EXPIRED' : 'OTP_FAILED_INVALID',
          user.id,
          {
            reason: validationResult.reason,
            attempts: validationResult.attempts,
            remainingAttempts: validationResult.remainingAttempts,
            validationTime: validationResult.validationTime,
            ipAddress
          },
          ipAddress
        );

        // Provide specific error messages
        const errorMessages = {
          'OTP_NOT_FOUND': 'No verification code found. Please request a new code.',
          'OTP_EXPIRED': 'Verification code has expired. Please login again.',
          'MAX_ATTEMPTS_EXCEEDED': 'Too many failed attempts. Please request a new code.',
          'INVALID_OTP': `Invalid verification code. ${validationResult.remainingAttempts || 0} attempts remaining.`,
          'VALIDATION_ERROR': 'Verification service temporarily unavailable. Please try again.'
        };

        return res.status(400).json({
          success: false,
          message: errorMessages[validationResult.reason] || 'Verification failed. Please try again.',
          attempts: validationResult.attempts,
          remainingAttempts: validationResult.remainingAttempts
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove sensitive data
      const { password: _, mfaSecret: __, ...userWithoutSecrets } = user;

      const totalTime = Date.now() - startTime;

      // Log successful login with performance metrics
      await logger.log(
        'LOGIN_SUCCESS',
        user.id,
        {
          method: 'MFA_FAST_ENHANCED',
          validationTime: validationResult.validationTime,
          totalTime: totalTime,
          ipAddress,
          userAgent: req.headers['user-agent'] || 'Unknown'
        },
        ipAddress
      );

      console.log(`✅ Enhanced login successful for ${email} in ${totalTime}ms`);

      res.json({
        success: true,
        message: 'Login successful with enhanced security',
        data: {
          user: userWithoutSecrets,
          token,
        },
        performance: {
          validationTime: validationResult.validationTime,
          totalTime: totalTime
        }
      });

    } catch (error) {
      console.error('❌ Enhanced OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ====================================================================
// OTP PERFORMANCE ANALYTICS
// ====================================================================

/**
 * @swagger
 * /api/auth/otp-stats:
 *   get:
 *     summary: Get OTP service performance statistics
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP statistics retrieved
 */
router.get('/otp-stats', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const [cacheStats, otpServiceStats] = await Promise.all([
      require('../services/otpCacheService').getStats(),
      fastOTPService.getStats()
    ]);

    res.json({
      success: true,
      data: {
        cache: cacheStats,
        otpService: otpServiceStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ OTP stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve OTP statistics'
    });
  }
});

// ====================================================================
// RESEND OTP WITH RATE LIMITING
// ====================================================================

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP with rate limiting
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       429:
 *         description: Too many requests
 */
router.post(
  '/resend-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

      // Rate limiting check (implement your rate limiting logic here)
      const canResend = await checkResendRateLimit(email, ipAddress);
      if (!canResend) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please wait before requesting again.',
          retryAfter: 60 // seconds
        });
      }

      // Generate new OTP
      const otpData = await fastOTPService.generateOTP(email);
      
      // Send OTP
      const deliveryResult = await fastOTPService.sendOTP(email, otpData.token, {
        sendSMS: true // Allow SMS backup for resend
      });

      await logger.log('OTP_RESENT', null, {
        email, deliveryTime: deliveryResult.totalDeliveryTime, ipAddress
      }, ipAddress);

      res.json({
        success: true,
        message: 'OTP resent successfully',
        data: {
          deliveryId: deliveryResult.deliveryId,
          deliveryTime: deliveryResult.totalDeliveryTime
        }
      });

    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }
  }
);

// Helper function for rate limiting (implement based on your needs)
async function checkResendRateLimit(email, ipAddress) {
  // Simple implementation - you can enhance this with Redis
  const cache = require('../services/otpCacheService');
  const key = `resend_limit:${email}:${ipAddress}`;
  
  // Check if user has exceeded rate limit in the last hour
  const existing = await cache.getOTP(key);
  if (existing) {
    return false; // Rate limited
  }
  
  // Set rate limit key for 1 hour
  await cache.storeOTP(key, { attempts: 1 }, 3600);
  return true;
}

// ====================================================================
// EXPORT ALL ORIGINAL ROUTES FOR COMPATIBILITY
// ====================================================================

// Export original routes for backward compatibility
const originalAuthRoutes = require('./auth');

// Add all original routes to this router
Object.keys(originalAuthRoutes.routes || {}).forEach(route => {
  const [method, path] = route.split(' ');
  const handler = originalAuthRoutes.routes[route];
  router[method.toLowerCase()](path, handler);
});

module.exports = router;