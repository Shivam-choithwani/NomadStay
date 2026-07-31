import axios from "axios";

export async function geocodeCity(city) {
  try {
    // We use OpenStreetMap's Nominatim API (free, no API key required)
    // Make sure to include a User-Agent to respect their terms of service
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
        }
      }
    );

    const data = response.data;
    if (data && data.length > 0) {
      const bestMatch = data[0];
      return {
        lat: parseFloat(bestMatch.lat),
        lng: parseFloat(bestMatch.lon),
        // Optional bbox from Nominatim [minLat, maxLat, minLon, maxLon]
      };
    }
    return null;
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
        }
      }
    );

    const data = response.data;
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
      const country = data.address.country || "";
      
      // Construct a simple address string
      const houseNumber = data.address.house_number || "";
      const road = data.address.road || "";
      const address = [houseNumber, road].filter(Boolean).join(" ");
      
      return {
        address: address || data.name || data.display_name || "",
        city,
        country
      };
    }
    return null;
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return null;
  }
}
