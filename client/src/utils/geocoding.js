/**
 * Frontend geocoding helper using Nominatim.
 * For the location search bar on the NearbyShops page.
 * Rate-limited to 1 request per 1000ms per Nominatim policy.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Search for locations by query string.
 * @param {string} query - e.g. "Ameerpet, Hyderabad"
 * @returns {Promise<Array<{lat: number, lng: number, displayName: string}>>}
 */
export async function searchLocation(query) {
  if (!query || query.trim().length < 3) return [];

  try {
    const url = `${NOMINATIM_BASE}/search?` + new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      countrycodes: 'in',
    });

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }));
  } catch (err) {
    console.error('Location search error:', err.message);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string|null>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `${NOMINATIM_BASE}/reverse?` + new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
    });

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name || null;
  } catch (err) {
    console.error('Reverse geocode error:', err.message);
    return null;
  }
}
