// backend/models/CompilationLog.js
const mongoose = require('mongoose');

// Schema for compilation logs in MongoDB
const compilationLogSchema = new mongoose.Schema({
  userId: { 
    type: Number, 
    required: true, 
    index: true 
  },
  language: { 
    type: String, 
    required: true,
    enum: ['c', 'cpp', 'python', 'javascript']
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'timeout']
  },
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  
  // Performance metrics
  executionTime: { 
    type: Number,  // in milliseconds
    min: 0
  },
  memoryUsed: { 
    type: Number,  // in KB
    min: 0
  },
  cpuTime: { 
    type: Number,  // in milliseconds
    min: 0
  },
  exitCode: {
    type: Number
  },
  
  // Code metadata
  codeLength: { 
    type: Number,
    min: 0
  },
  codeHash: { 
    type: String,
    index: true
  },
  
  // Error details
  errorMessage: {
    type: String
  },
  errorType: {
    type: String
  },
  
  // Context
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  sessionId: {
    type: String
  },
  
  // Additional metadata (flexible)
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Tags for categorization
  tags: [String]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'compilation_logs'
});

// Create compound indexes for common queries
compilationLogSchema.index({ userId: 1, timestamp: -1 });
compilationLogSchema.index({ language: 1, timestamp: -1 });
compilationLogSchema.index({ status: 1, timestamp: -1 });
compilationLogSchema.index({ codeHash: 1 }, { sparse: true });
compilationLogSchema.index({ errorType: 1, timestamp: -1 });

// TTL index for automatic cleanup (optional - uncomment if needed)
// compilationLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static method to get user statistics
compilationLogSchema.statics.getUserStats = async function(userId, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: cutoff }
      }
    },
    {
      $facet: {
        byLanguage: [
          {
            $group: {
              _id: '$language',
              count: { $sum: 1 },
              avgTime: { $avg: '$executionTime' },
              successCount: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
              },
              totalCount: { $sum: 1 }
            }
          },
          {
            $addFields: {
              successRate: {
                $multiply: [
                  { $divide: ['$successCount', '$totalCount'] },
                  100
                ]
              }
            }
          }
        ],
        overall: [
          {
            $group: {
              _id: null,
              totalCompilations: { $sum: 1 },
              successfulCompilations: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
              },
              avgExecutionTime: { $avg: '$executionTime' },
              avgMemoryUsed: { $avg: '$memoryUsed' },
              uniqueLanguages: { $addToSet: '$language' }
            }
          },
          {
            $addFields: {
              successRate: {
                $multiply: [
                  { $divide: ['$successfulCompilations', '$totalCompilations'] },
                  100
                ]
              },
              languageCount: { $size: '$uniqueLanguages' }
            }
          }
        ]
      }
    }
  ]);
  
  return stats[0] || { byLanguage: [], overall: {} };
};

// Static method to get daily stats
compilationLogSchema.statics.getDailyStats = async function(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoff }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          language: '$language'
        },
        count: { $sum: 1 },
        avgTime: { $avg: '$executionTime' },
        successRate: {
          $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id.date': -1 }
    }
  ]);
};

// Static method to get popular errors
compilationLogSchema.statics.getPopularErrors = async function(limit = 10) {
  return this.aggregate([
    {
      $match: {
        status: 'error',
        errorMessage: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$errorType',
        count: { $sum: 1 },
        examples: { $push: '$errorMessage' },
        languages: { $addToSet: '$language' },
        users: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        errorType: '$_id',
        count: 1,
        sampleMessage: { $arrayElemAt: ['$examples', 0] },
        languages: 1,
        uniqueUsers: { $size: '$users' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to get language popularity
compilationLogSchema.statics.getLanguagePopularity = async function(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoff }
      }
    },
    {
      $group: {
        _id: '$language',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgSuccessRate: {
          $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        avgExecutionTime: { $avg: '$executionTime' }
      }
    },
    {
      $project: {
        language: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgSuccessRate: { $multiply: ['$avgSuccessRate', 100] },
        avgExecutionTime: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to log compilation
compilationLogSchema.statics.logCompilation = async function(data) {
  try {
    // Calculate code hash if code is provided
    if (data.code) {
      const crypto = require('crypto');
      data.codeHash = crypto
        .createHash('sha256')
        .update(data.code)
        .digest('hex')
        .substring(0, 16);
      delete data.code; // Don't store full code
    }
    
    const log = new this(data);
    await log.save();
    return log;
  } catch (err) {
    console.error('Error logging compilation:', err);
    return null; // Don't fail compilation if logging fails
  }
};

// Virtual for formatted execution time
compilationLogSchema.virtual('formattedExecutionTime').get(function() {
  if (!this.executionTime) return 'N/A';
  if (this.executionTime < 1000) return `${this.executionTime}ms`;
  return `${(this.executionTime / 1000).toFixed(2)}s`;
});

// Virtual for formatted memory usage
compilationLogSchema.virtual('formattedMemory').get(function() {
  if (!this.memoryUsed) return 'N/A';
  if (this.memoryUsed < 1024) return `${this.memoryUsed}KB`;
  return `${(this.memoryUsed / 1024).toFixed(2)}MB`;
});

// Ensure virtuals are included in JSON output
compilationLogSchema.set('toJSON', { virtuals: true });
compilationLogSchema.set('toObject', { virtuals: true });

const CompilationLog = mongoose.model('CompilationLog', compilationLogSchema);

module.exports = CompilationLog;