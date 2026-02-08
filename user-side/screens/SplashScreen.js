import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 🎨 SPLASH SCREEN - ENATEGA STYLE
 * Clean White Background + Signature Green Pulse
 */
const SplashScreen = ({ navigation }) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.5));
    const [rippleScale] = useState(new Animated.Value(0));
    const [rippleOpacity] = useState(new Animated.Value(1));

    useEffect(() => {
        // POUR LE TEST : On réinitialise les booleans pour voir le flux à chaque fois
        // A ENLEVER PLUS TARD
        const resetForDev = async () => {
            await AsyncStorage.removeItem('hasSeenOnboarding');
            await AsyncStorage.removeItem('hasSeenLocationPermission');
        };
        resetForDev();

        // Enatega Pulse Effect
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
            // Continuous Ripple
            Animated.loop(
                Animated.parallel([
                    Animated.timing(rippleScale, {
                        toValue: 1.5,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rippleOpacity, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: true,
                    })
                ])
            )
        ]).start();

        const timer = setTimeout(async () => {
            await checkOnboardingStatus();
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
            const hasSeenLocation = await AsyncStorage.getItem('hasSeenLocationPermission');

            if (hasSeenOnboarding !== 'true') {
                navigation.replace('Onboarding');
            } else if (hasSeenLocation !== 'true') {
                navigation.replace('LocationPermission');
            } else {
                navigation.replace('SignIn');
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            navigation.replace('Onboarding'); // Default fallback
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Ripple Effect Background */}
            <Animated.View style={[
                styles.ripple,
                {
                    opacity: rippleOpacity,
                    transform: [{ scale: rippleScale }]
                }
            ]} />

            {/* Logo Container */}
            <Animated.View style={[
                styles.logoContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                {/* Replaced Text Logo with Image if available, or styled text */}
                <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>C</Text>
                </View>
            </Animated.View>

            {/* Branding Text */}
            <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                <Text style={styles.brandName}>C-Food</Text>
                <Text style={styles.tagline}>Livraison rapide, saveurs infinies</Text>
            </Animated.View>

            {/* Bottom Loader */}
            <View style={styles.loaderContainer}>
                <Animated.View style={[
                    styles.loaderDot,
                    { opacity: fadeAnim }
                ]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ripple: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#77b5fe', // New Brand Blue
        opacity: 0.2,
    },
    logoContainer: {
        marginBottom: 20,
        shadowColor: "#77b5fe",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 30, // Squircle shape common in modern apps
        backgroundColor: '#77b5fe',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-10deg' }]
    },
    logoText: {
        fontSize: 40,
        fontWeight: '900',
        color: 'white',
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 20
    },
    brandName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333333',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 5,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '600'
    },
    loaderContainer: {
        position: 'absolute',
        bottom: 50,
    },
    loaderDot: {
        width: 40,
        height: 4,
        backgroundColor: '#77b5fe',
        borderRadius: 2,
    }
});

export default SplashScreen;
