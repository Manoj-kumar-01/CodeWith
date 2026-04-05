const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    examples: [{
        input: String,
        output: String,
        explanation: String
    }],
    constraints: [String],
    tags: [String],
    starterCode: { type: Map, of: String, default: {} },
    testCases: [{
        input: String,
        expected: String,
        isHidden: { type: Boolean, default: false }
    }],
    stats: {
        likes: { type: Number, default: 0 },
        acceptance: { type: String, default: "0%" },
        solved: { type: Boolean, default: false } // User specific, usually aggregated
    }
}, { timestamps: true });

module.exports = mongoose.model('Problem', problemSchema);
