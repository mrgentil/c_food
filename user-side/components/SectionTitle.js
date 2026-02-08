import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRightIcon } from "react-native-heroicons/outline";

const SectionTitle = ({ title, onPress }) => {
    return (
        <View className="flex-row items-center justify-between px-4 mt-6 mb-4">
            <Text className="font-extrabold text-2xl text-gray-800 tracking-tight">
                {title}
            </Text>
            <TouchableOpacity onPress={onPress} className="flex-row items-center space-x-1">
                <Text className="text-[#0EA5E9] font-bold text-sm">Voir tout</Text>
                <ArrowRightIcon size={16} color="#0EA5E9" />
            </TouchableOpacity>
        </View>
    );
};

export default SectionTitle;
