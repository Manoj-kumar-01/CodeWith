const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: String,
    stats: {
        solved: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        globalRank: { type: Number, default: 0 },
        contestsWon: { type: Number, default: 0 },
        rating: { type: Number, default: 1200 }
    },
    skills: [{
        name: String,
        level: Number
    }],
    social: {
        github: String,
        twitter: String,
        linkedin: String,
        website: String
    },
    activity: [{
        title: String,
        time: { type: Date, default: Date.now }
    }],
    isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
