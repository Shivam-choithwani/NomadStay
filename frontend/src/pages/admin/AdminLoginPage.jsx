import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";

export default function AdminLoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  async function onSubmit(formData) {
    setServerError("");
    try {
      const { accessToken, user } = await loginUser(formData);
      
      // Strict Role Check for Admin Portal
      if (user.role !== "admin") {
        await logout(); // Ensure any token in memory is wiped
        setServerError("Access denied. You do not have administrative privileges.");
        return;
      }

      login(user, accessToken);
      navigate("/admin");
    } catch (err) {
      setServerError(err.response?.data?.message || "Login failed. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-surface-container-highest flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-body-md">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-on-surface">Admin Portal</h2>
        <p className="mt-2 text-center text-sm text-on-surface-variant">
          Secure access for authorized personnel only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-8 px-4 shadow-xl border border-outline-variant rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">
                Admin Email
              </label>
              <div className="mt-1 relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant group-focus-within:text-primary transition-colors">mail</span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-outline/50 focus:outline-none focus:ring-primary focus:border-primary bg-surface-container-low text-on-surface sm:text-sm transition-colors"
                  placeholder="admin@nomadestay.com"
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-error">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="mt-1 relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant group-focus-within:text-primary transition-colors">lock</span>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-outline/50 focus:outline-none focus:ring-primary focus:border-primary bg-surface-container-low text-on-surface sm:text-sm transition-colors"
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                />
              </div>
              {errors.password && <p className="mt-2 text-sm text-error">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-xl bg-error/10 p-4 border border-error/20">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-error">{serverError}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-on-primary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Authenticating..." : "Sign in to Dashboard"}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-outline-variant text-center">
             <button onClick={() => navigate("/")} className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto">
               <span className="material-symbols-outlined text-[16px]">arrow_back</span>
               Return to public site
             </button>
          </div>
        </div>
      </div>
    </main>
  );
}
