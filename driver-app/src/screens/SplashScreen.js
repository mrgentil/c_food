import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigation après 2.5 secondes
        const timer = setTimeout(async () => {
            const hasSeenOnboarding = await AsyncStorage.getItem('driver_onboarding_seen');
            if (hasSeenOnboarding) {
                navigation.replace('Login');
            } else {
                navigation.replace('Onboarding');
            }
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Logo animé */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Texte animé */}
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <Text style={styles.title}>C-FOOD</Text>
                <Text style={styles.subtitle}>Driver</Text>
            </Animated.View>

            {/* Indicateur de chargement */}
            <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
                <View style={styles.loadingBar}>
                    <Animated.View style={[styles.loadingProgress]} />
                </View>
                <Text style={styles.loadingText}>Chargement...</Text>
            </Animated.View>
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
    logoContainer: {
        marginBottom: 24,
    },
    logoImage: {
        width: 160,
        height: 160,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: '#0EA5E9',
        textAlign: 'center',
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: 8,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 80,
        alignItems: 'center',
    },
    loadingBar: {
        width: 150,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loadingProgress: {
        width: '100%',
        height: '100%',
        backgroundColor: '#0EA5E9',
        borderRadius: 2,
    },
    loadingText: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 8,
    },
});

export default SplashScreen;
