import { useEffect, useState } from "react";
import api from "../../services/api";
import { getImageUrl } from "../../services/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterBanned, setFilterBanned] = useState("");
  const [filterVerify, setFilterVerify] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedIdDoc, setSelectedIdDoc] = useState(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/users", {
        params: {
          search,
          role: filterRole || undefined,
          isBanned: filterBanned || undefined,
          idVerificationStatus: filterVerify || undefined,
          page: currentPage,
          limit: 10,
        },
      });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, filterRole, filterBanned, filterVerify, currentPage]);

  const handleBanToggle = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/ban`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update ban status");
    }
  };

  const handleVerifyId = async (userId, status) => {
    try {
      await api.patch(`/admin/users/${userId}/verify-id`, { status });
      loadUsers();
      setSelectedIdDoc(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify ID");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user roles, bans, and approve uploaded Government IDs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search name/email</label>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter Role</label>
          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
          <select
            value={filterBanned}
            onChange={(e) => { setFilterBanned(e.target.value); setCurrentPage(1); }}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="false">Active Only</option>
            <option value="true">Suspended/Banned</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">ID Verification</label>
          <select
            value={filterVerify}
            onChange={(e) => { setFilterVerify(e.target.value); setCurrentPage(1); }}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">All Verification States</option>
            <option value="none">No ID Uploaded</option>
            <option value="pending">Verification Pending ⏳</option>
            <option value="approved">Approved ✓</option>
            <option value="rejected">Rejected ✗</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Phone Status</th>
                <th className="p-4">Gov ID Document</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                    Fetching users database records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                    No users match your criteria.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/40">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                        {item.avatarUrl ? (
                          <img src={getImageUrl(item.avatarUrl)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-teal-700 uppercase">{item.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-1">
                          {item.name}
                          {item.isVerified && <span className="text-xs" title="Verified Member">✓</span>}
                        </p>
                        <p className="text-xs text-gray-500">{item.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                        item.role === "admin" ? "bg-red-50 text-red-600 border border-red-150" : "bg-gray-100 text-gray-600"
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs ${
                        item.phoneVerificationStatus === "verified" ? "text-green-600 font-semibold" : "text-gray-400 italic"
                      }`}>
                        {item.phoneVerificationStatus === "verified" ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.idDocumentUrl ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedIdDoc(item)}
                            className="w-12 h-8 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center hover:shadow transition cursor-pointer"
                          >
                            <img src={getImageUrl(item.idDocumentUrl)} alt="Gov ID" className="w-full h-full object-cover" />
                          </button>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            item.idVerificationStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                            item.idVerificationStatus === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {item.idVerificationStatus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No Upload</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.isBanned ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {item.isBanned ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleBanToggle(item._id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          item.isBanned
                            ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100/50"
                            : "bg-red-50 text-red-650 border-red-200 hover:bg-red-100/50"
                        }`}
                      >
                        {item.isBanned ? "Activate" : "Suspend"}
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

      {selectedIdDoc && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Review Government ID</h3>
              <button onClick={() => setSelectedIdDoc(null)} className="text-gray-450 hover:text-gray-600 text-xl cursor-pointer">×</button>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600 text-left">
              <p><strong>User:</strong> {selectedIdDoc.name}</p>
              <p><strong>Email:</strong> {selectedIdDoc.email}</p>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
              <img src={getImageUrl(selectedIdDoc.idDocumentUrl)} alt="Gov ID Attachment" className="max-h-full max-w-full object-contain" />
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => handleVerifyId(selectedIdDoc._id, "rejected")}
                className="px-4 py-2 border border-red-200 text-red-650 rounded-xl text-xs font-bold hover:bg-red-50 transition cursor-pointer"
              >
                Reject ID Document
              </button>
              <button
                onClick={() => handleVerifyId(selectedIdDoc._id, "approved")}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Approve & Verify Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
