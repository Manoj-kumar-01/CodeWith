const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Problem = require('./models/Problem');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('ERROR: MONGO_URI not set in .env'); process.exit(1); }

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const p = await Problem.findOne();
        console.log("PROBLEM TEST CASES:", JSON.stringify(p.testCases));
    } catch(e) {
        console.log(e);
    }
    process.exit(0);
});
