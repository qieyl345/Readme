const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../../middleware/auth');
const userSettingsController = require('./userSettings.controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated UUID of the user settings
 *         userId:
 *           type: string
 *           description: The user ID associated with these settings
 *         language:
 *           type: string
 *           description: User's preferred language
 *         currency:
 *           type: string
 *           description: User's preferred currency
 *         timezone:
 *           type: string
 *           description: User's preferred timezone
 *         notifications:
 *           type: object
 *           description: User's notification preferences
 *         privacy:
 *           type: object
 *           description: User's privacy settings
 *         preferences:
 *           type: object
 *           description: User's general preferences
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the settings were created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the settings were last updated
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         userId: "456e7890-e89b-12d3-a456-426614174000"
 *         language: "en"
 *         currency: "MYR"
 *         timezone: "Asia/Kuala_Lumpur"
 *         notifications: {"email": true, "push": false, "sms": true}
 *         privacy: {"profileVisibility": "private", "showOnlineStatus": false}
 *         preferences: {"theme": "light", "units": "metric"}
 *         createdAt: "2025-10-01T16:09:59.265Z"
 *         updatedAt: "2025-10-01T17:15:08.168Z"
 *         user:
 *           id: "456e7890-e89b-12d3-a456-426614174000"
 *           name: "John Doe"
 *           email: "john@example.com"
 *           role: "USER"
 */

/**
 * @swagger
 * tags:
 *   name: UserSettings
 *   description: User settings management API
 */

/**
 * @swagger
 * /api/user-settings/me:
 *   get:
 *     summary: Get current user's settings
 *     tags: [UserSettings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User settings not found
 */
router.get('/me', protect, userSettingsController.getCurrentUserSettings);

/**
 * @swagger
 * /api/user-settings/me:
 *   put:
 *     summary: Update current user's settings
 *     tags: [UserSettings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 description: User's preferred language
 *               currency:
 *                 type: string
 *                 description: User's preferred currency
 *               timezone:
 *                 type: string
 *                 description: User's preferred timezone
 *               notifications:
 *                 type: object
 *                 description: User's notification preferences
 *               privacy:
 *                 type: object
 *                 description: User's privacy settings
 *               preferences:
 *                 type: object
 *                 description: User's general preferences
 *           example:
 *             language: "en"
 *             currency: "MYR"
 *             timezone: "Asia/Kuala_Lumpur"
 *             notifications: {"email": true, "push": false, "sms": true}
 *             privacy: {"profileVisibility": "private", "showOnlineStatus": false}
 *             preferences: {"theme": "dark", "units": "metric"}
 *     responses:
 *       200:
 *         description: User settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/me',
  protect,
  [
    body('language')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Language must be at most 10 characters'),
    body('currency')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Currency must be at most 10 characters'),
    body('timezone')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Timezone must be at most 50 characters'),
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    body('privacy')
      .optional()
      .isObject()
      .withMessage('Privacy must be an object'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
  ],
  userSettingsController.updateCurrentUserSettings
);

/**
 * @swagger
 * /api/user-settings/{userId}:
 *   get:
 *     summary: Get user settings by user ID (admin only)
 *     tags: [UserSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: User settings not found
 */
router.get('/:userId', protect, userSettingsController.getByUserId);

/**
 * @swagger
 * /api/user-settings:
 *   post:
 *     summary: Create user settings (admin only)
 *     tags: [UserSettings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID for whom to create settings
 *               language:
 *                 type: string
 *                 description: User's preferred language
 *               currency:
 *                 type: string
 *                 description: User's preferred currency
 *               timezone:
 *                 type: string
 *                 description: User's preferred timezone
 *               notifications:
 *                 type: object
 *                 description: User's notification preferences
 *               privacy:
 *                 type: object
 *                 description: User's privacy settings
 *               preferences:
 *                 type: object
 *                 description: User's general preferences
 *           example:
 *             userId: "456e7890-e89b-12d3-a456-426614174000"
 *             language: "en"
 *             currency: "MYR"
 *             timezone: "Asia/Kuala_Lumpur"
 *             notifications: {"email": true, "push": false, "sms": true}
 *             privacy: {"profileVisibility": "private", "showOnlineStatus": false}
 *             preferences: {"theme": "light", "units": "metric"}
 *     responses:
 *       201:
 *         description: User settings created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post(
  '/',
  protect,
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    body('language')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Language must be at most 10 characters'),
    body('currency')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Currency must be at most 10 characters'),
    body('timezone')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Timezone must be at most 50 characters'),
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    body('privacy')
      .optional()
      .isObject()
      .withMessage('Privacy must be an object'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
  ],
  userSettingsController.create
);

/**
 * @swagger
 * /api/user-settings/{userId}:
 *   put:
 *     summary: Update user settings by user ID (admin only)
 *     tags: [UserSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 description: User's preferred language
 *               currency:
 *                 type: string
 *                 description: User's preferred currency
 *               timezone:
 *                 type: string
 *                 description: User's preferred timezone
 *               notifications:
 *                 type: object
 *                 description: User's notification preferences
 *               privacy:
 *                 type: object
 *                 description: User's privacy settings
 *               preferences:
 *                 type: object
 *                 description: User's general preferences
 *           example:
 *             language: "en"
 *             currency: "MYR"
 *             timezone: "Asia/Kuala_Lumpur"
 *             notifications: {"email": true, "push": false, "sms": true}
 *             privacy: {"profileVisibility": "private", "showOnlineStatus": false}
 *             preferences: {"theme": "dark", "units": "metric"}
 *     responses:
 *       200:
 *         description: User settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: User settings not found
 */
router.put(
  '/:userId',
  protect,
  [
    body('language')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Language must be at most 10 characters'),
    body('currency')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Currency must be at most 10 characters'),
    body('timezone')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Timezone must be at most 50 characters'),
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    body('privacy')
      .optional()
      .isObject()
      .withMessage('Privacy must be an object'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
  ],
  userSettingsController.update
);

/**
 * @swagger
 * /api/user-settings/{userId}:
 *   delete:
 *     summary: Delete user settings by user ID (admin only)
 *     tags: [UserSettings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User settings deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: User settings not found
 */
router.delete('/:userId', protect, userSettingsController.delete);

module.exports = router;