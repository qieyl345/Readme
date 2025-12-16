/**
 * MODULE 3: DIGITAL AGREEMENTS & CONTRACT MANAGEMENT
 *
 * FEATURES:
 * - PDF generation using Puppeteer
 * - Digital signatures with SHA-256 hashing
 * - Contract verification and management
 * - Secure document storage on Cloudinary
 */

const express = require('express');
const { prisma } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Contract:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         leaseId:
 *           type: string
 *         digitalSignature:
 *           type: string
 *         pdfUrl:
 *           type: string
 *         signedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   - name: Contracts
 *     description: Digital agreement and contract management endpoints
 */

// ====================================================================
// CONTRACT GENERATION (MOVED FROM AUTH.JS)
// ====================================================================

/**
 * @swagger
 * /api/contracts/generate:
 *   post:
 *     summary: Generate a rental agreement contract and PDF
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaseId
 *             properties:
 *               leaseId:
 *                 type: string
 *                 description: ID of the lease agreement
 *     responses:
 *       200:
 *         description: Contract generated successfully
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
 *                   type: object
 *                   properties:
 *                     leaseId:
 *                       type: string
 *                     digitalSignature:
 *                       type: string
 *                     pdfUrl:
 *                       type: string
 *                     signedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lease not found
 */
router.post('/generate', protect, async (req, res) => {
  try {
    const { leaseId } = req.body;

    if (!leaseId) {
      return res.status(400).json({
        success: false,
        message: 'Lease ID is required'
      });
    }

    // Find the lease with related data
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          include: {
            owner: true,
            propertyType: true
          }
        },
        tenant: true,
        landlord: true
      }
    });

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: 'Lease not found'
      });
    }

    // Check if user is authorized (must be landlord or tenant)
    if (req.user.id !== lease.landlordId && req.user.id !== lease.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to generate this contract'
      });
    }

    console.log(`📄 Generating contract for Lease ID: ${leaseId}`);

    // Generate and upload PDF
    const pdfService = require('../services/pdfGeneration.service');
    const result = await pdfService.generateAndUploadRentalAgreementPDF(leaseId);

    res.json({
      success: true,
      message: 'Contract generated successfully',
      data: {
        leaseId: leaseId,
        digitalSignature: result.data.digitalSignature,
        pdfUrl: result.data.cloudinary.url,
        signedAt: result.data.rentalAgreement.signedAt,
      },
    });
  } catch (error) {
    console.error('❌ Contract generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/test-generate:
 *   get:
 *     summary: TEST ENDPOINT - Generate contract with test data (for development)
 *     tags: [Contracts]
 *     responses:
 *       200:
 *         description: Test contract generated successfully
 */
router.get('/test-generate', async (req, res) => {
  try {
    console.log('🧪 Starting Contract Generation Test...');

    // Create test owner and tenant
    const owner = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@test.com`,
        password: 'hash',
        firstName: 'Datuk',
        lastName: 'Landlord',
        name: 'Datuk Landlord',
        role: 'LANDLORD',
      },
    });

    const tenant = await prisma.user.create({
      data: {
        email: `tenant-${Date.now()}@test.com`,
        password: 'hash',
        firstName: 'Ali',
        lastName: 'Tenant',
        name: 'Ali Tenant',
        role: 'USER',
      },
    });

    // Create test property type
    const propType = await prisma.propertyType.upsert({
      where: { code: 'TEST_CONDO' },
      update: {},
      create: { code: 'TEST_CONDO', name: 'Test Condominium' },
    });

    // Create test property
    const property = await prisma.property.create({
      data: {
        title: 'Luxury Test Villa',
        address: '1 Hacker Way',
        city: 'Cyberjaya',
        state: 'Selangor',
        zipCode: '63000',
        price: 2500,
        ownerId: owner.id,
        propertyTypeId: propType.id,
        code: `PROP-${Date.now()}`,
      },
    });

    // Create test lease
    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ),
        rentAmount: 2500,
        status: 'APPROVED',
        propertyId: property.id,
        tenantId: tenant.id,
        landlordId: owner.id,
      },
    });

    console.log(`✅ Fake Data Created. Lease ID: ${lease.id}`);
    console.log('📄 Generating PDF now...');

    // Generate and upload PDF
    const pdfService = require('../services/pdfGeneration.service');
    const result = await pdfService.generateAndUploadRentalAgreementPDF(
      lease.id
    );

    res.json({
      success: true,
      message: 'Module 3 COMPLETE: PDF Generated, Signed & Saved!',
      data: {
        leaseId: lease.id,
        digitalSignature: result.data.digitalSignature,
        pdfUrl: result.data.cloudinary.url,
        signedAt: result.data.rentalAgreement.signedAt,
      },
    });
  } catch (error) {
    console.error('❌ Test Failed:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

module.exports = router;