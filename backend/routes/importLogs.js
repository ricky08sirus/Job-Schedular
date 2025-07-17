const express = require("express");
const router = express.Router();
const ImportLog = require("../models/importLog");

router.get("/", async (req, res) => {
  try {
    const logs = await ImportLog.find().sort({ createdAt: -1 }).limit(20);
    // res.json(logs);
    res.json({ success: true, logs });
  } catch (err) {
    console.error("Failed to fetch logs", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
