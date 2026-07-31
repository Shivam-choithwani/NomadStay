import { useForm } from "react-hook-form";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { resetPassword } from "../services/authService";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const newPassword = watch("password");

  async function onSubmit({ password }) {
    setError("");
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired or is invalid.");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Set New Password</h1>
        <p className="text-sm text-gray-500 mb-6">Enter a strong, secure new password for your account.</p>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-teal-100">
              ✓
            </div>
            <p className="text-sm text-gray-600">Your password has been reset successfully.</p>
            <Link
              to="/login"
              className="inline-block w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => value === newPassword || "Passwords do not match",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
