const mongoose = require('mongoose');
const CustomRoom = require('./models/CustomRoom');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codewith')
  .then(async () => {
    const rooms = await CustomRoom.find({});
    console.log("Rooms:", JSON.stringify(rooms, null, 2));
    process.exit(0);
  });
