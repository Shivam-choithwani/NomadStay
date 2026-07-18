const { Worker } = require("bullmq");
const { redisConnection } = require("./redisClient");
const { generateEmbedding } = require("../services/llmService");
const { upsertListingToQdrant } = require("../services/qdrantService");

console.log("[BullMQ Worker] Initializing Qdrant sync worker...");

// Create the worker that listens to the 'qdrant-sync' queue
const qdrantWorker = new Worker(
  "qdrant-sync",
  async (job) => {
    console.log(`[BullMQ Worker] Processing job ${job.id} for listing ${job.data._id}`);
    
    const { _id, title, address, city, country, description, amenities, houseRules } = job.data;
    
    // Construct the text to embed, matching the exact format used previously in the Mongoose hook
    const textToEmbed = `
      Title: ${title}
      Address: ${address}
      City: ${city}
      Country: ${country}
      Description: ${description}
      Amenities: ${(amenities || []).join(", ")}
      Rules: ${houseRules || ""}
    `;

    console.log(`[BullMQ Worker] Calling Gemini API for embedding...`);
    const embedding = await generateEmbedding(textToEmbed);
    
    console.log(`[BullMQ Worker] Upserting to Qdrant...`);
    // upsertListingToQdrant expects an object with an _id string
    await upsertListingToQdrant({ _id }, embedding);

    console.log(`[BullMQ Worker] Job ${job.id} completed successfully!`);
    return true; // Mark job as successful
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs at once (respects Gemini rate limits)
  }
);

qdrantWorker.on("completed", (job) => {
  // console.log(`Job ${job.id} completed!`);
});

qdrantWorker.on("failed", (job, err) => {
  console.error(`[BullMQ Worker] Job ${job.id} failed with error:`, err.message);
});

module.exports = { qdrantWorker };
