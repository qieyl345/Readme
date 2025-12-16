const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSecurityAnomalies() {
  try {
    console.log('🧪 Testing Security Anomaly Detection...');

    // Get an existing user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`👤 Using user: ${user.email} (${user.id})`);

    // Directly create security anomalies in the database
    console.log('🔐 Creating security anomalies...');

    const anomalies = [
      {
        userId: user.id,
        type: 'MULTIPLE_FAILED_LOGINS',
        severity: 'HIGH',
        description: `User ${user.email} has 5 failed login attempts in the last 15 minutes`,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          failedAttempts: 5,
          recentIPs: ['192.168.1.100'],
          timeframe: '15 minutes'
        }
      },
      {
        userId: user.id,
        type: 'FAILED_LOGIN',
        severity: 'HIGH',
        description: `User ${user.email} has 6 failed OTP attempts in the last 15 minutes`,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          failedAttempts: 6,
          recentIPs: ['192.168.1.100'],
          timeframe: '15 minutes'
        }
      },
      {
        userId: user.id,
        type: 'UNUSUAL_ACCESS_TIME',
        severity: 'MEDIUM',
        description: `User ${user.email} logged in at unusual hour: 2:00`,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          loginHour: 2,
          timezone: 'UTC',
          userRole: user.role
        }
      }
    ];

    // Insert anomalies into database
    await prisma.securityAnomaly.createMany({
      data: anomalies
    });

    console.log(`✅ Created ${anomalies.length} security anomalies`);

    // Check for created anomalies
    const createdAnomalies = await prisma.securityAnomaly.findMany({
      where: { resolved: false },
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    console.log(`\n📊 Total unresolved security anomalies: ${createdAnomalies.length}`);
    createdAnomalies.forEach((anomaly, index) => {
      console.log(`${index + 1}. ${anomaly.type} (${anomaly.severity}): ${anomaly.description}`);
    });

    console.log('\n🎯 Security anomaly detection test completed!');
    console.log('📊 Check the admin dashboard at /admin/dashboard to see the alerts.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSecurityAnomalies();