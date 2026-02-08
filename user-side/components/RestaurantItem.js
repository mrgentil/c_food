import { View, Text, Image, Pressable, TouchableOpacity } from "react-native";
import { StarIcon, ClockIcon } from "react-native-heroicons/solid";
import { HeartIcon } from "react-native-heroicons/solid";
import { HeartIcon as HeartOutline } from "react-native-heroicons/outline";
import { useNavigation } from "@react-navigation/native";
import RestaurantRating from "./RestaurantRating";
import { useState, useEffect } from "react";
import { UserAuth } from "../contexts/AuthContext";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const RestaurantItem = ({
  id,
  title,
  rating,
  address,
  image,
  description,
  genre,
  lat,
  lng,
  minDeliveryTime,
  maxDeliveryTime,
}) => {
  const navigation = useNavigation();
  const { user } = UserAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const DEFAULT_IMAGE = "https://i.postimg.cc/qvhzT8XP/pastry.jpg";

  useEffect(() => {
    if (user?.uid) {
      checkFavoriteStatus();
    }
  }, [user, id]);

  const checkFavoriteStatus = async () => {
    try {
      const userRef = doc(db, "user", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const favorites = userSnap.data().favorites || [];
        setIsFavorite(favorites.includes(id));
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async (e) => {
    // e.stopPropagation();
    if (!user?.uid) return;

    try {
      const userRef = doc(db, "user", user.uid);
      if (isFavorite) {
        await updateDoc(userRef, {
          favorites: arrayRemove(id)
        });
        setIsFavorite(false);
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(id)
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <Pressable
      onPress={() => {
        navigation.navigate("Restaurant", { id });
      }}
      className="bg-white mb-4 flex-row items-center cursor-pointer p-2 rounded-xl border border-gray-50"
    >
      {/* Image Container */}
      <View className="h-24 w-24 rounded-xl overflow-hidden shadow-sm relative">
        <Image
          source={{
            uri: image && image.startsWith("http") ? image : DEFAULT_IMAGE,
          }}
          className="h-full w-full object-cover"
        />
        {/* Favorite Button */}
        <TouchableOpacity
          onPress={toggleFavorite}
          className="absolute top-1 right-1 bg-white/80 p-1.5 rounded-full"
        >
          {isFavorite ? (
            <HeartIcon size={14} color="#EF4444" />
          ) : (
            <HeartOutline size={14} color="#EF4444" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content Container */}
      <View className="flex-1 ml-3 space-y-1">
        <View className="flex-row justify-between items-center">
          <Text className="font-bold text-lg text-gray-800">{title}</Text>
          {/* Dynamic Rating from Firestore */}
          <RestaurantRating restaurantId={id} size="small" />
        </View>

        <Text className="text-gray-500 text-xs" numberOfLines={1}>
          {genre} • {address}
        </Text>

        <View className="flex-row items-center space-x-2 mt-1">
          <View className="flex-row items-center">
            <ClockIcon color="gray" size={12} opacity={0.6} />
            <Text className="text-xs text-gray-500 ml-1">{minDeliveryTime}-{maxDeliveryTime} min</Text>
          </View>
          <Text className="text-gray-300 text-xs">•</Text>
          <Text className="text-xs text-[#0EA5E9] font-medium">Livraison offerte</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default RestaurantItem;
