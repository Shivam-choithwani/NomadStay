import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit({ email }) {
    setMessage("");
    setError("");
    try {
      const response = await forgotPassword(email);
      setMessage(response.message || "A password reset link has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Pane - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900">
        <img 
          src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Peaceful sunset" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-900/90"></div>
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-4xl font-bold text-white mb-4">Don't worry, we've got you.</h2>
          <p className="text-lg text-stone-200">Reset your password to get back to planning your next trip.</p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <Link to="/login" className="text-sm font-bold text-rose-600 hover:text-rose-700 transition">← Back to Log in</Link>
            <h1 className="text-3xl font-extrabold text-stone-900 mt-6">Forgot Password?</h1>
            <p className="text-stone-500 mt-2">Enter your email and we'll send you a link to reset your password.</p>
          </div>

          {message && (
            <div className="mb-6 px-4 py-3 bg-teal-50 border border-teal-100 text-teal-700 rounded-xl text-sm font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-sm mt-1.5 text-red-500">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
