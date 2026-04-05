const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
};

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('✅ MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

// MongoDB schema for compilation logs (using Mongoose)
const compilationLogSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  language: {
    type: String,
    required: true,
    enum: ['c', 'cpp', 'python', 'javascript', 'java', 'typescript', 'go', 'rust', 'ruby', 'php', 'perl', 'r', 'swift', 'scala']
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'timeout']
  },
  timestamp: { type: Date, default: Date.now, index: true },
  executionTime: Number,
  memoryUsed: Number,
  codeLength: Number,
  errorMessage: String,
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
  codeHash: String,
  tags: [String]
}, {
  timestamps: true,
  collection: 'compilation_logs'
});

// Create compound indexes
compilationLogSchema.index({ userId: 1, timestamp: -1 });
compilationLogSchema.index({ language: 1, status: 1 });
compilationLogSchema.index({ codeHash: 1 }, { sparse: true });

// Static method for analytics
compilationLogSchema.statics.getUserStats = async function (userId, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: cutoff }
      }
    },
    {
      $group: {
        _id: '$language',
        count: { $sum: 1 },
        avgTime: { $avg: '$executionTime' },
        successRate: {
          $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        }
      }
    }
  ]);
};

const CompilationLog = mongoose.model('CompilationLog', compilationLogSchema);

// User behavior schema
const userBehaviorSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed,
  sessionId: String,
  ipAddress: String
}, {
  timestamps: true,
  collection: 'user_behavior',
  timeseries: {
    timeField: 'timestamp',
    metaField: 'details',
    granularity: 'minutes'
  }
});

const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);

module.exports = {
  connectMongoDB,
  CompilationLog,
  UserBehavior,
  mongoose
};