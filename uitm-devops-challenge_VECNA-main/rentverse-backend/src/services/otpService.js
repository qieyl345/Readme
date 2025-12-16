const speakeasy = require('speakeasy');
const enhancedEmailService = require('./enhancedEmailService');

/**
 * Enhanced OTP Service with Production-Ready Email Support
 * This service generates OTP codes and sends them via email with robust error handling
 */

// Generate OTP
const generateOTP = () => {
  const secret = speakeasy.generateSecret({ length: 20 });
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    step: 300, // Valid for 5 minutes
  });
  return { secret: secret.base32, token };
};

// Verify OTP
const verifyOTP = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow a little time drift
    step: 300,
  });
};

// Send OTP via Enhanced Email Service
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    console.log(`📧 Sending OTP to ${email} via enhanced email service`);
    
    // Use the enhanced email service
    const result = await enhancedEmailService.sendOTPEmail(email, otp, userName);
    
    if (result.success) {
      console.log(`✅ OTP sent successfully to ${email}`);
      if (result.fallback) {
        console.log(`⚠️ Using fallback mode - check console logs for OTP`);
      }
      return true;
    } else {
      console.error(`❌ Failed to send OTP to ${email}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error in sendOTPEmail:`, error.message);
    // Log OTP as final fallback
    console.log(`🔄 Emergency OTP fallback for ${email}: ${otp}`);
    return false;
  }
};

// Health check for OTP service
const healthCheck = async () => {
  const emailHealth = await enhancedEmailService.healthCheck();
  
  return {
    status: 'healthy',
    email: emailHealth,
    timestamp: new Date().toISOString(),
    services: {
      otp_generation: true,
      otp_verification: true,
      email_delivery: emailHealth.status === 'healthy'
    }
  };
};

// Get service statistics
const getStats = () => {
  return {
    provider: enhancedEmailService.getConfigType(),
    configured: enhancedEmailService.isConfigured,
    timestamp: new Date().toISOString()
  };
};

// Send Security Alert via Enhanced Email Service
const sendSecurityAlertEmail = async (email, details) => {
  try {
    console.log(`🛡️ Sending security alert to ${email} via enhanced email service`);
    return await enhancedEmailService.sendSecurityAlertEmail(email, details);
  } catch (error) {
    console.error(`❌ Error in sendSecurityAlertEmail:`, error.message);
  }
};

module.exports = { 
  generateOTP, 
  verifyOTP, 
  sendOTPEmail,
  sendSecurityAlertEmail,
  healthCheck,
  getStats
};