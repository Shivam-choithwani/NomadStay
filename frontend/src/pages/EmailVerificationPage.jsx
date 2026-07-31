import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyEmail } from "../services/authService";

export default function EmailVerificationPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function executeVerification() {
      try {
        const response = await verifyEmail(token);
        setStatus("success");
        setMessage(response.message || "Email verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Failed to verify email. The token may have expired or is invalid.");
      }
    }
    if (token) {
      executeVerification();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex">
      {/* Left Pane - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900">
        <img 
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Travel adventure" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-900/90"></div>
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-4xl font-bold text-white mb-4">You're almost there.</h2>
          <p className="text-lg text-stone-200">Verify your email to unlock all features and start your journey.</p>
        </div>
      </div>

      {/* Right Pane - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-12">
            <Link to="/" className="text-sm font-bold text-rose-600 hover:text-rose-700 transition">← Back to NomadeStay</Link>
          </div>

          {status === "verifying" && (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto shadow-sm"></div>
              <h1 className="text-3xl font-extrabold text-stone-900">Verifying Email...</h1>
              <p className="text-stone-500">Please wait while we confirm your verification link.</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-teal-100 shadow-sm">
                ✓
              </div>
              <h1 className="text-3xl font-extrabold text-stone-900">Verified!</h1>
              <p className="text-stone-600">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl hover:bg-rose-700 transition shadow-md"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-red-100 shadow-sm">
                !
              </div>
              <h1 className="text-3xl font-extrabold text-stone-900">Verification Failed</h1>
              <p className="text-stone-600">{message}</p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/register"
                  className="inline-block w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl hover:bg-rose-700 transition shadow-md"
                >
                  Create new account
                </Link>
                <Link to="/" className="text-sm font-bold text-rose-600 hover:text-rose-700 transition">
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
