import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftIcon, GiftIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';

const GiftCardScreen = () => {
    const navigation = useNavigation();

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-white rounded-full shadow-sm">
                        <ArrowLeftIcon size={20} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-800">Cartes Cadeaux</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="px-4 pt-4">
                    {/* Add Gift Card Section */}
                    <View className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                        <View className="items-center mb-4">
                            <View className="bg-pink-100 p-4 rounded-full mb-2">
                                <GiftIcon size={32} color="#EC4899" />
                            </View>
                            <Text className="font-bold text-lg text-gray-800">Ajouter une carte</Text>
                            <Text className="text-gray-400 text-center text-sm px-4">
                                Entrez le code de votre carte cadeau pour l'ajouter à votre solde.
                            </Text>
                        </View>

                        <TextInput
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            placeholderTextColor="#9CA3AF"
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-center font-bold tracking-widest"
                        />

                        <TouchableOpacity className="bg-[#EC4899] py-3 rounded-xl items-center">
                            <Text className="text-white font-bold">Activer</Text>
                        </TouchableOpacity>
                    </View>

                    {/* My Gift Cards List */}
                    <Text className="text-lg font-bold text-gray-800 mb-4">Vos cartes actives</Text>

                    <View className="items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Text className="text-gray-400 font-medium">Aucune carte active</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default GiftCardScreen;
