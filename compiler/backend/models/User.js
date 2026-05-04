const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String, required: true },
  tier: { 
    type: String, 
    enum: ['free', 'premium', 'enterprise'], 
    default: 'free' 
  },
  compilations_today: { type: Number, default: 0 },
  total_compilations: { type: Number, default: 0 },
  last_compilation: { type: Date },
  last_login: { type: Date },
  last_ip: { type: String },
  email_verified: { type: Boolean, default: false },
  verification_token: { type: String },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  collection: 'users'
});

// Middleware to hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Static methods to match previous API
userSchema.statics.create = async function(userData) {
  const user = new this({
    username: userData.username,
    email: userData.email,
    password_hash: userData.password, // Schema pre-save will hash this
    tier: userData.tier || 'free',
    verification_token: require('crypto').randomBytes(32).toString('hex')
  });
  return await user.save();
};

userSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email });
};

userSchema.statics.findById = async function(id) {
  return await this.findOne({ _id: id });
};

userSchema.statics.validatePassword = async function(user, password) {
  return await bcrypt.compare(password, user.password_hash);
};

userSchema.statics.updateLastLogin = async function(id, ip) {
  return await this.updateOne({ _id: id }, { 
    $set: { last_login: new Date(), last_ip: ip } 
  });
};

userSchema.statics.incrementCompilation = async function(id) {
  return await this.findOneAndUpdate(
    { _id: id },
    { 
      $inc: { compilations_today: 1, total_compilations: 1 },
      $set: { last_compilation: new Date() }
    },
    { new: true }
  );
};

userSchema.statics.canCompile = async function(id) {
  const user = await this.findOne({ _id: id });
  if (!user) return { canCompile: false, error: 'User not found' };

  let limit = 10;
  if (user.tier === 'premium') limit = 100;
  if (user.tier === 'enterprise') limit = 1000;

  return {
    canCompile: user.compilations_today < limit,
    used: user.compilations_today,
    limit: limit,
    tier: user.tier
  };
};

userSchema.statics.updatePreferences = async function(id, preferences) {
  const user = await this.findOneAndUpdate(
    { _id: id },
    { $set: { preferences: preferences } }, // Simplified logic for mongo
    { new: true }
  );
  return user.preferences;
};

userSchema.statics.findAll = async function(filters = {}) {
  const query = {};
  if (filters.tier) query.tier = filters.tier;
  if (filters.createdAfter) query.createdAt = { $gt: new Date(filters.createdAfter) };
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(100);
};

const User = mongoose.model('User', userSchema);

module.exports = User;