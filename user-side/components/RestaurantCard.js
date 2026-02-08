import { View, Text, Image, Pressable } from "react-native";
import { MapPinIcon, StarIcon, SparklesIcon } from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";

const RestaurantCard = ({
  id,
  title,
  rating,
  address,
  image,
  lat,
  description,
  lng,
  genre,
  minDeliveryTime,
  maxDeliveryTime,
}) => {
  const navigation = useNavigation();
  const DEFAULT_IMAGE = "https://i.postimg.cc/qvhzT8XP/pastry.jpg";

  return (
    <Pressable
      onPress={() => {
        navigation.navigate("Restaurant", {
          id,
        });
      }}
      className="bg-white mr-4 rounded-3xl shadow-lg shadow-blue-100 w-64 border border-gray-100"
    >
      <View className="relative">
        <Image
          source={{
            uri: image && image.startsWith("http") ? image : DEFAULT_IMAGE,
          }}
          className="h-40 w-full rounded-t-3xl"
        />
        {/* Floating Glassmorphism Badge */}
        <View className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded-full shadow-sm flex-row items-center space-x-1">
          <StarIcon color="#77b5fe" size={14} />
          <Text className="text-xs font-bold text-gray-800">{rating}</Text>
        </View>
      </View>

      <View className="px-3 pb-4">
        <Text className="font-bold text-lg pt-2 text-secondary">{title}</Text>

        <View className="flex-row items-center space-x-1">
          <MapPinIcon color="gray" opacity={0.4} size={22} />
          <Text className="text-xs text-gray-500 truncate w-[190px]">
            Nearby • {address}
          </Text>
        </View>

        <View className="flex-row items-center space-x-1 mt-2">
          <Text className="text-xs text-gray-500">{minDeliveryTime}-{maxDeliveryTime} mins</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default RestaurantCard;
