require('dotenv').config();
const mongoose = require('mongoose');


async function connectDB(){
    if (mongoose.connection.readyState >= 1) {
        console.log("MongoDB already connected");
        return;
    }
    try {
       await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to database successfully")
    } catch (error) {
        console.log("error : ",error)
    }
}

connectDB();
module.exports = connectDB;