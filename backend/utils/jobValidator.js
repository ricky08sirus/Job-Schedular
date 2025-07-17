function validateJobData(data) {
  const errors = [];

  if (!data.title || typeof data.title !== "string") errors.push("Missing or invalid title");
  if (!data.url || typeof data.url !== "string") errors.push("Missing or invalid URL");
  if (!data.company || typeof data.company !== "string") errors.push("Missing or invalid company name");
  if (!data.category || typeof data.category !== "string") errors.push("Missing or invalid category");
  if (!data.jobId || typeof data.jobId !== "string") errors.push("Missing or invalid jobId");

  const valid = errors.length === 0;
  return { valid, errors };
}

module.exports = { validateJobData };
