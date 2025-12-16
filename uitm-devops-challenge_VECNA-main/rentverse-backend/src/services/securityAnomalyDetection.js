const axios = require('axios');
const { prisma } = require('../config/database');
const crypto = require('crypto');

class SecurityAnomalyDetection {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.anomalyThresholds = {
      failedLogins: 3, // Number of failed logins before flagging
      failedOTPs: 5, // Number of failed OTP attempts before flagging
      unusualHours: { start: 23, end: 6 }, // Outside 11 PM - 6 AM
      locationChangeThreshold: 100, // KM difference to flag location change
      apiRateLimitBreaches: 5, // Number of rate limit breaches
      sessionDuration: { min: 300, max: 28800 } // 5 min to 8 hours
    };
  }

  // Analyze OTP failure patterns for anomalies
  async analyzeOTPFailure(userId, ipAddress, userAgent) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      if (!user) return null;

      const anomalies = [];

      // Check for multiple failed OTP attempts
      const recentFailedOTPs = await this.getRecentFailedOTPs(userId, 15); // Last 15 minutes
      if (recentFailedOTPs.length >= this.anomalyThresholds.failedOTPs) {
        anomalies.push({
          type: 'FAILED_LOGIN', // Using existing enum value
          severity: 'HIGH',
          description: `User ${user.email} has ${recentFailedOTPs.length} failed OTP attempts in the last 15 minutes`,
          metadata: {
            failedAttempts: recentFailedOTPs.length,
            recentIPs: [...new Set(recentFailedOTPs.map(o => o.ipAddress))],
            timeframe: '15 minutes'
          }
        });
      }

      // Record anomalies if any found
      if (anomalies.length > 0) {
        await this.recordAnomalies(userId, anomalies, ipAddress, userAgent);
        await this.sendSecurityAlerts(userId, anomalies);
      }

      return anomalies;
    } catch (error) {
      console.error('OTP failure analysis error:', error);
      return [];
    }
  }

  // Analyze login patterns for anomalies
  async analyzeLoginPattern(userId, ipAddress, userAgent, success, timestamp) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      if (!user) return null;

      const anomalies = [];

      // Check for multiple failed login attempts
      const recentFailedLogins = await this.getRecentFailedLogins(userId, 15); // Last 15 minutes
      if (!success && recentFailedLogins.length >= this.anomalyThresholds.failedLogins) {
        anomalies.push({
          type: 'MULTIPLE_FAILED_LOGINS',
          severity: 'HIGH',
          description: `User ${user.email} has ${recentFailedLogins.length} failed login attempts in the last 15 minutes`,
          metadata: {
            failedAttempts: recentFailedLogins.length,
            recentIPs: [...new Set(recentFailedLogins.map(l => l.ipAddress))],
            timeframe: '15 minutes'
          }
        });
      }

      // Check for unusual login hours
      const hour = new Date(timestamp).getHours();
      if (hour < this.anomalyThresholds.unusualHours.start && hour > this.anomalyThresholds.unusualHours.end) {
        anomalies.push({
          type: 'UNUSUAL_ACCESS_TIME',
          severity: 'MEDIUM',
          description: `User ${user.email} logged in at unusual hour: ${hour}:00`,
          metadata: {
            loginHour: hour,
            timezone: 'UTC',
            userRole: user.role
          }
        });
      }

      // Location change detection disabled - requires lastLoginIp field in User model
      // TODO: Add lastLoginIp field to User model for location-based anomaly detection

      // Check for rapid successive logins (session hijacking indicator)
      const recentLogins = await this.getRecentLogins(userId, 5); // Last 5 minutes
      if (success && recentLogins.length > 1) {
        anomalies.push({
          type: 'MULTIPLE_SESSIONS', // This might not exist in enum, using alternative
          severity: 'MEDIUM',
          description: `User ${user.email} has multiple successful logins within 5 minutes`,
          metadata: {
            loginCount: recentLogins.length,
            timeWindow: '5 minutes'
          }
        });
      }

      // Use AI service for advanced anomaly detection
      const aiAnalysis = await this.analyzeWithAI({
        userId,
        userEmail: user.email,
        userRole: user.role,
        ipAddress,
        userAgent,
        success,
        timestamp,
        recentActivity: await this.getUserRecentActivity(userId, 24) // Last 24 hours
      });

      if (aiAnalysis.anomalies && aiAnalysis.anomalies.length > 0) {
        anomalies.push(...aiAnalysis.anomalies);
      }

      // Record anomalies if any found
      if (anomalies.length > 0) {
        await this.recordAnomalies(userId, anomalies, ipAddress, userAgent);
        await this.sendSecurityAlerts(userId, anomalies);
      }

      // Update user's last login info - disabled (fields don't exist in User model)
      // TODO: Add lastLoginAt and lastLoginIp fields to User model

      return anomalies;
    } catch (error) {
      console.error('Login pattern analysis error:', error);
      return [];
    }
  }

  // Get recent failed OTP attempts for a user
  async getRecentFailedOTPs(userId, minutesBack) {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);

    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
        action: { in: ['OTP_FAILED_INVALID', 'OTP_FAILED_EXPIRED'] },
        createdAt: { gte: cutoff }
      },
      orderBy: { createdAt: 'desc' }
    });

    return logs.map(log => ({
      ipAddress: log.ipAddress,
      timestamp: log.createdAt
    }));
  }

  // Get recent failed login attempts for a user
  async getRecentFailedLogins(userId, minutesBack) {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);

    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
        action: { in: ['LOGIN_FAILED', 'LOGIN_ATTEMPT'] },
        createdAt: { gte: cutoff }
      },
      orderBy: { createdAt: 'desc' }
    });

    return logs.map(log => ({
      ipAddress: log.ipAddress,
      timestamp: log.createdAt
    }));
  }

  // Get recent successful logins for a user
  async getRecentLogins(userId, minutesBack) {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);

    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
        action: 'LOGIN_SUCCESS',
        createdAt: { gte: cutoff }
      },
      orderBy: { createdAt: 'desc' }
    });

    return logs;
  }

  // Get user's recent activity (last N hours)
  async getUserRecentActivity(userId, hoursBack) {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const activities = await prisma.activityLog.findMany({
      where: {
        userId,
        createdAt: { gte: cutoff }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50 activities
    });

    return activities.map(activity => ({
      action: activity.action,
      timestamp: activity.createdAt,
      ipAddress: activity.ipAddress,
      details: activity.details
    }));
  }

  // Use AI service for advanced anomaly detection
  async analyzeWithAI(userData) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/anomaly/detect`, {
        user_id: userData.userId,
        user_email: userData.userEmail,
        user_role: userData.userRole,
        ip_address: userData.ipAddress,
        user_agent: userData.userAgent,
        login_success: userData.success,
        timestamp: userData.timestamp,
        recent_activity: userData.recentActivity,
        analysis_type: 'security'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('AI anomaly detection error:', error.message);
      // Return empty result if AI service is unavailable
      return { anomalies: [] };
    }
  }

  // Record detected anomalies in database
  async recordAnomalies(userId, anomalies, ipAddress, userAgent) {
    try {
      // Filter out anomalies with types that don't exist in enum
      const validAnomalies = anomalies.filter(anomaly => {
        const validTypes = ['FAILED_LOGIN', 'MULTIPLE_FAILED_LOGINS', 'SUSPICIOUS_LOCATION', 'UNUSUAL_ACCESS_TIME', 'API_ABUSE', 'BRUTE_FORCE', 'RATE_LIMIT_EXCEEDED'];
        return validTypes.includes(anomaly.type);
      });

      if (validAnomalies.length === 0) return;

      const records = validAnomalies.map(anomaly => ({
        userId,
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        ipAddress,
        userAgent,
        metadata: anomaly.metadata
      }));

      await prisma.securityAnomaly.createMany({
        data: records
      });

      console.log(`📊 Recorded ${validAnomalies.length} security anomalies for user ${userId}`);
    } catch (error) {
      console.error('Failed to record anomalies:', error);
    }
  }

  // Send security alerts to relevant parties
  async sendSecurityAlerts(userId, anomalies) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email, name, role }
      });

      // Log high severity anomalies
      const highSeverityAnomalies = anomalies.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');

      if (highSeverityAnomalies.length > 0) {
        console.log(`🚨 HIGH SEVERITY SECURITY ALERT for ${user.email}:`);
        highSeverityAnomalies.forEach(anomaly => {
          console.log(`   - ${anomaly.type}: ${anomaly.description}`);
        });

        // In production, send actual alerts (email, SMS, Slack, etc.)
        await this.logSecurityAlert(user, highSeverityAnomalies);
      }
    } catch (error) {
      console.error('Failed to send security alerts:', error);
    }
  }

  // Log security alerts for audit trail
  async logSecurityAlert(user, anomalies) {
    const activityLogger = require('./activityLogger');

    for (const anomaly of anomalies) {
      await activityLogger.log(
        `SECURITY_ALERT: ${anomaly.type}`,
        user.id,
        {
          userEmail: user.email,
          severity: anomaly.severity,
          description: anomaly.description,
          anomalyMetadata: anomaly.metadata
        },
        null // IP address is not available in this context
      );
    }
  }

  // Get unresolved anomalies for dashboard
  async getUnresolvedAnomalies(limit = 100) {
    try {
      const anomalies = await prisma.securityAnomaly.findMany({
        where: { resolved: false },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return anomalies;
    } catch (error) {
      console.error('Failed to get unresolved anomalies:', error);
      return [];
    }
  }

  // Mark anomaly as resolved
  async resolveAnomaly(anomalyId, resolvedBy) {
    try {
      await prisma.securityAnomaly.update({
        where: { id: anomalyId },
        data: {
          resolved: true,
          resolvedAt: new Date()
        }
      });

      // Log the resolution
      const activityLogger = require('./activityLogger');
      await activityLogger.log(
        'ANOMALY_RESOLVED',
        resolvedBy,
        {
          resolutionType: 'SECURITY_RESOLUTION',
          resourceId: anomalyId,
          severity: 'INFO',
        },
        null // IP address is not available in this context
      );

      return true;
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
      return false;
    }
  }
}

module.exports = new SecurityAnomalyDetection();