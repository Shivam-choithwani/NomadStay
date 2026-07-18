require("dotenv").config();
const mongoose = require("mongoose");
const { QdrantClient } = require("@qdrant/js-client-rest");
const { cloudinary } = require("../config/cloudinary");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stayshare";
const QDRANT_URL = process.env.QDRANT_URL || "http://127.0.0.1:6333";
const COLLECTION_NAME = "listings";

async function wipeData() {
  try {
    console.log("⚠️ Starting data wipe...");

    // 1. Wipe MongoDB
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB. Dropping all collections...");
    
    await mongoose.connection.db.dropDatabase();
    console.log("✅ MongoDB successfully wiped (dropped entire database).");

    // 2. Wipe Qdrant
    console.log(`Connecting to Qdrant...`);
    const qdrantClient = new QdrantClient({ 
      url: QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY
    });
    
    // Check if collection exists before deleting
    const response = await qdrantClient.getCollections();
    const exists = response.collections.some(c => c.name === COLLECTION_NAME);
    
    if (exists) {
      await qdrantClient.deleteCollection(COLLECTION_NAME);
      console.log(`- Deleted Qdrant collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`- Qdrant collection ${COLLECTION_NAME} already empty or missing.`);
    }
    console.log("✅ Qdrant successfully wiped.");

    // 3. Wipe Cloudinary Images
    console.log(`Connecting to Cloudinary...`);
    try {
      await cloudinary.api.delete_resources_by_prefix("stayshare/listings");
      console.log("- Deleted Cloudinary listing images");
      
      await cloudinary.api.delete_resources_by_prefix("stayshare/avatars");
      console.log("- Deleted Cloudinary avatar images");
      
      console.log("✅ Cloudinary successfully wiped.");
    } catch (cloudErr) {
      console.log("⚠️ Could not wipe Cloudinary (maybe it's already empty or config is missing):", cloudErr.message);
    }

  } catch (err) {
    console.error("❌ Error wiping data:", err);
  } finally {
    console.log("Disconnecting from databases. Done.");
    await mongoose.disconnect();
    process.exit(0);
  }
}

wipeData();
