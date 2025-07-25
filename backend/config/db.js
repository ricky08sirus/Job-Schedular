const { tryCatch } = require('bullmq')
const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongodb connected");
    }catch(err) {
        console.error("MongoDB connection error : ", err);
        process.exit(1);

    }
    
};


module.exports = connectDB
