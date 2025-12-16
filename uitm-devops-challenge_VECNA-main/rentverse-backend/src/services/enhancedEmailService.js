const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Enhanced Email Service for Production
 * Handles multiple email providers with fallback mechanisms
 */
class EnhancedEmailService {
  constructor() {
    this.transporter = null;
    this.emailConfig = this.initializeEmailConfig();
    this.isConfigured = !!this.emailConfig;
  }

  /**
   * Initialize email configuration with multiple providers
   */
  initializeEmailConfig() {
    const config = {
      // Gmail configuration (primary)
      gmail: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        secure: false,
        port: 587
      },
      // SendGrid configuration (fallback)
      sendgrid: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY || 'your-sendgrid-key'
        }
      },
      // Mailgun configuration (backup)
      mailgun: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILGUN_USERNAME || 'postmaster@yourdomain.com',
          pass: process.env.MAILGUN_PASSWORD || 'your-mailgun-password'
        }
      }
    };

    // Return the best available configuration
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return config.gmail;
    } else if (process.env.SENDGRID_API_KEY) {
      return config.sendgrid;
    } else if (process.env.MAILGUN_USERNAME && process.env.MAILGUN_PASSWORD) {
      return config.mailgun;
    } else {
      // Development fallback
      return {
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'delores.wintheiser@ethereal.email',
          pass: 'kh5NpY9RvQ8XxGqM3d'
        }
      };
    }
  }

  /**
   * Initialize and verify email transporter
   */
  async initialize() {
    try {
      this.transporter = nodemailer.createTransport(this.emailConfig);
      
      // Verify transporter configuration
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      
      // Log configuration status
      const configType = this.getConfigType();
      console.log(`📧 Email service: ${configType}`);
      
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Get configuration type for logging
   */
  getConfigType() {
    if (this.emailConfig.service === 'gmail') return 'Gmail SMTP';
    if (this.emailConfig.host === 'smtp.sendgrid.net') return 'SendGrid';
    if (this.emailConfig.host === 'smtp.mailgun.org') return 'Mailgun';
    return 'Ethereal (Test)';
  }

  /**
   * Send OTP email with enhanced error handling
   */
  async sendOTPEmail(email, otp, userName = 'User') {
    if (!this.isConfigured) {
      console.warn('⚠️ Email service not configured - OTP will be logged');
      return this.logOTPFallback(email, otp, userName);
    }

    const mailOptions = {
      from: {
        name: 'RentVerse Security',
        address: process.env.FROM_EMAIL || 'noreply@rentverse.com'
      },
      to: email,
      subject: '🔐 Your RentVerse Login Verification Code',
      html: this.generateOTPEmailTemplate(otp, email, userName),
      text: this.generateOTPTextTemplate(otp, userName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // Log success with provider-specific info
      console.log(`✅ OTP email sent successfully to ${email}`);
      console.log(`📧 Provider: ${this.getConfigType()}`);
      
      // For Gmail, log preview URL if available
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`🔗 Preview: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        provider: this.getConfigType(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
      
      // Log the OTP as fallback
      console.log(`🔄 OTP Fallback: Code ${otp} for ${email}`);
      
      return {
        success: false,
        error: error.message,
        fallback: true,
        otp: otp, // In production, you might not want to log this
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate HTML email template for OTP
   */
  generateOTPEmailTemplate(otp, email, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RentVerse - Login Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🔐 RentVerse</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Login Verification</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Hello ${userName},</h2>
            
            <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              We're verifying your login attempt. Please use the verification code below:
            </p>
            
            <!-- OTP Code -->
            <div style="background: #f3f4f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px; font-weight: 500;">Your Verification Code</div>
              <div style="font-size: 36px; font-weight: 700; color: #1f2937; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
            </div>
            
            <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
              <strong>Security Notice:</strong>
            </p>
            <ul style="color: #6b7280; margin: 0 0 30px 20px; font-size: 14px; line-height: 1.6;">
              <li>This code expires in <strong>5 minutes</strong></li>
              <li>Never share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                🔒 This email was sent securely by RentVerse<br>
                <span style="color: #d1d5db;">Sent to: ${email} | ${new Date().toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text version of OTP email
   */
  generateOTPTextTemplate(otp, userName) {
    return `
RentVerse - Login Verification Code

Hello ${userName},

Your verification code is: ${otp}

This code expires in 5 minutes.

Security Notice:
- Never share this code with anyone
- If you didn't request this code, please ignore this email

---
🔒 This email was sent securely by RentVerse
    `;
  }

  /**
   * Send Security Alert email
   */
  async sendSecurityAlertEmail(email, details) {
    if (!this.isConfigured) {
      console.warn('⚠️ Email service not configured - security alert will be logged');
      return;
    }

    const mailOptions = {
      from: {
        name: 'RentVerse Security',
        address: process.env.FROM_EMAIL || 'noreply@rentverse.com'
      },
      to: email,
      subject: 'RentVerse Security Alert: Suspicious Login Attempt Detected',
      html: this.generateSecurityAlertEmailTemplate(email, details),
      text: this.generateSecurityAlertTextTemplate(details),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Security alert email sent successfully to ${email}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`🔗 Preview: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send security alert to ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HTML email template for Security Alert
   */
  generateSecurityAlertEmailTemplate(email, details) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>RentVerse Security Alert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border-left: 8px solid #d9534f; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: #d9534f; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🛡️ Security Alert</h1>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Suspicious Activity Detected</h2>
            <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Hello, our systems have detected a suspicious login attempt on your RentVerse account.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 30px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Reason:</strong> ${details.reason || 'Unusual login pattern'}</p>
              <p style="margin: 0 0 10px 0;"><strong>Risk Score:</strong> ${details.riskScore ? (details.riskScore * 100).toFixed(0) : 'N/A'}/100</p>
              <p style="margin: 0;"><strong>Time:</strong> ${new Date().toUTCString()}</p>
            </div>
            <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              <strong>If this was not you</strong>, please secure your account immediately by resetting your password.
            </p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/security" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin-top: 15px;">
              Secure Your Account
            </a>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">This alert was sent to ${email}.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text version of Security Alert email
   */
  generateSecurityAlertTextTemplate(details) {
    return `
RentVerse - Security Alert

Suspicious activity was detected on your account.

Reason: ${details.reason || 'Unusual login pattern'}
Risk Score: ${details.riskScore ? (details.riskScore * 100).toFixed(0) : 'N/A'}/100
Time: ${new Date().toUTCString()}

If this was not you, please visit our website to secure your account immediately.
    `;
  }

  /**
   * Fallback method when email service is unavailable
   */
  async logOTPFallback(email, otp, userName) {
    console.log('='.repeat(50));
    console.log('📧 OTP EMAIL FALLBACK MODE');
    console.log('='.repeat(50));
    console.log(`👤 User: ${userName}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log(`⏰ Expires: 5 minutes from now`);
    console.log(`🕐 Generated: ${new Date().toISOString()}`);
    console.log('='.repeat(50));
    
    // In a real application, you might want to store this in a secure database
    // or send via an alternative notification method
    
    return {
      success: true,
      fallback: true,
      message: 'OTP logged to console (email service unavailable)',
      otp: otp, // Only for development
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for email service
   */
  async healthCheck() {
    if (!this.isConfigured || !this.transporter) {
      return {
        status: 'unhealthy',
        message: 'Email service not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      await this.transporter.verify();
      return {
        status: 'healthy',
        provider: this.getConfigType(),
        message: 'Email service operational',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.getConfigType(),
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create and export singleton instance
const emailService = new EnhancedEmailService();

// Initialize email service
emailService.initialize().then(success => {
  if (success) {
    console.log('✅ Enhanced email service ready');
  } else {
    console.warn('⚠️ Enhanced email service using fallback mode');
  }
}).catch(error => {
  console.error('❌ Email service initialization error:', error);
});

module.exports = emailService;