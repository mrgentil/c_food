import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { ClockIcon, FireIcon } from "react-native-heroicons/solid";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import { db } from "../firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

const FlashDeals = () => {
    const navigation = useNavigation();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    // Fetch active promotions from Firestore
    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                const now = Timestamp.now();
                const promosRef = collection(db, 'promotions');

                // Get all promotions and filter client-side for better compatibility
                const snapshot = await getDocs(promosRef);

                const activePromos = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(promo => {
                        // Check if active and within date range
                        if (!promo.isActive) return false;

                        const startDate = promo.startDate?.toDate?.() || new Date(promo.startDate);
                        const endDate = promo.endDate?.toDate?.() || new Date(promo.endDate);
                        const nowDate = new Date();

                        return startDate <= nowDate && endDate >= nowDate;
                    })
                    .slice(0, 10); // Max 10 deals

                setDeals(activePromos);

                // Calculate time left until first promo expires
                if (activePromos.length > 0) {
                    const soonestEnd = activePromos.reduce((min, promo) => {
                        const endDate = promo.endDate?.toDate?.() || new Date(promo.endDate);
                        return endDate < min ? endDate : min;
                    }, new Date(activePromos[0].endDate?.toDate?.() || activePromos[0].endDate));

                    const secondsLeft = Math.max(0, Math.floor((soonestEnd - new Date()) / 1000));
                    setTimeLeft(secondsLeft);
                }
            } catch (error) {
                console.error('Error fetching promotions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPromotions();
    }, []);

    // Countdown Timer
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-CD').format(price) + ' FC';
    };

    const handleDealPress = (deal) => {
        // Navigate to restaurant with the dish highlighted
        navigation.navigate('Restaurant', {
            id: deal.restaurantId,
            highlightDishId: deal.dishId
        });
    };

    // Don't render if no deals
    if (!loading && deals.length === 0) {
        return null;
    }

    if (loading) {
        return (
            <View className="mt-6 mb-2 px-4">
                <View className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            </View>
        );
    }

    return (
        <View className="mt-6 mb-2">
            {/* Header with Timer */}
            <View className="flex-row justify-between items-center px-4 mb-3">
                <View className="flex-row items-center">
                    <Text className="text-xl font-extrabold text-gray-900 mr-2">Bons Plans 🎯</Text>
                    <Animatable.View animation="pulse" iterationCount="infinite" duration={1000}>
                        <FireIcon color="#F97316" size={24} />
                    </Animatable.View>
                </View>
                {timeLeft > 0 && (
                    <View className="bg-red-500 px-3 py-1 rounded-lg flex-row items-center shadow-sm">
                        <ClockIcon color="white" size={16} />
                        <Text className="text-white font-bold ml-1">{formatTime(timeLeft)}</Text>
                    </View>
                )}
            </View>

            {/* Horizontal Scroll List */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 15 }}
            >
                {deals.map((deal) => (
                    <TouchableOpacity
                        key={deal.id}
                        onPress={() => handleDealPress(deal)}
                        className="mr-4 bg-white rounded-2xl shadow-sm border border-gray-100 w-40 overflow-hidden"
                    >
                        <View className="relative">
                            <Image
                                source={{ uri: deal.dishImage || 'https://via.placeholder.com/200' }}
                                className="h-28 w-full object-cover"
                            />
                            <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-md">
                                <Text className="text-white text-xs font-bold">-{deal.discountPercent}%</Text>
                            </View>
                        </View>

                        <View className="p-3">
                            <Text className="font-bold text-gray-800 text-sm truncate">{deal.dishName}</Text>
                            <Text className="text-gray-400 text-xs truncate">{deal.restaurantName}</Text>
                            <View className="flex-row items-center mt-1">
                                <Text className="font-extrabold text-red-500 mr-2">{formatPrice(deal.discountedPrice)}</Text>
                                <Text className="text-gray-400 text-xs line-through">{formatPrice(deal.originalPrice)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default FlashDeals;
