import { View, Text, Image, Pressable, Dimensions, TouchableOpacity } from "react-native";
import { StarIcon, ClockIcon } from "react-native-heroicons/solid";
import { HeartIcon } from "react-native-heroicons/solid";
import { HeartIcon as HeartOutline } from "react-native-heroicons/outline";
import { useNavigation } from "@react-navigation/native";
import RestaurantRating from "./RestaurantRating";
import { useState, useEffect } from "react";
import { UserAuth } from "../contexts/AuthContext";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const { width } = Dimensions.get("window");

const RestaurantCardHero = ({
    id,
    title,
    rating,
    address,
    image,
    genre,
    minDeliveryTime,
    maxDeliveryTime,
    isTopRated = false,
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
        // e.stopPropagation(); // Prevent navigating to restaurant
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
            className="mr-4 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-2 relativ"
            style={{ width: width * 0.85 }}
        >
            <View className="relative">
                <Image
                    source={{
                        uri: image && image.startsWith("http") ? image : DEFAULT_IMAGE,
                    }}
                    className="h-48 w-full object-cover"
                />

                {/* Favorite Button */}
                <TouchableOpacity
                    onPress={toggleFavorite}
                    className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md z-10"
                >
                    {isFavorite ? (
                        <HeartIcon size={24} color="#EF4444" />
                    ) : (
                        <HeartOutline size={24} color="#EF4444" />
                    )}
                </TouchableOpacity>

                {/* Genre Badge */}
                <View className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Text className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">{genre}</Text>
                </View>

                {/* Excellence Badge for Top Rated */}
                {isTopRated && (
                    <View className="absolute top-14 right-4 bg-amber-400 px-3 py-1 rounded-full flex-row items-center border border-amber-500 shadow-sm">
                        <Text className="text-[10px] font-bold text-amber-900">🏆 EXCELLENCE</Text>
                    </View>
                )}

                {/* Rating Badge - Dynamic from Firestore */}
                <View className="absolute bottom-4 right-4 bg-white px-2 py-1 rounded-lg shadow-md">
                    <RestaurantRating restaurantId={id} size="small" />
                </View>
            </View>

            <View className="px-4 py-3 pb-4">
                <Text className="font-bold text-xl text-gray-800">{title}</Text>

                <View className="flex-row items-center space-x-4 mt-1">
                    <View className="flex-row items-center space-x-1">
                        <ClockIcon color="gray" size={14} opacity={0.6} />
                        <Text className="text-xs text-gray-500">{minDeliveryTime}-{maxDeliveryTime} min</Text>
                    </View>
                    <Text className="text-xs text-gray-400">•</Text>
                    <Text className="text-xs text-gray-500 truncate w-40">{address}</Text>
                </View>

                <View className="mt-3 flex-row items-center space-x-2">
                    <View className="bg-gray-100 px-2 py-1 rounded-md">
                        <Text className="text-[10px] text-gray-500 font-semibold">Livraison offerte</Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

export default RestaurantCardHero;

