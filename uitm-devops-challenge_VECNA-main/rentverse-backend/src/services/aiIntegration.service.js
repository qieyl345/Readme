const axios = require('axios');

// URL AI Service (Pastikan Python service berjalan di port 8000)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIIntegrationService {
  
  /**
   * Hantar data login ke AI untuk dianalisis
   * @param {Object} loginData - { userId, ip, timestamp, userAgent }
   * @returns {Promise<boolean>} - True jika mencurigakan, False jika selamat
   */
  async detectLoginAnomaly(loginData) {
    try {
      console.log(`🤖 AI Analysis requested for User: ${loginData.userId}`);
      
      // Hantar POST request ke Python API
      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/analyze/login`, {
        user_id: loginData.userId,
        ip_address: loginData.ip,
        timestamp: loginData.timestamp,
        user_agent: loginData.userAgent
      });

      const { is_suspicious, confidence, risk_factors } = response.data;
      
      if (is_suspicious) {
        console.warn(`🚨 AI ALERT: Suspicious login detected!`);
        console.warn(`   Confidence: ${confidence}`);
        console.warn(`   Reasons: ${risk_factors.join(', ')}`);
        return true; // Suspicious!
      }
      
      console.log(`✅ AI Analysis: Login looks safe (Confidence: ${confidence})`);
      return false; // Safe

    } catch (error) {
      // Jika AI down, kita benarkan login supaya tak block user (Fail Open)
      console.error('❌ AI Service connection failed:', error.message);
      return false; 
    }
  }
}

module.exports = new AIIntegrationService();