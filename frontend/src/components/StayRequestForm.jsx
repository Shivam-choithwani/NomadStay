import { useForm } from "react-hook-form";
import { useState } from "react";
import { createStayRequest } from "../services/stayRequestService";

export default function StayRequestForm({ listingId, maxGuests, onRequestSent }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const arrivalDate = watch("arrivalDate");

  // Get current date string for min date validation
  const todayStr = new Date().toISOString().split("T")[0];

  async function onSubmit(formData) {
    setServerError("");
    setSuccess(false);
    try {
      const payload = {
        listingId,
        message: formData.message,
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
        numberOfGuests: parseInt(formData.numberOfGuests, 10),
      };
      await createStayRequest(payload);
      setSuccess(true);
      reset();
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to send stay request. Please try again.");
    }
  }

  return (
    <div className="bg-surface-container-lowest p-6 border border-outline-variant/30 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] space-y-5 sticky top-28">
      <div>
        <h3 className="font-headline-lg text-on-surface text-xl">Request a Stay</h3>
        <p className="text-sm font-body-sm text-on-surface-variant mt-1">Introduce yourself and ask the host to open their home.</p>
      </div>

      {success && (
        <div className="p-4 bg-tertiary-container/30 border border-tertiary-container text-on-tertiary-container rounded-xl text-sm font-label-md flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Request sent! The host will review it.
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-error-container/30 border border-error-container text-on-error-container rounded-xl text-sm font-label-md flex items-center gap-2">
           <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
           {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Arrival Date */}
        <div>
          <label className="block text-sm font-label-md text-on-surface mb-1.5">Arrival Date</label>
          <input
            type="date"
            min={todayStr}
            {...register("arrivalDate", { required: "Arrival date is required" })}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
          />
          {errors.arrivalDate && <p className="text-xs font-label-sm text-error mt-1.5">{errors.arrivalDate.message}</p>}
        </div>

        {/* Departure Date */}
        <div>
          <label className="block text-sm font-label-md text-on-surface mb-1.5">Departure Date</label>
          <input
            type="date"
            min={arrivalDate || todayStr}
            {...register("departureDate", {
              required: "Departure date is required",
              validate: (val) => !arrivalDate || val >= arrivalDate || "Departure must be after arrival date",
            })}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
          />
          {errors.departureDate && <p className="text-xs font-label-sm text-error mt-1.5">{errors.departureDate.message}</p>}
        </div>

        {/* Number of Guests */}
        <div>
          <label className="block text-sm font-label-md text-on-surface mb-1.5">Number of Guests</label>
          <input
            type="number"
            min={1}
            max={maxGuests || 10}
            defaultValue={1}
            {...register("numberOfGuests", {
              required: "Number of guests is required",
              min: { value: 1, message: "Must be at least 1 guest" },
              max: { value: maxGuests, message: `This listing only hosts up to ${maxGuests} guests` },
            })}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
          />
          {errors.numberOfGuests && <p className="text-xs font-label-sm text-error mt-1.5">{errors.numberOfGuests.message}</p>}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-label-md text-on-surface mb-1.5">Message to Host</label>
          <textarea
            rows={4}
            placeholder="Introduce yourself, why you're traveling, and why you'd like to stay..."
            {...register("message", {
              required: "A message is required",
              minLength: { value: 20, message: "Please introduce yourself in at least 20 characters" },
            })}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm resize-none"
          />
          {errors.message && <p className="text-xs font-label-sm text-error mt-1.5">{errors.message.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3.5 rounded-xl text-sm font-label-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-primary/20 mt-2 flex items-center justify-center gap-2 active:scale-95"
        >
          {isSubmitting ? (
             <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Sending...
             </>
          ) : (
             <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                Send Proposal
             </>
          )}
        </button>
      </form>
    </div>
  );
}
