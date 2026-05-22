require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Friendship = require('./models/Friendship');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing users and friendships
        await User.deleteMany({});
        await Friendship.deleteMany({});

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash('password123', salt);

        // Create User 1
        const user1 = await User.create({
            username: 'alexchen',
            name: 'Alex Chen',
            email: 'alex@example.com',
            password: hashedPass,
            stats: { rating: 1500, solved: 10 }
        });

        // Create User 2
        const user2 = await User.create({
            username: 'bobsmith',
            name: 'Bob Smith',
            email: 'bob@example.com',
            password: hashedPass,
            stats: { rating: 1200, solved: 5 }
        });

        // Create Friendship
        await Friendship.create({
            requester: user1._id,
            recipient: user2._id,
            status: 'accepted'
        });

        console.log('Successfully seeded users and friendship!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
