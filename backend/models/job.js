const mongoose = require('mongoose')
const JobSchema = new mongoose.Schema({
    jobId: { type: String, unique: true },
    title: String,
    company: String,
    description: String,
    location: String,
    type: String,
    url: String,
    postedAt: Date
}, {timestamps: true});


module.exports = mongoose.model("Job", JobSchema)