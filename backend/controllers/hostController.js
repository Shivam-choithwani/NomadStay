const User = require("../models/User");
const HostListing = require("../models/HostListing");
const Review = require("../models/Review");

// @route GET /api/hosts
async function getHosts(req, res) {
  try {
    const { city, country, hostName, languages, verified, maxGuests, amenities, page = 1, limit = 10, sortBy } = req.query;

    const userQuery = { isHost: true, isBanned: false };

    // Filter by location
    if (city) userQuery.locationCity = { $regex: city, $options: "i" };
    if (country) userQuery.locationCountry = { $regex: country, $options: "i" };

    // Filter by name
    if (hostName) userQuery.name = { $regex: hostName, $options: "i" };

    // Filter by verification status
    if (verified === "true") userQuery.isVerified = true;

    // Filter by languages
    if (languages) {
      const langArray = typeof languages === "string"
        ? languages.split(",").map((l) => l.trim()).filter(Boolean)
        : languages;
      if (langArray.length > 0) {
        userQuery.languages = { $in: langArray };
      }
    }

    // Filter by listing specs (guests, amenities)
    const listingFilters = {};
    let needListingFilter = false;

    if (maxGuests) {
      listingFilters.maxGuests = { $gte: parseInt(maxGuests, 10) };
      needListingFilter = true;
    }

    if (amenities) {
      const amenArray = typeof amenities === "string"
        ? amenities.split(",").map((a) => a.trim()).filter(Boolean)
        : amenities;
      if (amenArray.length > 0) {
        listingFilters.amenities = { $all: amenArray };
        needListingFilter = true;
      }
    }

    if (needListingFilter) {
      const matchingListings = await HostListing.find(listingFilters).select("host");
      const hostIds = matchingListings.map((l) => l.host);
      userQuery._id = { $in: hostIds };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Fetch hosts
    const hosts = await User.find(userQuery)
      .select("-password -refreshToken -passwordResetToken -emailVerificationToken")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Populate listings & review stats
    const hostsWithDetails = await Promise.all(
      hosts.map(async (host) => {
        const listings = await HostListing.find({ host: host._id, isActive: true });
        const hostReviews = await Review.find({ target: host._id, type: "guest-to-host" });
        const reviewsCount = hostReviews.length;
        const averageRating = reviewsCount > 0
          ? parseFloat((hostReviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1))
          : 0;

        return {
          ...host,
          listings,
          reviewsCount,
          averageRating,
        };
      })
    );

    // Sorting
    if (sortBy === "highestRated") {
      hostsWithDetails.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === "recentlyActive") {
      hostsWithDetails.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    const total = await User.countDocuments(userQuery);

    res.json({
      hosts: hostsWithDetails,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch hosts", error: err.message });
  }
}

module.exports = {
  getHosts,
};
