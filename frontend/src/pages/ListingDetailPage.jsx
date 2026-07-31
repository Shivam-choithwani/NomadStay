import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchListingById, deleteListing } from "../services/listingService";
import { fetchUserReviews } from "../services/reviewService";
import { useAuthStore } from "../store/authStore";
import { getImageUrl } from "../services/api";
import StayRequestForm from "../components/StayRequestForm";
import ReviewCard from "../components/ReviewCard";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchListingById(id);
        setListing(data);

        // Load host reviews
        if (data.host?._id) {
          const hostReviews = await fetchUserReviews(data.host._id);
          setReviews(hostReviews);
        }
      } catch (err) {
        setError("Listing not found.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    try {
      await deleteListing(id);
      navigate("/");
    } catch (err) {
      alert("Failed to delete listing.");
    }
  }

  const nextPhoto = () => {
    if (listing?.photos?.length) {
      setCurrentPhotoIndex((prev) => (prev + 1) % listing.photos.length);
    }
  };

  const prevPhoto = () => {
    if (listing?.photos?.length) {
      setCurrentPhotoIndex((prev) => (prev - 1 + listing.photos.length) % listing.photos.length);
    }
  };

  if (isLoading) return <p className="max-w-container-max mx-auto px-margin-mobile py-8 text-on-surface-variant">Loading...</p>;
  if (error || !listing) return <p className="max-w-container-max mx-auto px-margin-mobile py-8 text-error">{error || "Listing not found."}</p>;

  const isOwner = user && listing.host?._id === user.id;
  const hostAvatarUrl = listing.host?.avatarUrl ? getImageUrl(listing.host.avatarUrl) : null;

  return (
    <div className="bg-background text-on-background min-h-screen pb-24 md:pb-8 selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top AppBar (Mobile Style - Transparent Header) */}
      <header className="fixed top-0 left-0 w-full z-50 px-margin-mobile py-6 flex justify-between items-center transition-all duration-500" id="top-bar">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-surface-container-lowest/90 backdrop-blur-md text-on-surface rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex gap-2">
          {isOwner && (
            <button 
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center bg-error/90 backdrop-blur-md text-on-error rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-transform"
              title="Delete Listing"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-container-max mx-auto overflow-x-hidden pt-20 md:pt-0">
        {/* Hero Section */}
        {listing.photos && listing.photos.length > 0 ? (
          <section className="relative w-full aspect-[1.49] md:aspect-[2.39] overflow-hidden md:rounded-b-3xl group">
            <img 
              alt={listing.title}
              className="w-full h-full object-cover transition-opacity duration-300"
              src={getImageUrl(listing.photos[currentPhotoIndex])}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none"></div>
            
            {/* Carousel Controls */}
            {listing.photos.length > 1 && (
              <>
                <button 
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-surface-container-lowest/80 hover:bg-surface-container-lowest text-on-surface w-10 h-10 flex items-center justify-center rounded-full shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-surface-container-lowest/80 hover:bg-surface-container-lowest text-on-surface w-10 h-10 flex items-center justify-center rounded-full shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                
                {/* Photo Counter Badge */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white font-label-sm text-label-sm px-3 py-1.5 rounded-full">
                  {currentPhotoIndex + 1} / {listing.photos.length}
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="relative w-full aspect-[1.49] md:aspect-[2.39] bg-surface-variant flex items-center justify-center md:rounded-b-3xl text-4xl">
            🏠
          </section>
        )}

        {/* Content Area */}
        <div className="px-margin-mobile -mt-8 relative z-10 md:px-0 md:mt-12 md:grid md:grid-cols-12 md:gap-gutter">
          <div className="md:col-span-8">
            
            {/* Header Info */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] mb-stack-lg md:p-0 md:bg-transparent md:shadow-none">
              <div className="flex justify-between items-start">
                <div className="space-y-1 pr-4">
                  <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface tracking-tight">{listing.title}</h1>
                  <div className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span>{listing.city}, {listing.country}</span>
                  </div>
                </div>
                <Link to={`/profile/${listing.host?._id}`} className="flex flex-col items-center gap-1 shrink-0 group">
                  <div className="w-14 h-14 rounded-full border-2 border-primary-container p-0.5 overflow-hidden group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold">
                      {hostAvatarUrl ? (
                        <img className="w-full h-full object-cover rounded-full" src={hostAvatarUrl} alt={listing.host?.name} />
                      ) : (
                        listing.host?.name?.charAt(0)
                      )}
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary group-hover:underline">Host</span>
                </Link>
              </div>
            </div>

            {/* About Section */}
            <section className="mb-stack-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">About the Stay</h2>
              <div className="space-y-4 font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </div>
            </section>

            {/* House Rules */}
            {listing.houseRules && (
              <section className="mb-stack-lg">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">House Rules</h2>
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-surface-container-low p-4 rounded-xl">
                  {listing.houseRules}
                </div>
              </section>
            )}

            {/* The Exchange Section (using maxGuests and amenities as proxies for now) */}
            <section className="mb-stack-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">The Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* What you get / Amenities */}
                <div className="p-6 bg-tertiary-container/10 border border-tertiary-container/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-tertiary p-2 bg-tertiary/10 rounded-lg">house_siding</span>
                    <h3 className="font-label-md text-label-md text-on-tertiary-fixed-variant uppercase tracking-widest">Amenities</h3>
                  </div>
                  <ul className="space-y-3 font-body-md text-body-md text-on-surface">
                    {listing.amenities && listing.amenities.length > 0 ? listing.amenities.map(a => (
                      <li key={a} className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        {a}
                      </li>
                    )) : (
                      <li className="text-on-surface-variant italic">No amenities specified.</li>
                    )}
                  </ul>
                </div>

                {/* What you give / Logistics */}
                <div className="p-6 bg-secondary-container/10 border border-secondary-container/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-secondary p-2 bg-secondary/10 rounded-lg">info</span>
                    <h3 className="font-label-md text-label-md text-on-secondary-fixed-variant uppercase tracking-widest">Logistics</h3>
                  </div>
                  <ul className="space-y-3 font-body-md text-body-md text-on-surface">
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                      Max Guests: {listing.maxGuests}
                    </li>
                    {listing.availableDates && listing.availableDates.length > 0 && (
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary text-sm mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                        <div>
                           Available Dates:
                           <div className="flex flex-wrap gap-1 mt-1">
                             {listing.availableDates.map((date) => (
                               <span key={date} className="text-xs bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md font-bold">
                                 {new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                               </span>
                             ))}
                           </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>

              </div>
            </section>

            {/* Reviews Section */}
            <section className="mb-stack-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-on-surface-variant font-body-md text-body-md italic bg-surface-container-low p-4 rounded-xl">No reviews yet for this host.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <ReviewCard key={rev._id} review={rev} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar / Map (Desktop layout) */}
          <div className="md:col-span-4">
            <div className="sticky top-28 space-y-gutter">
              
              {/* Map Preview */}
              <section className="shadow-[0px_4px_20px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden bg-surface-container-lowest">
                <div className="p-5">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Location</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-4">{listing.city}, {listing.country}</p>
                  
                  <div className="w-full h-56 relative rounded-xl overflow-hidden border border-outline-variant/30">
                    {listing.location?.coordinates && (
                      <Map
                        initialViewState={{
                          longitude: listing.location.coordinates[0],
                          latitude: listing.location.coordinates[1],
                          zoom: 13
                        }}
                        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                        mapLib={maplibregl}
                        scrollZoom={false}
                      >
                        <NavigationControl position="bottom-right" />
                        <Marker longitude={listing.location.coordinates[0]} latitude={listing.location.coordinates[1]}>
                          <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center animate-pulse">
                            <div className="bg-primary w-4 h-4 rounded-full border-2 border-surface-container-lowest shadow-md"></div>
                          </div>
                        </Marker>
                      </Map>
                    )}
                  </div>
                  
                  {!isOwner && (
                    <p className="text-xs text-on-surface-variant mt-3 italic text-center">Exact location provided after booking.</p>
                  )}
                </div>
              </section>

              {/* Host Quick Stats (Desktop Only) */}
              <section className="hidden md:block shadow-[0px_4px_20px_rgba(0,0,0,0.04)] rounded-2xl p-6 bg-surface-container-lowest">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center text-primary font-bold">
                    {hostAvatarUrl ? (
                      <img className="w-full h-full object-cover" src={hostAvatarUrl} alt={listing.host?.name} />
                    ) : (
                      listing.host?.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-headline-md text-[18px] text-on-surface">{listing.host?.name}</p>
                    <p className="font-body-md text-[14px] text-on-surface-variant">Host</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/30">
                  <div className="text-center">
                    <p className="font-headline-md text-primary text-[20px]">{reviews.length}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="font-headline-md text-primary text-[20px]">
                       {listing.host?.isVerified ? <span className="material-symbols-outlined text-[20px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> : "N/A"}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Verified</p>
                  </div>
                </div>
                <Link to={`/profile/${listing.host?._id}`} className="block w-full mt-4 py-2 border border-outline-variant text-center rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors">
                  View Profile
                </Link>
              </section>
              
              {/* Desktop Request Box (if owner or desktop view without sticky footer) */}
              <div className="hidden md:block">
                {isOwner ? (
                  <div className="bg-surface-container-low border border-outline-variant/50 p-6 rounded-2xl text-center space-y-4 shadow-sm">
                    <h3 className="font-headline-md text-on-surface text-xl">Your Listing</h3>
                    <p className="font-body-md text-on-surface-variant text-sm">
                      Manage stay requests from your dashboard.
                    </p>
                    <Link
                      to="/requests"
                      className="block w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-xl hover:bg-primary/90 transition-all shadow-md"
                    >
                      Go to Requests
                    </Link>
                  </div>
                ) : user ? (
                  <div className="stay-request-form">
                    <StayRequestForm listingId={listing._id} maxGuests={listing.maxGuests} />
                  </div>
                ) : (
                  <div className="bg-surface-container-low border border-outline-variant/50 p-6 rounded-2xl text-center space-y-4 shadow-sm">
                    <h3 className="font-headline-md text-on-surface text-xl">Plan your trip</h3>
                    <p className="font-body-md text-on-surface-variant text-sm">
                      Sign in to send a request to this host.
                    </p>
                    <Link
                      to="/login"
                      className="block w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-xl hover:bg-primary/90 transition-all shadow-md"
                    >
                      Log In to Request
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Sticky Footer (Mobile Only) */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 px-margin-mobile py-4">
        <div className="flex items-center justify-between gap-gutter">
          {isOwner ? (
             <Link
               to="/requests"
               className="w-full bg-primary text-on-primary font-headline-md text-label-md py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
               Go to Requests
             </Link>
          ) : user ? (
             // Ideally this would open a modal with the StayRequestForm on mobile,
             // for now we link to a request page or just use the desktop form which is responsive
             <button className="w-full bg-primary text-on-primary font-headline-md text-label-md py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2" onClick={() => {
                document.querySelector('.stay-request-form')?.scrollIntoView({ behavior: 'smooth' });
             }}>
               <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
               Propose Exchange
             </button>
          ) : (
             <Link
               to="/login"
               className="w-full bg-primary text-on-primary font-headline-md text-label-md py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
               Log In to Request
             </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
