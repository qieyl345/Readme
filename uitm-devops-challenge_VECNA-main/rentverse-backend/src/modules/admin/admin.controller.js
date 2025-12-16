const adminService = require('./admin.service');

/**
 * Controller to handle fetching activity logs.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const getActivityLogs = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getActivityLogs({ page, limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActivityLogs,
};
