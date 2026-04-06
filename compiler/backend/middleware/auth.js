const User = require('../models/User');
const { rateLimiter } = require('../config/redis');

// Require authentication
const requireAuth = async (req, res, next) => {
  // Allow internal requests from the main app
  if (req.headers['compiler-internal-key'] === 'secret') {
    // Mock a system user for internal requests
    req.user = { id: 0, tier: 'enterprise', email_verified: true };
    return next();
  }

  if (!req.session.userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    // Get user from database
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Optional authentication (provides default System user context if not logged in)
const optionalAuth = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (err) {
      console.error('Optional auth error:', err);
    }
  }
  
  // Default to system context if not authenticated
  req.user = { 
    id: 0, 
    username: 'Guest', 
    tier: 'enterprise', 
    email_verified: true 
  };
  next();
};

// Check compilation quota
const checkQuota = async (req, res, next) => {
  // Allow internal requests from the main app
  if (req.headers['compiler-internal-key'] === 'secret') {
    return next();
  }

  try {
    const quota = await User.canCompile(req.user.id);
    
    if (!quota.canCompile) {
      return res.status(429).json({
        error: 'Daily compilation limit reached',
        code: 'QUOTA_EXCEEDED',
        quota: {
          used: quota.used,
          limit: quota.limit,
          tier: quota.tier
        }
      });
    }

    // Check rate limit in Redis
    const rateKey = `rate:${req.user.id}:${new Date().getHours()}`;
    const rateCheck = await rateLimiter.checkLimit(rateKey, 20, 3600000); // 20 per hour

    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please slow down.',
        code: 'RATE_LIMITED'
      });
    }

    req.quota = quota;
    next();
  } catch (err) {
    console.error('Quota check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify email requirement
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({
      error: 'Email verification required',
      code: 'EMAIL_UNVERIFIED'
    });
  }
  next();
};

// Role-based access control
const requireTier = (allowedTiers) => {
  return (req, res, next) => {
    if (!allowedTiers.includes(req.user.tier)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_TIER',
        required: allowedTiers,
        current: req.user.tier
      });
    }
    next();
  };
};

// Session management
const sessionManager = {
  // Create session
  create: async (req, user) => {
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.tier = user.tier;
    req.session.createdAt = new Date();
    
    // Store in Redis for quick access
    const { cache } = require('../config/redis');
    await cache.setSession(req.sessionID, {
      userId: user.id,
      username: user.username,
      tier: user.tier
    }, 86400);
  },

  // Destroy session
  destroy: async (req) => {
    const { cache } = require('../config/redis');
    await cache.setSession(req.sessionID, null, 0);
    req.session.destroy();
  },

  // Refresh session
  refresh: async (req) => {
    req.session.touch();
    const { cache } = require('../config/redis');
    await cache.setSession(req.sessionID, {
      userId: req.user.id,
      username: req.user.username,
      tier: req.user.tier
    }, 86400);
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  checkQuota,
  requireVerifiedEmail,
  requireTier,
  sessionManager
};