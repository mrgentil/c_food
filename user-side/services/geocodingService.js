/**
 * 🌍 GEOCODING SERVICE
 * Service de géocodage amélioré utilisant Nominatim (OpenStreetMap)
 * Meilleure couverture pour Kinshasa/RDC que les services natifs
 */

// Nominatim API (gratuit, pas de clé API requise)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Convertit des coordonnées en adresse détaillée (Reverse Geocoding)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Adresse détaillée
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const response = await fetch(
            `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=fr`,
            {
                headers: {
                    'User-Agent': 'FoodDeliveryApp/1.0', // Requis par Nominatim
                },
            }
        );

        if (!response.ok) {
            throw new Error('Nominatim API error');
        }

        const data = await response.json();

        if (data && data.address) {
            const addr = data.address;

            // Construction de l'adresse pour le contexte RDC
            const result = {
                // Données brutes
                raw: addr,

                // Données formatées
                name: addr.amenity || addr.building || addr.road || '',
                street: addr.road || addr.pedestrian || addr.footway || '',
                houseNumber: addr.house_number || '',
                neighbourhood: addr.neighbourhood || addr.suburb || addr.quarter || '',
                district: addr.city_district || addr.suburb || addr.neighbourhood || '',
                city: addr.city || addr.town || addr.village || '',
                state: addr.state || '',
                country: addr.country || 'République démocratique du Congo',
                postcode: addr.postcode || '',

                // Coordonnées
                latitude: parseFloat(data.lat),
                longitude: parseFloat(data.lon),

                // Adresse formatée complète
                formattedAddress: formatAddress(addr),

                // Nom d'affichage court
                displayName: getDisplayName(addr),
            };

            return result;
        }

        throw new Error('No address found');

    } catch (error) {
        console.error('Reverse geocoding error:', error);

        // Retourne une adresse par défaut en cas d'erreur
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
 * Recherche d'adresse par texte (Forward Geocoding)
 * @param {string} query Texte de recherche
 * @returns {Promise<Array>} Liste de résultats
 */
export const searchAddress = async (query) => {
    try {
        // Ajouter "RDC" pour améliorer les résultats locaux
        const searchQuery = query.toLowerCase().includes('rdc') || query.toLowerCase().includes('congo')
            ? query
            : `${query}, RDC`;

        const response = await fetch(
            `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&addressdetails=1&accept-language=fr`,
            {
                headers: {
                    'User-Agent': 'FoodDeliveryApp/1.0',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Nominatim search error');
        }

        const data = await response.json();

        return data.map(item => ({
            id: item.place_id,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            name: item.address?.amenity || item.address?.building || item.address?.road || item.name,
            displayName: getDisplayName(item.address),
            formattedAddress: formatAddress(item.address),
            type: item.type,
            address: item.address,
        }));

    } catch (error) {
        console.error('Address search error:', error);
        return [];
    }
};

/**
 * Formate l'adresse pour l'affichage
 */
const formatAddress = (addr) => {
    if (!addr) return 'RDC';

    const parts = [];

    // Nom du lieu (si disponible)
    if (addr.amenity || addr.building) {
        parts.push(addr.amenity || addr.building);
    }

    // Numéro et rue
    if (addr.house_number && addr.road) {
        parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
        parts.push(addr.road);
    }

    // Quartier/Neighbourhood
    if (addr.neighbourhood || addr.quarter || addr.suburb) {
        parts.push(addr.neighbourhood || addr.quarter || addr.suburb);
    }

    // District/Commune
    if (addr.city_district) {
        parts.push(addr.city_district);
    }

    // Ville
    const city = addr.city || addr.town || addr.village || '';
    if (city && !parts.includes(city)) {
        parts.push(city);
    }

    // Pays
    if (addr.country) {
        parts.push(addr.country);
    }

    return parts.join(', ') || 'RDC';
};

/**
 * Retourne un nom court pour l'affichage
 */
const getDisplayName = (addr) => {
    if (!addr) return 'Position actuelle';

    // Priorité : quartier > rue > district > ville
    return addr.neighbourhood
        || addr.quarter
        || addr.suburb
        || addr.road
        || addr.city_district
        || addr.city
        || addr.town
        || 'Position actuelle';
};

export default {
    reverseGeocode,
    searchAddress,
};
