import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import Currency from "react-currency-formatter";
import { selectBasketItems, selectBasketTotal } from "../features/basketSlice";
import { useNavigation } from "@react-navigation/native";

const BasketIcon = () => {
  const navigation = useNavigation();

  const items = useSelector(selectBasketItems);
  const basketTotal = useSelector(selectBasketTotal);

  if (items.length === 0) return null;

  return (
    <View className="absolute bottom-4 w-full z-50">
      <TouchableOpacity
        onPress={() => navigation.navigate("Basket")}
        className="bg-primary mx-3 px-3 py-3 rounded-3xl items-center space-x-1 flex-row "
      >
        <Text className="text-white font-extrabold text-lg bg-secondary py-2 px-4 rounded-full ">
          {items.length}
        </Text>
        <Text className="flex-1 text-white font-extrabold text-lg text-center">
          Voir le Panier
        </Text>
        <Text className="text-lg text-white font-extrabold">
          {new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 0 }).format(basketTotal)} CDF
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BasketIcon;
