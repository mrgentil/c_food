import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { navigationRef } from "../App";

import {
  ArrowLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from "react-native-heroicons/solid";
import * as Animatable from "react-native-animatable";
import DishRow from "../components/DishRow";
import BasketIcon from "../components/BasketIcon";
import RestaurantRating from "../components/RestaurantRating";
import { useDispatch } from "react-redux";
import { setRestaurant } from "../features/restaurantSlice";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import { StatusBar } from "expo-status-bar";

const RestaurantDetails = ({ navigation, route }) => {
  // const navigation = useNavigation();

  const dispatch = useDispatch();
  const [dishes, setDishes] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);

  /*
  const {
    params: { id },
  } = useRoute();
  */
  const id = route?.params?.id;


  const restaurantUid = id;

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([getDishData(), getRecentReviews()]);

        const docRef = doc(db, "restaurants", restaurantUid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const items = docSnap.data();
          setRestaurantInfo(items);
          dispatch(
            setRestaurant({
              id: restaurantUid,
              name: items.name,
              rating: items.rating,
              address: items.address,
              description: items.description,
              image: items.image,
              lat: items.lat,
              lng: items.lng,
              minDeliveryTime: items.minDeliveryTime,
              maxDeliveryTime: items.maxDeliveryTime,
            })
          );
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [restaurantUid]);

  const getDishData = async () => {
    const dishRef = collection(db, "dishes");
    const q = query(dishRef, where("restaurantId", "==", restaurantUid));

    try {
      const querySnapshot = await getDocs(q);
      let item = [];
      querySnapshot.forEach((doc) => {
        item.push({ ...doc.data(), id: doc.id });
      });
      setDishes(item);
    } catch (error) {
      console.error("Error fetching dishes:", error);
    }
  };

  const getRecentReviews = async () => {
    const ratingsRef = collection(db, "ratings");
    const q = query(
      ratingsRef,
      where("restaurantId", "==", restaurantUid),
      orderBy("createdAt", "desc"),
      limit(3)
    );

    try {
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentReviews(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#77b5fe" />
        <Text className="text-secondary font-bold mt-2">Préparation du menu...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <BasketIcon />

      <ScrollView className="bg-white" showsVerticalScrollIndicator={false}>
        {/* Immersive Header Image */}
        <Animatable.View animation="fadeInDown" duration={1000} className="relative">
          <Image
            source={{
              uri: restaurantInfo.image || "https://links.papareact.com/wru",
            }}
            className="w-full h-72 bg-gray-300 object-cover"
          />

          {/* Gradient Overlay for better text visibility if needed, or just style */}
          <View className="absolute w-full h-full bg-black/10" />

          {/* Back Button with blurred background for visibility */}
          <TouchableOpacity
            onPress={navigation.goBack}
            className="absolute top-12 left-5 bg-white p-2 rounded-full shadow-lg active:scale-90 duration-150 transform"
          >
            <ArrowLeftIcon size={22} color="#77b5fe" />
          </TouchableOpacity>

          <View className="absolute top-12 right-5 flex-row space-x-3">
            <TouchableOpacity className="bg-white p-2 rounded-full shadow-lg">
              <MagnifyingGlassIcon size={22} color="#77b5fe" />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={800} delay={200} className="bg-white -mt-12 rounded-t-3xl px-5 pt-6 pb-2 shadow-inner">
          <View className="flex-row justify-between items-start">
            <Text className="text-3xl font-extrabold text-gray-900 flex-1 mr-2">{restaurantInfo.name}</Text>
            <RestaurantRating restaurantId={restaurantUid} size="large" />
          </View>

          <View className="flex-row items-center space-x-2 my-2 mt-3">
            <View className="flex-row items-center space-x-1 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <ClockIcon size={15} color="#77b5fe" opacity={0.8} />
              <Text className="text-xs text-gray-600 font-bold">
                {restaurantInfo.minDeliveryTime}-{restaurantInfo.maxDeliveryTime} min
              </Text>
            </View>

            <View className="flex-row items-center space-x-1 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 max-w-[60%]">
              <MapPinIcon color="#77b5fe" opacity={0.8} size={15} />
              <Text className="text-xs text-gray-600 truncate" numberOfLines={1}>
                {restaurantInfo.address}
              </Text>
            </View>
          </View>

          <Text className="text-gray-500 mt-3 leading-6 font-medium text-sm">
            {restaurantInfo.description}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Reviews', { restaurantId: restaurantUid, restaurantName: restaurantInfo.name })}
            className="flex-row items-center space-x-2 p-4 border border-gray-100 rounded-2xl bg-gray-50 mt-5 active:bg-gray-100"
          >
            <StarIcon color="#FBBF24" size={20} />
            <View className="flex-1">
              <Text className="text-md font-bold text-gray-700">
                Avis des clients
              </Text>
              {recentReviews.length > 0 ? (
                <Text className="text-gray-400 text-xs italic" numberOfLines={1}>
                  "{recentReviews[0].comment || 'Super expérience !'}"
                </Text>
              ) : (
                <Text className="text-gray-400 text-xs">Notez votre expérience</Text>
              )}
            </View>
            <View className="flex-row items-center">
              <Text className="text-[#77b5fe] font-bold text-xs mr-1">Voir tout</Text>
              <ChevronRightIcon color="#77b5fe" size={16} />
            </View>
          </TouchableOpacity>
        </Animatable.View>

        <View className="pb-36 bg-gray-50 pt-6">
          <Text className="px-5 mb-4 font-extrabold text-2xl text-gray-900">Menu 🍽️</Text>

          {/* Dishes List with Staggered Animation */}
          {dishes.map((dish, index) => (
            <Animatable.View
              key={index}
              animation="fadeInUp"
              duration={600}
              delay={400 + (index * 150)} // Progressive delay for cascade effect
              useNativeDriver
            >
              <DishRow
                restaurantId={restaurantUid}
                id={dish.id}
                name={dish.name}
                description={dish.description}
                price={dish.price}
                image={dish.image}
              />
            </Animatable.View>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export default RestaurantDetails;
