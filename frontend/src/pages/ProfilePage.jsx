import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/authStore";
import { 
  updateUserProfile, 
  uploadUserAvatar, 
  uploadGovId, 
  sendPhoneOTP, 
  verifyPhoneOTP 
} from "../services/profileService";
import { resendVerificationEmail } from "../services/authService";
import { getImageUrl } from "../services/api";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ? getImageUrl(user.avatarUrl) : "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Government ID Upload States
  const [idFile, setIdFile] = useState(null);
  const [isUploadingId, setIsUploadingId] = useState(false);

  // Phone OTP Verification States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSentCode, setOtpSentCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (user) {
      setValue("name", user.name);
      setValue("bio", user.bio || "");
      setValue("phone", user.phone || "");
      setValue("locationCity", user.locationCity || "");
      setValue("locationCountry", user.locationCountry || "");
      setValue("gender", user.gender || "");
      setValue("isHost", !!user.isHost);
      setValue("languages", user.languages ? user.languages.join(", ") : "");
      setValue("interests", user.interests ? user.interests.join(", ") : "");
      setValue("travelHistory", user.travelHistory ? user.travelHistory.join(", ") : "");
      setValue("twitter", user.socialLinks?.twitter || "");
      setValue("instagram", user.socialLinks?.instagram || "");
      setValue("facebook", user.socialLinks?.facebook || "");

      if (user.dateOfBirth) {
        setValue("dateOfBirth", user.dateOfBirth.split("T")[0]);
      }
      setAvatarPreview(user.avatarUrl ? getImageUrl(user.avatarUrl) : "");
    }
  }, [user, setValue]);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return;
    setIsUploading(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const data = await uploadUserAvatar(avatarFile);
      setUser(data.user);
      setSuccessMessage("Profile picture updated successfully!");
      setAvatarFile(null);
    } catch (err) {
      setErrorMessage("Failed to upload profile picture. Try again.");
    } finally {
      setIsUploading(false);
    }
  }

  // Handle Gov ID File Select
  function handleIdFileChange(e) {
    setIdFile(e.target.files[0]);
  }

  // Handle Gov ID Upload Submit
  async function handleIdUpload() {
    if (!idFile) return;
    setIsUploadingId(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const data = await uploadGovId(idFile);
      setUser(data.user);
      setSuccessMessage("Government ID uploaded successfully. Admin will review it shortly.");
      setIdFile(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to upload ID document. Try again.");
    } finally {
      setIsUploadingId(false);
    }
  }

  // Handle Phone Verification OTP trigger
  async function handleSendOTP() {
    const phoneVal = getValues("phone"); // get phone field
    // Fallback to fetch from input directly
    const phoneInput = document.getElementById("phone-input")?.value;
    if (!phoneInput) {
      setErrorMessage("Please enter a phone number in the form first and save, or edit profile to verify.");
      return;
    }

    setIsSendingOtp(true);
    setOtpError("");
    setSuccessMessage("");
    try {
      const data = await sendPhoneOTP(phoneInput);
      setOtpSentCode(data.simulatedCode);
      setIsOtpModalOpen(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send verification code.";
      setErrorMessage(msg);
      alert("⚠️ Twilio Error: " + msg + "\n\nCheck your backend terminal (npm run dev) to see if Twilio blocked the message!");
    } finally {
      setIsSendingOtp(false);
    }
  }

  // Handle Resend Email Verification
  async function handleResendEmail() {
    setIsResendingEmail(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await resendVerificationEmail();
      setSuccessMessage("Verification email sent! Check your inbox (or your backend terminal if testing locally).");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to resend email verification.");
    } finally {
      setIsResendingEmail(false);
    }
  }

  // Handle verification submit
  async function handleVerifyOTP() {
    if (!otpCode) {
      setOtpError("Code is required");
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const data = await verifyPhoneOTP(otpCode);
      setUser(data.user);
      setSuccessMessage("Phone number verified successfully!");
      setIsOtpModalOpen(false);
      setOtpCode("");
      setOtpSentCode("");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Verification failed. Try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function onSubmit(formData) {
    setSuccessMessage("");
    setErrorMessage("");
    try {
      // Map flat inputs to structured socialLinks object
      const payload = {
        ...formData,
        socialLinks: {
          twitter: formData.twitter || "",
          instagram: formData.instagram || "",
          facebook: formData.facebook || "",
        }
      };

      const updatedUser = await updateUserProfile(payload);
      setUser(updatedUser);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to update profile.");
    }
  }

  if (!user) {
    return <p className="text-center py-8 text-on-surface-variant font-body-md">Please log in to view your profile.</p>;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 md:pb-8 selection:bg-primary-container selection:text-on-primary-container pt-14">
      
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden border border-outline-variant/30">
          <div className="h-32 bg-gradient-to-r from-secondary to-tertiary opacity-90"></div>
          <div className="px-6 pb-6 relative">
            
            <div className="flex flex-col sm:flex-row justify-between mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative group w-32 h-32 -mt-16 mx-auto sm:mx-0 rounded-full overflow-hidden border-4 border-surface-container-lowest bg-surface-container-high shadow-md shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-4xl font-semibold bg-surface-variant text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-label-md text-label-md opacity-0 group-hover:opacity-100 cursor-pointer transition">
                      Change Photo
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  )}
                </div>
                <div className="text-center sm:text-left mt-2 sm:mt-3 flex flex-col justify-end">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface flex items-center justify-center sm:justify-start gap-1">
                    {user.name}
                    {user.isVerified && (
                      <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified Member">verified</span>
                    )}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">{user.email}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    {user.isEmailVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-container text-on-tertiary-container">
                        ✓ Email Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={isResendingEmail}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-error-container hover:bg-error-container/80 text-on-error-container transition cursor-pointer"
                      >
                        {isResendingEmail ? "Sending..." : "⚠ Email Unverified - Click to Verify"}
                      </button>
                    )}
                    {user.phoneVerificationStatus === "verified" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-container text-on-tertiary-container">
                        ✓ Phone Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-variant text-on-surface-variant">
                        Phone Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-0 flex gap-2 justify-center">
                {isEditing ? (
                  <>
                    {avatarFile && (
                      <button
                        onClick={handleAvatarUpload}
                        disabled={isUploading}
                        className="px-4 py-2 font-label-md text-label-md bg-primary hover:bg-primary/90 text-on-primary rounded-xl transition disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {isUploading ? "Uploading..." : "Save Photo"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setAvatarFile(null);
                      }}
                      className="px-4 py-2 font-label-md text-label-md border border-outline-variant text-on-surface hover:bg-surface-container-low rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 font-label-md text-label-md bg-primary hover:bg-primary/90 text-on-primary rounded-xl transition cursor-pointer shadow-md"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Profile Completion Bar */}
            <div className="mb-6 p-4 bg-primary-container/20 border border-primary-container/30 rounded-2xl space-y-2">
              <div className="flex justify-between items-center font-label-sm text-label-sm text-primary">
                <span className="flex items-center gap-1 uppercase tracking-widest">Profile Completion</span>
                <span>{user.profileCompletion || 0}% Complete</span>
              </div>
              <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${user.profileCompletion || 0}%` }}></div>
              </div>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 bg-tertiary-container border border-tertiary-container/30 text-on-tertiary-container rounded-xl font-body-md text-sm">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 p-3 bg-error-container border border-error-container/30 text-on-error-container rounded-xl font-body-md text-sm">
                {errorMessage}
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2">Full Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    {...register("name", { required: "Name is required" })}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                  />
                  {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2">Phone Number</label>
                  <div className="flex gap-2">
                    <input
                      id="phone-input"
                      type="text"
                      placeholder="e.g. +1 555-0199"
                      disabled={!isEditing}
                      {...register("phone")}
                      className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                    />
                    {user.phoneVerificationStatus !== "verified" && (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={isSendingOtp}
                        className="px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md text-label-md transition cursor-pointer"
                      >
                        {isSendingOtp ? "Sending..." : "Verify"}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2">City</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    {...register("locationCity")}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2">Country</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    {...register("locationCountry")}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2">Gender</label>
                  <select
                    disabled={!isEditing}
                    {...register("gender")}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface cursor-pointer transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-Binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-2">Date of Birth</label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    {...register("dateOfBirth")}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface cursor-pointer transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-label-md text-label-md text-on-surface mb-2">
                    Languages Spoken (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. English, Spanish, French"
                    disabled={!isEditing}
                    {...register("languages")}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-label-md text-label-md text-on-surface mb-2">
                    Interests & Hobbies (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hiking, Cooking, Photography, Chess"
                    disabled={!isEditing}
                    {...register("interests")}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-label-md text-label-md text-on-surface mb-2">
                    Travel History (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. France, Germany, Japan, Australia"
                    disabled={!isEditing}
                    {...register("travelHistory")}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="block font-label-md text-label-md text-on-surface">Social Media Handles (Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Twitter handle"
                      disabled={!isEditing}
                      {...register("twitter")}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Instagram handle"
                      disabled={!isEditing}
                      {...register("instagram")}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Facebook URL"
                      disabled={!isEditing}
                      {...register("facebook")}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-label-md text-label-md text-on-surface mb-2">Bio</label>
                  <textarea
                    rows={4}
                    placeholder="Tell other travelers about yourself, your interests, and your hosting philosophy..."
                    disabled={!isEditing}
                    {...register("bio")}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-variant disabled:text-on-surface-variant font-body-md text-on-surface transition-colors"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3 py-4 border-t border-outline-variant/30">
                  <input
                    type="checkbox"
                    id="isHost"
                    disabled={!isEditing}
                    {...register("isHost")}
                    className="w-5 h-5 rounded text-primary focus:ring-primary border-outline-variant disabled:opacity-50 cursor-pointer"
                  />
                  <label htmlFor="isHost" className="font-body-md text-on-surface cursor-pointer">
                    I want to host travelers (enable hosting profile)
                  </label>
                </div>
              </div>

              {isEditing && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary font-headline-md text-label-md py-4 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              )}
            </form>

            {/* Government ID Upload Card (Uncoupled from Edit Mode) */}
            <div className="mt-8 pt-8 border-t border-outline-variant/30 space-y-4">
              <div>
                <h2 className="font-headline-md text-xl text-on-surface mb-1">Identity Verification</h2>
                <p className="font-body-md text-sm text-on-surface-variant">Secure the verified badge by uploading a picture of your passport or government ID document.</p>
              </div>

              {(!user.idVerificationStatus || user.idVerificationStatus === "none") && (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-6 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdFileChange}
                    className="font-body-md text-sm text-on-surface-variant flex-1"
                  />
                  {idFile && (
                    <button
                      onClick={handleIdUpload}
                      disabled={isUploadingId}
                      className="px-6 py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md text-label-md transition disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      {isUploadingId ? "Uploading..." : "Submit ID"}
                    </button>
                  )}
                </div>
              )}

              {user.idVerificationStatus === "pending" && (
                <div className="p-4 bg-tertiary-container/20 text-on-tertiary-container border border-tertiary-container/30 rounded-2xl font-body-md text-sm flex gap-3 items-center">
                  <span className="material-symbols-outlined text-tertiary">schedule</span>
                  Your Government ID document is currently pending administrative review. We will notify you once verified!
                </div>
              )}

              {user.idVerificationStatus === "approved" && (
                <div className="p-4 bg-tertiary-container text-on-tertiary-container border border-tertiary-container/30 rounded-2xl font-body-md text-sm flex gap-3 items-center">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Identity verified. Your profile now features the verified member badge!
                </div>
              )}

              {user.idVerificationStatus === "rejected" && (
                <div className="space-y-4">
                  <div className="p-4 bg-error-container text-on-error-container border border-error-container/30 rounded-2xl font-body-md text-sm flex gap-3 items-center">
                    <span className="material-symbols-outlined">error</span>
                    ID verification was declined by admin. Please upload a clear photo of your identification to submit again.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-6 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdFileChange}
                      className="font-body-md text-sm text-on-surface-variant flex-1"
                    />
                    {idFile && (
                      <button
                        onClick={handleIdUpload}
                        disabled={isUploadingId}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md text-label-md transition disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {isUploadingId ? "Uploading..." : "Submit ID"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Phone OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-margin-mobile">
          <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-8 space-y-6 transform transition-all fade-in">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
              <h3 className="font-headline-md text-xl text-on-surface">Phone Verification</h3>
              <button onClick={() => setIsOtpModalOpen(false)} className="text-on-surface-variant hover:text-on-surface text-lg cursor-pointer transition-colors p-1 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed text-left">
              We sent a verification code to your phone number. Enter it below to verify.
            </p>

            {otpSentCode && (
              <div className="p-4 bg-secondary-container/20 border border-secondary-container/30 text-on-secondary-container rounded-xl font-label-md text-xs text-center">
                🛠️ Simulated SMS Code: <span className="text-sm font-headline-md block mt-1">{otpSentCode}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Verification Code</label>
              <input
                type="text"
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center text-xl font-headline-md tracking-[0.25em] px-4 py-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
              />
              {otpError && <p className="text-xs text-error font-body-md text-left mt-1">{otpError}</p>}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isVerifyingOtp}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-headline-md text-label-md transition disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/20"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
