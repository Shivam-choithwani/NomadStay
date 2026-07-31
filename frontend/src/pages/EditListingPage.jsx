import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { fetchListingById, updateListing } from "../services/listingService";
import { geocodeCity, reverseGeocode } from "../services/geocodeService";
import ImageUploader from "../components/ImageUploader";
import { getImageUrl } from "../services/api";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors, isSubmitting } } = useForm();
  
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const currentLng = watch("longitude");
  const currentLat = watch("latitude");
  
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [images, setImages] = useState([]);

  useEffect(() => {
    async function loadListing() {
      try {
        const listing = await fetchListingById(id);
        
        reset({
          title: listing.title,
          description: listing.description,
          address: listing.address,
          city: listing.city,
          country: listing.country,
          longitude: listing.location?.coordinates[0] || "",
          latitude: listing.location?.coordinates[1] || "",
          maxGuests: listing.maxGuests,
          amenities: listing.amenities ? listing.amenities.join(", ") : "",
          houseRules: listing.houseRules || "",
        });
        
        setExistingPhotos(listing.photos || []);
      } catch (err) {
        setServerError("Failed to load listing details.");
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [id, reset]);

  async function handleAutoFillCoords() {
    const address = getValues("address");
    const city = getValues("city");
    const country = getValues("country");
    
    if (!address || !city || !country) {
      alert("Please enter Address, City, and Country first.");
      return;
    }
    
    setIsGeocoding(true);
    try {
      let geo = await geocodeCity(`${address}, ${city}, ${country}`);
      
      // Fallback: If address is too specific (e.g. contains Apt 4B), Nominatim might fail.
      if (!geo) {
        geo = await geocodeCity(`${city}, ${country}`);
        if (geo) {
          alert("Could not find the exact street address. The pin has been placed at the city center. You can manually adjust the pin using the Latitude/Longitude fields.");
        }
      }

      if (geo) {
        setValue("latitude", geo.lat, { shouldValidate: true });
        setValue("longitude", geo.lng, { shouldValidate: true });
      } else {
        alert("Could not find coordinates for this location.");
      }
    } catch (err) {
      alert("Error fetching coordinates.");
    } finally {
      setIsGeocoding(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setValue("latitude", lat, { shouldValidate: true });
        setValue("longitude", lng, { shouldValidate: true });
        
        try {
          const revGeo = await reverseGeocode(lat, lng);
          if (revGeo) {
            setValue("address", revGeo.address, { shouldValidate: true });
            setValue("city", revGeo.city, { shouldValidate: true });
            setValue("country", revGeo.country, { shouldValidate: true });
          }
        } catch(e) {
          console.error(e);
        } finally {
          setIsGeocoding(false);
        }
      },
      (error) => {
        setIsGeocoding(false);
        alert("Unable to retrieve your location.");
      }
    );
  }

  async function handleMapClick(e) {
    if (e.lngLat) {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      setValue("longitude", lng, { shouldValidate: true });
      setValue("latitude", lat, { shouldValidate: true });
      
      try {
        const revGeo = await reverseGeocode(lat, lng);
        if (revGeo) {
          setValue("address", revGeo.address, { shouldValidate: true });
          setValue("city", revGeo.city, { shouldValidate: true });
          setValue("country", revGeo.country, { shouldValidate: true });
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function onSubmit(formData) {
    setServerError("");
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("address", formData.address);
      data.append("city", formData.city);
      data.append("country", formData.country);
      data.append("longitude", parseFloat(formData.longitude));
      data.append("latitude", parseFloat(formData.latitude));
      data.append("maxGuests", parseInt(formData.maxGuests, 10));
      
      if (formData.amenities) {
        data.append("amenities", formData.amenities);
      }

      if (formData.houseRules) {
        data.append("houseRules", formData.houseRules);
      }

      data.append("existingPhotos", JSON.stringify(existingPhotos));

      images.forEach((file) => {
        data.append("photos", file);
      });

      await updateListing(id, data);
      navigate(`/my-listings`);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to update listing.");
    }
  }

  function handleRemoveExistingPhoto(index) {
    const updated = [...existingPhotos];
    updated.splice(index, 1);
    setExistingPhotos(updated);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/my-listings")} className="text-gray-500 hover:text-gray-900 cursor-pointer">
          ← Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Listing</h1>
      </div>

      {serverError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            {...register("title", { required: "Title is required" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            {...register("description", { required: "Description is required" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
          <input
            {...register("address", { required: "Address is required" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              {...register("city", { required: "City is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              {...register("country", { required: "Country is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>}
          </div>
        </div>

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-stone-800">Map Location</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="text-xs bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg shadow-sm transition font-medium"
              >
                🎯 Use My Location
              </button>
              <button
                type="button"
                onClick={handleAutoFillCoords}
                disabled={isGeocoding}
                className="text-xs bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg shadow-sm transition font-medium disabled:opacity-50"
              >
                {isGeocoding ? "Detecting..." : "📍 Auto-fill"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                {...register("longitude", { required: "Longitude is required" })}
                placeholder="e.g. 2.3522"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
              {errors.longitude && <p className="text-xs text-red-500 mt-1">{errors.longitude.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                {...register("latitude", { required: "Latitude is required" })}
                placeholder="e.g. 48.8566"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
              {errors.latitude && <p className="text-xs text-red-500 mt-1">{errors.latitude.message}</p>}
            </div>
          </div>
          
          
          {/* Live Map Preview - Always visible so user can click */}
          <div className="h-48 w-full rounded-lg border border-stone-200 overflow-hidden relative mt-4 cursor-crosshair">
            <Map
              key={`${currentLng}-${currentLat}`} // Forces re-render on coordinate change
              initialViewState={{
                longitude: (currentLng && !isNaN(parseFloat(currentLng))) ? parseFloat(currentLng) : -95.7129,
                latitude: (currentLat && !isNaN(parseFloat(currentLat))) ? parseFloat(currentLat) : 37.0902,
                zoom: (currentLng && currentLat) ? 13 : 2
              }}
              mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
              mapLib={maplibregl}
              scrollZoom={true}
              onClick={handleMapClick}
            >
              <NavigationControl position="bottom-right" />
              {(currentLng && currentLat && !isNaN(parseFloat(currentLng)) && !isNaN(parseFloat(currentLat))) && (
                <Marker longitude={parseFloat(currentLng)} latitude={parseFloat(currentLat)}>
                  <div className="bg-teal-600/20 w-12 h-12 rounded-full flex items-center justify-center animation-pulse">
                    <div className="bg-teal-600 w-3 h-3 rounded-full border-2 border-white shadow-md"></div>
                  </div>
                </Marker>
              )}
            </Map>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Tip: You can click anywhere on the map to accurately place your pin.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max guests</label>
          <input
            type="number"
            min={1}
            {...register("maxGuests")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
          <input
            {...register("amenities")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">House Rules</label>
          <textarea
            rows={3}
            {...register("houseRules")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
        </div>

        {/* Display existing photos */}
        {existingPhotos.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Photos</label>
            <div className="grid grid-cols-3 gap-2">
              {existingPhotos.map((url, idx) => (
                <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  <img src={getImageUrl(url)} alt="listing" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPhoto(idx)}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Add New Photos</label>
          <ImageUploader images={images} setImages={setImages} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50 mt-4 cursor-pointer"
        >
          {isSubmitting ? "Saving changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
