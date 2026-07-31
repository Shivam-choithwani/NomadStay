import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchListings, deleteListing } from "../services/listingService";
import { getImageUrl } from "../services/api";

export default function MyListingsPage() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMyListings();
  }, [user]);

  async function loadMyListings() {
    if (!user) return;
    try {
      setLoading(true);
      // Pass the host ID to fetch only their listings
      const data = await fetchListings({ host: user.id });
      setListings(data.listings || []);
    } catch (err) {
      setError("Failed to load your listings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteListing(id);
      setListings(listings.filter((l) => l._id !== id));
    } catch (err) {
      alert("Failed to delete listing.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
          <p className="text-gray-500">Manage all the properties you're hosting on NomadeStay.</p>
        </div>
        <Link
          to="/listings/new"
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm"
        >
          + Add New Listing
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
          {error}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">You don't have any listings yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Become a host and start earning by sharing your space with travelers from around the world.
          </p>
          <Link
            to="/listings/new"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {listing.photos && listing.photos.length > 0 ? (
                  <img
                    src={getImageUrl(listing.photos[0])}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm">
                  {listing.city}, {listing.country}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                  {listing.description}
                </p>

                <div className="flex items-center gap-2 mt-auto border-t border-gray-50 pt-4">
                  <Link
                    to={`/my-listings/${listing._id}/edit`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center py-2 rounded-xl text-sm font-semibold transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(listing._id, listing.title)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-center py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Delete
                  </button>
                  <Link
                    to={`/listings/${listing._id}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
                    title="View public listing"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
