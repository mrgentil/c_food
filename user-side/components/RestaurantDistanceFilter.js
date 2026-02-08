import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MapPinIcon, GlobeAltIcon } from 'react-native-heroicons/outline';

/**
 * 🔍 RESTAURANT DISTANCE FILTER
 * Boutons pour filtrer: À proximité (< 5km) vs Tous les restaurants
 */

const RestaurantDistanceFilter = ({ activeFilter, onFilterChange, nearbyCount, totalCount }) => {
    return (
        <View className="flex-row px-4 mb-4 gap-3">
            {/* À Proximité Button */}
            <TouchableOpacity
                onPress={() => onFilterChange('nearby')}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${activeFilter === 'nearby'
                        ? 'bg-[#0EA5E9]'
                        : 'bg-white border border-gray-200'
                    }`}
                activeOpacity={0.7}
            >
                <MapPinIcon
                    size={20}
                    color={activeFilter === 'nearby' ? '#FFFFFF' : '#0EA5E9'}
                />
                <View className="ml-2">
                    <Text className={`font-bold ${activeFilter === 'nearby' ? 'text-white' : 'text-gray-800'
                        }`}>
                        À proximité
                    </Text>
                    <Text className={`text-xs ${activeFilter === 'nearby' ? 'text-white/80' : 'text-gray-500'
                        }`}>
                        {nearbyCount} restos
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Tous Button */}
            <TouchableOpacity
                onPress={() => onFilterChange('all')}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${activeFilter === 'all'
                        ? 'bg-[#0EA5E9]'
                        : 'bg-white border border-gray-200'
                    }`}
                activeOpacity={0.7}
            >
                <GlobeAltIcon
                    size={20}
                    color={activeFilter === 'all' ? '#FFFFFF' : '#0EA5E9'}
                />
                <View className="ml-2">
                    <Text className={`font-bold ${activeFilter === 'all' ? 'text-white' : 'text-gray-800'
                        }`}>
                        Tous
                    </Text>
                    <Text className={`text-xs ${activeFilter === 'all' ? 'text-white/80' : 'text-gray-500'
                        }`}>
                        {totalCount} restos
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default RestaurantDistanceFilter;
