const { prisma } = require('../../config/database');

/**
 * Fetches activity logs from the database with pagination.
 * @param {object} options - Pagination options { page, limit }.
 * @returns {Promise<object>} A promise that resolves to the logs and pagination info.
 */
const getActivityLogs = async ({ page = 1, limit = 20 }) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        skip: skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.activityLog.count(),
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw new Error('Could not retrieve activity logs.');
  }
};

module.exports = {
  getActivityLogs,
};
