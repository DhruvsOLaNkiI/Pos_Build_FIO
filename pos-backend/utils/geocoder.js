const axios = require('axios');

/**
 * Get coordinates for a given pincode using Zippopotam.us API
 * Only supports limited countries, but for India standard format is IN.
 * @param {string} pincode
 * @param {string} countryCode - Default 'IN' for India
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
const geocodePincode = async (pincode, countryCode = 'IN') => {
    try {
        const response = await axios.get(`https://api.zippopotam.us/${countryCode}/${pincode}`);
        if (response.data && response.data.places && response.data.places.length > 0) {
            const place = response.data.places[0];
            return {
                lat: parseFloat(place.latitude),
                lng: parseFloat(place.longitude)
            };
        }
        return null; // Not found
    } catch (error) {
        console.error(`Geocoding failed for pincode ${pincode}:`, error.message);
        return null;
    }
};

module.exports = { geocodePincode };
