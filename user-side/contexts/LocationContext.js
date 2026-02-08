import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reverseGeocode as mapboxReverseGeocode } from '../services/mapboxService';

/**
 * 📍 LOCATION CONTEXT
 * Gère la position de l'utilisateur dans toute l'app
 * Utilise Nominatim (OpenStreetMap) pour un meilleur géocodage RDC
 */

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStoredLocation();
    }, []);

    // Charger la localisation stockée
    const loadStoredLocation = async () => {
        try {
            const storedLocation = await AsyncStorage.getItem('userLocation');
            const storedAddress = await AsyncStorage.getItem('userAddress');

            if (storedLocation) {
                setLocation(JSON.parse(storedLocation));
            }
            if (storedAddress) {
                setAddress(JSON.parse(storedAddress));
            }
        } catch (err) {
            console.error('Error loading stored location:', err);
        } finally {
            setLoading(false);
        }
    };

    // Récupérer la position actuelle
    const getCurrentLocation = async () => {
        try {
            setLoading(true);
            setError(null);

            // Vérifier la permission
            const { status } = await Location.getForegroundPermissionsAsync();

            if (status !== 'granted') {
                throw new Error('Permission de localisation refusée');
            }

            // Récupérer position GPS
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });

            const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: position.timestamp,
            };

            // 🗺️ Utiliser Mapbox pour le reverse geocoding
            console.log('📍 Getting address from Mapbox...');
            const mapboxResult = await mapboxReverseGeocode(
                position.coords.latitude,
                position.coords.longitude
            );

            console.log('📍 Mapbox result:', mapboxResult);


            const addressData = {
                city: mapboxResult.city || '',
                district: mapboxResult.district || mapboxResult.neighbourhood || '',
                street: mapboxResult.street || '',
                name: mapboxResult.name || '',
                neighbourhood: mapboxResult.neighbourhood || '',
                country: mapboxResult.country || 'RDC',
                postalCode: mapboxResult.postcode || '',
                region: mapboxResult.state || '',
                formattedAddress: mapboxResult.formattedAddress,
                displayName: mapboxResult.displayName,
            };

            // Sauvegarder
            await AsyncStorage.setItem('userLocation', JSON.stringify(locationData));
            await AsyncStorage.setItem('userAddress', JSON.stringify(addressData));

            setLocation(locationData);
            setAddress(addressData);

            return { location: locationData, address: addressData };

        } catch (err) {
            console.error('Error getting location:', err);
            setError(err.message);

            // Position par défaut : Gombe, Kinshasa
            const defaultLocation = {
                latitude: -4.3276,
                longitude: 15.3136,
                timestamp: Date.now(),
            };
            const defaultAddress = {
                city: 'Kinshasa',
                district: 'Gombe',
                street: '',
                name: '',
                neighbourhood: '',
                country: 'RDC',
                postalCode: '',
                region: '',
                formattedAddress: 'Gombe, Kinshasa',
                displayName: 'Gombe',
            };

            setLocation(defaultLocation);
            setAddress(defaultAddress);

            return { location: defaultLocation, address: defaultAddress };
        } finally {
            setLoading(false);
        }
    };


    // Effacer la localisation
    const clearLocation = async () => {
        try {
            await AsyncStorage.removeItem('userLocation');
            await AsyncStorage.removeItem('userAddress');
            setLocation(null);
            setAddress(null);
        } catch (err) {
            console.error('Error clearing location:', err);
        }
    };

    // 📍 Définir une adresse sélectionnée manuellement
    const setSelectedAddress = async (selectedData) => {
        try {
            const locationData = {
                latitude: selectedData.latitude,
                longitude: selectedData.longitude,
                timestamp: Date.now(),
            };

            const addressData = {
                city: selectedData.city || '',
                district: selectedData.district || '',
                street: selectedData.street || '',
                name: selectedData.name || '',
                neighbourhood: selectedData.neighbourhood || '',
                country: selectedData.country || 'RDC',
                formattedAddress: selectedData.formattedAddress || selectedData.address || '',
                displayName: selectedData.displayName || selectedData.name || '',
            };

            // Sauvegarder dans AsyncStorage
            await AsyncStorage.setItem('userLocation', JSON.stringify(locationData));
            await AsyncStorage.setItem('userAddress', JSON.stringify(addressData));

            // Mettre à jour l'état
            setLocation(locationData);
            setAddress(addressData);

            console.log('📍 Adresse sélectionnée:', addressData.formattedAddress);

            return { location: locationData, address: addressData };
        } catch (err) {
            console.error('Error setting selected address:', err);
        }
    };

    // Distance entre deux points (Haversine)
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Rayon de la Terre en km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const value = {
        location,
        address,
        loading,
        error,
        getCurrentLocation,
        clearLocation,
        setSelectedAddress,
        getDistance,
        hasLocation: !!location,
        cityName: address?.city || '',
        districtName: address?.district || address?.neighbourhood || '',
        formattedAddress: address?.formattedAddress || '',
        displayName: address?.displayName || '',
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

/**
 * Hook pour accéder au contexte de localisation
 */
export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation doit être utilisé dans un LocationProvider');
    }
    return context;
};

export default LocationContext;
