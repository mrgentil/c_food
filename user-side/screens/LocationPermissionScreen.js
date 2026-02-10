import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 📍 LOCATION PERMISSION SCREEN
 * Premier écran au lancement - Demande autorisation géolocalisation
 */
const LocationPermissionScreen = ({ navigation }) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        // Animation d'entrée
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleEnableLocation = async () => {
        setIsFetching(true);
        try {
            // Demander la permission
            const { status } = await Location.requestForegroundPermissionsAsync();

            // Marquer comme vu
            await AsyncStorage.setItem('hasSeenLocationPermission', 'true');

            if (status === 'granted') {
                await AsyncStorage.setItem('locationPermissionGranted', 'true');

                // 🎯 RÉCUPÉRER AUTOMATIQUEMENT LA POSITION AVEC HAUTE PRÉCISION
                try {
                    const position = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Highest, // Changed from Balanced to Highest
                    });

                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        timestamp: position.coords.timestamp,
                    };

                    // 🗺️ REVERSE GEOCODING
                    const reverseGeocode = await Location.reverseGeocodeAsync({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });

                    if (reverseGeocode.length > 0) {
                        const place = reverseGeocode[0];

                        // Construction d'une adresse plus complète
                        // Ex: "12 Av. de la Paix, Gombe, Kinshasa"
                        const streetComponent = place.street ? `${place.street}, ` : '';
                        const nameComponent = place.name && place.name !== place.street ? `${place.name}, ` : '';
                        const districtComponent = place.district || place.subregion || '';
                        const cityComponent = place.city || 'Kinshasa';

                        // Priorité : Rue > Quartier > Ville
                        const fullAddress = `${nameComponent}${streetComponent}${districtComponent ? districtComponent + ', ' : ''}${cityComponent}`;

                        const addressData = {
                            city: place.city || 'Kinshasa',
                            district: place.district || place.subregion || 'Commune',
                            street: place.street || '',
                            name: place.name || '',
                            country: place.country || 'RDC',
                            formattedAddress: fullAddress.replace(/, $/, ''), // Remove trailing comma
                        };

                        // 💾 SAUVEGARDER
                        await AsyncStorage.setItem('userLocation', JSON.stringify(locationData));
                        await AsyncStorage.setItem('userAddress', JSON.stringify(addressData));

                        console.log('✅ Position précise détectée:', addressData.formattedAddress);
                    }
                } catch (locError) {
                    console.error('Erreur récupération position:', locError);
                    // Continuer quand même
                }
            }

            // Naviguer vers Auth
            navigation.replace('Auth');
        } catch (error) {
            console.error('Error requesting location:', error);
            // Continuer quand même
            await AsyncStorage.setItem('hasSeenLocationPermission', 'true');
            navigation.replace('Auth');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSkip = async () => {
        // Marquer comme vu et refusé
        await AsyncStorage.setItem('hasSeenLocationPermission', 'true');
        await AsyncStorage.setItem('locationPermissionGranted', 'false');
        navigation.replace('Auth');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.5)" translucent />

            <Animated.View style={[
                styles.modalContainer,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconEmoji}>📍</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Autoriser la localisation ?</Text>

                {/* Description */}
                <Text style={styles.description}>
                    C-Food utilise votre position pour trouver les restaurants et livreurs à proximité.
                </Text>

                {/* Features (Simplified) */}
                <View style={styles.features}>
                    <FeatureItem
                        icon="✓"
                        text="Restaurants proches de vous"
                    />
                    <FeatureItem
                        icon="✓"
                        text="Estimation précise de livraison"
                    />
                </View>

                {/* Buttons */}
                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={styles.enableButton}
                        onPress={handleEnableLocation}
                        activeOpacity={0.8}
                        disabled={isFetching}
                    >
                        {isFetching ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.enableButtonText}>Autoriser</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.skipButtonText}>Ne pas autoriser</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const FeatureItem = ({ icon, text }) => (
    <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>{icon}</Text>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background to simulate modal overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    // Removed backgroundGlow as it might clash with the modal look
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EFF6FF', // Very light blue
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconEmoji: {
        fontSize: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827', // Gray-900
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#6B7280', // Gray-500
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    // Modified FeatureItem to be more compact or removed for simple dialog look
    features: {
        width: '100%',
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    featureText: {
        fontSize: 14,
        color: '#4B5563', // Gray-600
        fontWeight: '500',
    },
    buttons: {
        width: '100%',
        gap: 10,
        flexDirection: 'column', // Stack buttons
    },
    enableButton: {
        backgroundColor: '#77b5fe',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    enableButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    skipButtonText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '600',
    },
    infoText: {
        marginTop: 16,
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});

export default LocationPermissionScreen;
