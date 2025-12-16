const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../../middleware/upload');
const propertiesController = require('./properties.controller');
const propertyViewsController = require('../propertyViews/propertyViews.controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Property:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated UUID of the property
 *         code:
 *           type: string
 *           description: The unique code of the property
 *         title:
 *           type: string
 *           description: The title of the property
 *         description:
 *           type: string
 *           description: The description of the property
 *         address:
 *           type: string
 *           description: The address of the property
 *         city:
 *           type: string
 *           description: The city where the property is located
 *         state:
 *           type: string
 *           description: The state where the property is located
 *         country:
 *           type: string
 *           description: The country where the property is located
 *         zipCode:
 *           type: string
 *           description: The zip code of the property
 *         price:
 *           type: number
 *           format: decimal
 *           description: The monthly rent price
 *         currencyCode:
 *           type: string
 *           description: Currency code (e.g., MYR, USD)
 *         bedrooms:
 *           type: integer
 *           description: Number of bedrooms
 *         bathrooms:
 *           type: integer
 *           description: Number of bathrooms
 *         areaSqm:
 *           type: number
 *           format: float
 *           description: Area in square meters
 *         furnished:
 *           type: boolean
 *           description: Whether the property is furnished
 *         isAvailable:
 *           type: boolean
 *           description: Whether the property is available for rent
 *         status:
 *           type: string
 *           enum: [PENDING_REVIEW, APPROVED, REJECTED]
 *           description: The listing status
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         viewCount:
 *           type: integer
 *           description: Total number of times this property has been viewed
 *         averageRating:
 *           type: number
 *           format: float
 *           description: Average rating from user reviews (0-5)
 *         totalRatings:
 *           type: integer
 *           description: Total number of ratings/reviews for this property
 *         isFavorited:
 *           type: boolean
 *           description: Whether the current user has favorited this property
 *         favoriteCount:
 *           type: integer
 *           description: Total number of users who have favorited this property
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the property was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the property was last updated
 *
 * /api/properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: List of properties
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Property created successfully
 *       401:
 *         description: Unauthorized
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 *   put:
 *     summary: Update property by ID
 *     tags: [Properties]
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
 *         description: Property updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 *   delete:
 *     summary: Delete property by ID
 *     tags: [Properties]
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
 *         description: Property deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 * /api/properties/my-properties:
 *   get:
 *     summary: Get properties owned by the authenticated user
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's properties retrieved successfully
 *       401:
 *         description: Unauthorized
 * /api/properties/favorites:
 *   get:
 *     summary: Get user's favorite properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's favorite properties
 *       401:
 *         description: Authentication required
 * /api/properties/featured:
 *   get:
 *     summary: Get featured properties
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: List of featured properties
 * /api/properties/property/{code}:
 *   get:
 *     summary: Get property by code/slug
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 * /api/properties.geojson:
 *   get:
 *     summary: Get property data in GeoJSON format
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of properties
 * /api/properties/{id}/view:
 *   post:
 *     summary: Log property view for analytics
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: View logged successfully
 *       404:
 *         description: Property not found
 * /api/properties/{id}/favorite:
 *   post:
 *     summary: Toggle property favorite status
 *     tags: [Properties]
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
 *         description: Favorite status toggled successfully
 *       401:
 *         description: Authentication required
 * /api/properties/{id}/favorite-status:
 *   get:
 *     summary: Get property favorite status for current user
 *     tags: [Properties]
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
 *         description: Property favorite status
 *       401:
 *         description: Authentication required
 * /api/properties/{id}/favorite-stats:
 *   get:
 *     summary: Get property favorite statistics
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property favorite statistics
 * /api/properties/{id}/rating:
 *   post:
 *     summary: Create or update property rating
 *     tags: [Properties]
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
 *         description: Rating submitted successfully
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete user's rating for property
 *     tags: [Properties]
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
 *         description: Rating deleted successfully
 *       401:
 *         description: Unauthorized
 * /api/properties/{id}/ratings:
 *   get:
 *     summary: Get property ratings with pagination
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property ratings with pagination
 * /api/properties/{id}/my-rating:
 *   get:
 *     summary: Get current user's rating for property
 *     tags: [Properties]
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
 *         description: User's rating for the property
 *       401:
 *         description: Unauthorized
 * /api/properties/{id}/rating-stats:
 *   get:
 *     summary: Get detailed rating statistics for property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed rating statistics
 * /api/properties/{id}/view-stats:
 *   get:
 *     summary: Get property view statistics
 *     tags: [Properties]
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
 *         description: Property view statistics
 *       401:
 *         description: Unauthorized
 * /api/properties/{id}/approve:
 *   post:
 *     summary: Approve a property (Admin only)
 *     tags: [Properties]
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
 *         description: Property approved successfully
 *       403:
 *         description: Forbidden - Admin access required
 * /api/properties/{id}/reject:
 *   post:
 *     summary: Reject a property (Admin only)
 *     tags: [Properties]
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
 *         description: Property rejected successfully
 *       403:
 *         description: Forbidden - Admin access required
 * /api/properties/{id}/approval-history:
 *   get:
 *     summary: Get approval history for a property
 *     tags: [Properties]
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
 *         description: Approval history retrieved successfully
 * /api/properties/pending-approval:
 *   get:
 *     summary: Get properties pending approval (Admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Properties pending approval
 *       403:
 *         description: Forbidden - Admin access required
 * /api/properties/auto-approve/toggle:
 *   post:
 *     summary: Toggle property auto-approve status (Admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auto-approve status updated successfully
 *       403:
 *         description: Forbidden - Admin access required
 * /api/properties/auto-approve/status:
 *   get:
 *     summary: Get property auto-approve status
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auto-approve status retrieved successfully
 * /api/properties/fix-approval-inconsistency:
 *   post:
 *     summary: Fix approval data inconsistency (Admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data inconsistency fixed successfully
 *       403:
 *         description: Forbidden - Admin access required
 */

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property management API
 */

// ==========================================
// 🔓 PUBLIC ROUTES (Specific Routes FIRST)
// ==========================================
router.get('/', propertiesController.getAllProperties);
router.get('/featured', propertiesController.getFeaturedProperties);
router.get('/property/:code', propertiesController.getPropertyByCode);
router.get('/geojson', propertiesController.getGeoJSON);

// ==========================================
// 🔐 PROTECTED ROUTES (Specific Routes FIRST)
// ==========================================

// --- FIX: Move these ABOVE '/:id' so they don't get caught as IDs ---
router.get('/favorites', protect, propertyViewsController.getUserFavorites);
router.get('/my-properties', protect, propertiesController.getMyProperties);
// --------------------------------------------------------------------

// Other User Actions
router.get('/:id/my-rating', protect, propertyViewsController.getUserRating);
router.get(
  '/:id/favorite-status',
  protect,
  propertyViewsController.getFavoriteStatus
);
router.get('/:id/ratings', propertyViewsController.getPropertyRatings);
router.get('/:id/rating-stats', propertyViewsController.getRatingStats);
router.get('/:id/favorite-stats', propertyViewsController.getFavoriteStats);

// ==========================================
// 🔐 ADMIN / ANALYTICS / ACTIONS (Must be BEFORE generic :id)
// ==========================================

// Admin approval endpoints
router.get(
  '/pending-approval',
  protect,
  authorize('ADMIN'),
  propertiesController.getPendingApprovals
);

// ==========================================
// 🆔 GENERIC ID ROUTE (Must be LAST)
// ==========================================
router.get('/:id', propertiesController.getPropertyById);

// Create Property
router.post(
  '/',
  protect,
  authorize('USER', 'ADMIN', 'LANDLORD'),
  uploadMultiple('images', 5),
  [
    body('title').notEmpty().trim(),
    body('address').notEmpty().trim(),
    body('price').isFloat({ min: 0 }),
    body('propertyTypeId').notEmpty().isString(),
  ],
  propertiesController.createProperty,
  handleUploadError
);

// Update Property
router.put(
  '/:id',
  protect,
  authorize('USER', 'ADMIN', 'LANDLORD'),
  uploadMultiple('images', 5),
  propertiesController.updateProperty,
  handleUploadError
);

// Delete Property
router.delete(
  '/:id',
  protect,
  authorize('USER', 'ADMIN', 'LANDLORD'),
  propertiesController.deleteProperty
);

// Interactions
router.post('/:id/view', propertyViewsController.logView);
router.post('/:id/favorite', protect, propertyViewsController.toggleFavorite);

router.post(
  '/:id/rating',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim().isLength({ max: 1000 }),
  ],
  propertyViewsController.createOrUpdateRating
);

router.delete('/:id/rating', protect, propertyViewsController.deleteRating);

// View Stats
router.get(
  '/:id/view-stats',
  protect,
  authorize('USER', 'ADMIN', 'LANDLORD'),
  propertyViewsController.getViewStats
);

// Admin Actions
router.post(
  '/:id/approve',
  protect,
  authorize('ADMIN'),
  propertiesController.approveProperty
);

router.post(
  '/:id/reject',
  protect,
  authorize('ADMIN'),
  propertiesController.rejectProperty
);

router.get(
  '/:id/approval-history',
  protect,
  propertiesController.getApprovalHistory
);

// Auto-Approve Settings
router.post(
  '/auto-approve/toggle',
  protect,
  authorize('ADMIN'),
  propertiesController.togglePropertyAutoApprove
);

router.get(
  '/auto-approve/status',
  protect,
  propertiesController.getPropertyAutoApproveStatus
);

router.post(
  '/fix-approval-inconsistency',
  protect,
  authorize('ADMIN'),
  propertiesController.fixApprovalDataInconsistency
);

module.exports = router;
