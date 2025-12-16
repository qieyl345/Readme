const { Resend } = require('resend');
const nodemailer = require('nodemailer');

// Initialize Resend (will be null if no API key)
const resendApiKey = process.env.RESEND_API_KEY;
let resend = null;

// Only initialize Resend if API key is available
if (resendApiKey && resendApiKey !== 'your_resend_api_key_here') {
  try {
    resend = new Resend(resendApiKey);
    console.log('✅ Resend email service initialized');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Resend:', error.message);
  }
} else {
  console.log('⚠️ Using Gmail SMTP fallback for testing');
}

// Initialize Gmail SMTP transporter as fallback
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'mohdbukhari03@gmail.com',
    pass: process.env.EMAIL_PASS || 'qsdnacxvzwnlzbxt'
  }
});

/**
 * Send OTP email using available email service
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time password
 * @returns {Promise<Object>} Email service response
 */
const sendOTPEmail = async (email, otp) => {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Code - Rentverse</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 450px;
            width: 90%;
            text-align: center;
        }
        .logo {
            color: #2563eb;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 30px;
        }
        .otp-box {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border-radius: 15px;
            padding: 30px 20px;
            margin: 30px 0;
            box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);
        }
        .otp-text {
            color: white;
            font-size: 14px;
            margin-bottom: 15px;
            font-weight: 500;
        }
        .otp-code {
            color: white;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .security-info {
            background: #f8fafc;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
        }
        .security-title {
            color: #1e293b;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .security-text {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
        }
        .footer {
            color: #94a3b8;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            margin: 5px 0;
        }
        .highlight {
            color: #2563eb;
            font-weight: 600;
        }
        .test-badge {
            background: #f59e0b;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 15px;
        }
        @media (max-width: 480px) {
            .container {
                padding: 30px 20px;
            }
            .otp-code {
                font-size: 28px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${!resend ? '<div class="test-badge">🔧 TEST MODE</div>' : ''}
        <div class="logo">🏠 Rentverse</div>
        <div class="subtitle">Your Secure Property Platform</div>
        
        <div class="otp-box">
            <div class="otp-text">Your Security Code</div>
            <div class="otp-code">${otp}</div>
        </div>
        
        <div class="security-info">
            <div class="security-title">
                🔒 Security Information
            </div>
            <p class="security-text">
                This 6-digit code will expire in <strong>10 minutes</strong>. 
                Please use it to complete your login process. 
                For your security, never share this code with anyone.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Rentverse</strong> - Secure Property Management Platform
            </p>
            <p class="footer-text">
                ${!resend ? '📧 Sent via Gmail SMTP (Test Mode)' : '📧 Sent via Resend API'}
            </p>
            <p class="footer-text">
                If you didn't request this code, please ignore this email.
            </p>
            <p class="footer-text">
                © 2024 Rentverse. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    let response;
    let emailService;

    // Try Resend first if available, otherwise use Gmail SMTP
    if (resend) {
      try {
        response = await resend.emails.send({
          from: 'Rentverse Security <security@rentverse-vecna-secure.xyz>',
          to: email,
          subject: 'Your Security Code - Rentverse',
          html: emailHtml
        });
        emailService = 'Resend API';
      } catch (resendError) {
        console.warn('⚠️ Resend failed, falling back to Gmail SMTP:', resendError.message);
        // Fall back to Gmail SMTP
        response = await gmailTransporter.sendMail({
          from: 'Rentverse Security <mohdbukhari03@gmail.com>',
          to: email,
          subject: 'Your Security Code - Rentverse',
          html: emailHtml
        });
        emailService = 'Gmail SMTP (Resend Fallback)';
      }
    } else {
      // Use Gmail SMTP as primary
      response = await gmailTransporter.sendMail({
        from: 'Rentverse Security <mohdbukhari03@gmail.com>',
        to: email,
        subject: 'Your Security Code - Rentverse',
        html: emailHtml
      });
      emailService = 'Gmail SMTP';
    }

    console.log('✅ OTP Email sent successfully:', {
      email,
      service: emailService,
      messageId: response.id || 'gmail_success',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: response.id || 'gmail_success',
      email,
      service: emailService
    };

  } catch (error) {
    console.error('❌ Failed to send OTP email:', {
      email,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

const sendSecurityAlertEmail = async (email, details) => {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert - Rentverse</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f7;
            color: #333;
        }
        .container {
            background-color: white;
            margin: 20px auto;
            padding: 30px;
            max-width: 600px;
            border-left: 8px solid #d9534f;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            color: #d9534f;
            font-size: 28px;
            margin: 0;
        }
        .content h2 {
            color: #333;
            font-size: 20px;
        }
        .content p {
            line-height: 1.6;
            font-size: 16px;
        }
        .details-box {
            background-color: #fcf8e3;
            border: 1px solid #faebcc;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .details-box strong {
            color: #8a6d3b;
        }
        .action-button {
            display: inline-block;
            background-color: #337ab7;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            margin-top: 15px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Security Alert</h1>
        </div>
        <div class="content">
            <h2>Suspicious Activity Detected on Your Account</h2>
            <p>Hello,</p>
            <p>Our security system detected a login attempt on your Rentverse account that we consider suspicious. We are notifying you immediately to ensure your account remains secure.</p>
            
            <div class="details-box">
                <p><strong>Reason for alert:</strong> ${details.reason || 'Unusual login pattern'}</p>
                <p><strong>Time of event:</strong> ${new Date().toUTCString()}</p>
                <p><strong>Risk Score Assessed:</strong> ${details.riskScore ? (details.riskScore * 100).toFixed(0) : 'N/A'}/100</p>
            </div>

            <h3>What should you do?</h3>
            <p>If this was you, you can safely ignore this email. A login attempt was made, but this alert is just a precaution.</p>
            <p><strong>If this was not you</strong>, your account may be at risk. We strongly recommend you take the following actions immediately:</p>
            <ol>
                <li>Change your password.</li>
                <li>Review your recent account activity.</li>
                <li>Ensure Two-Factor Authentication (MFA) is enabled.</li>
            </ol>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/security" class="action-button" style="color: white;">Secure Your Account</a>
        </div>
        <div class="footer">
            <p>Rentverse Security Team</p>
            <p>&copy; 2024 Rentverse. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    let response;
    let emailService;

    if (resend) {
      try {
        response = await resend.emails.send({
          from: 'Rentverse Security <security@rentverse-vecna-secure.xyz>',
          to: email,
          subject: 'Rentverse Security Alert: Suspicious Login Attempt',
          html: emailHtml,
        });
        emailService = 'Resend API';
      } catch (resendError) {
        console.warn('⚠️ Resend failed, falling back to Gmail SMTP:', resendError.message);
        response = await gmailTransporter.sendMail({
          from: 'Rentverse Security <mohdbukhari03@gmail.com>',
          to: email,
          subject: 'Rentverse Security Alert: Suspicious Login Attempt',
          html: emailHtml,
        });
        emailService = 'Gmail SMTP (Resend Fallback)';
      }
    } else {
      response = await gmailTransporter.sendMail({
        from: 'Rentverse Security <mohdbukhari03@gmail.com>',
        to: email,
        subject: 'Rentverse Security Alert: Suspicious Login Attempt',
        html: emailHtml,
      });
      emailService = 'Gmail SMTP';
    }

    console.log('✅ Security Alert Email sent successfully:', {
      email,
      service: emailService,
    });

    return {
      success: true,
      messageId: response.id || 'gmail_success',
    };

  } catch (error) {
    console.error('❌ Failed to send Security Alert email:', {
      email,
      error: error.message,
    });
    // Do not rethrow, as this is a non-critical notification
  }
};

module.exports = {
  sendOTPEmail,
  sendSecurityAlertEmail,
  resend: resend || null,
  gmailTransporter
};