#!/usr/bin/env node

/**
 * Test Utilities - Common functions for all tests
 */

const http = require('http');

// Helper function to safely parse JSON
function safeJsonParse(body) {
  try {
    return body ? JSON.parse(body) : null;
  } catch (e) {
    return { raw: body.substring(0, 100) };
  }
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, baseUrl = 'http://localhost:5000', headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: safeJsonParse(body),
          headers: res.headers,
          rawBody: body,
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

module.exports = {
  makeRequest,
  safeJsonParse,
};
