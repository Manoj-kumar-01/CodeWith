const mongoose = require('mongoose');

const customRoomSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    host: { type: String, required: true },
    size: { type: String, required: true, default: '6vs6' },
    map: { type: String, required: true, default: 'Bermuda' },
    status: { type: String, default: 'lobby' },
    players: { type: Number, default: 1 },
    slots: { type: Object, default: {} },
    chat: [{
        name: String,
        content: String,
        isSystem: Boolean
    }]
}, { timestamps: true });

module.exports = mongoose.model('CustomRoom', customRoomSchema);
