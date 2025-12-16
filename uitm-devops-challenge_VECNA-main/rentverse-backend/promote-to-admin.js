const { prisma } = require('./src/config/database');

async function promoteToAdmin(email) {
  try {
    console.log(`🔄 Promoting user ${email} to ADMIN role...`);

    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    console.log(`✅ Successfully promoted user:`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);

    return user;
  } catch (error) {
    console.error(`❌ Error promoting user:`, error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2];
  if (!email) {
    console.error('❌ Please provide an email address as an argument');
    console.log('Usage: node promote-to-admin.js user@example.com');
    process.exit(1);
  }

  promoteToAdmin(email)
    .then(() => {
      console.log('🎉 User promotion completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Promotion failed:', error);
      process.exit(1);
    });
}

module.exports = { promoteToAdmin };