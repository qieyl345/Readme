const { prisma } = require('./src/config/database');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

async function enableAdminMFA() {
  try {
    console.log('🔐 Setting up MFA for admin user with fixed OTP...');

    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@rentverse.com' },
      select: {
        id: true,
        email: true,
        role: true,
        mfaEnabled: true,
        mfaSecret: true
      }
    });

    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    console.log(`Found admin user: ${adminUser.email} (ID: ${adminUser.id})`);
    console.log(`Current MFA status: ${adminUser.mfaEnabled ? 'Enabled' : 'Disabled'}`);

    // Generate TOTP secret if not exists
    let secret = adminUser.mfaSecret;
    if (!secret) {
      console.log('Generating TOTP secret...');
      const generatedSecret = speakeasy.generateSecret({
        name: `RentVerse (${adminUser.email})`,
        issuer: 'RentVerse Secure Login',
        length: 20,
      });
      secret = generatedSecret.base32;
    }

    // For testing purposes, use a fixed OTP instead of TOTP
    const fixedOTP = '123456';
    const futureDate = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now

    // Enable MFA for the admin user with fixed OTP
    console.log('Setting up MFA with fixed OTP for testing...');
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
        otp: fixedOTP,
        otpExpires: futureDate
      }
    });

    console.log('✅ MFA set up successfully for admin user with fixed OTP');
    console.log('\n🔑 Admin login credentials:');
    console.log('Email: admin@rentverse.com');
    console.log('Password: password123');
    console.log('MFA Code: 123456 (fixed for testing - never expires)');

    console.log('\n🔧 Alternative TOTP setup (if you prefer dynamic codes):');
    console.log(`Secret: ${secret}`);
    console.log('Add this to Google Authenticator, Authy, or similar app');

  } catch (error) {
    console.error('❌ Error setting up MFA:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  enableAdminMFA()
    .then(() => {
      console.log('🎉 Admin MFA setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 MFA setup failed:', error);
      process.exit(1);
    });
}

module.exports = { enableAdminMFA };