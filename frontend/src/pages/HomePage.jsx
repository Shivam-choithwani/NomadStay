import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchListings, fetchRagListings } from "../services/listingService";
import { getImageUrl } from "../services/api";
import { geocodeCity } from "../services/geocodeService";
import MapComponent from "../components/MapComponent";

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  
  // Filters
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [amenities, setAmenities] = useState("");
  const [ragQuery, setRagQuery] = useState(""); // AI Search State
  const [isRagMode, setIsRagMode] = useState(false); // Toggle to show if results are AI-ranked

  const [currentPage, setCurrentPage] = useState(1);
  
  // Map State
  const [mapCenter, setMapCenter] = useState(null);
  const [currentBounds, setCurrentBounds] = useState(null);
  const [searchAreaVisible, setSearchAreaVisible] = useState(false);
  const [isMapView, setIsMapView] = useState(false); // Mobile toggle
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadListings({ city, country, gender, maxGuests, amenities, ragQuery, page: currentPage });
  }, [currentPage]);

  async function loadListings(filters = {}) {
    setIsLoading(true);
    setError("");
    setSearchAreaVisible(false); // Hide the "search area" button once we load
    setIsRagMode(false); // Reset RAG mode flag
    try {
      if (filters.ragQuery) {
        // If there's an AI query, trigger RAG flow
        const response = await fetchRagListings({
          query: filters.ragQuery,
          city: filters.city,
          maxGuests: filters.maxGuests,
          swLng: filters.swLng,
          swLat: filters.swLat,
          neLng: filters.neLng,
          neLat: filters.neLat,
          limit: 10
        });
        setListings(response.listings || []);
        setPagination({ page: 1, totalPages: 1, totalResults: (response.listings || []).length });
        setIsRagMode(true);
      } else {
        // Standard flow
        const params = {
          page: filters.page || 1,
          limit: 12,
        };
        
        if (filters.swLng !== undefined) {
          // Bounds search
          params.swLng = filters.swLng;
          params.swLat = filters.swLat;
          params.neLng = filters.neLng;
          params.neLat = filters.neLat;
        } else {
          // Normal search
          if (filters.city) params.city = filters.city;
        }
        
        if (filters.country) params.country = filters.country;
        if (filters.gender) params.gender = filters.gender;
        if (filters.maxGuests) params.maxGuests = filters.maxGuests;
        if (filters.amenities) params.amenities = filters.amenities;

        const response = await fetchListings(params);
        setListings(response.listings || []);
        setPagination(response.pagination || { page: 1, totalPages: 1, totalResults: 0 });
      }
    } catch (err) {
      setError("Couldn't load listings.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(e) {
    if(e) e.preventDefault();
    setCurrentPage(1);
    
    // If they typed a city in the rule-based filter, geocode it
    if (city.trim() && !ragQuery.trim()) {
      const geo = await geocodeCity(city);
      if (geo) {
        setMapCenter({ lng: geo.lng, lat: geo.lat, zoom: 12 });
      }
    }
    
    loadListings({ city, country, gender, maxGuests, amenities, ragQuery, page: 1 });
  }

  async function handleMapSearch(e) {
    if(e) e.preventDefault();
    if (mapSearchQuery.trim()) {
      const geo = await geocodeCity(mapSearchQuery);
      if (geo) {
        setMapCenter({ lng: geo.lng, lat: geo.lat, zoom: 12 });
      }
    }
  }

  function handleSearchArea() {
    if (currentBounds) {
      setCity(""); // Clear city string since we are searching by exact bounds
      setCurrentPage(1);
      loadListings({ ...currentBounds, country, gender, maxGuests, amenities, ragQuery, page: 1 });
    }
  }

  function handleReset() {
    setCity("");
    setCountry("");
    setGender("");
    setMapSearchQuery("");
    setMaxGuests("");
    setAmenities("");
    setRagQuery("");
    setCurrentPage(1);
    loadListings({ page: 1 });
  }

  // Count active rule-based filters
  const activeFilterCount = [city, country, gender, maxGuests].filter(Boolean).length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-surface text-on-surface font-body-md antialiased pb-20 md:pb-0">
      
      {/* Mobile Toggle */}
      <div className="lg:hidden p-4 border-b border-surface-variant flex justify-center bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.04)] z-10 sticky top-0">
        <button 
          onClick={() => setIsMapView(!isMapView)}
          className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md shadow-md active:scale-95 transition-transform"
        >
          {isMapView ? "Show List" : "Show Map"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: List & Filters */}
        <div className={`w-full lg:w-[55%] flex flex-col h-full bg-surface ${isMapView ? "hidden lg:flex" : "flex"}`}>
          
          <div className="px-margin-mobile md:px-margin-desktop pt-6 flex flex-col gap-stack-lg max-w-container-max mx-auto w-full h-full">
            
            {/* Search & Filters */}
            <section className="flex flex-col gap-stack-md shrink-0">
              {/* AI Search Bar */}
              <form onSubmit={handleSearch} className="flex flex-col gap-2">
                <div className="flex items-center gap-base">
                  <div className="flex-1 flex items-center bg-surface-container-low rounded-xl px-4 py-3 shadow-sm border border-outline-variant focus-within:border-primary transition-colors group">
                    <span className="material-symbols-outlined text-primary mr-3">psychology</span>
                    <textarea 
                      className="bg-transparent border-none outline-none w-full text-body-md placeholder:text-on-surface-variant/60 font-body-md resize-none overflow-hidden flex-1 py-1" 
                      placeholder="AI Search: Describe your ideal stay..." 
                      value={ragQuery}
                      rows={1}
                      style={{ minHeight: '28px', maxHeight: '150px', overflowY: 'auto' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                      onChange={e => {
                        setRagQuery(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setIsFiltersExpanded(!isFiltersExpanded)} 
                      className={`ml-2 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${activeFilterCount > 0 || isFiltersExpanded ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'}`}
                      title="Toggle Filters"
                    >
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                      {activeFilterCount > 0 && !isFiltersExpanded && (
                        <span className="absolute -top-1 -right-1 bg-error text-on-error w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    <button type="submit" className="text-primary hover:opacity-80 transition font-label-md text-label-md ml-3 pl-3 border-l border-outline-variant/30">Search</button>
                  </div>
                </div>
              </form>

              {/* Rule-Based Filters */}
              {isFiltersExpanded && (
                <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center animate-fade-in">
                  <div className="flex flex-col flex-1 min-w-[120px]">
                    <label className="text-label-sm font-label-sm text-on-surface-variant mb-1">City</label>
                    <input type="text" placeholder="e.g. Paris" value={city} onChange={e => setCity(e.target.value)} className="bg-surface-container-low border-none rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-body-sm"/>
                  </div>
                  <div className="flex flex-col flex-1 min-w-[120px]">
                    <label className="text-label-sm font-label-sm text-on-surface-variant mb-1">Country</label>
                    <input type="text" placeholder="e.g. France" value={country} onChange={e => setCountry(e.target.value)} className="bg-surface-container-low border-none rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-body-sm"/>
                  </div>
                  <div className="flex flex-col flex-1 min-w-[100px]">
                    <label className="text-label-sm font-label-sm text-on-surface-variant mb-1">Guests</label>
                    <input type="number" min="1" placeholder="Any" value={maxGuests} onChange={e => setMaxGuests(e.target.value)} className="bg-surface-container-low border-none rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-body-sm"/>
                  </div>
                  <div className="flex flex-col flex-1 min-w-[120px]">
                    <label className="text-label-sm font-label-sm text-on-surface-variant mb-1">Host Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} className="bg-surface-container-low border-none rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-body-sm">
                      <option value="">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                    </select>
                  </div>
                  <div className="flex items-end h-full">
                    <button onClick={handleSearch} className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all mt-6">Apply</button>
                    <button onClick={handleReset} className="text-primary underline font-label-sm text-label-sm ml-3 mt-6">Reset</button>
                  </div>
                </div>
              )}

              {/* Skill Filters (Horizontal Scroll) */}
              <div className="flex gap-stack-sm overflow-x-auto hide-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
                <button onClick={handleReset} className={`px-5 py-2 rounded-full font-label-md text-label-md whitespace-nowrap active:scale-95 transition-transform ${!amenities ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>All</button>
                {['Coding', 'Yoga', 'Gardening', 'Cooking', 'Photography'].map(skill => (
                  <button 
                    key={skill}
                    onClick={() => { setAmenities(skill); setTimeout(() => handleSearch(), 0); }}
                    className={`px-5 py-2 rounded-full font-label-md text-label-md whitespace-nowrap active:scale-95 transition-colors ${amenities === skill ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'}`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </section>

            {/* Main Feed */}
            <section className="flex-1 overflow-y-auto mt-4 pb-6 hide-scrollbar flex flex-col gap-6">
              <div className="flex justify-between items-end mb-2">
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {isRagMode ? "✨ AI Top Picks" : `${pagination.totalResults} Stays found`}
                </h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-surface-container-lowest rounded-xl h-64 w-full animate-pulse shadow-[0px_4px_20px_rgba(0,0,0,0.04)]" />
                  ))}
                </div>
              ) : error ? (
                <p className="text-error">{error}</p>
              ) : listings.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] opacity-50 mb-4">map</span>
                  <p className="font-body-lg text-body-lg">No stays found in this area.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {listings.map(listing => (
                    <Link 
                      key={listing._id} 
                      to={`/listings/${listing._id}`}
                      className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg active:scale-[0.98] transition-all duration-200 group block"
                    >
                      <div className="relative h-64 w-full bg-surface-variant">
                        {listing.photos?.[0] ? (
                          <img className="w-full h-full object-cover rounded-t-xl" src={getImageUrl(listing.photos[0])} alt={listing.title} style={{ borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                        )}
                        
                        {/* Floating Badge */}
                        {listing.host?.isVerified && (
                          <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md text-on-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            <span className="font-label-sm text-label-sm uppercase tracking-wider">Verified Host</span>
                          </div>
                        )}
                        
                        {/* Host Avatar */}
                        <div className="absolute bottom-4 right-4 w-14 h-14 rounded-full border-4 border-surface-container-lowest overflow-hidden shadow-xl bg-surface-variant flex items-center justify-center font-bold text-primary text-xl">
                          {listing.host?.avatarUrl ? (
                            <img className="w-full h-full object-cover" src={getImageUrl(listing.host.avatarUrl)} alt={listing.host?.name} />
                          ) : (
                            listing.host?.name?.charAt(0)
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="font-headline-md text-headline-md text-on-surface mb-0.5 line-clamp-1">{listing.title}</h2>
                            <div className="flex items-center gap-1 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[18px]">location_on</span>
                              <span className="font-body-md text-body-md line-clamp-1">{listing.host?.locationCity || listing.city}</span>
                            </div>
                          </div>
                          <div className="flex items-center text-primary font-bold shrink-0">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="ml-1">4.9</span>
                          </div>
                        </div>

                        {/* Skills Section (derived from amenities for now, or RAG reason) */}
                        {listing.ragReason ? (
                           <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 mt-2">
                             <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">psychology</span> AI Match</p>
                             <p className="text-sm text-primary line-clamp-2">{listing.ragReason}</p>
                           </div>
                        ) : (
                          <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 mt-2">
                            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1.5">Offered / Needed</p>
                            <div className="flex flex-wrap gap-2">
                              {listing.amenities && listing.amenities.slice(0, 3).map((amenity, i) => (
                                <span key={i} className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-label-sm font-label-sm">{amenity.trim()}</span>
                              ))}
                              {listing.maxGuests && <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-label-sm font-label-sm">{listing.maxGuests} Guests</span>}
                            </div>
                          </div>
                        )}

                        <div className="w-full py-3 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 transition-all mt-2">
                          View Details
                          <span className="material-symbols-outlined">chevron_right</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-4 pt-6 mt-4 border-t border-outline-variant pb-8">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-surface-container-high rounded-xl disabled:opacity-50 text-on-surface font-label-md text-label-md hover:bg-surface-variant transition">Prev</button>
                  <span className="py-2 text-on-surface-variant font-label-sm text-label-sm flex items-center">Page {currentPage} of {pagination.totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} className="px-4 py-2 bg-surface-container-high rounded-xl disabled:opacity-50 text-on-surface font-label-md text-label-md hover:bg-surface-variant transition">Next</button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN: Map */}
        <div className={`w-full lg:w-[45%] h-full bg-surface-container-low relative ${!isMapView ? "hidden lg:block" : "block"}`}>
           {/* Map location search bar */}
           <div className="absolute top-4 left-4 right-4 z-10 lg:w-80 lg:right-auto">
             <form onSubmit={handleMapSearch} className="relative group">
               <input 
                 type="text" 
                 placeholder="Search map destination..." 
                 value={mapSearchQuery} 
                 onChange={e => setMapSearchQuery(e.target.value)} 
                 className="w-full bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant text-on-surface rounded-full py-3 px-5 pr-12 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] focus:outline-none focus:border-primary transition-all font-body-md"
               />
               <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition shadow-md active:scale-95 text-on-primary">
                 <span className="material-symbols-outlined text-[18px]">search</span>
               </button>
             </form>
           </div>
           
           <MapComponent 
             listings={listings}
             center={mapCenter}
             searchAreaVisible={searchAreaVisible}
             onBoundsChange={(bounds) => {
               setCurrentBounds(bounds);
               if (!isLoading) setSearchAreaVisible(true);
             }}
             onSearchAreaClick={handleSearchArea}
           />
        </div>
      </div>

      {/* Mobile Bottom Navigation (Visible only on mobile) */}
      <nav className="lg:hidden fixed bottom-0 w-full z-50 bg-surface border-t border-outline-variant shadow-[0px_-4px_20px_rgba(0,0,0,0.04)] h-20 px-2 pb-safe flex justify-around items-center">
        <Link to="/explore" className="flex flex-col items-center justify-center text-primary font-bold bg-primary-fixed-dim/20 rounded-xl px-4 py-1 transition-all duration-150 active:scale-90">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="font-label-sm text-label-sm mt-0.5">Explore</span>
        </Link>
        <Link to="/messages" className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors px-4 py-1 rounded-xl active:scale-90">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="font-label-sm text-label-sm mt-0.5">Messages</span>
        </Link>
        <Link to="/my-listings" className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors px-4 py-1 rounded-xl active:scale-90">
          <span className="material-symbols-outlined">map</span>
          <span className="font-label-sm text-label-sm mt-0.5">Trips</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors px-4 py-1 rounded-xl active:scale-90">
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-sm text-label-sm mt-0.5">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
