/**
 * 🗺️ MAPBOX GEOCODING SERVICE
 * Service de géocodage utilisant Mapbox API
 * Meilleure couverture que Nominatim, gratuit jusqu'à 100k requêtes/mois
 */

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYmVkaXQiLCJhIjoiY21sY3g0ZnFmMDVxYjNmczhva2NhcmtxbCJ9.YhpxYWTk-E-kekV40WpdYg';
const MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * Recherche d'adresse par texte (Forward Geocoding)
 * @param {string} query - Texte de recherche
 * @param {Object} options - Options de recherche
 * @returns {Promise<Array>} Liste de résultats
 */
export const searchAddress = async (query, options = {}) => {
    try {
        const {
            country = 'cd', // RDC (code ISO)
            limit = 10,
            types = 'place,locality,neighborhood,address,poi'
        } = options;

        const url = `${MAPBOX_BASE_URL}/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=${country}&limit=${limit}&types=${types}&language=fr`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Mapbox API error');
        }

        const data = await response.json();

        return data.features.map(feature => ({
            id: feature.id,
            latitude: feature.center[1],
            longitude: feature.center[0],
            name: feature.text,
            displayName: feature.place_name,
            formattedAddress: feature.place_name,
            type: feature.place_type?.[0] || 'place',
            context: parseContext(feature.context),
        }));

    } catch (error) {
        console.error('Mapbox search error:', error);
        return [];
    }
};

/**
 * Convertit des coordonnées en adresse (Reverse Geocoding)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Adresse détaillée
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const url = `${MAPBOX_BASE_URL}/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=fr&types=place,locality,neighborhood,address`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Mapbox reverse geocoding error');
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const context = parseContext(feature.context);

            return {
                name: feature.text || '',
                street: context.address || feature.text || '',
                neighbourhood: context.neighborhood || context.locality || '',
                district: context.place || '',
                city: context.place || context.region || '',
                state: context.region || '',
                country: context.country || 'République démocratique du Congo',
                postcode: context.postcode || '',
                latitude,
                longitude,
                formattedAddress: feature.place_name || 'RDC',
                displayName: feature.text || context.neighborhood || context.locality || context.place || 'Position actuelle',
                raw: feature,
            };
        }

        throw new Error('No results found');

    } catch (error) {
        console.error('Mapbox reverse geocoding error:', error);

        // Fallback
        return {
            name: '',
            street: '',
            neighbourhood: '',
            district: '',
            city: '',
            country: 'République démocratique du Congo',
            latitude,
            longitude,
            formattedAddress: 'RDC',
            displayName: 'Position actuelle',
            error: error.message,
        };
    }
};

/**
 * Parse le contexte Mapbox pour extraire les composants d'adresse
 */
const parseContext = (context) => {
    if (!context) return {};

    const result = {};

    context.forEach(item => {
        const type = item.id.split('.')[0];
        result[type] = item.text;
    });

    return result;
};

export default {
    searchAddress,
    reverseGeocode,
    MAPBOX_ACCESS_TOKEN,
};
