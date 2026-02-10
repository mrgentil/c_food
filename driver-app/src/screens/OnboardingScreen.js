import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        emoji: '👋',
        title: 'Bienvenue chez C-Food',
        subtitle: 'Rejoignez notre équipe de livreurs et commencez à gagner de l\'argent dès aujourd\'hui !',
        color: '#0EA5E9',
    },
    {
        id: '2',
        emoji: '💰',
        title: 'Gagnez de l\'argent',
        subtitle: 'Livrez des repas et recevez des paiements instantanés. Vous définissez vos propres horaires.',
        color: '#0284C7', // Bleu un peu plus foncé
    },
    {
        id: '3',
        emoji: '🛵',
        title: 'Livrez facilement',
        subtitle: 'Navigation intégrée, suivi GPS et communication directe avec les clients.',
        color: '#38BDF8', // Bleu plus clair
    },
];

const OnboardingScreen = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            // Marquer l'onboarding comme vu
            await AsyncStorage.setItem('driver_onboarding_seen', 'true');
            navigation.replace('Login');
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('driver_onboarding_seen', 'true');
        navigation.replace('Login');
    };

    const renderSlide = ({ item, index }) => {
        return (
            <View style={[styles.slide, { width }]}>
                <View style={[styles.emojiContainer, { backgroundColor: item.color + '15' }]}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
        );
    };

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {slides.map((_, index) => {
                    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 24, 8],
                        extrapolate: 'clamp',
                    });
                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.4, 1, 0.4],
                        extrapolate: 'clamp',
                    });
                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    width: dotWidth,
                                    opacity,
                                    backgroundColor: slides[currentIndex].color,
                                },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Skip Button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            {/* Dots */}
            {renderDots()}

            {/* Next/Start Button */}
            <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: slides[currentIndex].color }]}
                onPress={handleNext}
            >
                <Text style={styles.nextText}>
                    {currentIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    skipText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '500',
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emojiContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 48,
    },
    emoji: {
        fontSize: 80,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    nextButton: {
        marginHorizontal: 24,
        marginBottom: 32,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    nextText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default OnboardingScreen;
