const { GoogleGenAI } = require("@google/genai");

// Make sure to initialize this with a valid API key
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Generates an embedding for a given text using Google Gemini
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} The vector embedding
 */
async function generateEmbedding(text) {
  if (!ai) {
    console.warn("GEMINI_API_KEY not set, using dummy embedding (for dev only)");
    // Return a dummy 3072-dimensional vector matching Qdrant collection size
    return Array(3072).fill(0.1);
  }

  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
    });
    return response.embeddings[0].values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Uses Gemini to rerank and explain the top listings based on the user's query
 * @param {string} query - The natural language query from the user
 * @param {Array} listings - The top candidate listings retrieved from static/vector search
 * @returns {Promise<Array>} Reranked listings with explanation
 */
async function rerankListings(query, listings) {
  if (!ai || listings.length === 0) return listings;

  try {
    const prompt = `
    You are an expert travel agent. A user is looking for a place to stay with the following requirements:
    "${query}"

    Here are the candidate listings:
    ${listings.map((l, index) => `
    [ID: ${l._id}]
    Title: ${l.title}
    City: ${l.city}
    Description: ${l.description}
    Amenities: ${l.amenities.join(", ")}
    Rules: ${l.houseRules}
    `).join("\n")}

    Please analyze these listings against the user's requirements and rank them from best match to worst match.
    Provide a JSON response with the following format:
    [
      { "id": "listing_id_here", "reason": "Why this is a good match or why it fell short" }
    ]
    Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let resultText = response.text;
    resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const ranking = JSON.parse(resultText);
      
      // Map reasoning back to the listings and sort them based on the LLM's order
      const rerankedListings = [];
      ranking.forEach(rank => {
        const listing = listings.find(l => l._id.toString() === rank.id);
        if (listing) {
          rerankedListings.push({
            ...listing,
            ragReason: rank.reason
          });
        }
      });

      // Append any listings that the LLM might have missed
      listings.forEach(l => {
        if (!rerankedListings.find(rl => rl._id.toString() === l._id.toString())) {
          rerankedListings.push({
            ...l,
            ragReason: "Not explicitly ranked by AI."
          });
        }
      });

      return rerankedListings;
    } catch (parseErr) {
      console.error("Failed to parse LLM JSON response:", parseErr, resultText);
      return listings; // Fallback to original
    }
  } catch (error) {
    console.error("Error reranking listings:", error);
    return listings; // Fallback
  }
}

module.exports = {
  generateEmbedding,
  rerankListings
};
