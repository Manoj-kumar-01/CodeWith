// Connect to analytics database
db = db.getSiblingDB('compiler_analytics');

// Create users for authentication
db.createUser({
  user: 'compiler_user',
  pwd: 'SecureMongoPass123!',
  roles: [
    { role: 'readWrite', db: 'compiler_analytics' },
    { role: 'dbAdmin', db: 'compiler_analytics' }
  ]
});

// Create collections with validation
db.createCollection('compilation_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'language', 'status', 'timestamp'],
      properties: {
        userId: { bsonType: 'number' },
        language: { 
          bsonType: 'string',
          enum: ['c', 'cpp', 'python', 'javascript']
        },
        status: {
          bsonType: 'string',
          enum: ['success', 'error', 'timeout']
        },
        timestamp: { bsonType: 'date' },
        executionTime: { bsonType: 'number' },
        memoryUsed: { bsonType: 'number' },
        codeLength: { bsonType: 'number' },
        errorMessage: { bsonType: 'string' },
        ipAddress: { bsonType: 'string' },
        userAgent: { bsonType: 'string' },
        metadata: { bsonType: 'object' }
      }
    }
  }
});

// Create collection for user behavior analytics
db.createCollection('user_behavior', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'action', 'timestamp'],
      properties: {
        userId: { bsonType: 'number' },
        action: { bsonType: 'string' },
        timestamp: { bsonType: 'date' },
        details: { bsonType: 'object' },
        sessionId: { bsonType: 'string' }
      }
    }
  }
});

// Create collection for error analytics
db.createCollection('error_analytics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['errorType', 'count', 'lastOccurrence'],
      properties: {
        errorType: { bsonType: 'string' },
        count: { bsonType: 'number' },
        users: { bsonType: 'array' },
        lastOccurrence: { bsonType: 'date' },
        languages: { bsonType: 'array' },
        stackTraces: { bsonType: 'array' }
      }
    }
  }
});

// Create indexes for performance
db.compilation_logs.createIndex({ userId: 1, timestamp: -1 });
db.compilation_logs.createIndex({ language: 1, timestamp: -1 });
db.compilation_logs.createIndex({ status: 1, timestamp: -1 });
db.compilation_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

db.user_behavior.createIndex({ userId: 1, timestamp: -1 });
db.user_behavior.createIndex({ action: 1, timestamp: -1 });

db.error_analytics.createIndex({ errorType: 1 });
db.error_analytics.createIndex({ lastOccurrence: -1 });

// Create timeseries collection for real-time metrics
db.createCollection('compilation_metrics', {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'minutes'
  }
});

// Insert sample data
db.compilation_logs.insertMany([
  {
    userId: 1,
    language: 'python',
    status: 'success',
    timestamp: new Date(),
    executionTime: 234,
    memoryUsed: 15360,
    codeLength: 256,
    ipAddress: '192.168.1.100',
    metadata: { browser: 'Chrome', os: 'Windows' }
  },
  {
    userId: 2,
    language: 'javascript',
    status: 'success',
    timestamp: new Date(Date.now() - 3600000),
    executionTime: 156,
    memoryUsed: 10240,
    codeLength: 128,
    ipAddress: '192.168.1.101',
    metadata: { browser: 'Firefox', os: 'MacOS' }
  }
]);

// Create aggregation pipeline for daily stats
db.createCollection('daily_stats', {
  viewOn: 'compilation_logs',
  pipeline: [
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
    }
  ]
});

print('MongoDB initialization completed successfully!');