const Queue = require("bull");
require("dotenv").config();

const jobQueue = new Queue("jobs", process.env.REDIS_URL);

jobQueue.on('error', (err) => {
  console.error(" Redis Bull queue connection error:", err);
});

module.exports = jobQueue;
