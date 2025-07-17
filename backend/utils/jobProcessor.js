const { upsertJob } = require("../services/jobService");
const { saveImportLog } = require("../services/importLogService");

async function processJobBatch(jobs) {
  let total = 0, created = 0, updated = 0, failed = 0;
  const errors = [];

  for (const job of jobs) {
    total++;
    try {
      const result = await upsertJob(job);
      if (result === "new" || (result && result.updated === false)) created++;
      else if (result === "updated" || (result && result.updated === true)) updated++;
    } catch (err) {
      failed++;
      errors.push(`Job failed: ${job.url || job.jobId} - ${err.message}`);
    }
  }


  await saveImportLog({ total, new: created, updated, failed, errors });
  console.log("Import log saved");
}

module.exports = { processJobBatch };
