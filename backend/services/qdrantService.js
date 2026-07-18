const { QdrantClient } = require('@qdrant/js-client-rest');

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = "host_listings";

async function initQdrant() {
  try {
    const response = await qdrant.getCollections();
    const collectionExists = response.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!collectionExists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 3072, // gemini-embedding-001 vector size
          distance: 'Cosine'
        }
      });
      console.log(`Qdrant collection '${COLLECTION_NAME}' created.`);
    }
  } catch (error) {
    console.error("Failed to initialize Qdrant:", error.message);
  }
}

/**
 * Syncs a single listing to Qdrant.
 * @param {Object} listing - The HostListing mongoose document
 * @param {Array<Number>} embedding - The embedding vector
 */
async function upsertListingToQdrant(listing, embedding) {
  try {
    // Qdrant point IDs must be UUID or integer. 
    // We can hash the MongoDB ObjectId to an integer, or pass the ObjectId string if UUID-compatible.
    // MongoDB ObjectId is a 24-char hex string, which doesn't directly map to a standard UUID.
    // However, Qdrant allows passing UUID string. 
    // Let's generate a simple UUID-like string from the ObjectId by padding it.
    const idStr = listing._id.toString();
    const uuidId = `${idStr.substring(0,8)}-${idStr.substring(8,12)}-4000-8000-${idStr.substring(12)}`.padEnd(36, '0');

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: uuidId,
          vector: embedding,
          payload: {
            mongoId: idStr,
            title: listing.title,
            city: listing.city,
            country: listing.country,
            maxGuests: listing.maxGuests,
            isActive: listing.isActive,
          }
        }
      ]
    });
  } catch (error) {
    console.error("Failed to upsert listing to Qdrant:", error);
  }
}

/**
 * Searches Qdrant for similar listings
 * @param {Array<Number>} queryEmbedding 
 * @param {Object} filter - Static filters (e.g., city, maxGuests)
 * @param {Number} limit 
 */
async function searchListings(queryEmbedding, filter = {}, limit = 20) {
  try {
    const qdrantFilter = {
      must: []
    };

    if (filter.city) {
      qdrantFilter.must.push({
        key: "city",
        match: { value: filter.city }
      });
    }

    if (filter.maxGuests) {
      qdrantFilter.must.push({
        key: "maxGuests",
        range: { gte: filter.maxGuests }
      });
    }
    
    // Always filter by isActive
    qdrantFilter.must.push({
      key: "isActive",
      match: { value: true }
    });

    const searchResult = await qdrant.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      filter: qdrantFilter,
      limit: limit,
      with_payload: true,
    });

    return searchResult.map(result => result.payload.mongoId);
  } catch (error) {
    console.error("Failed to search Qdrant:", error);
    return [];
  }
}

module.exports = {
  initQdrant,
  upsertListingToQdrant,
  searchListings
};
