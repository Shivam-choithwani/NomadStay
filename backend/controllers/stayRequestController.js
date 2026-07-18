const StayRequest = require("../models/StayRequest");
const HostListing = require("../models/HostListing");
const { createNotification } = require("../services/notificationService");

// @route POST /api/stay-requests
// @access Private (must be logged in)
async function createStayRequest(req, res) {
  try {
    const { listingId, message, arrivalDate, departureDate, numberOfGuests } = req.body;

    if (!listingId || !message || !arrivalDate || !departureDate) {
      return res.status(400).json({ message: "listingId, message, arrivalDate, and departureDate are required" });
    }

    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);

    if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (arrival >= departure) {
      return res.status(400).json({ message: "Departure date must be after arrival date" });
    }

    if (arrival < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: "Arrival date cannot be in the past" });
    }

    const listing = await HostListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.host.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot request to stay at your own listing" });
    }

    // [CONFLICT CHECK 1] Block if dates overlap an already-accepted booking
    const acceptedConflict = await StayRequest.findOne({
      listing: listingId,
      status: "accepted",
      arrivalDate: { $lt: departure },
      departureDate: { $gt: arrival },
    });
    if (acceptedConflict) {
      return res.status(409).json({
        message: "These dates are already booked. Please choose different dates.",
        conflict: {
          bookedFrom: acceptedConflict.arrivalDate,
          bookedTo: acceptedConflict.departureDate,
        },
      });
    }

    // [CONFLICT CHECK 2] Block duplicate pending request from the same guest
    const duplicatePending = await StayRequest.findOne({
      listing: listingId,
      guest: req.user._id,
      status: "pending",
      arrivalDate: { $lt: departure },
      departureDate: { $gt: arrival },
    });
    if (duplicatePending) {
      return res.status(409).json({
        message: "You already have a pending request for overlapping dates on this listing.",
      });
    }

    const request = await StayRequest.create({
      guest: req.user._id,
      listing: listingId,
      host: listing.host,
      message,
      arrivalDate: arrival,
      departureDate: departure,
      numberOfGuests: numberOfGuests || 1,
    });

    // Notify the host about the new stay request
    try {
      await createNotification({
        recipient: listing.host,
        type: "stay_request",
        title: "New Stay Request Received 📅",
        body: `${req.user.name} sent a request to stay at "${listing.title}".`,
        data: { requestId: request._id, listingId: listing._id },
      });
    } catch (notifErr) {
      console.error("Failed to send stay_request notification:", notifErr);
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: "Failed to create stay request", error: err.message });
  }
}

// @route GET /api/stay-requests
// @access Private
// Supports filtering by role: ?role=guest (requests user sent) or ?role=host (requests host received)
async function getStayRequests(req, res) {
  try {
    const { role } = req.query;
    const query = {};

    if (role === "host") {
      query.host = req.user._id;
    } else if (role === "guest") {
      query.guest = req.user._id;
    } else {
      // Default to either guest or host requests
      query.$or = [{ guest: req.user._id }, { host: req.user._id }];
    }

    const requests = await StayRequest.find(query)
      .populate("guest", "name avatarUrl isVerified")
      .populate("host", "name avatarUrl isVerified")
      .populate("listing", "title city country photos")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stay requests", error: err.message });
  }
}

// @route PATCH /api/stay-requests/:id/status
// @access Private
async function updateStayRequestStatus(req, res) {
  try {
    const { status } = req.body;
    const allowedStatuses = ["accepted", "declined", "cancelled", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const request = await StayRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Stay request not found" });
    }

    const isHost = request.host.toString() === req.user._id.toString();
    const isGuest = request.guest.toString() === req.user._id.toString();

    if (status === "accepted" || status === "declined") {
      if (!isHost) {
        return res.status(403).json({ message: "Only the host can accept or decline a request" });
      }
    }

    if (status === "cancelled") {
      if (!isGuest) {
        return res.status(403).json({ message: "Only the guest can cancel a request" });
      }
    }

    if (status === "completed") {
      if (!isHost && !isGuest) {
        return res.status(403).json({ message: "Unauthorized to complete this request" });
      }
      if (request.status !== "accepted") {
        return res.status(400).json({ message: "Only accepted requests can be completed" });
      }
    }

    request.status = status;
    await request.save();

    // Populate early — needed for notifications and auto-decline messages
    const populatedRequest = await StayRequest.findById(request._id)
      .populate("guest", "name avatarUrl isVerified")
      .populate("host", "name avatarUrl isVerified")
      .populate("listing", "title city country photos");

    // [CONFLICT CHECK 3] When host accepts, auto-decline all other pending requests
    // that overlap the same dates on the same listing
    if (status === "accepted") {
      try {
        const conflictingRequests = await StayRequest.find({
          _id: { $ne: request._id },
          listing: request.listing,
          status: "pending",
          arrivalDate: { $lt: request.departureDate },
          departureDate: { $gt: request.arrivalDate },
        });

        if (conflictingRequests.length > 0) {
          const conflictingIds = conflictingRequests.map((r) => r._id);
          await StayRequest.updateMany(
            { _id: { $in: conflictingIds } },
            { $set: { status: "declined" } }
          );

          // Notify each affected guest
          for (const conflict of conflictingRequests) {
            try {
              await createNotification({
                recipient: conflict.guest,
                type: "stay_request",
                title: "Stay Request Declined ❌",
                body: `Unfortunately, these dates are no longer available at "${populatedRequest.listing.title}". Another booking was confirmed.`,
                data: { requestId: conflict._id, listingId: request.listing },
              });
            } catch (notifErr) {
              console.error("Failed to notify guest of auto-decline:", notifErr);
            }
          }

          console.log(`Auto-declined ${conflictingIds.length} conflicting request(s) for listing ${request.listing}`);
        }
      } catch (autoDeclineErr) {
        console.error("Failed to auto-decline conflicting requests:", autoDeclineErr);
      }
    }

    // If status is completed, save to TravelHistory
    if (status === "completed") {
      try {
        const TravelHistory = require("../models/TravelHistory");
        await TravelHistory.create({
          traveller: request.guest,
          host: request.host,
          listing: request.listing,
          stayRequest: request._id,
          arrivalDate: request.arrivalDate,
          departureDate: request.departureDate,
          status: "completed"
        });
      } catch (historyErr) {
        console.error("Failed to create travel history:", historyErr);
      }
    }

    // Trigger notification
    try {
      let recipientId;
      let title = "";
      let body = "";

      if (status === "accepted") {
        recipientId = request.guest;
        title = "Stay Request Approved! 🎉";
        body = `${populatedRequest.host.name} accepted your stay request at "${populatedRequest.listing.title}".`;
      } else if (status === "declined") {
        recipientId = request.guest;
        title = "Stay Request Declined 😔";
        body = `${populatedRequest.host.name} declined your stay request at "${populatedRequest.listing.title}".`;
      } else if (status === "cancelled") {
        // If guest cancelled, notify host
        recipientId = request.host;
        title = "Stay Request Cancelled ❌";
        body = `${populatedRequest.guest.name} cancelled their stay request at "${populatedRequest.listing.title}".`;
      }

      if (recipientId && title) {
        await createNotification({
          recipient: recipientId,
          type: "stay_request",
          title,
          body,
          data: { requestId: request._id, listingId: populatedRequest.listing._id },
        });
      }
    } catch (notifErr) {
      console.error("Failed to create status change notification:", notifErr);
    }

    res.json(populatedRequest);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
}

module.exports = {
  createStayRequest,
  getStayRequests,
  updateStayRequestStatus,
};
