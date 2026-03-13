/**
 * Geocoding utility using Nominatim (OpenStreetMap).
 * Modular design — swap this file to switch to Google Maps or Mapbox.
 *
 * Rate limit: max 1 request/second (Nominatim policy).
 * Results are meant to be cached in the database after first fetch.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SmartCart-Hackathon/1.0 (contact: admin@smartcart.local)';

/**
 * Forward geocode — address string → { lat, lng, displayName }
 * @param {string} address
 * @returns {Promise<{lat: number, lng: number, displayName: string} | null>}
 */
async function geocodeAddress(address) {
  try {
    const url = `${NOMINATIM_BASE}/search?` + new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://smartcart.local' },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch (err) {
    console.error('Geocoding error:', err.message);
    return null;
  }
}

/**
 * Reverse geocode — lat/lng → readable address
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string | null>}
 */
async function reverseGeocode(lat, lng) {
  try {
    const url = `${NOMINATIM_BASE}/reverse?` + new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
    });

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://smartcart.local' },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name || null;
  } catch (err) {
    console.error('Reverse geocoding error:', err.message);
    return null;
  }
}

module.exports = { geocodeAddress, reverseGeocode };
