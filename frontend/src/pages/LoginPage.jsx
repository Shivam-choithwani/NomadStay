import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../services/authService";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  async function onSubmit(formData) {
    setServerError("");
    try {
      const { accessToken, user } = await loginUser(formData);
      login(user, accessToken);
      navigate("/explore");
    } catch (err) {
      setServerError(err.response?.data?.message || "Login failed. Please try again.");
    }
  }

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-background font-body-md text-body-md text-on-background">
      {/* Left/Top: Hero Image Section */}
      <section className="h-[40vh] md:h-screen md:w-1/2 relative overflow-hidden">
        <img
          alt="Digital nomads working"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI--y36hNeHEp1zaybWS_NkgE89dhdpudYDEQWzbJQSYIHBD9JizND_SyZjNTi5TOCZAHDbiJRdIxPEFTmOgc4knrPxhRodCLFds44GEUwuv58LIqKnnSFaWPJl2fnMxvOYEDAoRMhP73ccmSTdSW0sKIjz6iyvKxOHyJq9ukZcfSP67OSio2iPlWyuNWATArDMsTL2eXhbCfYeQBpXZLi8fmh3LP9FTnS36Btdsh1N96cecb9gp6G32ZgIjO4lT4XILrx0DGNhW4"
        />
        {/* Branding Overlay (Desktop Only) */}
        <div className="hidden md:flex absolute inset-0 bg-black/20 flex-col justify-end p-margin-desktop text-white">
          <div className="mb-8">
            <span className="material-symbols-outlined text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
            <h1 className="font-display-lg text-display-lg max-w-md">Find your base. Share your journey.</h1>
            <p className="font-body-lg text-body-lg mt-4 max-w-sm opacity-90">Join the world's most curated community of digital nomads and remote professionals.</p>
          </div>
        </div>
        {/* Branding Overlay (Mobile Logo) */}
        <div className="md:hidden absolute top-0 left-0 w-full p-margin-mobile flex justify-center">
          <Link to="/" className="bg-surface-container-lowest/90 backdrop-blur-md rounded-full px-6 py-2 flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
            <span className="font-headline-md text-headline-md text-primary tracking-tight">NomadeStay</span>
          </Link>
        </div>
      </section>

      {/* Right/Bottom: Form Section */}
      <section className="flex-grow md:w-1/2 flex flex-col items-center justify-center relative -mt-10 md:mt-0 z-10">
        <div className="w-full h-full bg-surface-container-lowest md:bg-transparent rounded-t-[40px] md:rounded-none px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col max-w-[500px] mx-auto shadow-[0px_-8px_40px_rgba(0,0,0,0.08)] md:shadow-none">
          
          {/* Toggle: Login / Register */}
          <div className="flex items-center justify-center mb-stack-lg p-1 bg-surface-container rounded-full w-full max-w-[320px] mx-auto">
            <Link to="/login" className="flex-1 text-center py-3 px-6 rounded-full font-label-md text-label-md bg-surface-container-lowest text-primary shadow-sm transition-all">Sign In</Link>
            <Link to="/register" className="flex-1 text-center py-3 px-6 rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Register</Link>
          </div>

          {/* Header Info */}
          <div className="text-center md:text-left mb-stack-lg">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Welcome Back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Access your nomad dashboard and global stays.</p>
          </div>

          {/* Form */}
          <form className="space-y-stack-lg w-full" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1 uppercase" htmlFor="email">Email Address</label>
              <div className="relative flex items-center focus-within:shadow-[0_0_0_4px_rgba(0,92,187,0.1)] rounded-xl border border-outline-variant bg-surface-container-lowest transition-all group focus-within:border-primary">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant group-focus-within:text-primary transition-colors">mail</span>
                <input 
                  className="w-full pl-12 pr-4 py-4 h-[56px] bg-transparent border-none focus:ring-0 rounded-xl text-on-surface font-body-md placeholder:text-outline/50 outline-none" 
                  id="email" 
                  placeholder="nomad@nomadestay.com" 
                  type="email"
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email && <p className="text-sm mt-1.5 text-error">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-1">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="password">Password</label>
                <a className="font-label-sm text-label-sm text-primary hover:underline transition-all" href="#">Forgot Password?</a>
              </div>
              <div className="relative flex items-center focus-within:shadow-[0_0_0_4px_rgba(0,92,187,0.1)] rounded-xl border border-outline-variant bg-surface-container-lowest transition-all group focus-within:border-primary">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  className="w-full pl-12 pr-12 py-4 h-[56px] bg-transparent border-none focus:ring-0 rounded-xl text-on-surface font-body-md placeholder:text-outline/50 outline-none" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                  {...register("password", { required: "Password is required" })}
                />
              </div>
              {errors.password && <p className="text-sm mt-1.5 text-error">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium bg-error-container text-on-error-container">
                {serverError}
              </div>
            )}

            {/* Submit Button */}
            <button 
              className="w-full h-[56px] bg-primary text-on-primary font-label-md text-label-md rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
              {!isSubmitting && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center my-stack-lg w-full">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="px-4 font-label-sm text-label-sm text-on-surface-variant bg-surface-container-lowest">Or continue with</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/google`} className="flex items-center justify-center gap-3 h-[56px] border border-outline-variant rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container transition-all active:scale-95">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Google
            </a>
            <button className="flex items-center justify-center gap-3 h-[56px] border border-outline-variant rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container transition-all active:scale-95">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05 1.61-3.14 1.61-1.04 0-1.74-.52-2.81-.52-1.06 0-1.89.54-2.83.54-1.04 0-2.09-.61-3.21-1.72C3.12 18.25 1.73 14.48 1.73 11.23c0-3.32 2.13-5.07 4.14-5.07 1.03 0 1.91.43 2.76.43.83 0 1.54-.45 2.84-.45 2.1 0 3.86 1.79 3.86 1.79-.85.95-1.41 2.38-1.41 3.96 0 2.21 1.08 3.73 2.5 4.67-.34.99-.86 1.95-1.37 2.72zM12.03 5.46c.15-1.95 1.77-3.48 3.63-3.46.16 2.05-1.7 3.62-3.63 3.46z"></path>
              </svg>
              Apple
            </button>
          </div>

          {/* Footer Text */}
          <div className="mt-auto pt-stack-lg text-center pb-8">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">Join the community</Link>
            </p>
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-center">
              <Link to="/admin/login" className="text-xs font-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
