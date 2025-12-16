const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { generateOTP, sendOTPEmail, sendSecurityAlertEmail } = require('./otpService');

class EnhancedMFAService {
  constructor() {
    this.roleBasedMFAPolicies = {
      ADMIN: {
        requireMFA: true,
        allowedMethods: ['TOTP', 'SMS', 'EMAIL'],
        sessionTimeout: 15, // minutes
        maxFailedAttempts: 3,
        allowedLoginHours: { start: 6, end: 22 }, // 6 AM to 10 PM
        requireDeviceVerification: true
      },
      LANDLORD: {
        requireMFA: true,
        allowedMethods: ['TOTP', 'EMAIL'],
        sessionTimeout: 30,
        maxFailedAttempts: 5,
        allowedLoginHours: { start: 5, end: 23 },
        requireDeviceVerification: true
      },
      USER: {
        requireMFA: false,
        allowedMethods: ['TOTP', 'EMAIL'],
        sessionTimeout: 60,
        maxFailedAttempts: 5,
        allowedLoginHours: { start: 0, end: 24 },
        requireDeviceVerification: false
      }
    };
  }

  // Generate TOTP secret for a user
  async generateTOTPSecret(userId, userEmail, userRole) {
    try {
      const secret = speakeasy.generateSecret({
        name: `RentVerse (${userEmail})`,
        issuer: 'RentVerse Secure Login',
        length: 20,
      });

      // Generate QR code for the secret
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      // Store the secret temporarily (not activated until verified)
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret: secret.base32,
          // Mark as pending verification
          mfaEnabled: false
        }
      });

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: this.generateBackupCodes()
      };
    } catch (error) {
      console.error('TOTP secret generation error:', error);
      throw error;
    }
  }

  // Verify TOTP token and enable MFA
  async verifyAndEnableMFA(userId, token, backupCode = null) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          mfaSecret: true,
          mfaEnabled: true
        }
      });

      if (!user || !user.mfaSecret) {
        throw new Error('MFA setup not found');
      }

      // Verify TOTP token
      const isValidTOTP = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      // If backup code is provided, verify it
      let isValidBackupCode = false;
      if (backupCode) {
        // In a real implementation, you'd store and verify hashed backup codes
        // For now, we'll use a simple check
        isValidBackupCode = backupCode === 'BACKUP123'; // This should be hashed and stored
      }

      if (isValidTOTP || isValidBackupCode) {
        // Enable MFA for the user
        await prisma.user.update({
          where: { id: userId },
          data: {
            mfaEnabled: true
          }
        });

        // Log the MFA setup
        await this.logMFAActivity(userId, 'MFA_ENABLED', 'TOTP', null);

        return {
          success: true,
          message: 'MFA enabled successfully'
        };
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  }

  // Enhanced OTP generation with role-based policies
  async generateRoleBasedOTP(userId, loginMethod = 'EMAIL') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          mfaEnabled: true,
          lastLoginAt: true,
          lastLoginIp: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get role-based policy
      const policy = this.roleBasedMFAPolicies[user.role];
      if (!policy) {
        throw new Error('No MFA policy defined for user role');
      }

      // Check login time restrictions
      const currentHour = new Date().getHours();
      if (currentHour < policy.allowedLoginHours.start || currentHour > policy.allowedLoginHours.end) {
        if (user.role === 'ADMIN') {
          throw new Error('Login outside allowed hours for admin users');
        }
      }

      // Check for suspicious login patterns
      const suspiciousActivity = await this.detectSuspiciousActivity(user);
      if (suspiciousActivity.blocked) {
        // Log and notify if blocked
        this.logMFAActivity(userId, 'LOGIN_BLOCKED', 'RISK_ANALYSIS', suspiciousActivity.reason, suspiciousActivity.riskScore);
        sendSecurityAlertEmail(user.email, suspiciousActivity); // Fire-and-forget notification
        throw new Error(`Login blocked: ${suspiciousActivity.reason}`);
      }

      // --- MODULE 4: SMART NOTIFICATION ---
      // If activity is suspicious but not blocked, send a non-blocking alert email
      if (suspiciousActivity.riskScore > 0.4) {
        console.log(`🛡️ High risk score detected (${suspiciousActivity.riskScore}). Sending security alert.`);
        this.logMFAActivity(userId, 'SUSPICIOUS_LOGIN_DETECTED', 'RISK_ANALYSIS', suspiciousActivity.reason, suspiciousActivity.riskScore);
        // Fire-and-forget, don't await to avoid blocking the login flow
        sendSecurityAlertEmail(user.email, suspiciousActivity);
      }
      // ------------------------------------

      // Generate OTP
      const { secret, token } = generateOTP();

      // Store OTP with role-based expiration
      const expiresAt = new Date(Date.now() + (policy.sessionTimeout * 60 * 1000));
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          otp: token,
          otpExpires: expiresAt
        }
      });

      // Send OTP via appropriate method
      let otpSent = false;
      if (loginMethod === 'EMAIL' && policy.allowedMethods.includes('EMAIL')) {
        otpSent = await sendOTPEmail(user.email, token);
      }
      // Add SMS method here if needed

      // Log the OTP generation
      await this.logMFAActivity(userId, 'OTP_GENERATED', loginMethod, null, suspiciousActivity.riskScore);

      return {
        success: otpSent,
        expiresAt,
        method: loginMethod,
        riskScore: suspiciousActivity.riskScore,
        requiresAdditionalVerification: policy.requireDeviceVerification && suspiciousActivity.riskScore > 0.7
      };
    } catch (error) {
      console.error('Role-based OTP generation error:', error);
      await this.logMFAActivity(userId, 'OTP_GENERATION_FAILED', 'EMAIL', error.message);
      throw error;
    }
  }

  // Enhanced OTP verification with role-based security
  async verifyRoleBasedOTP(userId, providedToken, clientInfo = {}) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          mfaEnabled: true,
          mfaSecret: true,
          otp: true,
          otpExpires: true,
          lastLoginAt: true,
          lastLoginIp: true,
          loginAttempts: true,
          lockedUntil: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if account is locked
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        throw new Error('Account is temporarily locked due to multiple failed attempts');
      }

      // Get role-based policy
      const policy = this.roleBasedMFAPolicies[user.role];
      if (!policy) {
        throw new Error('No MFA policy defined for user role');
      }

      // Check OTP expiration
      if (!user.otpExpires || new Date() > user.otpExpires) {
        await this.recordFailedAttempt(userId, 'OTP_EXPIRED');
        throw new Error('OTP has expired');
      }

      // Verify OTP
      const isValidOTP = user.otp === providedToken;
      const isValidTOTP = user.mfaSecret && speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: providedToken,
        window: 2
      });

      if (!isValidOTP && !isValidTOTP) {
        await this.recordFailedAttempt(userId, 'INVALID_OTP');
        throw new Error('Invalid verification code');
      }

      // Check for device verification requirements
      if (policy.requireDeviceVerification) {
        const deviceVerified = await this.verifyDevice(user, clientInfo);
        if (!deviceVerified.verified) {
          await this.logMFAActivity(userId, 'DEVICE_VERIFICATION_REQUIRED', 'DEVICE', deviceVerified.reason);
          throw new Error('Device verification required');
        }
      }

      // Clear OTP after successful verification
      await prisma.user.update({
        where: { id: userId },
        data: {
          otp: null,
          otpExpires: null,
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: clientInfo.ipAddress
        }
      });

      // Generate enhanced session token
      const sessionToken = this.generateSessionToken(user, policy);

      // Log successful verification
      await this.logMFAActivity(userId, 'LOGIN_SUCCESS', 'MULTIFACTOR', null);

      return {
        success: true,
        sessionToken,
        expiresAt: new Date(Date.now() + (policy.sessionTimeout * 60 * 1000)),
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        policy: {
          sessionTimeout: policy.sessionTimeout,
          requireMFA: policy.requireMFA
        }
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      await this.logMFAActivity(userId, 'LOGIN_FAILED', 'MULTIFACTOR', error.message);
      throw error;
    }
  }

  // Detect suspicious login activity
  async detectSuspiciousActivity(user) {
    let riskScore = 0;
    let reasons = [];

    // Check for multiple failed attempts
    if (user.loginAttempts > 0) {
      riskScore += 0.3;
      reasons.push('Previous failed attempts');
    }

    // Check for location changes (IP-based)
    const currentIP = user.lastLoginIp;
    if (currentIP && user.lastLoginAt) {
      // In a real implementation, you'd check IP geolocation
      // For now, we'll simulate location change detection
      const hoursSinceLastLogin = (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastLogin < 1) {
        riskScore += 0.2;
        reasons.push('Rapid successive login attempts');
      }
    }

    // Check for unusual login patterns based on user role
    const currentHour = new Date().getHours();
    const policy = this.roleBasedMFAPolicies[user.role];
    
    if (policy.allowedLoginHours.start > currentHour || currentHour > policy.allowedLoginHours.end) {
      riskScore += 0.4;
      reasons.push('Login outside normal hours');
    }

    // Determine if activity should be blocked
    const blocked = riskScore > 0.8 || user.role === 'ADMIN' && reasons.includes('Login outside normal hours');

    return {
      riskScore,
      blocked,
      reason: reasons.join(', ') || 'No suspicious activity detected',
      reasons
    };
  }

  // Verify device based on client information
  async verifyDevice(user, clientInfo) {
    // In a real implementation, you'd:
    // 1. Check against known devices for the user
    // 2. Verify device fingerprint
    // 3. Check for device registration
    
    // For now, we'll use a simple heuristic
    const isKnownIP = user.lastLoginIp === clientInfo.ipAddress;
    const isKnownUserAgent = clientInfo.userAgent && clientInfo.userAgent.length > 10;
    
    return {
      verified: isKnownIP || isKnownUserAgent,
      reason: !isKnownIP ? 'Unknown device or IP address' : null
    };
  }

  // Record failed login attempt
  async recordFailedAttempt(userId, reason) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { loginAttempts: true, role: true }
      });

      const policy = this.roleBasedMFAPolicies[user.role];
      const newAttempts = (user.loginAttempts || 0) + 1;
      
      let lockUntil = null;
      if (newAttempts >= policy.maxFailedAttempts) {
        lockUntil = new Date(Date.now() + (15 * 60 * 1000)); // Lock for 15 minutes
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: lockUntil
        }
      });

      await this.logMFAActivity(userId, 'LOGIN_FAILED', reason, null);

      return {
        attempts: newAttempts,
        locked: !!lockUntil,
        lockUntil
      };
    } catch (error) {
      console.error('Failed to record attempt:', error);
    }
  }

  // Generate enhanced session token
  generateSessionToken(user, policy) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      mfaVerified: true,
      sessionTimeout: policy.sessionTimeout,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (policy.sessionTimeout * 60 * 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `${policy.sessionTimeout}m`,
      issuer: 'rentverse-mfa'
    });
  }

  // Generate backup codes for MFA recovery
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    return codes;
  }

  // Log MFA-related activities
  async logMFAActivity(userId, action, method, error = null, riskScore = null) {
    try {
      const activityLogger = require('./activityLogger');
      
      await activityLogger.log(
        action,
        userId,
        {
          type: 'MFA_SECURITY',
          method: method,
          riskScore: riskScore,
          error: error,
          severity: action.includes('FAILED') || action.includes('BLOCKED') ? 'WARNING' : 'INFO',
        },
        null // IP Address not available in this context
      );
    } catch (error) {
      console.error('Failed to log MFA activity:', error);
    }
  }

  // Get MFA status for user
  async getMFAStatus(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          mfaEnabled: true,
          mfaSecret: true,
          loginAttempts: true,
          lockedUntil: true,
          lastLoginAt: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const policy = this.roleBasedMFAPolicies[user.role];

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        mfa: {
          enabled: user.mfaEnabled,
          setupComplete: !!user.mfaSecret,
          requiresSetup: policy.requireMFA && !user.mfaEnabled
        },
        security: {
          loginAttempts: user.loginAttempts || 0,
          isLocked: user.lockedUntil && new Date() < user.lockedUntil,
          lockUntil: user.lockedUntil,
          lastLogin: user.lastLoginAt,
          policy: policy
        }
      };
    } catch (error) {
      console.error('Get MFA status error:', error);
      throw error;
    }
  }

  // Disable MFA for user (admin function)
  async disableMFA(userId, adminId, reason) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          otp: null,
          otpExpires: null
        }
      });

      // Log the action
      await this.logMFAActivity(userId, 'MFA_DISABLED_BY_ADMIN', 'ADMIN', reason);
      await this.logMFAActivity(adminId, 'ADMIN_MFA_DISABLED', 'ADMIN', `Target user: ${userId}, Reason: ${reason}`);

      return { success: true, message: 'MFA disabled successfully' };
    } catch (error) {
      console.error('Disable MFA error:', error);
      throw error;
    }
  }
}

module.exports = new EnhancedMFAService();