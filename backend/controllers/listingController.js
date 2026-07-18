const HostListing = require("../models/HostListing");
const jwt = require("jsonwebtoken");

// Helper: Privacy protection to avoid exposing exact address to public users
function jitterLocation(coords) {
  // Adds roughly up to ~300-500 meters of random jitter
  const lngOffset = (Math.random() - 0.5) * 0.006;
  const latOffset = (Math.random() - 0.5) * 0.006;
  return [coords[0] + lngOffset, coords[1] + latOffset];
}

// @route POST /api/listings
// @access Private (must be logged in)
async function createListing(req, res) {
  try {
    const { title, description, address, city, country, longitude, latitude, maxGuests, amenities } = req.body;

    if (!title || !description || !address || !city || !country || longitude === undefined || latitude === undefined) {
      return res.status(400).json({ message: "title, description, address, city, country, longitude, and latitude are required" });
    }

    if (req.user.idVerificationStatus !== "approved") {
      return res.status(403).json({ message: "You must be Gov-ID verified to host a stay." });
    }

    let parsedAmenities = [];
    if (amenities) {
      parsedAmenities = typeof amenities === "string"
        ? amenities.split(",").map((a) => a.trim()).filter(Boolean)
        : amenities;
    }

    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map((file) => {
        return file.path.startsWith("http")
          ? file.path
          : `/uploads/listings/${file.filename}`;
      });
    }

    const listing = await HostListing.create({
      host: req.user._id,
      title,
      description,
      address,
      city,
      country,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      maxGuests: parseInt(maxGuests, 10) || 1,
      amenities: parsedAmenities,
      photos,
    });

    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ message: "Failed to create listing", error: err.message });
  }
}

// @route GET /api/listings
// @access Public
// Supports geospatial bounds (?swLng, ?swLat, ?neLng, ?neLat), nearby (?lng, ?lat, ?maxDistanceKm), and normal filters
async function getListings(req, res) {
  try {
    const { city, country, gender, lng, lat, maxDistanceKm, swLng, swLat, neLng, neLat, host, maxGuests, amenities, page, limit } = req.query;
    const query = { isActive: true };

    if (host) {
      query.host = host;
    }

    if (city) {
      query.city = new RegExp(city, "i"); // case-insensitive partial match
    }
    
    if (country) {
      query.country = new RegExp(country, "i");
    }

    if (gender) {
      const User = require("../models/User");
      const usersWithGender = await User.find({ gender: gender.toLowerCase() }).select("_id").lean();
      const userIds = usersWithGender.map(u => u._id);
      
      if (query.host) {
        // If host was already provided, verify it matches the gender
        if (!userIds.some(id => id.toString() === query.host.toString())) {
           // The provided host does not match the requested gender, so no listings should match.
           return res.json({ listings: [], pagination: { page: 1, limit: 12, totalPages: 0, totalResults: 0 } });
        }
      } else {
        query.host = { $in: userIds };
      }
    }

    if (maxGuests) {
      query.maxGuests = { $gte: parseInt(maxGuests, 10) };
    }

    if (amenities) {
      const amenitiesList = amenities.split(",").map((a) => a.trim()).filter(Boolean);
      if (amenitiesList.length > 0) {
        query.amenities = { $all: amenitiesList };
      }
    }

    // Geospatial "Search this area" bounds search
    if (swLng && swLat && neLng && neLat) {
      query.location = {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)], // Bottom left (South West)
            [parseFloat(neLng), parseFloat(neLat)]  // Top right (North East)
          ]
        }
      };
    } 
    // Geospatial "near me" search
    else if (lng && lat) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: (parseFloat(maxDistanceKm) || 50) * 1000, // convert km to meters
        },
      };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Use lean() so we can freely mutate the result objects (jitter location)
    let listingsQuery = HostListing.find(query).lean();

    // If no coordinates provided, sort by date
    if (!lng || !lat) {
      listingsQuery = listingsQuery.sort({ createdAt: -1 });
    }

    const listings = await listingsQuery
      .populate("host", "name avatarUrl isVerified bio locationCity gender")
      .skip(skip)
      .limit(limitNum);

    // Apply Privacy Jitter to public search results
    const maskedListings = listings.map(l => {
      if (l.location && l.location.coordinates) {
        l.location.coordinates = jitterLocation(l.location.coordinates);
      }
      return l;
    });

    let totalCount = 0;
    if ((lng && lat) || (swLng && swLat && neLng && neLat)) {
      totalCount = await HostListing.find(query).countDocuments();
    } else {
      totalCount = await HostListing.countDocuments(query);
    }

    res.json({
      listings: maskedListings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalResults: totalCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listings", error: err.message });
  }
}

// @route GET /api/listings/:id
// @access Public
async function getListingById(req, res) {
  try {
    const listing = await HostListing.findById(req.params.id).populate("host", "name avatarUrl isVerified bio").lean();
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if requester is the host (using optional auth decoding)
    let isOwner = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decoded.id === listing.host._id.toString()) {
          isOwner = true;
        }
      } catch(e) {
        // Token invalid or expired, ignore and treat as public user
      }
    }

    // Jitter location if not the owner
    if (!isOwner && listing.location && listing.location.coordinates) {
      listing.location.coordinates = jitterLocation(listing.location.coordinates);
    }

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listing", error: err.message });
  }
}

// @route PUT /api/listings/:id
// @access Private (only the host who owns it)
async function updateListing(req, res) {
  try {
    const listing = await HostListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this listing" });
    }

    const { title, description, address, city, country, longitude, latitude, maxGuests, amenities, existingPhotos } = req.body;

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (address) listing.address = address;
    if (city) listing.city = city;
    if (country) listing.country = country;

    if (longitude !== undefined && latitude !== undefined) {
      listing.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    if (maxGuests !== undefined) {
      listing.maxGuests = parseInt(maxGuests, 10) || 1;
    }

    if (amenities !== undefined) {
      listing.amenities = typeof amenities === "string"
        ? amenities.split(",").map((a) => a.trim()).filter(Boolean)
        : amenities;
    }

    // Handle photos updating
    let currentPhotos = [];
    if (existingPhotos) {
      currentPhotos = typeof existingPhotos === "string"
        ? JSON.parse(existingPhotos)
        : existingPhotos;
    }

    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map((file) => {
        return file.path.startsWith("http")
          ? file.path
          : `/uploads/listings/${file.filename}`;
      });
      currentPhotos = [...currentPhotos, ...newPhotos];
    }
    
    if (existingPhotos !== undefined || (req.files && req.files.length > 0)) {
      listing.photos = currentPhotos;
    }

    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: "Failed to update listing", error: err.message });
  }
}

// @route DELETE /api/listings/:id
// @access Private (only the host who owns it)
async function deleteListing(req, res) {
  try {
    const listing = await HostListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this listing" });
    }

    await listing.deleteOne();
    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete listing", error: err.message });
  }
}

// @route GET /api/listings/rag-search
// @access Public
// RAG based search: filters static parameters, then searches Qdrant via vector embedding, then reranks via LLM
async function ragSearchListings(req, res) {
  try {
    const { query, city, maxGuests, limit, swLng, swLat, neLng, neLat } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required for RAG search" });
    }

    const { generateEmbedding, rerankListings } = require("../services/llmService");
    const { searchListings } = require("../services/qdrantService");

    // 1. Generate embedding for user query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Perform vector search with static filters
    const filter = {};
    if (city) filter.city = city;
    if (maxGuests) filter.maxGuests = parseInt(maxGuests, 10);

    // If bounding box provided, fetch a larger pool from Qdrant since Qdrant doesn't do geospatial filtering yet
    const hasBounds = swLng && swLat && neLng && neLat;
    const matchLimit = hasBounds ? 100 : (parseInt(limit, 10) || 10);
    const mongoIds = await searchListings(queryEmbedding, filter, matchLimit);

    if (mongoIds.length === 0) {
      return res.json({ listings: [], message: "No matching listings found." });
    }

    // 3. Fetch full listings from MongoDB
    const mongoQuery = { _id: { $in: mongoIds } };
    
    // Apply bounding box locally in Mongo
    if (hasBounds) {
      mongoQuery.location = {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)],
            [parseFloat(neLng), parseFloat(neLat)]
          ]
        }
      };
    }

    let listings = await HostListing.find(mongoQuery)
      .populate("host", "name avatarUrl isVerified bio locationCity")
      .lean();

    // Limit to the requested number of items before sending to LLM for reranking
    const finalLimit = parseInt(limit, 10) || 10;
    listings = listings.slice(0, finalLimit);

    if (listings.length === 0) {
      return res.json({ listings: [], message: "No listings found in this map area for your query." });
    }

    // Jitter locations for privacy
    const maskedListings = listings.map(l => {
      if (l.location && l.location.coordinates) {
        l.location.coordinates = jitterLocation(l.location.coordinates);
      }
      return l;
    });

    // 4. Rerank using LLM based on user query
    const rerankedListings = await rerankListings(query, maskedListings);

    res.json({
      listings: rerankedListings,
    });
  } catch (err) {
    res.status(500).json({ message: "RAG search failed", error: err.message });
  }
}

module.exports = { createListing, getListings, getListingById, updateListing, deleteListing, ragSearchListings };
