#!/usr/bin/env node

/**
 * RentVerse Backend - Main Entry Point
 * 6 Security Modules Mobile Platform
 * 
 * This file serves as the entry point for Railway deployment
 * and exports the Express application from src/app.js
 */

const app = require('./src/app.js');
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 RentVerse Backend running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 6 Security Modules Active`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});