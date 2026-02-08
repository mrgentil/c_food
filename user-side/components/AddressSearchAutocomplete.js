import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { MagnifyingGlassIcon, XCircleIcon, MapPinIcon } from 'react-native-heroicons/outline';
import { searchAddress as mapboxSearchAddress } from '../services/mapboxService';

/**
 * 🔍 ADDRESS SEARCH AUTOCOMPLETE
 * Recherche d'adresse avec suggestions en temps réel
 * Utilise Mapbox API pour une couverture complète
 */

const AddressSearchAutocomplete = ({ onSelectAddress }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Debounce la recherche pour éviter trop de requêtes
        const timeoutId = setTimeout(() => {
            if (query.length > 2) {
                handleSearch(query);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = async (searchText) => {
        setLoading(true);
        try {
            // 🗺️ Recherche avec Mapbox API
            const results = await mapboxSearchAddress(searchText);

            if (results.length > 0) {
                // Convertir les résultats Mapbox en format attendu
                const suggestionsList = results.map(result => ({
                    id: result.id,
                    latitude: result.latitude,
                    longitude: result.longitude,
                    mainText: result.name,
                    secondaryText: result.formattedAddress,
                    formattedAddress: result.formattedAddress,
                }));

                setSuggestions(suggestionsList);
            } else {
                // Si pas de résultats Mapbox, chercher dans la base locale
                setSuggestions(getPopularPlaces(searchText));
            }
        } catch (error) {
            console.error('Erreur de recherche:', error);
            setSuggestions(getPopularPlaces(searchText));
        } finally {
            setLoading(false);
        }
    };

    // Base de données des lieux en RDC (principales villes + Kinshasa)
    const getPopularPlaces = (search) => {
        const rdcDatabase = [
            // Principales villes de RDC
            { name: 'Kinshasa', coords: { lat: -4.3225, lng: 15.3222 }, type: 'ville', province: 'Kinshasa' },
            { name: 'Lubumbashi', coords: { lat: -11.6647, lng: 27.4794 }, type: 'ville', province: 'Haut-Katanga' },
            { name: 'Mbuji-Mayi', coords: { lat: -6.1500, lng: 23.6000 }, type: 'ville', province: 'Kasaï-Oriental' },
            { name: 'Kananga', coords: { lat: -5.8962, lng: 22.4166 }, type: 'ville', province: 'Kasaï-Central' },
            { name: 'Kisangani', coords: { lat: 0.5153, lng: 25.1909 }, type: 'ville', province: 'Tshopo' },
            { name: 'Bukavu', coords: { lat: -2.5083, lng: 28.8608 }, type: 'ville', province: 'Sud-Kivu' },
            { name: 'Goma', coords: { lat: -1.6792, lng: 29.2228 }, type: 'ville', province: 'Nord-Kivu' },
            { name: 'Kolwezi', coords: { lat: -10.7167, lng: 25.4667 }, type: 'ville', province: 'Lualaba' },
            { name: 'Likasi', coords: { lat: -10.9833, lng: 26.7333 }, type: 'ville', province: 'Haut-Katanga' },
            { name: 'Matadi', coords: { lat: -5.8167, lng: 13.4500 }, type: 'ville', province: 'Kongo-Central' },
            { name: 'Kikwit', coords: { lat: -5.0333, lng: 18.8167 }, type: 'ville', province: 'Kwilu' },
            { name: 'Mbandaka', coords: { lat: 0.0500, lng: 18.2667 }, type: 'ville', province: 'Équateur' },
            { name: 'Boma', coords: { lat: -5.8500, lng: 13.0500 }, type: 'ville', province: 'Kongo-Central' },
            { name: 'Bunia', coords: { lat: 1.5667, lng: 30.2500 }, type: 'ville', province: 'Ituri' },
            { name: 'Bandundu', coords: { lat: -3.3167, lng: 17.3667 }, type: 'ville', province: 'Kwilu' },

            // Communes de Kinshasa
            // Communes
            { name: 'Gombe', coords: { lat: -4.3193, lng: 15.3152 }, type: 'commune' },
            { name: 'Ma Campagne', coords: { lat: -4.3383, lng: 15.2961 }, type: 'commune' },
            { name: 'Ngaliema', coords: { lat: -4.3814, lng: 15.2653 }, type: 'commune' },
            { name: 'Limete', coords: { lat: -4.3764, lng: 15.2895 }, type: 'commune' },
            { name: 'Kalamu', coords: { lat: -4.3358, lng: 15.3067 }, type: 'commune' },
            { name: 'Bandalungwa', coords: { lat: -4.3485, lng: 15.2817 }, type: 'commune' },
            { name: 'Kintambo', coords: { lat: -4.3294, lng: 15.2844 }, type: 'commune' },
            { name: 'Lingwala', coords: { lat: -4.3067, lng: 15.2944 }, type: 'commune' },
            { name: 'Kinshasa', coords: { lat: -4.3225, lng: 15.3222 }, type: 'commune' },
            { name: 'Barumbu', coords: { lat: -4.3133, lng: 15.3167 }, type: 'commune' },
            { name: 'Ngiri-Ngiri', coords: { lat: -4.3517, lng: 15.2856 }, type: 'commune' },
            { name: 'Kasa-Vubu', coords: { lat: -4.3350, lng: 15.2975 }, type: 'commune' },
            { name: 'Lemba', coords: { lat: -4.3956, lng: 15.2986 }, type: 'commune' },
            { name: 'Matete', coords: { lat: -4.3811, lng: 15.2817 }, type: 'commune' },
            { name: 'Ngaba', coords: { lat: -4.3578, lng: 15.2922 }, type: 'commune' },
            { name: 'Bumbu', coords: { lat: -4.4050, lng: 15.2836 }, type: 'commune' },
            { name: 'Makala', coords: { lat: -4.3794, lng: 15.2700 }, type: 'commune' },
            { name: 'Selembao', coords: { lat: -4.3908, lng: 15.2681 }, type: 'commune' },

            // Quartiers populaires
            { name: 'ITI Gombe', coords: { lat: -4.3150, lng: 15.3100 }, type: 'quartier' },
            { name: 'Socimat', coords: { lat: -4.3200, lng: 15.3050 }, type: 'quartier' },
            { name: 'Victoire', coords: { lat: -4.3250, lng: 15.3150 }, type: 'quartier' },
            { name: 'Matonge', coords: { lat: -4.3300, lng: 15.2950 }, type: 'quartier' },
            { name: 'Yolo', coords: { lat: -4.3450, lng: 15.2850 }, type: 'quartier' },
            { name: 'Righini', coords: { lat: -4.3550, lng: 15.2900 }, type: 'quartier' },
            { name: 'Salongo', coords: { lat: -4.3400, lng: 15.2800 }, type: 'quartier' },
            { name: 'Sainte Anne', coords: { lat: -4.3100, lng: 15.3000 }, type: 'quartier' },
            { name: 'UPN', coords: { lat: -4.4000, lng: 15.3000 }, type: 'quartier' },
            { name: 'Binza', coords: { lat: -4.3900, lng: 15.2700 }, type: 'quartier' },
            { name: 'Kasa-Vubu', coords: { lat: -4.3350, lng: 15.2975 }, type: 'quartier' },
            { name: 'Ndjili', coords: { lat: -4.3856, lng: 15.4097 }, type: 'quartier' },
            { name: 'Masina', coords: { lat: -4.3850, lng: 15.3950 }, type: 'quartier' },
            { name: 'Kimbanseke', coords: { lat: -4.4167, lng: 15.3167 }, type: 'quartier' },
            { name: 'Mont Ngafula', coords: { lat: -4.4644, lng: 15.2817 }, type: 'quartier' },
            { name: 'Nsele', coords: { lat: -4.3333, lng: 15.4333 }, type: 'quartier' },
            { name: 'Kisenso', coords: { lat: -4.4333, lng: 15.2167 }, type: 'quartier' },

            // Cités et quartiers supplémentaires
            { name: 'Cité Verte', coords: { lat: -4.3847, lng: 15.3156 }, type: 'quartier' },
            { name: 'Cité Mama Mobutu', coords: { lat: -4.3950, lng: 15.3050 }, type: 'quartier' },
            { name: 'Cité des Anciens Combattants', coords: { lat: -4.3780, lng: 15.3100 }, type: 'quartier' },
            { name: 'Camp Luka', coords: { lat: -4.3650, lng: 15.2750 }, type: 'quartier' },
            { name: 'Debonhomme', coords: { lat: -4.3580, lng: 15.2880 }, type: 'quartier' },
            { name: 'Kingabwa', coords: { lat: -4.3350, lng: 15.3400 }, type: 'quartier' },
            { name: 'Funa', coords: { lat: -4.3750, lng: 15.2850 }, type: 'quartier' },
            { name: 'Livulu', coords: { lat: -4.3920, lng: 15.3080 }, type: 'quartier' },
            { name: 'Mombele', coords: { lat: -4.3850, lng: 15.3200 }, type: 'quartier' },
            { name: 'Petro Congo', coords: { lat: -4.3720, lng: 15.3150 }, type: 'quartier' },
            { name: 'Gambela', coords: { lat: -4.3680, lng: 15.3050 }, type: 'quartier' },
            { name: 'Pakadjuma', coords: { lat: -4.3600, lng: 15.3100 }, type: 'quartier' },
            { name: 'Ngiri-Ngiri', coords: { lat: -4.3517, lng: 15.2856 }, type: 'quartier' },
            { name: 'Macampagne', coords: { lat: -4.3383, lng: 15.2961 }, type: 'quartier' },
            { name: 'Joli Parc', coords: { lat: -4.4050, lng: 15.2950 }, type: 'quartier' },
            { name: 'Quartier 1', coords: { lat: -4.3900, lng: 15.3100 }, type: 'quartier' },
            { name: 'Quartier 2', coords: { lat: -4.3920, lng: 15.3120 }, type: 'quartier' },
            { name: 'Quartier 7', coords: { lat: -4.3980, lng: 15.3180 }, type: 'quartier' },
            { name: 'Lumumba', coords: { lat: -4.3700, lng: 15.3000 }, type: 'quartier' },
            { name: 'Mbanza Lemba', coords: { lat: -4.3980, lng: 15.2950 }, type: 'quartier' },
            { name: 'Limete Industriel', coords: { lat: -4.3650, lng: 15.3200 }, type: 'quartier' },
            { name: 'Limete Résidentiel', coords: { lat: -4.3750, lng: 15.3100 }, type: 'quartier' },
            { name: 'Binza Météo', coords: { lat: -4.3850, lng: 15.2650 }, type: 'quartier' },
            { name: 'Binza Pigeon', coords: { lat: -4.3920, lng: 15.2700 }, type: 'quartier' },
            { name: 'Binza Ozone', coords: { lat: -4.3880, lng: 15.2620 }, type: 'quartier' },
            { name: 'Ngaliema Village', coords: { lat: -4.3800, lng: 15.2600 }, type: 'quartier' },
            { name: 'GB (Gombe)', coords: { lat: -4.3180, lng: 15.3080 }, type: 'quartier' },
            { name: 'Kitambo', coords: { lat: -4.3294, lng: 15.2844 }, type: 'quartier' },

            // Lieux spécifiques
            { name: 'Silikin Village', coords: { lat: -4.3250, lng: 15.3100 }, type: 'lieu' },
            { name: 'Kintambo Magasin', coords: { lat: -4.3300, lng: 15.2850 }, type: 'lieu' },
            { name: 'Rond Point Victoire', coords: { lat: -4.3260, lng: 15.3160 }, type: 'lieu' },
            { name: 'Rond Point Ngaba', coords: { lat: -4.3600, lng: 15.2950 }, type: 'lieu' },
            { name: 'Marché Central', coords: { lat: -4.3256, lng: 15.3233 }, type: 'lieu' },
            { name: 'Marché de la Liberté', coords: { lat: -4.3100, lng: 15.3050 }, type: 'lieu' },
            { name: 'Boulevard du 30 Juin', coords: { lat: -4.3200, lng: 15.3100 }, type: 'rue' },
            { name: 'Avenue de la Justice', coords: { lat: -4.3180, lng: 15.3140 }, type: 'rue' },
            { name: 'Place de la Gare', coords: { lat: -4.3300, lng: 15.3200 }, type: 'lieu' },
            { name: 'Aéroport de Ndjili', coords: { lat: -4.3856, lng: 15.4444 }, type: 'lieu' },
            { name: 'Stade des Martyrs', coords: { lat: -4.3950, lng: 15.3100 }, type: 'lieu' },
            { name: 'Palais du Peuple', coords: { lat: -4.3350, lng: 15.3050 }, type: 'lieu' },
            { name: 'Université de Kinshasa (UNIKIN)', coords: { lat: -4.4050, lng: 15.2900 }, type: 'lieu' },
        ];

        // Recherche fuzzy (tolérant aux fautes)
        const searchLower = search.toLowerCase().trim();
        const searchWords = searchLower.split(' ');

        return rdcDatabase
            .filter(place => {
                const placeLower = place.name.toLowerCase();

                // Correspondance exacte
                if (placeLower.includes(searchLower)) return true;

                // Correspondance par mots
                return searchWords.some(word => placeLower.includes(word) && word.length > 2);
            })
            .slice(0, 8) // Limiter à 8 résultats
            .map(place => ({
                id: `${place.name}-${place.type}`,
                latitude: place.coords.lat,
                longitude: place.coords.lng,
                mainText: place.name,
                secondaryText: place.province ? `${place.type === 'ville' ? 'Ville' : place.type === 'commune' ? 'Commune' : place.type === 'quartier' ? 'Quartier' : 'Lieu'}, ${place.province}` : `${place.type === 'commune' ? 'Commune' : place.type === 'quartier' ? 'Quartier' : 'Lieu'}, Kinshasa`,
                formattedAddress: place.province ? `${place.name}, ${place.province}, RDC` : `${place.name}, Kinshasa, RDC`,
            }));
    };

    const handleSelectAddress = (suggestion) => {
        onSelectAddress({
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            address: suggestion.formattedAddress,
            district: suggestion.mainText,
        });
        setQuery('');
        setSuggestions([]);
    };

    return (
        <View style={styles.container}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
                <MagnifyingGlassIcon size={20} color="#6B7280" />
                <TextInput
                    style={styles.input}
                    placeholder="Rechercher une rue, un quartier..."
                    placeholderTextColor="#9CA3AF"
                    value={query}
                    onChangeText={setQuery}
                    autoFocus={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <XCircleIcon size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
                {loading && <ActivityIndicator size="small" color="#0EA5E9" style={{ marginLeft: 8 }} />}
            </View>

            {/* Suggestions List */}
            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.suggestionItem}
                                onPress={() => handleSelectAddress(item)}
                                activeOpacity={0.7}
                            >
                                <MapPinIcon size={20} color="#0EA5E9" />
                                <View style={styles.suggestionText}>
                                    <Text style={styles.mainText}>{item.mainText}</Text>
                                    <Text style={styles.secondaryText}>{item.secondaryText}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        style={styles.suggestionsList}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 1000,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '500',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        maxHeight: 300,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    suggestionsList: {
        paddingVertical: 8,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    suggestionText: {
        flex: 1,
        marginLeft: 12,
    },
    mainText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    secondaryText: {
        fontSize: 13,
        color: '#6B7280',
    },
});

export default AddressSearchAutocomplete;
