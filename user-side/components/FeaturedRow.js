import React from "react";
import { View, Text, ScrollView } from "react-native";
import { ArrowRightIcon } from "react-native-heroicons/outline";
import RestaurantCard from "./RestaurantCard";

const FeaturedRow = ({ id, title, description, restaurants = [] }) => {
  return (
    <View>
      <View className="mt-4 flex-row items-center justify-between px-4">
        <Text className="font-bold text-2xl">{title}</Text>
        <ArrowRightIcon color="#77b5fe" />
      </View>

      <Text className="text-sm text-gray-500 px-4">{description}</Text>

      <ScrollView
        horizontal
        contentContainerStyle={{
          paddingHorizontal: 15,
        }}
        showsHorizontalScrollIndicator={false}
        className="pt-4"
      >
        {/* Restaurant Cards */}
        {restaurants.map((item, index) => {
          return (
            <RestaurantCard
              key={index}
              id={item.id}
              title={item.name}
              rating={item.rating}
              description={item.description}
              address={item.address}
              image={item.image}
              genre={item.genre}
              lat={item.lat}
              lng={item.lng}
              minDeliveryTime={item.minDeliveryTime}
              maxDeliveryTime={item.maxDeliveryTime}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

export default FeaturedRow;
