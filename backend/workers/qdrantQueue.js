const { Queue } = require("bullmq");
const { redisConnection } = require("./redisClient");

// Create the Qdrant sync queue
const qdrantQueue = new Queue("qdrant-sync", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // Wait 5s before first retry, then 25s, then 125s
    },
    removeOnComplete: true, // Keep Redis clean
    removeOnFail: false, // Keep failed jobs for debugging
  },
});

/**
 * Adds a listing to the background queue for embedding generation and Qdrant indexing.
 * @param {Object} listing - The saved HostListing document from MongoDB
 */
async function addSyncListingJob(listing) {
  try {
    // Pass only the necessary plain data to the worker
    const jobData = {
      _id: listing._id.toString(),
      title: listing.title,
      address: listing.address,
      city: listing.city,
      country: listing.country,
      description: listing.description,
      amenities: listing.amenities || [],
      houseRules: listing.houseRules || "",
    };

    const job = await qdrantQueue.add("sync-listing", jobData);
    console.log(`[BullMQ] Added job ${job.id} to qdrant-sync queue for listing ${listing._id}`);
  } catch (err) {
    console.error("[BullMQ] Failed to add sync job:", err);
  }
}

module.exports = {
  qdrantQueue,
  addSyncListingJob,
};
