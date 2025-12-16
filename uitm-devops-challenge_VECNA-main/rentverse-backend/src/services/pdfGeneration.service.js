const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

// Polyfill for ReadableStream in Railway environment
if (typeof ReadableStream === 'undefined') {
  try {
    const { ReadableStream } = require('stream/web');
    global.ReadableStream = ReadableStream;
  } catch (error) {
    console.warn('⚠️ stream/web not available, ReadableStream polyfill failed');
  }
}

// Polyfill for WritableStream in Railway environment
if (typeof WritableStream === 'undefined') {
  try {
    const { WritableStream } = require('stream/web');
    global.WritableStream = WritableStream;
  } catch (error) {
    console.warn('⚠️ stream/web not available, WritableStream polyfill failed');
  }
}

// Polyfill for TransformStream in Railway environment
if (typeof TransformStream === 'undefined') {
  try {
    const { TransformStream } = require('stream/web');
    global.TransformStream = TransformStream;
  } catch (error) {
    console.warn('⚠️ stream/web not available, TransformStream polyfill failed');
  }
}

// 1. Keep existing QR Service (Sibling folder) - Optional import
let getSignatureQRCode = null;
try {
  ({ getSignatureQRCode } = require('./eSignature.service'));
} catch (error) {
  console.log('ℹ️ QR code service not available, proceeding without QR codes');
  getSignatureQRCode = null;
}

// 2. Import NEW Hashing Utility (Up one level -> utils)
const { generateDocumentHash } = require('../utils/digitalSignature');

const { prisma } = require('../config/database');
const {
  cloudinary,
  isCloudinaryConfigured,
  CLOUD_FOLDER_PREFIX,
} = require('../config/storage');

class PDFGenerationService {
  /**
   * Upload PDF buffer to Cloudinary using signed upload
   */
  async uploadPDFToCloudinary(pdfBuffer, fileName) {
    if (!isCloudinaryConfigured) {
      throw new Error(
        'Cloudinary is not configured. Please check your environment variables.'
      );
    }

    return new Promise((resolve, reject) => {
      const fileTimestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, '')
        .slice(0, 14);
      const shortId = uuidv4().split('-')[0];
      const publicId = `${CLOUD_FOLDER_PREFIX}/rental-agreements/${fileName}-${fileTimestamp}-${shortId}`;

      const signatureTimestamp = Math.round(new Date().getTime() / 1000);
      const uploadParams = {
        public_id: publicId,
        resource_type: 'raw',
        format: 'pdf',
        use_filename: false,
        unique_filename: false,
        overwrite: true,
        type: 'upload',
        access_mode: 'public',
        timestamp: signatureTimestamp,
      };

      const paramsToSign = {
        public_id: publicId,
        resource_type: 'raw',
        timestamp: signatureTimestamp,
        format: 'pdf',
        overwrite: true,
        use_filename: false,
        unique_filename: false,
        type: 'upload',
        access_mode: 'public',
      };

      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUD_API_SECRET
      );

      const signedParams = {
        ...uploadParams,
        signature: signature,
        api_key: process.env.CLOUD_API_KEY,
      };

      console.log('🔐 Using signed upload for PDF to Cloudinary...');

      const uploadStream = cloudinary.uploader.upload_stream(
        signedParams,
        (error, result) => {
          if (error) {
            console.error('Cloudinary signed PDF upload error:', error);
            reject(error);
            return;
          }

          console.log('✅ PDF uploaded successfully with signed upload');

          resolve({
            publicId: result.public_id,
            fileName: `${fileName}.pdf`,
            size: result.bytes,
            url: result.secure_url,
            etag: result.etag,
            format: result.format,
            resourceType: result.resource_type,
          });
        }
      );

      uploadStream.end(pdfBuffer);
    });
  }

  getChromePath() {
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
    const macChromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];
    for (const chromePath of macChromePaths) {
      if (fs.existsSync(chromePath)) return chromePath;
    }
    return null;
  }

  async saveToLocalStorage(pdfBuffer, fileName) {
    const uploadsDir = path.join(__dirname, '../../uploads/pdfs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const shortId = uuidv4().split('-')[0];
    const uniqueFileName = `${fileName}-${timestamp}-${shortId}.pdf`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    fs.writeFileSync(filePath, pdfBuffer);

    const serverUrl = `${process.env.BASE_URL || 'https://rentverse-backend-production.up.railway.app'}/api/files/pdfs/${uniqueFileName}`;

    return {
      fileName: uniqueFileName,
      filePath: filePath,
      url: serverUrl,
      size: pdfBuffer.length,
      publicId: null,
    };
  }

  /**
   * Generate rental agreement PDF, SIGN IT, and upload
   */
  async generateAndUploadRentalAgreementPDF(leaseId) {
    try {
      console.log(`🚀 Starting rental agreement PDF generation for lease: ${leaseId}`);

      // 1. Get lease data
      const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
        include: {
          property: {
            include: {
              propertyType: true,
              amenities: { include: { amenity: true } },
            },
          },
          tenant: { select: { id: true, email: true, firstName: true, lastName: true, name: true, phone: true } },
          landlord: { select: { id: true, email: true, firstName: true, lastName: true, name: true, phone: true } },
        },
      });

      if (!lease) throw new Error(`Lease with ID ${leaseId} not found`);

      // 2. Generate QR codes (Optional - won't fail if not available)
      let landlordQRCode = null;
      let tenantQRCode = null;

      try {
        if (getSignatureQRCode) {
          const staticSignData = { leaseId: lease.id, date: new Date().toISOString() };
          [landlordQRCode, tenantQRCode] = await Promise.all([
            getSignatureQRCode({ ...staticSignData, name: lease.landlord.name, role: 'landlord' }),
            getSignatureQRCode({ ...staticSignData, name: lease.tenant.name, role: 'tenant' }),
          ]);
        } else {
          console.log('ℹ️ QR code generation service not available, proceeding without QR codes');
        }
      } catch (qrError) {
        console.warn('⚠️ QR Code generation failed, proceeding without visual codes:', qrError.message);
        landlordQRCode = null;
        tenantQRCode = null;
      }

      // 3. Prepare template data
      const templateData = {
        rentalAgreement: { id: `RA-${lease.id.slice(-8).toUpperCase()}-${new Date().getFullYear()}` },
        lease: lease,
        signatures: {
          landlord: { qrCode: landlordQRCode, signDate: new Date().toLocaleDateString('id-ID'), name: lease.landlord.name },
          tenant: { qrCode: tenantQRCode, signDate: new Date().toLocaleDateString('id-ID'), name: lease.tenant.name },
        },
      };

      // 4. Render PDF
      const templatePath = path.join(__dirname, '../../templates/rental-agreement.ejs');
      if (!fs.existsSync(templatePath)) throw new Error(`Template file not found: ${templatePath}`);
      
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const html = ejs.render(templateContent, templateData);

      // Launch Puppeteer with Railway-compatible options
      const chromePath = this.getChromePath();
      const launchOptions = { 
        headless: true, 
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-default-apps'
        ] 
      };
      if (chromePath) launchOptions.executablePath = chromePath;

      let browser = null;
      let pdfBuffer = null;
      
      try {
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        
        // Set viewport and content with timeout
        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Generate PDF with error handling
        pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
          preferCSSPageSize: false,
        });
        
      } finally {
        if (browser) {
          await browser.close();
        }
      }

      if (!pdfBuffer) {
        throw new Error('Failed to generate PDF buffer');
      }

      // --- 🔒 MODULE 3: DIGITAL SIGNATURE GENERATION ---
      // Hash the PDF buffer
      const digitalSignature = generateDocumentHash(pdfBuffer);
      console.log(`✅ Document Secured. SHA-256 Hash: ${digitalSignature}`);
      // --------------------------------------------------

      // 5. Save PDF
      const fileName = `rental-agreement-${lease.id}`;
      let uploadResult;
      
      try {
        uploadResult = await this.saveToLocalStorage(pdfBuffer, fileName);
      } catch (localStorageError) {
        console.warn('⚠️ Local storage failed, using Cloudinary backup...');
        try {
            uploadResult = await this.uploadPDFToCloudinary(pdfBuffer, fileName);
        } catch (cloudError) {
            throw new Error(`Failed to save PDF anywhere: ${cloudError.message}`);
        }
      }

      // 6. Save to Database WITH SIGNATURE
      console.log('💾 Saving record with digital signature...');
      const rentalAgreement = await prisma.rentalAgreement.create({
        data: {
          leaseId: lease.id,
          pdfUrl: uploadResult.url,
          publicId: uploadResult.publicId,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.size,
          // Save the security fields
          digitalSignature: digitalSignature,
          signedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Rental agreement generated, signed, and saved.',
        data: {
          rentalAgreement,
          digitalSignature, // Return hash for verification
          cloudinary: { url: uploadResult.url }
        },
      };
    } catch (error) {
      console.error('❌ Error generating PDF:', error.message);
      console.error('Stack trace:', error.stack);
      throw new Error(`Failed to generate rental agreement: ${error.message}`);
    }
  }

  // Helper to get existing agreement
  async getRentalAgreementPDF(leaseId) {
    const rentalAgreement = await prisma.rentalAgreement.findUnique({
      where: { leaseId },
      include: { 
          lease: { 
              include: { 
                  property: { select: { title: true } },
                  tenant: { select: { name: true } },
                  landlord: { select: { name: true } }
              } 
          } 
      }
    });
    
    if (!rentalAgreement) throw new Error('Rental agreement not found');
    
    // Construct local URL if needed
    if (rentalAgreement.pdfUrl && !rentalAgreement.pdfUrl.startsWith('http')) {
         rentalAgreement.pdfUrl = `${process.env.BASE_URL || 'https://rentverse-backend-production.up.railway.app'}${rentalAgreement.pdfUrl}`;
    }

    return { success: true, data: rentalAgreement };
  }
}

module.exports = new PDFGenerationService();