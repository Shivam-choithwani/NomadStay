const cron = require("node-cron");
const StayRequest = require("../models/StayRequest");
const { createNotification } = require("../services/notificationService");

function startCronJobs() {
  // Run every hour at the top of the hour
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Running auto-expire check for pending stay requests...");
    try {
      // Find requests older than 48 hours that are still pending
      const expirationTime = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const expiredRequests = await StayRequest.find({
        status: "pending",
        createdAt: { $lt: expirationTime },
      })
      .populate("listing", "title")
      .populate("guest", "name")
      .populate("host", "name");

      if (expiredRequests.length === 0) {
        return;
      }

      console.log(`[CRON] Found ${expiredRequests.length} expired requests. Declining them...`);

      const expiredIds = expiredRequests.map(r => r._id);
      
      // Bulk update the status to declined
      await StayRequest.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: "declined" } }
      );

      // Send notifications to both guest and host
      for (const request of expiredRequests) {
        // Notify Guest
        try {
          await createNotification({
            recipient: request.guest._id,
            type: "stay_request",
            title: "Request Expired ⏳",
            body: `Your request for "${request.listing.title}" expired because the host didn't respond in time.`,
            data: { requestId: request._id, listingId: request.listing._id },
          });
        } catch (err) {
          console.error("Failed to notify guest of expiration:", err);
        }

        // Notify Host
        try {
          await createNotification({
            recipient: request.host._id,
            type: "stay_request",
            title: "Request Auto-Declined ⏳",
            body: `A request from ${request.guest.name} for "${request.listing.title}" automatically expired after 48 hours.`,
            data: { requestId: request._id, listingId: request.listing._id },
          });
        } catch (err) {
          console.error("Failed to notify host of expiration:", err);
        }
      }

      console.log(`[CRON] Successfully auto-declined ${expiredIds.length} requests.`);
    } catch (err) {
      console.error("[CRON] Error during auto-expire check:", err);
    }
  });

  console.log("Cron jobs initialized.");
}

module.exports = { startCronJobs };
