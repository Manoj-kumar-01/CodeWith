const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    uid: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: String,
    settings: {
        language: { type: String, default: 'en' },
        autoSave: { type: Boolean, default: true },
        fontScale: { type: String, default: 'medium' },
        pushNotifications: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: false },
        soundEffects: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true },
        privateProfile: { type: Boolean, default: false },
        codeFont: { type: String, default: 'jetbrains' },
        showLineNumbers: { type: Boolean, default: true },
        tabSize: { type: String, default: '4' }
    },
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
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date
}, { timestamps: true });

// Pre-save hook to generate unique 10-digit numeric ID
userSchema.pre('save', async function() {
    if (!this.uid) {
        let unique = false;
        let uid = '';
        while (!unique) {
            uid = '';
            for (let i = 0; i < 10; i++) {
                uid += Math.floor(Math.random() * 10).toString();
            }
            const existing = await this.constructor.findOne({ uid });
            if (!existing) {
                unique = true;
            }
        }
        this.uid = uid;
    }
});

module.exports = mongoose.model('User', userSchema);

