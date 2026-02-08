import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftIcon, MegaphoneIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';

const AnnouncementsScreen = () => {
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
                    <Text className="text-xl font-bold text-gray-800">Annonces</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="px-4 pt-4">
                    {/* Empty State for now */}
                    <View className="flex-1 items-center justify-center py-20">
                        <View className="bg-red-50 p-6 rounded-full mb-4">
                            <MegaphoneIcon size={48} color="#EF4444" />
                        </View>
                        <Text className="text-xl font-bold text-gray-800 mb-2">Rien pour le moment</Text>
                        <Text className="text-gray-500 text-center px-10">
                            Revenez bientôt pour découvrir les nouveautés et offres exclusives !
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default AnnouncementsScreen;
