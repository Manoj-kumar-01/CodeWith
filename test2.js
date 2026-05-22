require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const user = await User.findOne({ $or: [{ email: 'some@email.com' }, { username: 'mkk' }] });
        console.log('Found:', user);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
