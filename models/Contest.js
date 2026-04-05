const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: String,
    description: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    status: { type: String, enum: ['active', 'upcoming', 'past'], default: 'upcoming' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    prize: String,
    tags: [String],
    rules: [String],
    organizer: { type: String, default: 'CodeWith? Team' },
    problemsCount: { type: Number, default: 0 },
    participants: [String],
    problemsList: [{
        id: String, // Reference ID (ObjectId string)
        title: String,
        difficulty: String,
        points: Number,
        solved: { type: Number, default: 0 },
        acceptance: { type: String, default: '0%' }
    }],
    leaderboard: [{
        rank: Number,
        name: String,
        score: Number,
        solved: Number,
        time: String,
        avatar: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Contest', contestSchema);
