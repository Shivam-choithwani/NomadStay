import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviews = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/reviews", {
        params: {
          page: currentPage,
          limit: 10,
        },
      });
      setReviews(data.reviews);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [currentPage]);

  const handleDeleteReview = async (id) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete review");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Review feedback and moderate inappropriate text comments.</p>
      </div>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Author</th>
                <th className="p-4">Target User</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Comments</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                    Fetching reviews database records...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/40">
                    <td className="p-4 text-left">
                      {item.author ? (
                        <div>
                          <p className="font-semibold text-gray-900">{item.author.name}</p>
                          <p className="text-xs text-gray-500">{item.author.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-450 italic">Deleted User</span>
                      )}
                    </td>
                    <td className="p-4 text-left">
                      {item.target ? (
                        <div>
                          <p className="font-semibold text-gray-900">{item.target.name}</p>
                          <p className="text-xs text-gray-500">{item.target.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-450 italic">Deleted User</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-base">★</span>
                        <span className="font-bold text-gray-800">{item.rating}</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs truncate text-gray-650" title={item.text}>
                      {item.text}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteReview(item._id)}
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
