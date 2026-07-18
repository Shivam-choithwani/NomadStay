require("dotenv").config();
const mongoose = require("mongoose");
const HostListing = require("../models/HostListing");
const { generateEmbedding } = require("../services/llmService");
const { initQdrant, upsertListingToQdrant } = require("../services/qdrantService");

async function runSync() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/stayshare");
    console.log("MongoDB connected.");

    console.log("Initializing Qdrant...");
    await initQdrant();

    console.log("Fetching existing host listings...");
    const listings = await HostListing.find({});
    console.log(`Found ${listings.length} listings to sync.`);

    for (let i = 0; i < listings.length; i++) {
      const doc = listings[i];
      console.log(`Syncing ${i + 1}/${listings.length}: ${doc.title}...`);
      
      const textToEmbed = `
      Title: ${doc.title}
      City: ${doc.city}
      Country: ${doc.country}
      Description: ${doc.description}
      Amenities: ${doc.amenities.join(", ")}
      Rules: ${doc.houseRules}
      `;
      
      const embedding = await generateEmbedding(textToEmbed);
      await upsertListingToQdrant(doc, embedding);
    }

    console.log("Sync complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error during sync:", err);
    process.exit(1);
  }
}

runSync();
