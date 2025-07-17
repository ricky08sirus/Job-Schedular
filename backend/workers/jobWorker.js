const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");

const { validateJobData } = require("../utils/jobValidator");
const { upsertJob } = require("../services/jobService");
const { saveImportLog } = require("../services/importLogService");

// Log loaded env vars
console.log("DEBUG MONGO_URI:", process.env.MONGO_URI);
console.log("DEBUG REDIS_URL:", process.env.REDIS_URL);

// Check .env
if (!process.env.MONGO_URI || !process.env.REDIS_URL) {
  console.error(" Missing MONGO_URI or REDIS_URL in .env");
  process.exit(1);
}

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected in worker"))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Redis connection (auto TLS if needed)
const redisOptions = {
  maxRetriesPerRequest: null,
};

if (process.env.REDIS_URL.startsWith("rediss://")) {
  redisOptions.tls = { rejectUnauthorized: false };
}

const connection = new IORedis(process.env.REDIS_URL, redisOptions);

// Import Log State
let total = 0, created = 0, updated = 0, failed = 0;
const importErrors = [];
let lastLogTime = Date.now();
const LOG_INTERVAL = 10_000;

//  Flush logs
async function flushImportLog() {
  if (total === 0) return;
  try {
    await saveImportLog({
      total,
      new: created,
      updated,
      failed,
      errors: [...importErrors],
      timestamp: new Date(),
    });
    console.log("Import summary saved");

    total = created = updated = failed = 0;
    importErrors.length = 0;
    lastLogTime = Date.now();
  } catch (err) {
    console.error("Failed to save import log:", err.message);
  }
}

// Job Worker
const worker = new Worker("jobs", async (job) => {
  try {
    total++;

    const { valid, errors: validationErrors } = validateJobData(job.data);
    if (!valid) {
      failed++;
      importErrors.push(`Validation failed (${job.data.url || job.id}): ${validationErrors.join(", ")}`);
      return;
    }

    const result = await upsertJob(job.data);
    if (result.updated) {
      updated++;
      console.log(`Updated: ${job.data.url}`);
    } else {
      created++;
      console.log(`New: ${job.data.url}`);
    }

  } catch (err) {
    failed++;
    importErrors.push(`Error (${job.data.url || job.id}): ${err.message}`);
  }

  if (Date.now() - lastLogTime >= LOG_INTERVAL) {
    await flushImportLog();
  }

}, { connection });

//  Events
worker.on("completed", job => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  failed++;
  importErrors.push(`Failed job (${job.id}): ${err.message}`);
  console.error(`Job ${job.id} failed: ${err.message}`);
});


async function shutdown() {
  console.log("\n Worker shutting down... Flushing logs.");
  await flushImportLog();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", async (err) => {
  console.error(" Uncaught Exception:", err);
  await flushImportLog();
  process.exit(1);
});
