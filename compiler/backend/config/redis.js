const redis = require('redis');
require('dotenv').config();

// Redis connection URL construction with support for REDIS_URL and robust fallbacks
const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;

  const username = process.env.REDIS_USERNAME || '';
  const password = process.env.REDIS_PASSWORD || '';
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || 6379;

  // URL format: redis://[user]:[password]@[host]:[port]
  const auth = (username || password) ? `${username}:${password}@` : '';

  return `redis://${auth}${host}:${port}`;
};

const redisUrl = getRedisUrl();

// Redis client for caching and rate limiting
const redisClient = redis.createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis max retries reached');
        return new Error('Redis max retries');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Redis events
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisClient.on('ready', () => {
  console.log('✅ Redis ready');
});

redisClient.on('end', () => {
  console.log('⚠️ Redis connection ended');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
    process.exit(1);
  }
};

// Rate limiting functions
const rateLimiter = {
  // Check if user exceeded rate limit
  checkLimit: async (key, maxRequests, windowMs) => {
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, windowMs / 1000);
    }

    return {
      allowed: current <= maxRequests,
      current,
      remaining: Math.max(0, maxRequests - current)
    };
  },

  // Block IP for duration
  blockIP: async (ip, durationMs) => {
    const key = `blocked:${ip}`;
    await redisClient.setEx(key, durationMs / 1000, 'blocked');
  },

  // Check if IP is blocked
  isBlocked: async (ip) => {
    const key = `blocked:${ip}`;
    return await redisClient.exists(key);
  }
};

// Cache functions
const cache = {
  // Cache compilation result
  setCompilation: async (key, data, ttl = 300) => {
    await redisClient.setEx(`compile:${key}`, ttl, JSON.stringify(data));
  },

  // Get cached compilation
  getCompilation: async (key) => {
    const data = await redisClient.get(`compile:${key}`);
    return data ? JSON.parse(data) : null;
  },

  // Cache user session
  setSession: async (sessionId, userData, ttl = 86400) => {
    await redisClient.setEx(`session:${sessionId}`, ttl, JSON.stringify(userData));
  },

  // Get cached session
  getSession: async (sessionId) => {
    const data = await redisClient.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
};

module.exports = {
  redisClient,
  connectRedis,
  rateLimiter,
  cache
};