const Job = require("../models/job");

async function upsertJob(data) {
  try {
    const filter = { url: data.url }; 
    const update = { $set: data };
    const options = { upsert: true, new: true };

    const existing = await Job.findOne(filter);

    if (existing) {
      await Job.updateOne(filter, update);
      return { updated: true };
    } else {
      await Job.create(data);
      return { updated: false };
    }

  } catch (err) {
    console.error("DB Error:", err.message);
    throw err;
  }
}

module.exports = { upsertJob };
