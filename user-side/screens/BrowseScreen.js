import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MagnifyingGlassIcon, AdjustmentsVerticalIcon } from 'react-native-heroicons/outline';
import {
    FireIcon,
    CakeIcon,
    ShoppingBagIcon,
    StarIcon,
    HeartIcon,
    SparklesIcon
} from 'react-native-heroicons/solid';

const BrowseScreen = () => {
    const [searchText, setSearchText] = useState('');

    const categories = [
        { id: '1', name: 'Populaire', icon: FireIcon, color: '#EF4444', bg: 'bg-red-50' },
        { id: '2', name: 'Desserts', icon: CakeIcon, color: '#EC4899', bg: 'bg-pink-50' },
        { id: '3', name: 'Fast Food', icon: ShoppingBagIcon, color: '#F59E0B', bg: 'bg-orange-50' },
        { id: '4', name: 'Nouveautés', icon: SparklesIcon, color: '#8B5CF6', bg: 'bg-violet-50' },
        { id: '5', name: 'Sain', icon: HeartIcon, color: '#10B981', bg: 'bg-green-50' },
        { id: '6', name: 'Milleurs Note', icon: StarIcon, color: '#FACC15', bg: 'bg-yellow-50' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Header Mockup - Simplified for Browse */}
            <View className="px-5 py-4">
                <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">Explorer</Text>
            </View>

            {/* Tags vertically scrollable */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 px-5">
                {['Vérifié', 'Populaire', 'Nouveau'].map((tag, i) => (
                    <View key={i} className="bg-blue-100 px-2 py-1 rounded-md mr-2">
                        <Text className="text-xs text-blue-800 font-bold">{tag}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Search Bar */}
            <View className="px-5 mb-4">
                <View className="flex-row items-center space-x-2 bg-gray-100 p-3 rounded-2xl shadow-sm border border-gray-100">
                    <MagnifyingGlassIcon color="#9CA3AF" size={24} />
                    <TextInput
                        placeholder="Qu'est-ce qui vous ferait plaisir ?"
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 font-semibold text-gray-700 text-base"
                        onChangeText={setSearchText}
                        value={searchText}
                    />
                    <View className="h-6 w-[1px] bg-gray-300 mx-1" />
                    <TouchableOpacity>
                        <AdjustmentsVerticalIcon color="#0EA5E9" size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

                {/* GRID CATEGORIES */}
                <Text className="text-xl font-bold text-gray-800 mb-4 mt-2">Catégories</Text>

                <View className="flex-row flex-wrap justify-between">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const screenWidth = Dimensions.get('window').width;
                        const cardWidth = (screenWidth - 40 - 15) / 2; // (Screen - Padding - Gap) / 2

                        return (
                            <TouchableOpacity
                                key={category.id}
                                style={{ width: cardWidth }}
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

                {/* PROMO BOX */}
                <View className="bg-gray-900 rounded-3xl p-6 mt-4 relative overflow-hidden mb-24">
                    {/* Decorative circles */}
                    <View className="absolute -right-10 -top-10 w-40 h-40 bg-gray-700 rounded-full opacity-30" />
                    <View className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#0EA5E9] rounded-full opacity-30" />

                    <View className="">
                        <Text className="text-[#0EA5E9] font-bold text-sm uppercase tracking-widest mb-1">Coming Soon</Text>
                        <Text className="text-white font-extrabold text-2xl mb-2">Mode Sombre 🌙</Text>
                        <Text className="text-gray-400 font-medium">Bientôt, reposez vos yeux avec notre thème sombre ultra-élégant.</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default BrowseScreen;
