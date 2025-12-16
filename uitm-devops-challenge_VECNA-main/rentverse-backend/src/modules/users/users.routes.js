const express = require('express');
const { body } = require('express-validator');
// Correctly import 'protect' from middleware
const { protect, authorize } = require('../../middleware/auth');
const usersController = require('./users.controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated UUID of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *         firstName:
 *           type: string
 *           description: The first name of the user
 *         lastName:
 *           type: string
 *           description: The last name of the user
 *         name:
 *           type: string
 *           description: The computed full name of the user
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: The date of birth of the user
 *         phone:
 *           type: string
 *           description: The phone number of the user
 *         profilePicture:
 *           type: string
 *           description: URL of the user's profile picture
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, LANDLORD]
 *           description: The role of the user
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 *
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

// ==========================================
// 🔓 PUBLIC ROUTES
// ==========================================
// None (All user management requires login)

// ==========================================
// 🔐 PROTECTED ROUTES (Must be Logged In)
// ==========================================

// Get own profile
router.get('/profile', protect, usersController.getProfile);

// Update own profile
router.patch(
  '/profile',
  protect,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('phone').optional().trim(),
    body('profilePicture').optional().isURL(),
  ],
  usersController.updateProfile
);

// ==========================================
// 🛡️ ADMIN ONLY ROUTES
// ==========================================

// Create User (Admin)
router.post(
  '/',
  protect,
  authorize('ADMIN'),
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['USER', 'ADMIN']),
  ],
  usersController.createUser
);

// Get All Users (Admin)
router.get('/', protect, authorize('ADMIN'), usersController.getAllUsers);

// Delete User (Admin)
router.delete('/:id', protect, authorize('ADMIN'), usersController.deleteUser);

// ==========================================
// 🔐 GENERIC ID ROUTES (Must be last)
// ==========================================

// Get User by ID
router.get('/:id', protect, usersController.getUserById);

// Update User by ID
router.patch(
  '/:id',
  protect,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('role').optional().isIn(['USER', 'ADMIN']),
    body('isActive').optional().isBoolean(),
  ],
  usersController.updateUser
);

module.exports = router;
