import { useState, useRef, useEffect, useMemo } from "react";

import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import useSupercluster from "use-supercluster";
import { Link as RouterLink } from "react-router-dom";

export default function MapComponent({ listings, center, onBoundsChange, onSearchAreaClick, searchAreaVisible }) {
  const mapRef = useRef();
  
  // Default bounds
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(12);
  const [popupInfo, setPopupInfo] = useState(null);

  // Initialize view state
  const [viewState, setViewState] = useState({
    longitude: center?.lng || 4.9041,
    latitude: center?.lat || 52.3676,
    zoom: 12,
  });

  // Whenever center prop changes from geocoding, fly to it
  useEffect(() => {
    if (center && center.lng && center.lat && mapRef.current) {
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: center.zoom || 12,
        duration: 2000,
        essential: true
      });
    }
  }, [center]);

  // Convert listings to GeoJSON points for supercluster
  const points = useMemo(() => {
    return listings
      .filter((l) => l.location && l.location.coordinates)
      .map((listing) => ({
        type: "Feature",
        properties: {
          cluster: false,
          listingId: listing._id,
          title: listing.title,
          city: listing.city,
          hostName: listing.host?.name || "Host",
          hostAvatar: listing.host?.avatarUrl,
          maxGuests: listing.maxGuests,
          // Since we don't have exact review rating per listing fetched easily here,
          // we might just show "Host", or use a generic "View Profile"
        },
        geometry: {
          type: "Point",
          coordinates: [
            listing.location.coordinates[0],
            listing.location.coordinates[1],
          ],
        },
      }));
  }, [listings]);

  // Get clusters
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: bounds
      ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
      : null,
    zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-gray-100">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={(evt) => {
          const mapBounds = evt.target.getBounds();
          setBounds(mapBounds);
          setZoom(evt.viewState.zoom);
          
          if (onBoundsChange) {
            onBoundsChange({
              swLng: mapBounds.getWest(),
              swLat: mapBounds.getSouth(),
              neLng: mapBounds.getEast(),
              neLat: mapBounds.getNorth(),
            });
          }
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" // Lighter but colorful map style
        mapLib={maplibregl}
        attributionControl={true}
      >
        <NavigationControl position="bottom-right" />

        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;

          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                latitude={latitude}
                longitude={longitude}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer shadow-md transition transform hover:scale-110"
                  style={{
                    background: "linear-gradient(135deg, #14b8a6, #f59e0b)",
                    border: "2px solid white",
                    width: `${Math.max(30, 20 + (pointCount / points.length) * 30)}px`,
                    height: `${Math.max(30, 20 + (pointCount / points.length) * 30)}px`,
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);
                    setViewState({
                      ...viewState,
                      longitude,
                      latitude,
                      zoom: expansionZoom,
                      transitionDuration: 500,
                    });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          // Individual Marker
          return (
            <Marker
              key={`listing-${cluster.properties.listingId}`}
              latitude={latitude}
              longitude={longitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupInfo({
                  ...cluster.properties,
                  longitude,
                  latitude,
                });
              }}
            >
              <div 
                className="bg-white border-2 border-amber-600 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-sm transform hover:scale-110 transition"
                title={cluster.properties.title}
              >
                <span className="text-sm">📍</span>
              </div>
            </Marker>
          );
        })}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            offset={[0, -15]}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="rounded-2xl"
          >
            <div className="p-1 min-w-[180px] max-w-[220px]">
              <h3 className="font-bold text-gray-900 truncate">{popupInfo.title}</h3>
              <p className="text-xs text-gray-500 mb-2">{popupInfo.city} • Up to {popupInfo.maxGuests} guests</p>
              
              <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden border border-amber-200">
                   {popupInfo.hostName.charAt(0)}
                </div>
                <span className="text-xs font-semibold">Hosted by {popupInfo.hostName}</span>
              </div>

              <RouterLink
                to={`/listings/${popupInfo.listingId}`}
                className="block text-center w-full bg-amber-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-amber-700 transition"
              >
                View Listing
              </RouterLink>
            </div>
          </Popup>
        )}
      </Map>

      {/* Phase 5: Search This Area Button */}
      {searchAreaVisible && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 mt-16 lg:mt-0">
          <button
            onClick={onSearchAreaClick}
            className="bg-white text-gray-900 px-5 py-2 rounded-full font-bold text-sm shadow-xl hover:bg-gray-50 transition flex items-center gap-2 cursor-pointer border border-gray-100"
          >
            <span>🔄</span> Search this area
          </button>
        </div>
      )}
    </div>
  );
}
