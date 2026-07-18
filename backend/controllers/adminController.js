const User = require("../models/User");
const HostListing = require("../models/HostListing");
const StayRequest = require("../models/StayRequest");
const Review = require("../models/Review");

// @route GET /api/admin/stats
async function getStats(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await HostListing.countDocuments();
    const totalRequests = await StayRequest.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Group stay requests by status
    const requestStatusStats = await StayRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Average ratings
    const averageRatingRaw = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    const avgRating = averageRatingRaw[0] ? parseFloat(averageRatingRaw[0].avgRating.toFixed(1)) : 0;

    res.json({
      totalUsers,
      totalListings,
      totalRequests,
      totalReviews,
      avgRating,
      requestStatusStats: requestStatusStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admin stats", error: err.message });
  }
}

// @route GET /api/admin/users
async function getUsers(req, res) {
  try {
    const { search, role, isBanned, idVerificationStatus, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;
    if (isBanned) query.isBanned = isBanned === "true";
    if (idVerificationStatus) query.idVerificationStatus = idVerificationStatus;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
}

// @route PATCH /api/admin/users/:id/ban
async function toggleUserBan(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot ban yourself" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ message: `User ${user.isBanned ? "banned" : "unbanned"} successfully`, user });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle ban status", error: err.message });
  }
}

// @route PATCH /api/admin/users/:id/verify-id
async function verifyUserGovId(req, res) {
  try {
    const { status } = req.body; // "approved" or "rejected"
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status, must be approved or rejected" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.idVerificationStatus = status;
    if (status === "approved") {
      user.isVerified = true;
    } else {
      user.isVerified = false;
    }
    await user.save();

    res.json({ message: `Verification status set to ${status}`, user });
  } catch (err) {
    res.status(500).json({ message: "Failed to set verification status", error: err.message });
  }
}

// @route GET /api/admin/listings
async function getListings(req, res) {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const listings = await HostListing.find(query)
      .populate("host", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await HostListing.countDocuments(query);

    res.json({
      listings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listings", error: err.message });
  }
}

// @route DELETE /api/admin/listings/:id
async function deleteListing(req, res) {
  try {
    const listing = await HostListing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete listing", error: err.message });
  }
}

// @route GET /api/admin/reviews
async function getReviews(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const reviews = await Review.find()
      .populate("author", "name email")
      .populate("target", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Review.countDocuments();

    res.json({
      reviews,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
}

// @route DELETE /api/admin/reviews/:id
async function deleteReview(req, res) {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete review", error: err.message });
  }
}

module.exports = {
  getStats,
  getUsers,
  toggleUserBan,
  verifyUserGovId,
  getListings,
  deleteListing,
  getReviews,
  deleteReview,
};
