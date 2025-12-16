const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const { rateLimiters } = require('../../middleware/rateLimiter');
const securityAnomalyDetection = require('../../services/securityAnomalyDetection');
const activityLogger = require('../../services/activityLogger');
const { prisma } = require('../../config/database');

const router = express.Router();

// All security monitoring routes require admin authentication
router.use(protect);
router.use(authorize('ADMIN'));

// Apply rate limiting specifically for admin monitoring
router.use('/dashboard', rateLimiters.admin);
router.use('/anomalies', rateLimiters.admin);
router.use('/activity', rateLimiters.admin);

/**
 * @swagger
 * /api/security-monitoring/dashboard:
 *   get:
 *     summary: Get security dashboard overview statistics
 *     tags: [Security Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security dashboard data retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/dashboard', async (req, res) => {
  try {
    const daysBack = parseInt(req.query.days) || 30;
    
    // Get comprehensive security statistics
    const [
      securityStats,
      activityStats,
      userStats,
      systemStats
    ] = await Promise.all([
      securityAnomalyDetection.getSecurityStatistics(daysBack),
      getActivityStatistics(daysBack),
      getUserSecurityStats(daysBack),
      getSystemSecurityStats(daysBack)
    ]);

    // Get recent critical security events
    const recentCriticalEvents = await prisma.activityLog.findMany({
      where: {
        action: {
          in: [
            'SECURITY_ALERT',
            'MULTIPLE_FAILED_LOGINS',
            'SUSPICIOUS_LOCATION',
            'BRUTE_FORCE_ATTEMPT',
            'ANOMALY_DETECTED'
          ]
        },
        createdAt: {
          gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        }
      },
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
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get top threat sources (IP addresses)
    const threatSources = await getTopThreatSources(daysBack);

    // Get security trends over time
    const securityTrends = await getSecurityTrends(daysBack);

    const dashboardData = {
      summary: {
        totalAnomalies: securityStats?.totalAnomalies || 0,
        unresolvedAnomalies: securityStats?.unresolvedAnomalies || 0,
        resolutionRate: securityStats?.resolutionRate || 0,
        highSeverityCount: securityStats?.highSeverityAnomalies || 0
      },
      statistics: {
        security: securityStats,
        activity: activityStats,
        users: userStats,
        system: systemStats
      },
      recentEvents: recentCriticalEvents,
      threatSources,
      trends: securityTrends,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Security dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security dashboard data',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/security-monitoring/anomalies:
 *   get:
 *     summary: Get security anomalies with filtering and pagination
 *     tags: [Security Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: resolved
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Security anomalies retrieved successfully
 */
router.get('/anomalies', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const { severity, type, resolved } = req.query;

    // Build where clause
    const whereClause = {};
    if (severity) whereClause.severity = severity;
    if (type) whereClause.type = type;
    if (resolved !== undefined) whereClause.resolved = resolved === 'true';

    // Get anomalies with pagination
    const [anomalies, totalCount] = await Promise.all([
      prisma.securityAnomaly.findMany({
        where: whereClause,
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
        skip,
        take: limit
      }),
      prisma.securityAnomaly.count({ where: whereClause })
    ]);

    // Get statistics for the filtered results
    const stats = await prisma.securityAnomaly.groupBy({
      by: ['type', 'severity'],
      where: whereClause,
      _count: { type: true }
    });

    res.status(200).json({
      success: true,
      message: 'Security anomalies retrieved successfully',
      data: {
        anomalies,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security anomalies',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/security-monitoring/anomalies/{id}/resolve:
 *   post:
 *     summary: Mark a security anomaly as resolved
 *     tags: [Security Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution:
 *                 type: string
 *                 description: Resolution notes
 *     responses:
 *       200:
 *         description: Anomaly marked as resolved
 */
router.post('/anomalies/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const adminId = req.user.id;

    const success = await securityAnomalyDetection.resolveAnomaly(id, adminId);
    
    if (success) {
      // Log the resolution action
      await activityLogger.log(
        'ANOMALY_RESOLVED',
        adminId,
        {
          type: 'SECURITY_MONITORING',
          resourceId: id,
          resolution: resolution,
          severity: 'INFO'
        },
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Anomaly marked as resolved'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Anomaly not found'
      });
    }
  } catch (error) {
    console.error('Resolve anomaly error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve anomaly',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/security-monitoring/activity:
 *   get:
 *     summary: Get security-related activity logs
 *     tags: [Security Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 */
router.get('/activity', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const days = parseInt(req.query.days) || 7;
    
    const { action, userId } = req.query;

    // Build where clause
    const whereClause = {
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    };
    
    if (action) whereClause.action = action;
    if (userId) whereClause.userId = userId;

    // Get activity logs
    const [activities, totalCount] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereClause,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.activityLog.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      message: 'Activity logs retrieved successfully',
      data: {
        activities,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/security-monitoring/realtime:
 *   get:
 *     summary: Get real-time security updates
 *     tags: [Security Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time security data
 */
router.get('/realtime', async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get real-time statistics
    const [
      recentAnomalies,
      recentLogins,
      activeThreats,
      systemHealth
    ] = await Promise.all([
      // Recent security anomalies
      prisma.securityAnomaly.count({
        where: {
          createdAt: { gte: last24Hours },
          resolved: false
        }
      }),
      
      // Recent login attempts (success and failure)
      prisma.activityLog.count({
        where: {
          action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] },
          createdAt: { gte: last24Hours }
        }
      }),
      
      // Active high-severity threats
      prisma.securityAnomaly.count({
        where: {
          severity: { in: ['HIGH', 'CRITICAL'] },
          resolved: false,
          createdAt: { gte: last24Hours }
        }
      }),
      
      // System health indicators
      {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    ]);

    // Get hourly breakdown of activities for the last 24 hours
    const hourlyActivity = await getHourlyActivity(last24Hours);

    const realtimeData = {
      metrics: {
        recentAnomalies,
        recentLogins,
        activeThreats,
        systemHealth
      },
      hourlyActivity,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Real-time security data retrieved successfully',
      data: realtimeData
    });
  } catch (error) {
    console.error('Real-time security data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve real-time security data',
      error: error.message
    });
  }
});

// Helper functions
async function getActivityStatistics(daysBack) {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  const activities = await prisma.activityLog.groupBy({
    by: ['action'],
    where: { createdAt: { gte: cutoff } },
    _count: { action: true },
    orderBy: { _count: { action: 'desc' } }
  });

  return {
    totalActivities: await prisma.activityLog.count({ where: { createdAt: { gte: cutoff } } }),
    activitiesByType: activities.map(item => ({
      action: item.action,
      count: item._count.action
    }))
  };
}

async function getUserSecurityStats(daysBack) {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  return {
    totalUsers: await prisma.user.count(),
    activeUsers: await prisma.user.count({
      where: {
        lastLoginAt: { gte: cutoff }
      }
    }),
    usersWithMFA: await prisma.user.count({
      where: { mfaEnabled: true }
    }),
    flaggedUsers: await prisma.securityAnomaly.count({
      where: {
        createdAt: { gte: cutoff },
        resolved: false
      },
      distinct: ['userId']
    })
  };
}

async function getSystemSecurityStats(daysBack) {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  return {
    totalRequests: await prisma.activityLog.count({
      where: {
        action: { startsWith: 'API_' },
        createdAt: { gte: cutoff }
      }
    }),
    failedRequests: await prisma.activityLog.count({
      where: {
        action: 'API_ERROR',
        createdAt: { gte: cutoff }
      }
    }),
    rateLimitHits: await prisma.activityLog.count({
      where: {
        action: 'RATE_LIMIT_EXCEEDED',
        createdAt: { gte: cutoff }
      }
    })
  };
}

async function getTopThreatSources(daysBack) {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  const threatSources = await prisma.activityLog.groupBy({
    by: ['ipAddress'],
    where: {
      createdAt: { gte: cutoff },
      action: { in: ['LOGIN_FAILED', 'SECURITY_ALERT', 'ANOMALY_DETECTED'] },
      ipAddress: { not: null }
    },
    _count: { ipAddress: true },
    orderBy: { _count: { ipAddress: 'desc' } },
    take: 10
  });

  return threatSources.map(source => ({
    ipAddress: source.ipAddress,
    threatCount: source._count.ipAddress
  }));
}

async function getSecurityTrends(daysBack) {
  const trends = [];
  const now = new Date();
  
  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    
    const [anomalies, loginAttempts, threats] = await Promise.all([
      prisma.securityAnomaly.count({
        where: {
          createdAt: { gte: date, lt: nextDate }
        }
      }),
      prisma.activityLog.count({
        where: {
          action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] },
          createdAt: { gte: date, lt: nextDate }
        }
      }),
      prisma.securityAnomaly.count({
        where: {
          severity: { in: ['HIGH', 'CRITICAL'] },
          createdAt: { gte: date, lt: nextDate }
        }
      })
    ]);

    trends.push({
      date: date.toISOString().split('T')[0],
      anomalies,
      loginAttempts,
      threats
    });
  }
  
  return trends;
}

async function getHourlyActivity(since) {
  const hourlyData = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const nextHour = new Date(hour.getTime() + 60 * 60 * 1000);
    
    const [logins, anomalies] = await Promise.all([
      prisma.activityLog.count({
        where: {
          action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] },
          createdAt: { gte: hour, lt: nextHour }
        }
      }),
      prisma.securityAnomaly.count({
        where: {
          createdAt: { gte: hour, lt: nextHour }
        }
      })
    ]);

    hourlyData.push({
      hour: hour.getHours(),
      logins,
      anomalies
    });
  }
  
  return hourlyData;
}

module.exports = router;