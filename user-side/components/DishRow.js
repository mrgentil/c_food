import { View, Text, Pressable, Image, TouchableOpacity } from "react-native";
import { MinusCircleIcon, PlusCircleIcon } from "react-native-heroicons/solid";
import React, { useState } from "react";
import {
  addToBasket,
  selectBasketItemsWithId,
  removeFromBasket,
} from "../features/basketSlice";
import { useDispatch, useSelector } from "react-redux";

const DishRow = ({ id, name, description, price, image, restaurantId }) => {
  const [isPressed, setIsPressed] = useState(false);

  const dispatch = useDispatch();
  const items = useSelector((state) => selectBasketItemsWithId(state, id));

  const addItems = () => {
    dispatch(
      addToBasket({ id, restaurantId, name, description, price: Number(price), image })
    );
  };

  const removeItemFromBasket = () => {
    if (!items.length > 0) return;
    dispatch(removeFromBasket({ id }));
  };

  // Format price to Congolese Francs (FC)
  const formattedPrice = new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF' }).format(price);

  return (
    <>
      <Pressable
        onPress={() => setIsPressed(!isPressed)}
        className={`bg-white border-b border-gray-100 p-4 ${isPressed && "border-b-0"}`}
      >
        <View className="flex-row">
          <View className="flex-1 pr-2">
            <Text className="text-lg mb-1 font-bold text-gray-800">{name}</Text>
            <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>{description}</Text>
            <Text className="text-gray-900 mt-2 text-base font-bold">
              {formattedPrice}
            </Text>
          </View>

          <View>
            <Image
              style={{
                borderWidth: 0,
              }}
              source={{
                uri: image,
              }}
              className="h-28 w-28 bg-gray-300 p-4 rounded-xl object-cover"
            />
          </View>
        </View>
      </Pressable>

      {/* Quantity Selector - Show if pressed or item in basket */}
      {(isPressed || items.length > 0) && (
        <View className="bg-white px-4 pb-4">
          <View className="flex-row items-center space-x-2 pb-0">
            <TouchableOpacity onPress={removeItemFromBasket} disabled={!items.length}>
              <MinusCircleIcon
                color={items.length > 0 ? "#0EA5E9" : "gray"}
                size={34}
              />
            </TouchableOpacity>

            <Text className="text-gray-700 font-bold text-lg mx-2">{items.length}</Text>

            <TouchableOpacity onPress={addItems}>
              <PlusCircleIcon color="#0EA5E9" size={34} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
};

export default DishRow;
