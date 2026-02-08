import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRightIcon } from "react-native-heroicons/solid";
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Enatega Style Data
const SLIDES = [
    {
        id: '1',
        title: 'Choisissez vos plats préférés',
        subtitle: 'Cuisines Variées',
        description: 'Trouvez les meilleurs restaurants près de chez vous avec une grande variété de cuisines pour satisfaire toutes vos envies.',
        image: 'https://cdn-icons-png.flaticon.com/512/9357/9357448.png', // Placeholder for Enatega Illustration
        color: '#77b5fe', // Enatega Green
    },
    {
        id: '2',
        title: 'Livraison Rapide et Fiable',
        subtitle: 'Suivi en Temps Réel',
        description: 'Recevez vos plats chauds et frais. Suivez votre livreur en temps réel sur la carte jusqu\'à votre porte.',
        image: 'https://cdn-icons-png.flaticon.com/512/7603/7603875.png',
        color: '#77b5fe',
    },
    {
        id: '3',
        title: 'Bon Appétit',
        subtitle: 'Savourez l\'instant',
        description: 'Profitez de délicieux repas chez vous avec vos proches. Découvrez le meilleur service de livraison.',
        image: 'https://cdn-icons-png.flaticon.com/512/3655/3655682.png',
        color: '#77b5fe',
    },
];

const OnboardingItem = ({ item, index }) => {
    return (
        <View style={{ width, height: height * 0.65, alignItems: 'center', justifyContent: 'center', paddingBottom: 50 }}>
            {/* Main Illustration Area */}
            <Animatable.View
                animation="fadeInUp"
                delay={index * 300}
                duration={1000}
                className="items-center justify-center p-10"
            >
                <Animatable.Image
                    animation="pulse"
                    easing="ease-out"
                    iterationCount="infinite"
                    duration={4000}
                    source={{ uri: item.image }}
                    style={{ width: width * 0.8, height: width * 0.8 }}
                    resizeMode="contain"
                />
            </Animatable.View>
        </View>
    );
};

const OnboardingScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef(null);

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

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Enatega Green Top Blob */}
            <View className="absolute top-0 right-0 -mt-32 -mr-32 w-80 h-80 bg-[#77b5fe] rounded-full opacity-20 blur-3xl" />

            {/* Bottom Yellow/Accent Blob */}
            <View className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-[#FFC107] rounded-full opacity-10 blur-3xl" />

            <SafeAreaView className="flex-1">
                {/* Skip Button */}
                <View className="flex-row justify-end px-6 pt-2">
                    {currentIndex !== SLIDES.length - 1 && (
                        <TouchableOpacity onPress={finishOnboarding} className="bg-gray-100 px-4 py-2 rounded-full">
                            <Text className="text-gray-500 font-bold text-xs">PASSER</Text>
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
                    scrollEventThrottle={32}
                    ref={slidesRef}
                />

                {/* Bottom Sheet UI */}
                <View className="h-[35%] w-full px-8 justify-between pb-10">

                    {/* Text Section */}
                    <View className="items-center">
                        <Animatable.Text
                            key={`title-${currentIndex}`}
                            animation="fadeInDown"
                            duration={500}
                            className="text-3xl font-extrabold text-[#333333] text-center mb-2"
                        >
                            {SLIDES[currentIndex].title}
                        </Animatable.Text>

                        <Animatable.Text
                            key={`desc-${currentIndex}`}
                            animation="fadeInUp"
                            duration={500}
                            className="text-gray-400 text-center text-sm leading-6 px-2 mt-2"
                        >
                            {SLIDES[currentIndex].description}
                        </Animatable.Text>
                    </View>

                    {/* Controls Section */}
                    <View>
                        {/* Pagination */}
                        <View className="flex-row justify-center mb-8 space-x-2">
                            {SLIDES.map((_, i) => (
                                <View
                                    key={i}
                                    className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-[#77b5fe]' : 'w-2 bg-gray-200'
                                        }`}
                                />
                            ))}
                        </View>

                        {/* Primary Button */}
                        <TouchableOpacity
                            onPress={scrollToNext}
                            className="w-full bg-[#77b5fe] py-4 rounded-xl shadow-lg shadow-blue-200/50 flex-row justify-center items-center active:scale-95 duration-200"
                        >
                            <Text className="text-white font-bold text-lg mr-2 uppercase tracking-widest">
                                {currentIndex === SLIDES.length - 1 ? "C'est parti" : "Suivant"}
                            </Text>
                            {currentIndex !== SLIDES.length - 1 && (
                                <ArrowRightIcon size={20} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default OnboardingScreen;
