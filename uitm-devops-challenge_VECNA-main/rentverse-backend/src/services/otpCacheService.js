const Redis = require('ioredis');
const crypto = require('crypto');

/**
 * OTP Cache Service - High-performance OTP storage and validation
 * Uses Redis for distributed caching with fallback to in-memory storage
 */
class OTPCacheService {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.isRedisConnected = false;
    
    // Initialize Redis connection if available
    this.initRedis();
    
    // Fallback cleanup interval for memory cache
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Clean up every minute
  }

  async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        
        this.redis.on('connect', () => {
          console.log('✅ OTP Cache: Redis connected successfully');
          this.isRedisConnected = true;
        });
        
        this.redis.on('error', (error) => {
          console.warn('⚠️ OTP Cache: Redis connection failed, using memory cache', error.message);
          this.isRedisConnected = false;
        });
        
        // Test connection
        await this.redis.ping();
        this.isRedisConnected = true;
      }
    } catch (error) {
      console.warn('⚠️ OTP Cache: Redis not available, using memory cache');
      this.isRedisConnected = false;
    }
  }

  /**
   * Store OTP with expiration in Redis or memory cache
   */
  async storeOTP(email, otpData, ttlSeconds = 300) {
    const key = this.getOTPKey(email);
    const value = JSON.stringify({
      otp: otpData.token,
      secret: otpData.secret,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 3
    });

    try {
      if (this.isRedisConnected && this.redis) {
        // Use Redis for distributed caching
        await this.redis.setex(key, ttlSeconds, value);
        
        // Also store in memory as fallback
        this.memoryCache.set(key, {
          value: JSON.parse(value),
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      } else {
        // Use memory cache only
        this.memoryCache.set(key, {
          value: JSON.parse(value),
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ OTP Cache: Failed to store OTP', error);
      return false;
    }
  }

  /**
   * Retrieve OTP data from cache
   */
  async getOTP(email) {
    const key = this.getOTPKey(email);
    
    try {
      let otpData = null;
      
      if (this.isRedisConnected && this.redis) {
        // Try Redis first
        const redisData = await this.redis.get(key);
        if (redisData) {
          otpData = JSON.parse(redisData);
        }
      }
      
      // Fallback to memory cache if Redis failed or data not found
      if (!otpData) {
        const memoryData = this.memoryCache.get(key);
        if (memoryData && memoryData.expiry > Date.now()) {
          otpData = memoryData.value;
        } else if (memoryData) {
          // Clean up expired memory cache entry
          this.memoryCache.delete(key);
        }
      }
      
      return otpData;
    } catch (error) {
      console.error('❌ OTP Cache: Failed to retrieve OTP', error);
      return null;
    }
  }

  /**
   * Validate OTP and increment attempt counter
   */
  async validateOTP(email, providedOTP) {
    const otpData = await this.getOTP(email);
    
    if (!otpData) {
      return {
        valid: false,
        reason: 'OTP_NOT_FOUND',
        attempts: 0
      };
    }

    // Check if OTP has expired
    const now = Date.now();
    const otpAge = now - otpData.timestamp;
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    if (otpAge > maxAge) {
      await this.deleteOTP(email);
      return {
        valid: false,
        reason: 'OTP_EXPIRED',
        attempts: otpData.attempts
      };
    }

    // Check attempt limit
    if (otpData.attempts >= otpData.maxAttempts) {
      await this.deleteOTP(email);
      return {
        valid: false,
        reason: 'MAX_ATTEMPTS_EXCEEDED',
        attempts: otpData.attempts
      };
    }

    // Validate OTP
    const isValid = otpData.otp === providedOTP;
    
    if (isValid) {
      // Delete OTP after successful validation
      await this.deleteOTP(email);
      return {
        valid: true,
        reason: 'SUCCESS',
        attempts: otpData.attempts
      };
    } else {
      // Increment attempt counter
      otpData.attempts++;
      await this.updateOTPAttempts(email, otpData.attempts);
      
      return {
        valid: false,
        reason: 'INVALID_OTP',
        attempts: otpData.attempts,
        remainingAttempts: otpData.maxAttempts - otpData.attempts
      };
    }
  }

  /**
   * Update attempt counter for existing OTP
   */
  async updateOTPAttempts(email, attempts) {
    const key = this.getOTPKey(email);
    
    try {
      if (this.isRedisConnected && this.redis) {
        const redisData = await this.redis.get(key);
        if (redisData) {
          const otpData = JSON.parse(redisData);
          otpData.attempts = attempts;
          await this.redis.setex(key, 300, JSON.stringify(otpData));
        }
      } else {
        const memoryData = this.memoryCache.get(key);
        if (memoryData) {
          memoryData.value.attempts = attempts;
        }
      }
    } catch (error) {
      console.error('❌ OTP Cache: Failed to update attempts', error);
    }
  }

  /**
   * Delete OTP from cache
   */
  async deleteOTP(email) {
    const key = this.getOTPKey(email);
    
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
      return true;
    } catch (error) {
      console.error('❌ OTP Cache: Failed to delete OTP', error);
      return false;
    }
  }

  /**
   * Clean up expired entries from memory cache
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, data] of this.memoryCache.entries()) {
      if (data.expiry <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 OTP Cache: Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const memorySize = this.memoryCache.size;
      let redisSize = 0;
      
      if (this.isRedisConnected && this.redis) {
        redisSize = await this.redis.dbsize();
      }
      
      return {
        memoryCacheSize: memorySize,
        redisCacheSize: redisSize,
        isRedisConnected: this.isRedisConnected,
        totalEntries: memorySize + redisSize
      };
    } catch (error) {
      console.error('❌ OTP Cache: Failed to get stats', error);
      return {
        memoryCacheSize: this.memoryCache.size,
        redisCacheSize: 0,
        isRedisConnected: this.isRedisConnected,
        totalEntries: this.memoryCache.size
      };
    }
  }

  /**
   * Generate cache key for email
   */
  getOTPKey(email) {
    const hash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    return `otp:${hash}`;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      
      if (this.redis) {
        await this.redis.quit();
      }
      
      this.memoryCache.clear();
      console.log('🔄 OTP Cache: Shutdown completed');
    } catch (error) {
      console.error('❌ OTP Cache: Shutdown error', error);
    }
  }
}

// Singleton instance
const otpCache = new OTPCacheService();

module.exports = otpCache;