import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MagnifyingGlassIcon, AdjustmentsVerticalIcon, XCircleIcon } from 'react-native-heroicons/outline';
import {
    FireIcon,
    CakeIcon,
    ShoppingBagIcon,
    StarIcon,
    HeartIcon,
    SparklesIcon
} from 'react-native-heroicons/solid';

import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import RestaurantItem from '../components/RestaurantItem';
import FilterModal from '../components/FilterModal';

const BrowseScreen = () => {
    const [searchText, setSearchText] = useState('');
    const [restaurants, setRestaurants] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Active Filters State
    const [activeFilters, setActiveFilters] = useState({
        sortBy: 'recommended',
        prices: [],
        dietary: []
    });

    const categories = [
        { id: '1', name: 'Populaire', icon: FireIcon, color: '#EF4444', bg: 'bg-red-50', filter: 'popular' },
        { id: '2', name: 'Desserts', icon: CakeIcon, color: '#EC4899', bg: 'bg-pink-50', filter: 'dessert' },
        { id: '3', name: 'Fast Food', icon: ShoppingBagIcon, color: '#F59E0B', bg: 'bg-orange-50', filter: 'fast_food' },
        { id: '4', name: 'Nouveautés', icon: SparklesIcon, color: '#8B5CF6', bg: 'bg-violet-50', filter: 'new' },
        { id: '5', name: 'Sain', icon: HeartIcon, color: '#10B981', bg: 'bg-green-50', filter: 'healthy' },
        { id: '6', name: 'Meilleurs Note', icon: StarIcon, color: '#FACC15', bg: 'bg-yellow-50', filter: 'top_rated' },
    ];

    useEffect(() => {
        fetchRestaurants();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchText, activeFilters, restaurants]);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "restaurants"));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRestaurants(data);
            setFilteredRestaurants(data);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...restaurants];

        // 1. Text Search
        if (searchText) {
            result = result.filter(r =>
                r.name.toLowerCase().includes(searchText.toLowerCase()) ||
                r.short_description?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // 2. Price Filter
        if (activeFilters.prices.length > 0) {
            // Check if restaurant priceRating matches any selected price ($, $$, etc)
            // Assuming priceRating is stored as '$', '$$', etc. or 1, 2, 3. 
            // We'll normalize to length if stored as string.
            result = result.filter(r => {
                const price = r.priceRating || '$'; // Default to $ if missing
                return activeFilters.prices.includes(price);
            });
        }

        // 3. Dietary Filter
        if (activeFilters.dietary.length > 0) {
            result = result.filter(r => {
                // Check genre or tags array
                const tags = r.genre ? r.genre.toLowerCase() : '';
                return activeFilters.dietary.some(diet => tags.includes(diet));
            });
        }

        // 4. Sorting
        switch (activeFilters.sortBy) {
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'deliveryTime':
                result.sort((a, b) => (a.minDeliveryTime || 0) - (b.minDeliveryTime || 0));
                break;
            case 'cost_low_high':
                // Rough estimate based on priceRating length if numeric price not available
                result.sort((a, b) => (a.priceRating?.length || 1) - (b.priceRating?.length || 1));
                break;
            case 'recommended':
            default:
                // Shuffle or default order
                break;
        }

        setFilteredRestaurants(result);
    };

    const handleQuickCategory = (filterType) => {
        // Quick preset filters based on category card clicks
        if (filterType === 'top_rated') {
            setActiveFilters(prev => ({ ...prev, sortBy: 'rating' }));
        } else if (filterType === 'new') {
            // Need a createdAt field or similar, for now just no-op or sort by logic
            setActiveFilters(prev => ({ ...prev, sortBy: 'recommended' }));
        }
        // Can expand this logic for genres
    };

    const activeFilterCount = activeFilters.prices.length + activeFilters.dietary.length + (activeFilters.sortBy !== 'recommended' ? 1 : 0);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-5 py-4">
                <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">Explorer</Text>
            </View>

            {/* Tags vertically scrollable */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 px-5 mb-4 max-h-10">
                {['Tout', 'Vérifié', 'Populaire', 'Nouveau', 'Offres Spéciales'].map((tag, i) => (
                    <TouchableOpacity key={i} className={`px-4 py-1.5 rounded-full mr-2 bg-blue-50 border border-blue-100`}>
                        <Text className="text-xs text-blue-800 font-bold">{tag}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Search Bar */}
            <View className="px-5 mb-2">
                <View className="flex-row items-center space-x-2 bg-gray-100 p-3 rounded-2xl shadow-sm border border-gray-100">
                    <MagnifyingGlassIcon color="#9CA3AF" size={24} />
                    <TextInput
                        placeholder="Plats, restaurants ou cuisines..."
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 font-semibold text-gray-700 text-base"
                        onChangeText={setSearchText}
                        value={searchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <XCircleIcon size={20} color="gray" />
                        </TouchableOpacity>
                    )}
                    <View className="h-6 w-[1px] bg-gray-300 mx-1" />
                    <TouchableOpacity
                        onPress={() => setShowFilterModal(true)}
                        className="relative"
                    >
                        <AdjustmentsVerticalIcon color={activeFilterCount > 0 ? "#0EA5E9" : "#6B7280"} size={24} />
                        {activeFilterCount > 0 && (
                            <View className="absolute -top-2 -right-2 bg-[#0EA5E9] w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                                <Text className="text-white text-[10px] font-bold">{activeFilterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* GRID CATEGORIES (Only show if no search/filter active to keep clean?) 
                     Let's keep them as quick shortcuts 
                 */}
                {!searchText && activeFilterCount === 0 && (
                    <View className="px-5 mt-4">
                        <Text className="text-xl font-bold text-gray-800 mb-4">Catégories</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {categories.map((category) => {
                                const Icon = category.icon;
                                const screenWidth = Dimensions.get('window').width;
                                const cardWidth = (screenWidth - 40 - 15) / 2;

                                return (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={{ width: cardWidth }}
                                        onPress={() => handleQuickCategory(category.filter)}
                                        className={`mb-4 rounded-3xl p-5 flex-col items-center justify-center shadow-sm border border-gray-100 active:scale-95 duration-200 ${category.bg}`}
                                    >
                                        <View className="p-3 bg-white rounded-full shadow-sm mb-3">
                                            <Icon size={32} color={category.color} />
                                        </View>
                                        <Text className="font-bold text-gray-800 text-center">{category.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Results List */}
                <View className="px-5 mt-4">
                    <Text className="text-xl font-bold text-gray-800 mb-4">
                        {filteredRestaurants.length} Résultat{filteredRestaurants.length > 1 ? 's' : ''}
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#0EA5E9" />
                    ) : filteredRestaurants.length > 0 ? (
                        filteredRestaurants.map((item) => (
                            <View key={item.id} className="mb-2">
                                <RestaurantItem
                                    id={item.id}
                                    title={item.name}
                                    rating={item.rating}
                                    description={item.description}
                                    address={item.address}
                                    genre={item.genre}
                                    image={item.image}
                                    lat={item.lat}
                                    lng={item.lng}
                                    minDeliveryTime={item.minDeliveryTime}
                                    maxDeliveryTime={item.maxDeliveryTime}
                                />
                            </View>
                        ))
                    ) : (
                        <View className="items-center py-10 opacity-50">
                            <MagnifyingGlassIcon size={64} color="#9CA3AF" />
                            <Text className="text-gray-500 font-bold mt-4 text-center">Aucun restaurant trouvé.</Text>
                            <Text className="text-gray-400 text-center text-sm">Essayez de modifier vos filtres.</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchText('');
                                    setActiveFilters({ sortBy: 'recommended', prices: [], dietary: [] });
                                }}
                                className="mt-4 px-4 py-2 bg-gray-100 rounded-full"
                            >
                                <Text className="text-gray-600 font-bold text-xs">Tout effacer</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </ScrollView>

            <FilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApplyFilters={(filters) => setActiveFilters(filters)}
                initialFilters={activeFilters}
            />
        </SafeAreaView>
    );
};

export default BrowseScreen;
