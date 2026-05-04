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
// MOCKED for local development without Redis
const redisClient = {
  connect: async () => console.log('✅ Mock Redis connected successfully'),
  on: (event, cb) => { if(event === 'connect' || event === 'ready') cb(); },
  incr: async () => 1,
  expire: async () => {},
  setEx: async () => {},
  exists: async () => 0,
  get: async () => null,
};

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  }
};

// Rate limiting functions
const rateLimiter = {
  checkLimit: async (key, maxRequests, windowMs) => ({ allowed: true, current: 1, remaining: maxRequests - 1 }),
  blockIP: async (ip, durationMs) => {},
  isBlocked: async (ip) => false
};

// Cache functions
const cache = {
  setCompilation: async (key, data, ttl = 300) => {},
  getCompilation: async (key) => null,
  setSession: async (sessionId, userData, ttl = 86400) => {},
  getSession: async (sessionId) => null
};

module.exports = {
  redisClient,
  connectRedis,
  rateLimiter,
  cache
};