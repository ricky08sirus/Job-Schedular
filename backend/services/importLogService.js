const ImportLog = require("../models/importLog");

async function saveImportLog({ total, new: created, updated, failed, errors }) {
  try {
    await ImportLog.create({ total, new: created, updated, failed, errors });
    console.log("✅ Import log saved to MongoDB");
  } catch (err) {
    console.error("❌ Failed to save import log:", err.message);
  }
}

module.exports = { saveImportLog };
