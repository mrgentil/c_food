import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftIcon, TrophyIcon, GiftIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';

const FidelityScreen = () => {
    const navigation = useNavigation();
    const { dbUser } = require('../contexts/AuthContext').UserAuth();

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-white rounded-full shadow-sm">
                        <ArrowLeftIcon size={20} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-800">Fidélité & Cashback</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="px-4 pt-4">
                    {/* Points Card */}
                    <View className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-indigo-600 p-6 rounded-3xl shadow-lg mb-6 overflow-hidden relative">
                        <View className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full" />
                        <View className="absolute -left-10 -bottom-10 bg-white/10 w-40 h-40 rounded-full" />

                        <View className="flex-row justify-between items-start mb-4">
                            <View>
                                <Text className="text-white/80 font-medium mb-1">Vos points</Text>
                                <Text className="text-white text-4xl font-bold">{dbUser?.loyaltyPoints || 0} pts</Text>
                            </View>
                            <View className="bg-white/20 p-2 rounded-xl">
                                <TrophyIcon size={32} color="white" />
                            </View>
                        </View>
                        <Text className="text-white/70 text-sm">Gagnez 1 point tous les 1000 FC dépensés !</Text>
                    </View>

                    {/* Cashback Card */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex-row items-center justify-between">
                        <View className="flex-row items-center space-x-4">
                            <View className="bg-purple-100 p-3 rounded-xl">
                                <GiftIcon size={24} color="#8B5CF6" />
                            </View>
                            <View>
                                <Text className="font-bold text-gray-800 text-lg">Cashback</Text>
                                <Text className="text-gray-500 text-xs">Cumulé (Portefeuille)</Text>
                            </View>
                        </View>
                        <Text className="text-xl font-bold text-[#8B5CF6]">{new Intl.NumberFormat('fr-CD').format(dbUser?.walletBalance || 0)} FC</Text>
                    </View>

                    {/* Rewards List Placeholder */}
                    <Text className="text-lg font-bold text-gray-800 mb-4">Récompenses disponibles</Text>

                    <View className="items-center justify-center py-10">
                        <Image
                            source={{ uri: "https://cdn-icons-png.flaticon.com/512/6165/6165576.png" }}
                            className="w-32 h-32 opacity-50 mb-4"
                            resizeMode="contain"
                        />
                        <Text className="text-gray-400 text-center px-10">
                            Continuez à commander pour débloquer des récompenses exclusives !
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default FidelityScreen;
