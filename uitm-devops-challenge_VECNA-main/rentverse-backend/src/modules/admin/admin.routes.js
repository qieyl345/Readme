const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect, authorize } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations
 */

/**
 * @swagger
 * /api/admin/activity-logs:
 *   get:
 *     summary: Retrieve activity logs
 *     description: Fetches a paginated list of all activity logs. Requires ADMIN role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of logs per page.
 *     responses:
 *       '200':
 *         description: A list of activity logs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityLog'
 *                 pagination:
 *                   type: object
 *       '401':
 *         description: Not authorized
 *       '403':
 *         description: Forbidden (role is not ADMIN)
 *       '500':
 *         description: Internal server error
 */
router.get(
  '/activity-logs',
  protect,
  authorize('ADMIN'),
  adminController.getActivityLogs
);

module.exports = router;
