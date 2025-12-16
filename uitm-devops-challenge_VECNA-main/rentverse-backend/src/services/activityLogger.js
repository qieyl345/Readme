const { prisma } = require('../config/database');

class ActivityLogger {
  /**
   * Log a security event to the database
   */
  async log(action, userId, details, ipAddress) {
    try {
      // Pastikan prisma.activityLog wujud (anda sudah db push tadi)
      await prisma.activityLog.create({
        data: {
          action,
          userId: userId || null,
          details: typeof details === 'object' ? JSON.stringify(details) : details,
          ipAddress: ipAddress || 'Unknown'
        }
      });
      console.log(`📝 Logged: ${action} - ${userId || 'ANON'}`);
    } catch (error) {
      console.error('❌ Failed to save activity log:', error.message);
    }
  }
}

module.exports = new ActivityLogger();