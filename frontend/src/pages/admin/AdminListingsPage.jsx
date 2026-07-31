import { useEffect, useState } from "react";
import api from "../../services/api";
import { getImageUrl } from "../../services/api";
import { Link } from "react-router-dom";

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadListings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/listings", {
        params: {
          search,
          page: currentPage,
          limit: 10,
        },
      });
      setListings(data.listings);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [search, currentPage]);

  const handleDeleteListing = async (id) => {
    if (!confirm("Are you sure you want to force-delete this listing?")) return;
    try {
      await api.delete(`/admin/listings/${id}`);
      loadListings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete listing");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Listings</h1>
        <p className="text-sm text-gray-500 mt-1">Review host listings and moderate inappropriate content.</p>
      </div>

      <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm max-w-sm">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search stays/city</label>
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Listing</th>
                <th className="p-4">Location</th>
                <th className="p-4">Host</th>
                <th className="p-4">Max Guests</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                    Fetching listings database records...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                    No listings found.
                  </td>
                </tr>
              ) : (
                listings.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/40">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-12 h-8 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                        {item.photos?.[0] ? (
                          <img src={getImageUrl(item.photos[0])} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-gray-400">No Photo</span>
                        )}
                      </div>
                      <div>
                        <Link to={`/listings/${item._id}`} className="font-semibold text-teal-600 hover:underline">
                          {item.title}
                        </Link>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-750">
                      {item.city}, {item.country}
                    </td>
                    <td className="p-4 text-gray-600 text-left">
                      {item.host ? (
                        <div>
                          <p className="font-medium text-gray-900">{item.host.name}</p>
                          <p className="text-xs text-gray-500">{item.host.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-450 italic">Deleted User</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-750 font-medium">
                      Up to {item.maxGuests} guests
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteListing(item._id)}
                        className="text-xs font-bold bg-red-50 hover:bg-red-100/50 text-red-650 px-3 py-1.5 rounded-lg border border-red-200 transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-gray-150">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer text-xs font-semibold text-gray-65"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer text-xs font-semibold text-gray-65"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
