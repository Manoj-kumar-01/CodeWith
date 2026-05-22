const mongoose = require('mongoose');
const CustomRoom = require('./models/CustomRoom');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codewith')
  .then(async () => {
    // Keep the latest 'Vignan_Challengers_2' if any, but actually let's delete all empty/host-left rooms.
    // For now just clear all rooms to reset the state for the user
    await CustomRoom.deleteMany({});
    console.log("All rooms deleted.");
    process.exit(0);
  });
