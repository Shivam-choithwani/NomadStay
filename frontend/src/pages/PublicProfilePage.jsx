import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchUserProfile } from "../services/profileService";
import { getImageUrl } from "../services/api";
import { fetchListings } from "../services/listingService";

export default function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError("");
      try {
        const profileData = await fetchUserProfile(id);
        setProfile(profileData);

        // Fetch listings hosted by this user
        const response = await fetchListings({ host: id });
        setListings(response.listings || []);
      } catch (err) {
        setError("User profile not found.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return <p className="max-w-container-max mx-auto px-margin-mobile pt-24 pb-8 text-center text-on-surface-variant font-body-md">Loading profile...</p>;
  }

  if (error || !profile) {
    return <p className="max-w-container-max mx-auto px-margin-mobile pt-24 pb-8 text-center text-error font-body-md">{error || "User profile not found."}</p>;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 md:pb-8 selection:bg-primary-container selection:text-on-primary-container">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-14 bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
        <button 
          onClick={() => navigate(-1)}
          className="active:scale-95 transition-transform duration-200 hover:bg-surface-container-low transition-colors p-2 rounded-full cursor-pointer"
        >
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md text-primary font-bold">Profile</h1>
        <div className="w-10"></div>
      </header>

      <main className="pt-14 max-w-container-max mx-auto md:px-margin-desktop">
        
        {/* Desktop Layout Wrapper */}
        <div className="md:grid md:grid-cols-12 md:gap-gutter md:mt-8">
          
          {/* Left Column (Hero / Sticky Profile Details) */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="md:sticky md:top-24 bg-surface-container-lowest md:rounded-2xl md:shadow-[0px_4px_20px_rgba(0,0,0,0.04)] md:p-6 pb-6">
              {/* Hero Section */}
              <section className="px-margin-mobile md:px-0 pt-stack-lg flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-surface shadow-md overflow-hidden bg-surface-container-high flex items-center justify-center">
                    {profile.avatarUrl ? (
                      <img
                        src={getImageUrl(profile.avatarUrl)}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-4xl font-bold">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {profile.isVerified && (
                    <div className="absolute bottom-1 right-1 bg-primary text-on-primary rounded-full p-1 border-2 border-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-stack-md text-center">
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{profile.name}</h2>
                  {(profile.locationCity || profile.locationCountry) && (
                    <div className="flex items-center justify-center text-on-surface-variant mt-1">
                      <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
                      <span className="font-label-md text-label-md">
                         {[profile.locationCity, profile.locationCountry].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-on-surface-variant mt-2 italic">
                    Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short" })}
                  </div>
                </div>
                
                <div className="flex gap-stack-md mt-stack-lg w-full">
                  <button className="flex-1 bg-primary text-on-primary font-bold py-3.5 rounded-xl active:scale-95 transition-transform hover:bg-primary/90">
                    Message
                  </button>
                  <button className="flex-1 bg-surface border-1.5 border-primary text-primary font-bold py-3.5 rounded-xl border-[1.5px] active:scale-95 transition-transform hover:bg-surface-container-low">
                    Follow
                  </button>
                </div>
              </section>

              {/* Bio Section (Mobile visible, Desktop moved inside card) */}
              <section className="px-margin-mobile md:px-0 mt-stack-lg border-t border-outline-variant/30 pt-6 md:border-none md:pt-4">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-sm md:text-xl">About Me</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {profile.bio || <span className="italic">No bio written yet.</span>}
                </p>
                
                {profile.languages && profile.languages.length > 0 && (
                  <div className="mt-4">
                     <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Languages</span>
                     <p className="font-body-md text-sm text-on-surface">{profile.languages.join(", ")}</p>
                  </div>
                )}
                {profile.gender && (
                   <div className="mt-4">
                     <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Gender</span>
                     <p className="font-body-md text-sm text-on-surface capitalize">{profile.gender}</p>
                   </div>
                )}
              </section>
            </div>
          </div>

          {/* Right Column (Listings & Content) */}
          <div className="md:col-span-8 lg:col-span-9 mt-8 md:mt-0">
            {/* Skills Offered (Interests mapped to skills for this UI) */}
            {(profile.interests && profile.interests.length > 0) && (
              <section className="px-margin-mobile md:px-0 mb-stack-lg">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Skills I Share</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-full font-label-md text-label-md border border-outline-variant hover:border-primary transition-colors cursor-default"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* My Stays (Horizontal Scroll) */}
            {profile.isHost && (
              <section className="mb-stack-lg">
                <div className="px-margin-mobile md:px-0 flex justify-between items-end mb-stack-md">
                  <h3 className="font-headline-md text-headline-md text-on-surface">My Stays</h3>
                  {listings.length > 0 && <span className="text-primary font-label-md text-label-md cursor-pointer hover:underline">See all</span>}
                </div>
                
                {listings.length === 0 ? (
                  <p className="px-margin-mobile md:px-0 text-on-surface-variant italic font-body-md">This host hasn't posted any stays yet.</p>
                ) : (
                  <div className="flex overflow-x-auto no-scrollbar gap-stack-md px-margin-mobile md:px-0 snap-x pb-4">
                    {listings.map(listing => (
                      <Link 
                        to={`/listings/${listing._id}`} 
                        key={listing._id}
                        className="min-w-[280px] max-w-[280px] bg-surface rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden snap-start flex-shrink-0 group hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-48 bg-surface-container-high">
                          {listing.photos?.[0] ? (
                            <img 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              src={getImageUrl(listing.photos[0])} 
                              alt={listing.title} 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">No Photo</div>
                          )}
                          <div className="absolute top-3 left-3 bg-secondary-container text-on-secondary px-3 py-1 rounded-full text-label-sm font-label-sm shadow-sm backdrop-blur-md bg-opacity-90">
                              Exchange Required
                          </div>
                        </div>
                        <div className="p-4 bg-surface-container-lowest">
                          <h4 className="font-headline-md text-[18px] text-on-surface group-hover:text-primary transition-colors truncate">{listing.title}</h4>
                          <p className="text-on-surface-variant text-label-sm mt-1 truncate"> 
                            {listing.city} • {listing.maxGuests} guests
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Reviews Section (Mocked for now since backend fetches them in ListingDetail usually, but we could fetch them if needed. Displaying empty or static for demo) */}
            <section className="px-margin-mobile md:px-0 mt-stack-lg pb-10">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Community Reviews (0)</h3>
              <div className="space-y-stack-md">
                 <p className="text-on-surface-variant italic bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">No reviews available on this profile yet.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
