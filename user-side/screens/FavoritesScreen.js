import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HeartIcon, MapPinIcon, ClockIcon } from 'react-native-heroicons/solid';
import { HeartIcon as HeartOutline } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, documentId, updateDoc, arrayRemove, onSnapshot } from 'firebase/firestore';
import { UserAuth } from '../contexts/AuthContext';
import RestaurantRating from '../components/RestaurantRating';

const FavoritesScreen = () => {
    const { user } = UserAuth();
    const navigation = useNavigation();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    // Listen to user's favorites in real-time
    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const userRef = doc(db, 'user', user.uid);
        const unsubscribe = onSnapshot(userRef, async (docSnap) => {
            if (docSnap.exists()) {
                const favoriteIds = docSnap.data().favorites || [];

                if (favoriteIds.length === 0) {
                    setFavorites([]);
                    setLoading(false);
                } else {
                    await fetchRestaurants(favoriteIds);
                }
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const fetchRestaurants = async (ids) => {
        try {
            // Firestore 'in' query supports up to 10 items. 
            // If more than 10 favorites, we need to batch or loop (simplified here for <10)
            const batches = [];
            let tempIds = [...ids];
            while (tempIds.length) {
                const batch = tempIds.splice(0, 10);
                const q = query(collection(db, 'restaurants'), where(documentId(), 'in', batch));
                batches.push(getDocs(q));
            }

            const results = await Promise.all(batches);
            const restaurants = results.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));

            setFavorites(restaurants);
        } catch (error) {
            console.error("Error fetching favorite restaurants:", error);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (restaurantId) => {
        try {
            const userRef = doc(db, 'user', user.uid);
            await updateDoc(userRef, {
                favorites: arrayRemove(restaurantId)
            });
            // State update handled by onSnapshot
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#0EA5E9" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-5 py-4 border-b border-gray-100">
                <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">Mes Favoris ❤️</Text>
                <Text className="text-gray-500 text-sm mt-1">Vos restaurants préférés</Text>
            </View>

            {favorites.length === 0 ? (
                <View className="flex-1 items-center justify-center px-10">
                    <View className="bg-red-50 p-6 rounded-full mb-6">
                        <HeartOutline size={60} color="#EF4444" />
                    </View>
                    <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                        Aucun favori
                    </Text>
                    <Text className="text-gray-500 text-center">
                        Appuyez sur le ❤️ sur un restaurant pour l'ajouter à vos favoris !
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('HomeTab')}
                        className="mt-6 bg-[#0EA5E9] px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-bold">Explorer les restaurants</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                    {favorites.map((restaurant) => (
                        <TouchableOpacity
                            key={restaurant.id}
                            onPress={() => navigation.navigate('Restaurant', { id: restaurant.id })}
                            className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden"
                        >
                            {/* Image */}
                            <View className="relative">
                                <Image
                                    source={{ uri: restaurant.image }}
                                    className="w-full h-40"
                                    resizeMode="cover"
                                />
                                {/* Remove Button */}
                                <TouchableOpacity
                                    onPress={() => removeFavorite(restaurant.id)}
                                    className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md"
                                >
                                    <HeartIcon size={24} color="#EF4444" />
                                </TouchableOpacity>
                                {/* Rating Badge */}
                                <View className="absolute bottom-3 right-3 bg-white px-2 py-1 rounded-lg shadow-sm">
                                    <RestaurantRating restaurantId={restaurant.id} size="small" />
                                </View>
                            </View>

                            {/* Info */}
                            <View className="p-4">
                                <Text className="text-lg font-bold text-gray-900">{restaurant.name}</Text>
                                <Text className="text-gray-500 text-sm">{restaurant.genre}</Text>

                                <View className="flex-row items-center mt-3 space-x-4">
                                    <View className="flex-row items-center">
                                        <ClockIcon size={16} color="#9CA3AF" />
                                        <Text className="text-gray-500 text-xs ml-1">
                                            {restaurant.minDeliveryTime}-{restaurant.maxDeliveryTime} min
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <MapPinIcon size={16} color="#9CA3AF" />
                                        <Text className="text-gray-500 text-xs ml-1 flex-1" numberOfLines={1}>
                                            {restaurant.address}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Bottom padding */}
                    <View className="h-24" />
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default FavoritesScreen;
