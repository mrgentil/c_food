import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRightIcon } from "react-native-heroicons/solid";
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Premium Onboarding Data
const SLIDES = [
    {
        id: '1',
        title: 'Vos envies à portée de main',
        subtitle: 'LARGE CHOIX',
        description: 'Explorez une multitude de saveurs locales et internationales. Vos restaurants préférés livrés chez vous.',
        image: require('../assets/2.jpg'),
        bg: '#F8FAFC', // Light Slate
        accent: '#77b5fe',
    },
    {
        id: '2',
        title: 'Suivez la course en direct',
        subtitle: 'RAPIDITÉ & PRÉCISION',
        description: 'Ne perdez pas une miette de votre commande. Suivez votre livreur en temps réel sur notre carte interactive.',
        image: 'https://img.freepik.com/free-vector/delivery-service-illustrated_23-2148505081.jpg',
        bg: '#F0F9FF', // Light Sky
        accent: '#77b5fe',
    },
    {
        id: '3',
        title: 'Savourez chaque instant',
        subtitle: 'BON APPÉTIT',
        description: 'Rejoignez la communauté C-Food et profitez d\'une expérience de livraison sans couture et délicieuse.',
        image: require('../assets/1.jpg'),
        bg: '#EFF6FF', // Light Blue
        accent: '#77b5fe',
    },
];

const OnboardingItem = ({ item, index }) => {
    return (
        <View style={{ width, height: height * 0.6, alignItems: 'center', justifyContent: 'center' }}>
            {/* Main Illustration Area */}
            <Animatable.View
                animation="fadeIn"
                duration={1000}
                className="items-center justify-center p-4"
            >
                <Animatable.Image
                    animation="pulse"
                    easing="ease-out"
                    iterationCount="infinite"
                    duration={6000}
                    source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                    style={{
                        width: width * 0.85,
                        height: width * 0.85,
                        borderRadius: 40,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                    }}
                    resizeMode="cover"
                />
            </Animatable.View>
        </View>
    );
};

const OnboardingScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollToNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            await finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        navigation.replace('LocationPermission');
    };

    // Interpolate background color for smooth transitions
    const backgroundColor = scrollX.interpolate({
        inputRange: SLIDES.map((_, i) => i * width),
        outputRange: SLIDES.map(slide => slide.bg),
    });

    return (
        <Animated.View style={{ flex: 1, backgroundColor }}>
            <StatusBar barStyle="dark-content" />

            <SafeAreaView className="flex-1">
                {/* Header: Logo & Skip */}
                <View className="flex-row justify-between items-center px-6 pt-2">
                    <Image
                        source={require('../assets/logo.png')}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                    />
                    {currentIndex !== SLIDES.length - 1 && (
                        <TouchableOpacity onPress={finishOnboarding} className="px-4 py-2">
                            <Text className="text-gray-400 font-bold text-xs tracking-widest uppercase">Passer</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Slides */}
                <FlatList
                    data={SLIDES}
                    renderItem={({ item, index }) => <OnboardingItem item={item} index={index} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    ref={slidesRef}
                />

                {/* Content Section (Glassmorphism effect placeholder) */}
                <View className="bg-white/90 rounded-t-[50px] px-10 pt-12 pb-10 shadow-2xl">
                    <View className="items-center">
                        <Animatable.Text
                            key={`subtitle-${currentIndex}`}
                            animation="fadeInRight"
                            duration={500}
                            style={{ color: SLIDES[currentIndex].accent }}
                            className="text-xs font-black tracking-[4px] mb-3 uppercase"
                        >
                            {SLIDES[currentIndex].subtitle}
                        </Animatable.Text>

                        <Animatable.Text
                            key={`title-${currentIndex}`}
                            animation="fadeInUp"
                            duration={600}
                            className="text-3xl font-extrabold text-[#111827] text-center mb-4 leading-tight"
                        >
                            {SLIDES[currentIndex].title}
                        </Animatable.Text>

                        <Animatable.Text
                            key={`desc-${currentIndex}`}
                            animation="fadeInUp"
                            delay={100}
                            duration={600}
                            className="text-gray-500 text-center text-base leading-7 px-2 mb-8"
                        >
                            {SLIDES[currentIndex].description}
                        </Animatable.Text>
                    </View>

                    {/* Bottom Controls */}
                    <View className="flex-row justify-between items-center">
                        {/* Pagination Dots */}
                        <View className="flex-row space-x-2">
                            {SLIDES.map((_, i) => (
                                <View
                                    key={i}
                                    className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-[#77b5fe]' : 'w-2 bg-gray-200'
                                        }`}
                                />
                            ))}
                        </View>

                        {/* Next Button - Circular Style */}
                        <TouchableOpacity
                            onPress={scrollToNext}
                            style={{ backgroundColor: SLIDES[currentIndex].accent }}
                            className="w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-400/50"
                        >
                            {currentIndex === SLIDES.length - 1 ? (
                                <Animatable.View animation="pulse" iterationCount="infinite">
                                    <Text className="text-white font-bold text-xs">GO</Text>
                                </Animatable.View>
                            ) : (
                                <ArrowRightIcon size={24} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
};

export default OnboardingScreen;
