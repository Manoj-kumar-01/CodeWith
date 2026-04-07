const express = require('express');
const session = require('express-session');
// const PgSession = require('connect-pg-simple')(session);
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

// Database connections
// const { pgPool } = require('./config/postgres');
const { connectMongoDB, CompilationLog, UserBehavior, mongoose } = require('./config/mongodb');
const { redisClient, connectRedis, rateLimiter, cache } = require('./config/redis');

// Models and middleware
const User = require('./models/User');
const auth = require('./middleware/auth');
const Compiler = require('./utils/compiler');

const app = express();
const PORT = process.env.PORT || 3001;

// Helper for masking sensitive URIs in logs
const maskURI = (uri) => {
  if (!uri) return 'undefined';
  try {
    const url = new URL(uri);
    if (url.password) url.password = '****';
    return url.toString();
  } catch (e) {
    // Fallback for non-standard URIs or if URL parsing fails
    return uri.replace(/:([^@]+)@/, ':****@');
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global optional authentication (provides Guest context if not logged in)
app.use(auth.optionalAuth);

// Session configuration - using MongoDB for session storage
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  collectionName: 'sessions',
  ttl: parseInt(process.env.SESSION_MAX_AGE) / 1000,
  autoRemove: 'native'
});

app.use(session({
  store: sessionStore,
  name: 'compiler.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  }
}));

// Request logging middleware
app.use(async (req, res, next) => {
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  // Log to MongoDB if user is authenticated
  if (req.session.userId) {
    await UserBehavior.create({
      userId: req.session.userId,
      action: `${req.method} ${req.path}`,
      timestamp: new Date(),
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
        requestId: req.requestId
      },
      ipAddress: req.ip,
      sessionId: req.sessionID
    });
  }
  
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

app.use('/api', apiLimiter);

// Health check
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.isReady ? 'connected' : 'disconnected';

  res.json({
    status: (mongoStatus === 'connected' && redisStatus === 'connected') ? 'healthy' : 'degraded',
    timestamp: new Date(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  });
});

// ============= AUTH ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, tier = 'free' } = req.body;
    
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create user
    const user = await User.create({ username, email, password, tier });
    
    // Auto login
    await auth.sessionManager.create(req, user);
    await User.updateLastLogin(user.id, req.ip);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tier: user.tier
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const valid = await User.validatePassword(user, password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Create session
    await auth.sessionManager.create(req, user);
    
    // Update last login
    await User.updateLastLogin(user.id, req.ip);
    
    // Set remember me
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tier: user.tier
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  await auth.sessionManager.destroy(req);
  res.json({ success: true });
});

// Get current session
app.get('/api/auth/session', async (req, res) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tier: user.tier
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// ============= COMPILER ROUTES =============

// Compile code (Publicly accessible)
app.post('/api/compile', async (req, res) => {
  try {
    const { code, language, input } = req.body;
    
    // Validate inputs
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required and must be a string' });
    }
    if (!Compiler.isSupported(language)) {
      return res.status(400).json({ error: 'Unsupported language' });
    }
    
    // Check cache
    const userId = req.user?.id || req.body.userId || 'anonymous';
    const cacheKey = `${userId}:${language}:${Buffer.from(code).toString('base64').slice(0, 50)}`;
    const cached = await cache.getCompilation(cacheKey);
    
    if (cached) {
      return res.json({
        ...cached,
        cached: true
      });
    }
    
    // Compile
    const result = await Compiler.compile(code, language, input, userId);
    
    // Update user quota (skip for anonymous/unauthenticated users)
    let quota = null;
    if (userId !== 'anonymous' && userId !== 0) {
      try {
        await User.incrementCompilation(userId);
        quota = await User.canCompile(userId);
      } catch (e) { /* skip quota for unauthenticated */ }
    }
    
    // Cache result
    await cache.setCompilation(cacheKey, {
      output: result.output,
      error: result.error || '',
      exitCode: result.exitCode,
      executionTime: result.executionTime
    }, 300);
    
    res.json({
      ...result,
      quota: quota || { canCompile: true, used: 0, limit: 1000, tier: 'enterprise' }
    });
    
  } catch (err) {
    console.error('Compilation error:', err);
    res.status(500).json({ 
      error: err.message || 'Compilation failed',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get supported languages
app.get('/api/languages', (req, res) => {
  res.json({
    languages: [
      { id: 'c', name: 'C', version: 'GCC (C11)' },
      { id: 'cpp', name: 'C++', version: 'GCC (C++17)' },
      { id: 'java', name: 'Java', version: 'OpenJDK 17' },
      { id: 'python', name: 'Python', version: 'Python 3.11' },
      { id: 'javascript', name: 'JavaScript', version: 'Node.js 18' },
      { id: 'typescript', name: 'TypeScript', version: 'tsx (Node 18)' },
      { id: 'go', name: 'Go', version: 'Go 1.21' },
      { id: 'rust', name: 'Rust', version: 'Rust 1.73' },
      { id: 'ruby', name: 'Ruby', version: 'Ruby 3.2' },
      { id: 'php', name: 'PHP', version: 'PHP 8.2' },
      { id: 'perl', name: 'Perl', version: 'Perl 5.38' },
      { id: 'r', name: 'R', version: 'R 4.x' },
      { id: 'swift', name: 'Swift', version: 'Swift 5.9' },
      { id: 'scala', name: 'Scala', version: 'Scala 3.2' }
    ]
  });
});

// ============= USER DASHBOARD ROUTES =============

// Get user stats (Publicly accessible)
app.get('/api/user/stats', async (req, res) => {
  try {
    // Get PostgreSQL user data
    const user = await User.findById(req.user.id);
    
    // Get MongoDB compilation stats
    const compilationStats = await CompilationLog.getUserStats(req.user.id, 30);
    
    // Get recent activity
    const recentActivity = await UserBehavior.find({
      userId: req.user.id
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();
    
    // Get quota
    const quota = await User.canCompile(req.user.id);
    
    res.json({
      user,
      stats: {
        totalCompilations: user.total_compilations,
        byLanguage: compilationStats,
        successRate: await this.calculateSuccessRate(req.user.id)
      },
      recentActivity,
      quota
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Helper: Calculate success rate
async function calculateSuccessRate(userId) {
  const result = await CompilationLog.aggregate([
    {
      $match: { userId }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        }
      }
    }
  ]);
  
  if (result.length === 0) return 0;
  return (result[0].success / result[0].total) * 100;
}

// Get user compilation history (Publicly accessible)
app.get('/api/user/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const history = await CompilationLog.find({
      userId: req.user.id
    })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
    
    const total = await CompilationLog.countDocuments({
      userId: req.user.id
    });
    
    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Update user preferences (Publicly accessible)
app.post('/api/user/preferences', async (req, res) => {
  try {
    const preferences = await User.updatePreferences(req.user.id, req.body);
    res.json({ preferences });
  } catch (err) {
    console.error('Preferences error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ============= ADMIN ROUTES =============

// Get all users (admin only)
app.get('/api/admin/users', auth.requireAuth, auth.requireTier(['enterprise']), async (req, res) => {
  try {
    const users = await User.findAll(req.query);
    res.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get system analytics (admin only)
app.get('/api/admin/analytics', auth.requireAuth, auth.requireTier(['enterprise']), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    // Get compilation stats by language
    const byLanguage = await CompilationLog.aggregate([
      {
        $match: {
          timestamp: { $gte: cutoff }
        }
      },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          successRate: {
            $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          avgTime: { $avg: '$executionTime' }
        }
      }
    ]);
    
    // Get user activity
    const activeUsers = await UserBehavior.aggregate([
      {
        $match: {
          timestamp: { $gte: cutoff }
        }
      },
      {
        $group: {
          _id: '$userId',
          lastActive: { $max: '$timestamp' },
          actions: { $sum: 1 }
        }
      },
      {
        $sort: { actions: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Get error rates
    const errors = await CompilationLog.aggregate([
      {
        $match: {
          timestamp: { $gte: cutoff },
          status: 'error'
        }
      },
      {
        $group: {
          _id: '$errorMessage',
          count: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);
    
    res.json({
      period: { days: parseInt(days) },
      byLanguage,
      activeUsers,
      commonErrors: errors
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.requestId
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server with database synchronization
const startServer = async () => {
  try {
    console.log('⏳ Connecting to databases...');
    await connectMongoDB();
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`✅ Backend server running on port ${PORT}`);
      console.log(`📈 MongoDB: ${maskURI(process.env.MONGODB_URI)}`);
      console.log(`⚡ Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
      console.log('🚀 Final health check: All systems operational');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();