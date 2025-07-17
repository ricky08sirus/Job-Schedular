require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const scheduleJobImport = require("./cron/jobFetcher");
const importLogRoutes = require("./routes/importLogs");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "https://job-schedular-1jon.vercel.app",
    credentials: true,
  }),
);

app.use(express.json());
app.use("/api/import-logs", importLogRoutes);

connectDB();

app.get("/", (req, res) => res.send("Job Importer Backend Running"));

scheduleJobImport();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(` Server listening on port ${PORT}`);
});
