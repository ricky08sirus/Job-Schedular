const mongoose = require("mongoose");

const ImportLogSchema = new mongoose.Schema({
  importedAt: { type: Date, default: Date.now },
  total: Number,
  new: Number,
  updated: Number,
  failed: Number,
  errors: [String]
}, { timestamps: true });

module.exports = mongoose.model("importLog", ImportLogSchema);
