const crypto = require('crypto');

/**
 * Generates a SHA-256 cryptographic hash of the document buffer.
 * This acts as the unique digital fingerprint of the file.
 * @param {Buffer} buffer - The file content
 * @returns {string} - The hex string of the hash
 */
const generateDocumentHash = (buffer) => {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
};

module.exports = { generateDocumentHash };