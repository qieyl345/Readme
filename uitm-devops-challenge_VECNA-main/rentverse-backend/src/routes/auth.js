/**
 * MODULE 1: SECURE LOGIN & MFA
 * Comprehensive Authentication Routes with Clean Architecture
 * 
 * FEATURES:
 * - Two-factor authentication (2FA) with OTP
 * - Password validation with bcrypt
 * - JWT token generation and validation
 * - Multiple OAuth providers (Google, Facebook, GitHub, Twitter, Apple)
 * - OAuth account linking/unlinking
 * - AI anomaly detection for suspicious logins
 * - Activity logging for audit trail
 * - Input validation with express-validator
 * - Comprehensive error handling
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { passport, handleAppleSignIn } = require('../config/passport');

// Import Services (Clean separation of concerns)
const otpService = require('../services/otpService');
const emailService = require('../utils/emailService');
const aiService = require('../services/aiIntegration.service');
const activityLogger = require('../services/activityLogger');
const securityAnomalyDetection = require('../services/securityAnomalyDetection');

// Alias for backward compatibility
const logger = activityLogger;

// Import Middleware
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Initialize Passport
router.use(passport.initialize());

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         name:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         phone:
 *           type: string
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, LANDLORD]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User password
 *     VerifyOTPRequest:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         otp:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: 6-digit OTP code
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         phone:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         requireOTP:
 *           type: boolean
 *           description: Whether OTP verification is required
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT token
 */

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints (login, register, OAuth, MFA)
 */

// ====================================================================
// STEP 1: LOGIN (Password Check + Send OTP)
// ====================================================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password, triggers OTP if valid
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Password valid, OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 requireOTP:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *       401:
 *         description: Invalid email or password
 *       400:
 *         description: Validation failed
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Validate input (original pattern)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Find user (original logic)
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        // Log failed attempt
        await logger.log(
          'LOGIN_FAILED',
          null,
          {
            email,
            reason: 'User not found or inactive',
            ipAddress,
            userAgent: userAgent.substring(0, 100),
          },
          ipAddress
        );

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password (original logic)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Log failed attempt
        await logger.log(
          'LOGIN_FAILED',
          user.id,
          {
            email,
            reason: 'Invalid password',
            ipAddress,
            userAgent: userAgent.substring(0, 100),
          },
          ipAddress
        );

        // Analyze login patterns for security anomalies
        await securityAnomalyDetection.analyzeLoginPattern(user.id, ipAddress, userAgent, false, new Date().toISOString());

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // AI Anomaly Detection (your feature - via service)
      const isSuspicious = await aiService.detectLoginAnomaly({
        userId: user.id,
        ip: ipAddress,
        timestamp: new Date().toISOString(),
        userAgent,
      });

      if (isSuspicious) {
        await logger.log(
          'SUSPICIOUS_LOGIN',
          user.id,
          {
            action: 'MFA_ENFORCED',
            ipAddress,
            userAgent: userAgent.substring(0, 100),
            riskLevel: 'HIGH',
          },
          ipAddress
        );
      }

      // Generate OTP (via service)
      const { secret, token } = otpService.generateOTP();

      // DEBUG: Print OTP for testing
      console.log('👉 DEBUG OTP CODE:', token);

      // Save OTP to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaSecret: secret,
          otp: token,
          otpExpires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
      });

      // Send OTP email (via service)
      let emailSent = false;
      try {
        const emailResult = await emailService.sendOTPEmail(email, token);
        console.log(`✅ OTP email sent successfully to ${email} - Message ID: ${emailResult.messageId}`);
        emailSent = true;
      } catch (emailError) {
        console.error(`❌ Failed to send OTP email to ${email}:`, emailError.message);
        // Don't fail the login process if email fails, but log it
        await logger.log(
          'EMAIL_SEND_FAILED',
          user.id,
          {
            email,
            error: emailError.message,
            ipAddress,
          },
          ipAddress
        );
      }

      if (!emailSent) {
        console.warn(`⚠️ OTP email failed to send for ${email}`);
      }

      // Log OTP sent
      await logger.log(
        'OTP_SENT',
        user.id,
        {
          email,
          method: 'email',
          ipAddress,
        },
        ipAddress
      );

      // Return response (OTP required for MFA)
      res.json({
        success: true,
        message: 'OTP sent to your email. Please verify.',
        requireOTP: true,
        data: {
          email: email,
          // Security: Don't expose OTP or secret in response
        },
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// ====================================================================
// STEP 2: VERIFY OTP (Validate Code + Issue JWT)
// ====================================================================

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP code and issue JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOTPRequest'
 *     responses:
 *       200:
 *         description: OTP verified, user logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */
router.post(
  '/verify-otp',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
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

      const { email, otp } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check OTP expiration
      if (!user.otpExpires || new Date() > user.otpExpires) {
        await logger.log(
          'OTP_FAILED_EXPIRED',
          user.id,
          'OTP expired',
          ipAddress        );

        // Analyze OTP failure patterns for security anomalies
        await securityAnomalyDetection.analyzeOTPFailure(user.id, ipAddress, req.headers['user-agent'] || 'Unknown');

        return res.status(400).json({
          success: false,
          message: 'OTP expired. Please login again.',
        });
      }

      // Verify OTP (via service)
      // Special handling for admin users with fixed OTP for testing
      let isValid = false;
      if (user.role === 'ADMIN' && otp === '123456') {
        // Allow fixed OTP for admin testing
        console.log('🔧 Admin using fixed test OTP: 123456');
        isValid = true;
      } else {
        // Verify OTP normally (via service)
        isValid = otpService.verifyOTP(otp, user.mfaSecret);
      }

      if (!isValid) {
        await logger.log(
          'OTP_FAILED_INVALID',
          user.id,
          'Invalid OTP entered',
          ipAddress        );

        // Analyze OTP failure patterns for security anomalies
        await securityAnomalyDetection.analyzeOTPFailure(user.id, ipAddress, req.headers['user-agent'] || 'Unknown');

        return res.status(400).json({
          success: false,
          message: 'Invalid OTP code',
        });
      }

      // Generate JWT token (original pattern)
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Clear OTP data
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null,
          otpExpires: null,
        },
      });

      // Remove sensitive data (original pattern)
      const { password: _, mfaSecret: __, ...userWithoutSecrets } = user;

      // Analyze successful login patterns for security anomalies
      await securityAnomalyDetection.analyzeLoginPattern(user.id, ipAddress, req.headers['user-agent'] || 'Unknown', true, new Date().toISOString());

      // Log successful login
      await logger.log(
        'LOGIN_SUCCESS',
        user.id,
        'User logged in with MFA',
        ipAddress
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutSecrets,
          token,
        },
      });
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// ====================================================================
// REGISTRATION
// ====================================================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation failed
 *       409:
 *         description: User already exists
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName')
      .notEmpty()
      .trim()
      .withMessage('First name is required'),
    body('lastName')
      .notEmpty()
      .trim()
      .withMessage('Last name is required'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be a valid date'),
    body('phone').optional().trim(),
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

      const { email, password, firstName, lastName, dateOfBirth, phone } =
        req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create full name for backward compatibility
      const fullName = `${firstName} ${lastName}`;

      // Create user with USER role
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          name: fullName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          phone: phone || null,
          role: 'USER',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          dateOfBirth: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Log registration
      const ipAddress =
        req.ip || req.connection.remoteAddress || '127.0.0.1';
      await logger.log(
        'REGISTRATION_SUCCESS',
        user.id,
        {
          email,
          ipAddress,
        },
        ipAddress
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error('❌ User registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// ====================================================================
// GET USER PROFILE
// ====================================================================

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized or no token provided
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        dateOfBirth: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('❌ Auth me error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
});

// ====================================================================
// CHECK EMAIL EXISTENCE
// ====================================================================

/**
 * @swagger
 * /api/auth/check-email:
 *   post:
 *     summary: Check if email exists in the system
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
 *         description: Email check result
 *       400:
 *         description: Invalid email format
 */
router.post(
  '/check-email',
  [body('email').isEmail().normalizeEmail()],
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

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          isActive: true,
          role: true,
        },
      });

      if (!user) {
        return res.json({
          success: true,
          data: {
            exists: false,
          },
        });
      }

      res.json({
        success: true,
        data: {
          exists: true,
          isActive: user.isActive,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('❌ Check email error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// ====================================================================
// OAUTH ROUTES
// ====================================================================

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_failed`
        );
      }

      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback?token=${token}&provider=google`
      );
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_error`
      );
    }
  }
);

/**
 * @swagger
 * /api/auth/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth consent screen
 */
router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: ['email'],
  })
);

/**
 * @swagger
 * /api/auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_failed`
        );
      }

      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback?token=${token}&provider=facebook`
      );
    } catch (error) {
      console.error('❌ Facebook OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_error`
      );
    }
  }
);

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth consent screen
 */
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email'],
  })
);

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 */
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_failed`
        );
      }

      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback?token=${token}&provider=github`
      );
    } catch (error) {
      console.error('❌ GitHub OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_error`
      );
    }
  }
);

/**
 * @swagger
 * /api/auth/twitter:
 *   get:
 *     summary: Initiate Twitter OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Twitter OAuth consent screen
 */
router.get('/twitter', passport.authenticate('twitter'));

/**
 * @swagger
 * /api/auth/twitter/callback:
 *   get:
 *     summary: Twitter OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 */
router.get(
  '/twitter/callback',
  passport.authenticate('twitter', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_failed`
        );
      }

      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback?token=${token}&provider=twitter`
      );
    } catch (error) {
      console.error('❌ Twitter OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_error`
      );
    }
  }
);

/**
 * @swagger
 * /api/auth/apple:
 *   post:
 *     summary: Apple Sign In authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identityToken
 *             properties:
 *               identityToken:
 *                 type: string
 *               user:
 *                 type: object
 *     responses:
 *       200:
 *         description: Apple Sign In successful
 *       400:
 *         description: Identity token required
 *       401:
 *         description: Apple Sign In failed
 */
router.post('/apple', async (req, res) => {
  try {
    const { identityToken, user: userInfo } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        message: 'Identity token is required',
      });
    }

    const user = await handleAppleSignIn(identityToken, userInfo);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Apple Sign In successful',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('❌ Apple Sign In error:', error);
    res.status(401).json({
      success: false,
      message: 'Apple Sign In failed',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/oauth/link:
 *   post:
 *     summary: Link OAuth account to existing user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - providerId
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, facebook, apple, github, twitter]
 *               providerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OAuth account linked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: OAuth account already linked
 */
router.post('/oauth/link', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { provider, providerId } = req.body;

    if (!provider || !providerId) {
      return res.status(400).json({
        success: false,
        message: 'Provider and providerId are required',
      });
    }

    if (
      !['google', 'facebook', 'apple', 'github', 'twitter'].includes(provider)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider',
      });
    }

    const fieldName = `${provider}Id`;
    const existingUser = await prisma.user.findFirst({
      where: {
        [fieldName]: providerId,
        id: { not: decoded.userId },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `This ${provider} account is already linked to another user`,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { [fieldName]: providerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        googleId: true,
        facebookId: true,
        appleId: true,
        githubId: true,
        twitterId: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: `${provider} account linked successfully`,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('❌ OAuth link error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/oauth/unlink:
 *   post:
 *     summary: Unlink OAuth account from user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, facebook, apple, github, twitter]
 *     responses:
 *       200:
 *         description: OAuth account unlinked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/oauth/unlink', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider is required',
      });
    }

    if (
      !['google', 'facebook', 'apple', 'github', 'twitter'].includes(provider)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider',
      });
    }

    const fieldName = `${provider}Id`;
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { [fieldName]: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        googleId: true,
        facebookId: true,
        appleId: true,
        githubId: true,
        twitterId: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: `${provider} account unlinked successfully`,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('❌ OAuth unlink error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ====================================================================
// MODULE 3: PDF GENERATION & DIGITAL SIGNATURES (Test Endpoints)
// ====================================================================

/**
 * @swagger
 * /api/auth/test-signature:
 *   get:
 *     summary: Test digital signature generation
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Signature test successful
 */
router.get('/test-signature', async (req, res) => {
  try {
    const dummyPDF = Buffer.from(
      'This is a test rental agreement for Rentverse.'
    );
    const { generateDocumentHash } = require('../utils/digitalSignature');
    const signature = generateDocumentHash(dummyPDF);
    console.log('🧪 TEST: Generated Signature:', signature);
    res.json({
      success: true,
      message: 'Signature Logic Verified',
      originalContent: 'This is a test rental agreement for Rentverse.',
      generatedHash: signature,
    });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/test-generate-contract:
 *   get:
 *     summary: Test complete contract generation flow
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Contract generated successfully
 */
router.get('/test-generate-contract', async (req, res) => {
  try {
    console.log('🧪 Starting Contract Generation Test...');

    // Create test owner and tenant
    const owner = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@test.com`,
        password: 'hash',
        firstName: 'Datuk',
        lastName: 'Landlord',
        name: 'Datuk Landlord',
        role: 'LANDLORD',
      },
    });

    const tenant = await prisma.user.create({
      data: {
        email: `tenant-${Date.now()}@test.com`,
        password: 'hash',
        firstName: 'Ali',
        lastName: 'Tenant',
        name: 'Ali Tenant',
        role: 'USER',
      },
    });

    // Create test property type
    const propType = await prisma.propertyType.upsert({
      where: { code: 'TEST_CONDO' },
      update: {},
      create: { code: 'TEST_CONDO', name: 'Test Condominium' },
    });

    // Create test property
    const property = await prisma.property.create({
      data: {
        title: 'Luxury Test Villa',
        address: '1 Hacker Way',
        city: 'Cyberjaya',
        state: 'Selangor',
        zipCode: '63000',
        price: 2500,
        ownerId: owner.id,
        propertyTypeId: propType.id,
        code: `PROP-${Date.now()}`,
      },
    });

    // Create test lease
    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ),
        rentAmount: 2500,
        status: 'APPROVED',
        propertyId: property.id,
        tenantId: tenant.id,
        landlordId: owner.id,
      },
    });

    console.log(`✅ Fake Data Created. Lease ID: ${lease.id}`);
    console.log('📄 Generating PDF now...');

    // Generate and upload PDF
    const pdfService = require('../services/pdfGeneration.service');
    const result = await pdfService.generateAndUploadRentalAgreementPDF(
      lease.id
    );

    res.json({
      success: true,
      message: 'Module 3 COMPLETE: PDF Generated, Signed & Saved!',
      data: {
        leaseId: lease.id,
        digitalSignature: result.data.digitalSignature,
        pdfUrl: result.data.cloudinary.url,
        signedAt: result.data.rentalAgreement.signedAt,
      },
    });
  } catch (error) {
    console.error('❌ Test Failed:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// ====================================================================
// MODULE 5: ACTIVITY LOGS ENDPOINT (Admin Only)
// ====================================================================

/**
 * @swagger
 * /api/auth/activity-logs:
 *   get:
 *     summary: Get activity logs (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity logs retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/activity-logs',
  // Note: Using inline auth check instead of middleware for now
  // Can be replaced with: auth, authorize('ADMIN')
  async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      const logs = await prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: { email: true, role: true },
          },
        },
      });

      res.json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }
  }
);

// ====================================================================
// SECURITY ALERTS ENDPOINT (Admin Only)
// ====================================================================

/**
 * @swagger
 * /api/auth/security-alerts:
 *   get:
 *     summary: Get active security alerts (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security alerts retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/security-alerts',
  async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      // Get recent security alerts from anomaly detection service
      const alerts = await securityAnomalyDetection.getUnresolvedAnomalies();

      res.json({
        success: true,
        count: alerts.length,
        data: alerts,
      });
    } catch (error) {
      console.error('❌ Error fetching security alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }
  }
);

module.exports = router;





