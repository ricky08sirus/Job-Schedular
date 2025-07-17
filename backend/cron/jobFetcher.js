const axios = require("axios");
const xml2js = require("xml2js");
const cron = require("node-cron");
const crypto = require("crypto");
const jobQueue = require("../queues/jobQueue");

const FEEDS = [
  "https://jobicy.com/?feed=job_feed",
  "https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time",
  "https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france",
  "https://jobicy.com/?feed=job_feed&job_categories=design-multimedia",
  "https://jobicy.com/?feed=job_feed&job_categories=data-science",
  "https://jobicy.com/?feed=job_feed&job_categories=copywriting",
  "https://jobicy.com/?feed=job_feed&job_categories=business",
  "https://jobicy.com/?feed=job_feed&job_categories=management",
  "https://www.higheredjobs.com/rss/articleFeed.cfm"
];

const parser = new xml2js.Parser({ explicitArray: false });

const sanitize = (value, allowDot = false) => {
  if (!value || typeof value !== "string") return "";
  let cleaned = value.replace(/\$/g, "");
  if (!allowDot) cleaned = cleaned.replace(/\./g, "");
  return cleaned.trim();
};

const fetchAndProcess = async () => {
  console.log(`\n Job import triggered at: ${new Date().toISOString()}`);

  for (const url of FEEDS) {
    console.log(` Fetching from: ${url}`);

    try {
      const { data: xml } = await axios.get(url);

      let json;
      try {
        json = await parser.parseStringPromise(xml);
      } catch (xmlErr) {
        console.error(` XML parse error for ${url}:`, xmlErr.message);
        continue;
      }

      const items = json.rss?.channel?.item || [];
      console.log(` Jobs found: ${items.length}`);

      for (const item of items) {
        try {
          let rawJobId = item.guid || item.link || item.title;

          if (typeof rawJobId === "object" && rawJobId._) {
            rawJobId = rawJobId._;
          } else if (typeof rawJobId !== "string") {
            rawJobId = JSON.stringify(rawJobId);
          }

          if (!rawJobId || typeof rawJobId !== "string") {
            console.warn(" Skipping job with invalid jobId:", item.title);
            continue;
          }

          const hashedJobId = crypto.createHash("md5").update(rawJobId).digest("hex");

          const jobData = {
            jobId: hashedJobId,
            title: sanitize(item.title),
            company: sanitize(item["job:company"] || item.company || "Unknown"),
            description: sanitize(item.description),
            location: sanitize(item["job:location"] || "Remote"),
            type: sanitize(item["job:employmentType"] || "Full-time"),
            url: sanitize(item.link, true),
            postedAt: item.pubDate ? new Date(item.pubDate) : new Date()
          };

          await jobQueue.add(jobData);
          console.log(` [queued] ${jobData.title}`);
        } catch (jobErr) {
          console.error(` Error processing job item:`, jobErr.message);
        }
      }

    } catch (fetchErr) {
      console.error(` Failed to fetch feed: ${url}`, fetchErr.message);
    }
  }
};

// Run every hour
cron.schedule("0 * * * *", fetchAndProcess);

// Also run once on start
fetchAndProcess();

module.exports = fetchAndProcess;
