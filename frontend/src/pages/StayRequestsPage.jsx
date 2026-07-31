import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStayRequests, updateStayRequestStatus } from "../services/stayRequestService";
import { getImageUrl } from "../services/api";
import { createReview } from "../services/reviewService";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { createConversation } from "../services/conversationService";
import { useNavigate } from "react-router-dom";

export default function StayRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("sent"); // 'sent' or 'received'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setActiveConversation } = useChatStore();

  // Review modal state
  const [reviewingRequest, setReviewingRequest] = useState(null); // request object
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  async function loadRequests() {
    setIsLoading(true);
    setError("");
    try {
      const role = activeTab === "received" ? "host" : "guest";
      const data = await fetchStayRequests(role);
      setRequests(data);
    } catch (err) {
      setError("Failed to load requests.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(requestId, status) {
    if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return;
    try {
      const updated = await updateStayRequestStatus(requestId, status);
      // Update local state
      setRequests((prev) => prev.map((r) => (r._id === requestId ? updated : r)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update request status.");
    }
  }

  async function handleMessageUser(targetUserId) {
    try {
      const conv = await createConversation(targetUserId);
      setActiveConversation(conv);
      navigate("/messages");
    } catch (err) {
      alert("Failed to start conversation.");
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!reviewText) return;
    setIsSubmittingReview(true);
    setReviewSuccess("");
    setReviewError("");

    try {
      await createReview({
        stayRequestId: reviewingRequest._id,
        rating,
        text: reviewText,
      });
      setReviewSuccess("Review submitted successfully!");
      setReviewText("");
      setRating(5);
      setTimeout(() => {
        setReviewingRequest(null);
        setReviewSuccess("");
      }, 1500);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-secondary-container text-on-secondary-container border-secondary-container/20";
      case "accepted":
        return "bg-tertiary-container text-on-tertiary-container border-tertiary-container/20";
      case "declined":
        return "bg-error-container text-on-error-container border-error-container/20";
      case "cancelled":
        return "bg-surface-variant text-on-surface-variant border-outline-variant/30";
      case "completed":
        return "bg-primary-container text-on-primary-container border-primary-container/20";
      default:
        return "bg-surface-variant text-on-surface-variant border-outline-variant/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return "hourglass_empty";
      case "accepted": return "check_circle";
      case "declined": return "cancel";
      case "cancelled": return "not_interested";
      case "completed": return "task_alt";
      default: return "help";
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24 md:pb-12 pt-8 selection:bg-primary-container selection:text-on-primary-container">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        <div className="mb-10">
          <h1 className="font-display-lg text-4xl text-on-surface mb-2 tracking-tight">Stay Requests</h1>
          <p className="font-body-lg text-on-surface-variant">Manage your travel proposals and hosting requests.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/30 mb-10 gap-8">
          <button
            onClick={() => setActiveTab("sent")}
            className={`pb-4 text-sm font-label-lg transition-colors cursor-pointer relative ${
              activeTab === "sent"
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            My Travel Requests (Sent)
            {activeTab === "sent" && (
              <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
            )}
          </button>
          {user?.isHost && (
            <button
              onClick={() => setActiveTab("received")}
              className={`pb-4 text-sm font-label-lg transition-colors cursor-pointer relative ${
                activeTab === "received"
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Hosting Requests (Received)
              {activeTab === "received" && (
                <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
              )}
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        )}
        
        {error && (
          <div className="p-6 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3">
             <span className="material-symbols-outlined">error</span>
             <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && requests.length === 0 && (
          <div className="text-center py-24 bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">luggage</span>
            <p className="text-on-surface-variant font-body-lg mb-6">You don't have any requests here yet.</p>
            <Link to="/explore" className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-lg px-8 py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all">
              <span className="material-symbols-outlined">explore</span>
              Explore Listings
            </Link>
          </div>
        )}

        {!isLoading && !error && requests.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((req) => {
              const isGuest = activeTab === "sent";
              const targetUser = isGuest ? req.host : req.guest;
              const targetUserAvatar = targetUser?.avatarUrl ? getImageUrl(targetUser.avatarUrl) : null;

              return (
                <div
                  key={req._id}
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col hover:border-primary/30 transition-colors duration-300"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-outline-variant/20 flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-headline-lg text-xl text-on-surface mb-1">
                        {req.listing?.title || "Unknown Listing"}
                      </h3>
                      <p className="text-sm text-on-surface-variant font-body-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {req.listing ? `${req.listing.city}, ${req.listing.country}` : "Location unavailable"}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-label-sm uppercase tracking-wider ${getStatusBadgeClass(req.status)}`}>
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {getStatusIcon(req.status)}
                      </span>
                      {req.status}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col gap-6">
                    <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl">
                      <div>
                        <p className="text-xs font-label-sm text-on-surface-variant uppercase mb-1">Dates</p>
                        <p className="font-body-md text-on-surface font-semibold">
                          {new Date(req.arrivalDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - {new Date(req.departureDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-outline-variant/30"></div>
                      <div>
                        <p className="text-xs font-label-sm text-on-surface-variant uppercase mb-1">Guests</p>
                        <p className="font-body-md text-on-surface font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">group</span>
                          {req.numberOfGuests}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-label-sm text-on-surface-variant uppercase mb-2">Message / Proposal</p>
                      <div className="p-4 bg-surface border border-outline-variant/30 rounded-2xl text-sm font-body-md text-on-surface-variant whitespace-pre-wrap relative italic">
                        "{req.message}"
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-lowest bg-surface-container-high shadow-sm">
                          {targetUserAvatar ? (
                            <img src={targetUserAvatar} alt={targetUser?.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                              {targetUser?.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-label-sm text-on-surface-variant uppercase">{isGuest ? "Host" : "Traveler"}</p>
                          <Link to={`/profile/${targetUser?._id}`} className="font-headline-md text-on-surface hover:text-primary transition-colors">
                            {targetUser?.name}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 bg-surface-container/30 border-t border-outline-variant/20 flex flex-wrap gap-3 justify-end items-center">
                    
                    {/* Host Actions */}
                    {!isGuest && req.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(req._id, "declined")}
                          className="px-5 py-2.5 rounded-xl border border-error/30 text-error font-label-md hover:bg-error-container hover:border-error transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(req._id, "accepted")}
                          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                          Accept Request
                        </button>
                      </>
                    )}

                    {!isGuest && req.status === "accepted" && (
                      <>
                        <button
                          onClick={() => handleMessageUser(targetUser._id)}
                          className="px-5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface font-label-md hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                          Message
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(req._id, "completed")}
                          className="px-5 py-2.5 rounded-xl bg-tertiary text-on-tertiary font-label-md shadow-md shadow-tertiary/20 hover:bg-tertiary/90 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">task_alt</span>
                          Mark Completed
                        </button>
                      </>
                    )}

                    {/* Guest Actions */}
                    {isGuest && req.status === "pending" && (
                      <button
                        onClick={() => handleStatusUpdate(req._id, "cancelled")}
                        className="px-5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface font-label-md hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Cancel Request
                      </button>
                    )}

                    {isGuest && req.status === "accepted" && (
                      <button
                        onClick={() => handleMessageUser(targetUser._id)}
                        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        Message Host
                      </button>
                    )}

                    {/* Completed / Review */}
                    {req.status === "completed" && (
                      <button
                        onClick={() => setReviewingRequest(req)}
                        className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary font-label-md shadow-md shadow-secondary/20 hover:bg-secondary/90 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">star</span>
                        Write Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Review Modal Dialog */}
      {reviewingRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface">
              <h3 className="font-headline-lg text-on-surface text-xl">Submit Review</h3>
              <button
                onClick={() => setReviewingRequest(null)}
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-8 space-y-6 flex-1">
              <p className="text-sm font-body-md text-on-surface-variant">
                Write a review for your stay at <strong className="text-on-surface">{reviewingRequest.listing?.title}</strong>.
              </p>

              {reviewSuccess && (
                <div className="p-4 bg-tertiary-container/30 text-on-tertiary-container rounded-xl text-sm font-label-md border border-tertiary-container flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {reviewSuccess}
                </div>
              )}
              {reviewError && (
                <div className="p-4 bg-error-container/30 text-on-error-container rounded-xl text-sm font-label-md border border-error-container flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  {reviewError}
                </div>
              )}

              {/* Rating */}
              <div>
                <label className="block text-sm font-label-md text-on-surface mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className="focus:outline-none cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <span className={`material-symbols-outlined text-4xl ${val <= rating ? "text-tertiary" : "text-outline-variant/50"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div>
                <label className="block text-sm font-label-md text-on-surface mb-2">Comments</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setReviewingRequest(null)}
                  className="flex-1 py-3.5 border border-outline-variant bg-surface text-on-surface rounded-xl text-sm font-label-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 bg-primary hover:bg-primary/90 text-on-primary font-label-lg py-3.5 rounded-xl text-sm transition-all shadow-md shadow-primary/20 cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingReview ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Submitting...
                    </>
                  ) : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
