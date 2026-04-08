const fs = require('fs');

let file = fs.readFileSync('server.js', 'utf8');

if (!file.includes("const Friendship = require('./models/Friendship');")) {
    file = file.replace(/(const Problem = require\('\.\/models\/Problem'\);)/, '$1\nconst Friendship = require(\'./models/Friendship\');');
}

// 1. Replace the /api/friends GET endpoint
const getFriendsRegex = /app\.get\('\/api\/friends', \(req, res\) => \{[\s\S]*?\}\);/;
const getFriendsReplacement = `app.get('/api/friends', async (req, res) => {
    try {
        if (!dbConnected) return res.json({ friends: [], onlineFriends: [], pendingReceived: [], pendingSent: [], suggestions: [], counts: {} });
        
        let currentUser = await User.findOne({ username: 'alexchen' });
        if (!currentUser) return res.status(404).json({error: 'No current user'});

        const friendships = await Friendship.find({
            $or: [{ requester: currentUser._id }, { recipient: currentUser._id }]
        }).populate('requester recipient');

        const allUsers = await User.find({ _id: { $ne: currentUser._id } });
        
        let friends = [];
        let pendingReceived = [];
        let pendingSent = [];
        const relatedUserIds = new Set();

        friendships.forEach(f => {
            if (f.status === 'accepted') {
                const friend = f.requester._id.equals(currentUser._id) ? f.recipient : f.requester;
                friends.push({ id: friend._id, name: friend.name, username: friend.username, status: 'online', rating: friend.stats?.rating || 1200, solved: friend.stats?.solved || 0 });
                relatedUserIds.add(friend._id.toString());
            } else if (f.status === 'pending') {
                if (f.requester._id.equals(currentUser._id)) {
                    pendingSent.push({ id: f.recipient._id, name: f.recipient.name, username: f.recipient.username, rating: f.recipient.stats?.rating || 1200 });
                    relatedUserIds.add(f.recipient._id.toString());
                } else {
                    pendingReceived.push({ id: f.requester._id, name: f.requester.name, username: f.requester.username, rating: f.requester.stats?.rating || 1200 });
                    relatedUserIds.add(f.requester._id.toString());
                }
            }
        });

        let suggestions = allUsers.filter(u => !relatedUserIds.has(u._id.toString())).map(u => ({
            id: u._id, name: u.name, username: u.username, rating: u.stats?.rating || 1200, solved: u.stats?.solved || 0
        }));

        res.json({
            friends, onlineFriends: friends, pendingReceived, pendingSent, suggestions,
            counts: { all: friends.length, online: friends.length, pending: pendingReceived.length + pendingSent.length, suggestions: suggestions.length }
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});`;

file = file.replace(getFriendsRegex, getFriendsReplacement);

// 2. Replace Request Action
const reqRegex = /app\.post\('\/api\/friends\/request', \(req, res\) => \{[\s\S]*?\}\);/;
const reqReplacement = `app.post('/api/friends/request', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const { userId } = req.body;
        const currentUser = await User.findOne({ username: 'alexchen' });
        await Friendship.create({ requester: currentUser._id, recipient: userId, status: 'pending' });
        res.json({ success: true, message: 'Friend request sent' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});`;
file = file.replace(reqRegex, reqReplacement);

// 3. Replace Accept Action
const accRegex = /app\.post\('\/api\/friends\/accept', \(req, res\) => \{[\s\S]*?\}\);/;
const accReplacement = `app.post('/api/friends/accept', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const { userId } = req.body;
        const currentUser = await User.findOne({ username: 'alexchen' });
        await Friendship.findOneAndUpdate(
            { requester: userId, recipient: currentUser._id },
            { status: 'accepted' }
        );
        res.json({ success: true, message: 'Friend request accepted' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});`;
file = file.replace(accRegex, accReplacement);

// 4. Replace Reject/Cancel
const rejRegex = /app\.post\('\/api\/friends\/reject', \(req, res\) => \{[\s\S]*?\}\);/;
const rejReplacement = `app.post('/api/friends/reject', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const { userId } = req.body;
        const currentUser = await User.findOne({ username: 'alexchen' });
        await Friendship.findOneAndDelete({
            $or: [
                { requester: currentUser._id, recipient: userId },
                { requester: userId, recipient: currentUser._id }
            ]
        });
        res.json({ success: true, message: 'Request cancelled' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});`;
file = file.replace(rejRegex, rejReplacement);

// 5. Replace Remove
const remRegex = /app\.post\('\/api\/friends\/remove', \(req, res\) => \{[\s\S]*?\}\);/;
const remReplacement = `app.post('/api/friends/remove', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const { userId } = req.body;
        const currentUser = await User.findOne({ username: 'alexchen' });
        await Friendship.findOneAndDelete({
            $or: [
                { requester: currentUser._id, recipient: userId, status: 'accepted' },
                { requester: userId, recipient: currentUser._id, status: 'accepted' }
            ]
        });
        res.json({ success: true, message: 'Friend removed' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});`;
file = file.replace(remRegex, remReplacement);

// 6. Update seedData to include Dummy Users
const seedRegex = /const seedData = async \(\) => \{[\s\S]*?try \{/;
const seedReplacement = `const seedData = async () => {
    try {
        if (!dbConnected) return;

        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Seeding initial users...');
            const mainUser = await User.create({ username: 'alexchen', name: 'Alex Chen', email: 'alex@codewith.dev', stats: { rating: 1847, solved: 247 } });
            const dummy1 = await User.create({ username: 'sarahm', name: 'Sarah Miller', email: 'sarah@example.com', stats: { rating: 1650, solved: 189 } });
            const dummy2 = await User.create({ username: 'jordanl', name: 'Jordan Lee', email: 'jordan@example.com', stats: { rating: 1920, solved: 312 } });
            const dummy3 = await User.create({ username: 'priyas', name: 'Priya Sharma', email: 'priya@example.com', stats: { rating: 1780, solved: 256 } });
            const dummy4 = await User.create({ username: 'marcusj', name: 'Marcus Johnson', email: 'marcus@example.com', stats: { rating: 1540, solved: 143 } });
            
            // Seed a friendship and pending request
            await Friendship.create({ requester: dummy1._id, recipient: mainUser._id, status: 'accepted' });
            await Friendship.create({ requester: dummy2._id, recipient: mainUser._id, status: 'pending' });
        }`;
file = file.replace(seedRegex, seedReplacement);

// 7. Dynamic /api/user/profile
const profRegex = /app\.get\('\/api\/user\/profile', \(req, res\) => \{[\s\S]*?\}\);/;
const profReplacement = `app.get('/api/user/profile', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const user = await User.findOne({ username: 'alexchen' });
        
        // Generate mock heatmap temporarily out of DB
        const heatmap = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayOfWeek = d.getDay();
            let count = (dayOfWeek === 0 || dayOfWeek === 6) ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4);
            heatmap.push({ date: d.toISOString().split('T')[0], count });
        }
        res.json({
            user: { ...user.toObject(), joinedAt: user.createdAt },
            activity: user.activity || [],
            achievements: [], // Dynamic achievements logic to be added
            heatmap
        });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});`;
file = file.replace(profRegex, profReplacement);

fs.writeFileSync('server.js', file);
