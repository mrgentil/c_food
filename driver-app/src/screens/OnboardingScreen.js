import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        image: require('../../assets/1.jpg'),
        title: 'Rejoignez la flotte C-Food',
        subtitle: 'OPPORTUNITÉ',
        description: 'Devenez votre propre patron. Livrez des sourires et gagnez de l\'argent selon votre emploi du temps.',
        color: '#0EA5E9',
        bg: '#F0F9FF',
    },
    {
        id: '2',
        image: 'https://img.freepik.com/free-vector/delivery-service-illustrated_23-2148505080.jpg',
        title: 'Gagnez plus, travaillez mieux',
        subtitle: 'REVENUS INSTANTANÉS',
        description: 'Suivez vos gains en temps réel et profitez de bonus exclusifs durant les heures de pointe.',
        color: '#0EA5E9',
        bg: '#F8FAFC',
    },
    {
        id: '3',
        image: require('../../assets/2.jpg'),
        title: 'Optimisez vos trajets',
        subtitle: 'NAVIGATION INTELLIGENTE',
        description: 'La meilleure technologie GPS pour vous guider rapidement vers vos clients. Moins d\'attente, plus de livraisons.',
        color: '#0EA5E9',
        bg: '#F0FDF4',
    },
];

const OnboardingScreen = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
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
                <Animated.View
                    style={[
                        styles.imageContainer,
                        {
                            backgroundColor: item.bg,
                            transform: [{
                                scale: scrollX.interpolate({
                                    inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                                    outputRange: [0.8, 1, 0.8],
                                })
                            }]
                        }
                    ]}
                >
                    <Image
                        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </Animated.View>

                <View style={styles.textContainer}>
                    <Text style={[styles.slideSubtitle, { color: item.color }]}>{item.subtitle}</Text>
                    <Text style={styles.slideTitle}>{item.title}</Text>
                    <Text style={styles.slideDescription}>{item.description}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header: Logo & Skip */}
            <View style={styles.header}>
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                {currentIndex !== slides.length - 1 && (
                    <TouchableOpacity onPress={handleSkip}>
                        <Text style={styles.skipText}>Passer</Text>
                    </TouchableOpacity>
                )}
            </View>

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

            {/* Footer */}
            <View style={styles.footer}>
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {slides.map((_, index) => {
                        const widthAnim = scrollX.interpolate({
                            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        width: widthAnim,
                                        backgroundColor: index === currentIndex ? slides[currentIndex].color : '#E2E8F0',
                                    },
                                ]}
                            />
                        );
                    })}
                </View>

                {/* Next Button */}
                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: slides[currentIndex].color }]}
                    onPress={handleNext}
                >
                    {currentIndex === slides.length - 1 ? (
                        <Text style={styles.nextText}>COMMENCER</Text>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.nextText}>SUIVANT</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        zIndex: 10,
    },
    logo: {
        width: 40,
        height: 40,
    },
    skipText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    imageContainer: {
        width: width * 0.85,
        height: width * 0.85,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    slideSubtitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    slideTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 34,
    },
    slideDescription: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    nextButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    nextText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
    },
});

export default OnboardingScreen;
