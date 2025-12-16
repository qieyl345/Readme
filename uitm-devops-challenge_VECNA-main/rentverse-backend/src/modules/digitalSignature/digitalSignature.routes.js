const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../../middleware/auth');
const digitalSignatureValidation = require('../../services/digitalSignatureValidation');
const { rateLimiters } = require('../../middleware/rateLimiter');

const router = express.Router();

// All digital signature routes require authentication
router.use(protect);

// Apply rate limiting specifically for signature operations
router.use('/validate', rateLimiters.otp); // Very strict rate limiting for signature validation
router.use('/generate', rateLimiters.login);
router.use('/history', rateLimiters.general);

/**
 * @swagger
 * /api/digital-signature/generate:
 *   post:
 *     summary: Generate secure digital signature for document
 *     tags: [Digital Signature]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *               - documentHash
 *             properties:
 *               documentId:
 *                 type: string
 *                 description: ID of the document to be signed
 *               documentHash:
 *                 type: string
 *                 description: SHA-256 hash of the document content
 *     responses:
 *       200:
 *         description: Signature generated successfully
 *       400:
 *         description: Invalid input or access denied
 *       401:
 *         description: Authentication required
 */
router.post(
  '/generate',
  [
    body('documentId').isUUID().withMessage('Valid document ID is required'),
    body('documentHash').isLength({ min: 64, max: 64 }).withMessage('Valid document hash is required')
  ],
  async (req, res) => {
    try {
      const { documentId, documentHash } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Generate secure signature payload
      const signatureData = digitalSignatureValidation.generateSignaturePayload(
        documentId,
        userId,
        userRole,
        documentHash
      );

      // Record the signature attempt
      const signatureRecord = await digitalSignatureValidation.recordSignatureAttempt(
        signatureData.signature,
        documentId,
        userId,
        req.ip,
        req.get('User-Agent')
      );

      res.status(200).json({
        success: true,
        message: 'Digital signature generated successfully',
        data: {
          signature: signatureData.signature,
          expiresAt: signatureData.expiresAt,
          signatureId: signatureRecord.id,
          nonce: signatureData.payload.nonce
        }
      });
    } catch (error) {
      console.error('Digital signature generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate digital signature',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/digital-signature/validate:
 *   post:
 *     summary: Validate digital signature and record signing action
 *     tags: [Digital Signature]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *               - documentId
 *             properties:
 *               signature:
 *                 type: string
 *                 description: The digital signature to validate
 *               documentId:
 *                 type: string
 *                 description: ID of the document being signed
 *               action:
 *                 type: string
 *                 enum: ['SIGN', 'REJECT']
 *                 default: 'SIGN'
 *     responses:
 *       200:
 *         description: Signature validated and action recorded
 *       400:
 *         description: Invalid signature or signature expired
 *       401:
 *         description: Authentication required
 */
router.post(
  '/validate',
  [
    body('signature').notEmpty().withMessage('Signature is required'),
    body('documentId').isUUID().withMessage('Valid document ID is required'),
    body('action').optional().isIn(['SIGN', 'REJECT']).withMessage('Invalid action')
  ],
  async (req, res) => {
    try {
      const { signature, documentId, action = 'SIGN' } = req.body;
      const userId = req.user.id;

      // Validate the signature
      const validationResult = await digitalSignatureValidation.validateSignature(
        signature,
        documentId,
        userId
      );

      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Signature validation failed',
          error: validationResult.error
        });
      }

      // Record the signature attempt
      const signatureRecord = await digitalSignatureValidation.recordSignatureAttempt(
        signature,
        documentId,
        userId,
        req.ip,
        req.get('User-Agent')
      );

      // Update signature status based on action
      const newStatus = action === 'SIGN' ? 'SIGNED' : 'REJECTED';
      await digitalSignatureValidation.updateSignatureStatus(
        signatureRecord.id,
        newStatus,
        {
          metadata: {
            validatedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            action: action
          }
        }
      );

      // If signing, also update the rental agreement
      if (action === 'SIGN') {
        const { prisma } = require('../../config/database');
        await prisma.rentalAgreement.update({
          where: { id: documentId },
          data: {
            digitalSignature: signature,
            signedAt: new Date()
          }
        });
      }

      res.status(200).json({
        success: true,
        message: `Document ${action.toLowerCase()}ed successfully`,
        data: {
          signatureId: signatureRecord.id,
          status: newStatus,
          validatedAt: new Date(),
          documentId: documentId
        }
      });
    } catch (error) {
      console.error('Digital signature validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate digital signature',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/digital-signature/history/{documentId}:
 *   get:
 *     summary: Get signature history for a document
 *     tags: [Digital Signature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signature history retrieved successfully
 *       404:
 *         description: Document not found
 *       401:
 *         description: Authentication required
 */
router.get('/history/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    // Check if user has permission to view this document's signature history
    const { prisma } = require('../../config/database');
    const document = await prisma.rentalAgreement.findUnique({
      where: { id: documentId },
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
            landlord: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions
    const hasPermission = document.lease.landlordId === userId || 
                         document.lease.tenantId === userId ||
                         req.user.role === 'ADMIN';

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get signature history
    const signatureHistory = await digitalSignatureValidation.getSignatureHistory(documentId);

    res.status(200).json({
      success: true,
      message: 'Signature history retrieved successfully',
      data: signatureHistory
    });
  } catch (error) {
    console.error('Get signature history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve signature history',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/digital-signature/verify-integrity/{documentId}:
 *   post:
 *     summary: Verify document integrity since last signature
 *     tags: [Digital Signature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentHash
 *             properties:
 *               currentHash:
 *                 type: string
 *                 description: Current SHA-256 hash of the document
 *     responses:
 *       200:
 *         description: Document integrity verification completed
 *       404:
 *         description: Document or signature not found
 */
router.post(
  '/verify-integrity/:documentId',
  [
    body('currentHash').isLength({ min: 64, max: 64 }).withMessage('Valid document hash is required')
  ],
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { currentHash } = req.body;

      // Verify document integrity
      const integrityResult = await digitalSignatureValidation.verifyDocumentIntegrity(
        documentId,
        currentHash
      );

      if (!integrityResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Document integrity verification failed',
          error: integrityResult.error
        });
      }

      res.status(200).json({
        success: true,
        message: 'Document integrity verified successfully',
        data: integrityResult
      });
    } catch (error) {
      console.error('Document integrity verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify document integrity',
        error: error.message
      });
    }
  }
);

module.exports = router;