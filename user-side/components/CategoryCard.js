import React from "react";
import { Image, Text, Pressable, View } from "react-native";

export default function CategoryCard({ imgUrl, title, isSelected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`relative mr-4 items-center active:scale-95 duration-200 ${isSelected ? 'opacity-100' : 'opacity-70'}`}
    >
      <View className={`shadow-lg rounded-full ${isSelected ? 'shadow-sky-200' : 'shadow-gray-100'}`}>
        <Image
          source={{ uri: imgUrl }}
          className={`h-[72px] w-[72px] rounded-full border-[3px] ${isSelected ? 'border-sky-500' : 'border-white'}`}
        />
        {isSelected && (
          <View className="absolute -bottom-1 -right-1 bg-sky-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}
      </View>
      <Text className={`text-[11px] font-bold mt-2 tracking-wide uppercase ${isSelected ? 'text-sky-600' : 'text-gray-600'}`}>
        {title}
      </Text>
    </Pressable>
  );
}
