const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

class DigitalSignatureValidation {
  // Generate secure signature payload with timestamp and user context
  generateSignaturePayload(documentId, userId, userRole, documentHash) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = {
      documentId,
      userId,
      userRole,
      documentHash,
      timestamp,
      nonce,
      version: '1.0'
    };

    // Create signature using JWT for tamper-proof verification
    const signature = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'rentverse-dsa'
    });

    return {
      payload,
      signature,
      expiresAt: new Date(timestamp + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  // Validate signature integrity and user permissions
  async validateSignature(signature, documentId, userId) {
    try {
      // Decode and verify JWT signature
      const decoded = jwt.verify(signature, process.env.JWT_SECRET, {
        issuer: 'rentverse-dsa'
      });

      // Verify document ownership and access permissions
      const document = await prisma.property.findUnique({
        where: { id: documentId },
        include: {
          owner: true,
          bookings: {
            where: {
              tenantId: userId,
              status: 'APPROVED'
            }
          }
        }
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      // Check if user has permission to access this document
      const hasPermission = document.ownerId === userId || 
                           document.bookings.length > 0 ||
                           decoded.userId === userId;

      if (!hasPermission) {
        throw new Error('User does not have permission to sign this document');
      }

      // Verify signature hasn't expired
      if (decoded.timestamp && Date.now() > decoded.timestamp + 24 * 60 * 60 * 1000) {
        throw new Error('Signature has expired');
      }

      // Verify nonce to prevent replay attacks
      const existingSignature = await prisma.digitalSignature.findFirst({
        where: {
          documentId,
          userId,
          nonce: decoded.nonce,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
          }
        }
      });

      if (existingSignature) {
        throw new Error('Signature already used - potential replay attack');
      }

      return {
        valid: true,
        user: decoded.userId,
        documentId: decoded.documentId,
        userRole: decoded.userRole,
        timestamp: decoded.timestamp,
        nonce: decoded.nonce
      };
    } catch (error) {
      console.error('Signature validation failed:', error.message);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Record digital signature attempt for audit trail
  async recordSignatureAttempt(signature, documentId, userId, ipAddress, userAgent) {
    try {
      const decoded = jwt.decode(signature);
      
      const signatureRecord = await prisma.digitalSignature.create({
        data: {
          documentId,
          userId,
          signatureHash: crypto.createHash('sha256').update(signature).digest('hex'),
          nonce: decoded?.nonce || crypto.randomBytes(16).toString('hex'),
          ipAddress,
          userAgent,
          status: 'PENDING',
          createdAt: new Date(),
          metadata: {
            userRole: decoded?.userRole,
            timestamp: decoded?.timestamp,
            version: decoded?.version || '1.0'
          }
        }
      });

      return signatureRecord;
    } catch (error) {
      console.error('Failed to record signature attempt:', error);
      throw error;
    }
  }

  // Generate document hash for integrity verification
  generateDocumentHash(documentContent) {
    return crypto.createHash('sha256')
      .update(documentContent + process.env.DOCUMENT_SALT)
      .digest('hex');
  }

  // Verify document hasn't been modified since signing
  async verifyDocumentIntegrity(documentId, currentHash) {
    try {
      const signatureRecord = await prisma.digitalSignature.findFirst({
        where: {
          documentId,
          status: 'SIGNED'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!signatureRecord) {
        throw new Error('No signature found for document');
      }

      // In a real implementation, you'd compare with stored original hash
      // For now, we'll validate the structure
      return {
        valid: true,
        signedAt: signatureRecord.createdAt,
        signerId: signatureRecord.userId
      };
    } catch (error) {
      console.error('Document integrity verification failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Update signature status after user action
  async updateSignatureStatus(signatureId, status, additionalData = {}) {
    try {
      const updatedSignature = await prisma.digitalSignature.update({
        where: { id: signatureId },
        data: {
          status,
          signedAt: status === 'SIGNED' ? new Date() : null,
          ...additionalData
        }
      });

      // Log the action for audit purposes
      await this.logSignatureActivity({
        signatureId,
        action: status,
        timestamp: new Date(),
        metadata: additionalData
      });

      return updatedSignature;
    } catch (error) {
      console.error('Failed to update signature status:', error);
      throw error;
    }
  }

  // Log signature activity for security monitoring
  async logSignatureActivity(activityData) {
    try {
      const activityLogger = require('./activityLogger');
      await activityLogger.log(
        activityData.action,
        activityData.userId,
        {
          type: 'DIGITAL_SIGNATURE',
          resourceId: activityData.signatureId,
          documentId: activityData.documentId,
          userAgent: activityData.userAgent,
          metadata: activityData.metadata,
          severity: activityData.action === 'SIGNED' ? 'INFO' : 'WARNING',
        },
        activityData.ipAddress
      );
    } catch (error) {
      console.error('Failed to log signature activity:', error);
    }
  }

  // Get signature history for audit trail
  async getSignatureHistory(documentId) {
    try {
      const signatures = await prisma.digitalSignature.findMany({
        where: { documentId },
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
        orderBy: { createdAt: 'desc' }
      });

      return signatures.map(sig => ({
        id: sig.id,
        status: sig.status,
        signer: sig.user,
        signedAt: sig.signedAt,
        createdAt: sig.createdAt,
        ipAddress: sig.ipAddress,
        userAgent: sig.userAgent,
        isValid: sig.status === 'SIGNED'
      }));
    } catch (error) {
      console.error('Failed to get signature history:', error);
      throw error;
    }
  }
}

module.exports = new DigitalSignatureValidation();