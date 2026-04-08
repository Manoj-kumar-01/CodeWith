const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    type: { type: String, enum: ['solved', 'joined_contest', 'achievement'], default: 'solved' },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
    problemTitle: { type: String },
    difficulty: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
