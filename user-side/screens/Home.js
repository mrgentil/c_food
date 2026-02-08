import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { UserAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import {
  UserIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  AdjustmentsVerticalIcon,
  XCircleIcon,
  BellIcon,
  MapPinIcon
} from "react-native-heroicons/outline";
import { CalendarDaysIcon } from "react-native-heroicons/solid"; // Example solid icon
import Categories from "../components/Categories";
import FilterPills from "../components/FilterPills";
import RestaurantCardHero from "../components/RestaurantCardHero";
import RestaurantItem from "../components/RestaurantItem";
import PromoBanner from "../components/PromoBanner"; // NEW
import SectionTitle from "../components/SectionTitle"; // NEW
import Skeleton from "../components/Skeleton"; // NEW
import FlashDeals from "../components/FlashDeals"; // NEW
import LoyaltyCard from "../components/LoyaltyCard"; // NEW
import TopRatedSection from "../components/TopRatedSection"; // NEW
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import SearchCard from "../components/SearchCard";
import { useDispatch, useSelector } from "react-redux";
import { setUser, selectUser } from "../features/userSlice";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker } from "react-native-maps";
import { seedDatabase } from "../utils/seeder";
import AddressSearchAutocomplete from "../components/AddressSearchAutocomplete";
import RestaurantDistanceFilter from "../components/RestaurantDistanceFilter";
import { getDistance } from "geolib";

const Home = () => {
  const { user } = UserAuth();
  const { formattedAddress, districtName, location, setSelectedAddress, getCurrentLocation } = useLocation();
  const dispatch = useDispatch();
  const dbUser = useSelector(selectUser);
  const navigation = useNavigation();

  const [restaurant, setRestaurant] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [searchInputHasValue, setSearchInputHasValue] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Search state
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [addressSearch, setAddressSearch] = useState("");

  // Selected address from autocomplete
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Filter state
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Derive user first name for greeting (Prioritize Firestore > Auth > Default)
  const firstName = dbUser?.firstName || user?.displayName?.split(" ")[0] || "Gourmand";

  useEffect(() => {
    const initHome = async () => {
      setLoading(true);
      try {
        await Promise.all([getUserData(), getResData(), getDishes()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initHome();
  }, [user]);

  // 📍 Auto-fetch location if missing or default (New Fix)
  useEffect(() => {
    const fetchLocationIfMissing = async () => {
      // Force refresh if address is empty OR looks like the default fallback "Kinshasa, Gombe" or just "Kinshasa"
      if (!formattedAddress || formattedAddress.includes('Kinshasa, Gombe') || formattedAddress === 'Kinshasa') {
        console.log("📍 Location default/missing, auto-fetching fresh GPS data...");
        try {
          await getCurrentLocation();
        } catch (error) {
          console.log("📍 Auto-fetch failed (probably permission or gps):", error);
        }
      }
    };
    fetchLocationIfMissing();
  }, [formattedAddress]);

  const getUserData = async () => {
    if (!user?.uid) return;
    const userRef = doc(db, "user", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      dispatch(
        setUser({
          uid: user.uid,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
          latitude: userData.latitude,
          longitude: userData.longitude,
        })
      );
    }
  };

  const getResData = async () => {
    const resRef = collection(db, "restaurants");
    const querySnapshot = await getDocs(resRef);
    let restaurants = [];
    querySnapshot.forEach((doc) => {
      restaurants.push({ ...doc.data(), id: doc.id });
    });
    setRestaurant(restaurants);
  };

  const getDishes = async () => {
    const dishesRef = collection(db, "dishes");
    const querySnapshot = await getDocs(dishesRef);
    let dishesList = [];
    querySnapshot.forEach((doc) => {
      dishesList.push({ ...doc.data(), id: doc.id });
    });
    setDishes(dishesList);
  };

  // Gestion de la recherche
  const handleSearch = (text) => {
    setSearchText(text);
    if (text.length > 0) {
      setSearchInputHasValue(true);
      const filteredRestaurants = restaurant.filter((res) =>
        res.name.toLowerCase().includes(text.toLowerCase())
      );
      const filteredDishes = dishes.filter((dish) =>
        dish.name.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults([...filteredRestaurants, ...filteredDishes]);
    } else {
      setSearchInputHasValue(false);
      setSearchResults([]);
    }
  };

  const handleSeed = async () => {
    Alert.alert(
      "Remplir la base de données ?",
      "Cela va ajouter des restaurants et des plats fictifs pour la RDC.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui, remplir", onPress: async () => {
            await seedDatabase();
            getResData();
            getDishes();
          }
        }
      ]
    )
  };

  // 📍 Filtrer restaurants par distance ET catégorie
  const filterRestaurants = (restaurants, distanceFilter, genre) => {
    let filtered = [...restaurants];

    // Filtre par catégorie/genre
    if (genre) {
      filtered = filtered.filter(r =>
        r.genre?.toLowerCase() === genre.toLowerCase()
      );
    }

    // Filtre par distance
    if (location && distanceFilter !== 'all') {
      filtered = filtered.filter(restaurant => {
        if (!restaurant.lat || !restaurant.lng) return false;
        try {
          const distance = getDistance(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: restaurant.lat, longitude: restaurant.lng }
          );
          return distance < 5000;
        } catch (error) {
          console.error('Error calculating distance:', error);
          return false;
        }
      });
    }

    setFilteredRestaurants(filtered);
  };

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    filterRestaurants(restaurant, restaurantFilter, selectedGenre);
  }, [restaurantFilter, restaurant, location, selectedGenre]);

  // Handler pour le changement de catégorie
  const handleCategorySelect = (categoryId, genre) => {
    setSelectedCategory(categoryId);
    setSelectedGenre(genre);
  };

  return (
    <SafeAreaView className="bg-gray-50 flex-1 pt-2">
      <StatusBar style="dark" />

      {/* --- PREMIUM HEADER --- */}
      <View className="px-5 pt-2 pb-4 flex-row justify-between items-center bg-white rounded-b-[30px] shadow-sm z-10">
        <View className="flex-1">
          <View className="flex-row items-center space-x-2">
            <Text className="text-gray-400 text-sm font-medium">Localisation actuelle</Text>
            <ChevronDownIcon size={12} color="#77b5fe" />
          </View>

          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="flex-row items-center mt-0.5"
          >
            <MapPinIcon size={20} color="#77b5fe" solid />
            <Text className="text-gray-900 font-extrabold text-xl ml-1 truncate" numberOfLines={1}>
              {formattedAddress || districtName || 'Kinshasa, Gombe'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          className="bg-gray-50 p-1.5 rounded-full border border-gray-100 shadow-sm"
        >
          <Image
            source={{ uri: "https://links.papareact.com/wru" }}
            className="h-10 w-10 bg-gray-300 rounded-full"
          />
        </TouchableOpacity>
      </View>

      {/* --- GREETING & SEARCH --- */}
      <View className="px-5 mt-4">
        <Text className="text-gray-500 text-lg">Bonjour, <Text className="font-extrabold text-gray-800 text-2xl">{firstName} 👋</Text></Text>
        <Text className="text-gray-400 text-xs font-medium -mt-1 mb-4">Qu'est-ce qui vous ferait plaisir aujourd'hui ?</Text>
      </View>


      {/* --- SEARCH BAR FLOATING --- */}
      <Animatable.View animation="fadeInUp" duration={800} delay={200} className="mx-5 mb-2 relative z-50">
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-lg shadow-gray-200/50 border border-gray-100">
          <MagnifyingGlassIcon color="#77b5fe" size={24} />
          <TextInput
            placeholder="Rechercher 'Burger', 'Sushi'..."
            keyboardType="default"
            className="flex-1 font-semibold text-gray-800 text-base ml-3"
            onChangeText={handleSearch}
            value={searchText}
            placeholderTextColor="#9CA3AF"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <XCircleIcon color="gray" size={20} />
            </TouchableOpacity>
          )}
          <View className="h-6 w-[1px] bg-gray-200 mx-3" />
          <TouchableOpacity className="p-1">
            <AdjustmentsVerticalIcon color="#77b5fe" size={22} />
          </TouchableOpacity>
        </View>
      </Animatable.View>

      {/* 📍 RESTAURANT FILTER */}
      <Animatable.View animation="fadeInUp" duration={800} delay={300} className="mt-4">
        <RestaurantDistanceFilter
          activeFilter={restaurantFilter}
          onFilterChange={setRestaurantFilter}
          nearbyCount={location ? restaurant.filter(r => {
            if (!r.lat || !r.lng || !location) return false;
            const d = getDistance(
              { latitude: location.latitude, longitude: location.longitude },
              { latitude: r.lat, longitude: r.lng }
            );
            return d < 5000;
          }).length : 0}
          totalCount={restaurant.length}
        />
      </Animatable.View>


      {/* --- BODY --- */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#77b5fe" />
          <Text className="text-secondary font-bold mt-2 animate-pulse">Chargement des délices...</Text>
        </View>
      ) : (
        <ScrollView
          className="bg-gray-50 flex-1 pt-4"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >

          {/* SEARCH RESULTS */}
          {searchInputHasValue ? (
            <View className="px-4">
              <Text className="text-lg font-bold mb-4">Résultats de recherche</Text>
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <SearchCard key={index} results={result} />
                ))
              ) : (
                <Text className="text-center text-gray-400 mt-10">Aucun résultat trouvé 😢</Text>
              )}
            </View>
          ) : (
            <>
              {/* --- PROMO BANNERS --- */}
              <Animatable.View animation="fadeInUp" duration={800} delay={300}>
                <PromoBanner />
              </Animatable.View>

              {/* --- CATEGORIES --- */}
              <Animatable.View animation="fadeInUp" duration={800} delay={400} className="mt-6 mb-2">
                <View className="px-4 mb-2 flex-row justify-between items-center">
                  <Text className="font-bold text-gray-900 text-lg">Catégories 🍽️</Text>
                  {selectedGenre && (
                    <TouchableOpacity
                      onPress={() => handleCategorySelect('all', null)}
                      className="bg-sky-100 px-3 py-1 rounded-full"
                    >
                      <Text className="text-sky-600 text-xs font-bold">✕ Réinitialiser</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Categories
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleCategorySelect}
                />
              </Animatable.View>

              {/* --- FLASH DEALS --- */}
              <Animatable.View animation="fadeInUp" duration={800} delay={450}>
                <FlashDeals />
              </Animatable.View>

              {/* --- LOYALTY CARD --- */}
              <LoyaltyCard />

              {/* --- FEATURED SECTION --- */}
              <Animatable.View animation="fadeInUp" duration={800} delay={500} className="mt-4">
                <SectionTitle title="À la une 🔥" onPress={() => { }} />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 15 }}
                  className="pt-2"
                >
                  {/* Show first 5 filtered restaurants */}
                  {filteredRestaurants.slice(0, 5).map((item, index) => (
                    <RestaurantCardHero
                      key={index}
                      id={item.id}
                      title={item.name}
                      rating={item.rating}
                      description={item.description}
                      address={item.address}
                      image={item.image}
                      genre={item.genre}
                      minDeliveryTime={item.minDeliveryTime}
                      maxDeliveryTime={item.maxDeliveryTime}
                    />
                  ))}
                </ScrollView>
              </Animatable.View>

              {/* --- TOP RATED SECTION --- */}
              <TopRatedSection restaurants={filteredRestaurants} />

              {/* --- NEW ARRIVALS SECTION (NOUVEAUTÉS) --- */}
              <Animatable.View animation="fadeInUp" duration={800} delay={550} className="mt-6">
                <SectionTitle title="Nouveautés ✨" onPress={() => { }} />
                <Text className="text-xs text-gray-400 px-4 -mt-2 mb-2">Les pépites qu'on vient de dénicher pour vous !</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 15 }}
                  className="pt-2"
                >
                  {/* Last 5 filtered restaurants */}
                  {[...filteredRestaurants].reverse().slice(0, 5).map((item, index) => (
                    <RestaurantCardHero
                      key={index}
                      id={item.id}
                      title={item.name}
                      rating={item.rating}
                      description={item.description}
                      address={item.address}
                      image={item.image}
                      genre={item.genre}
                      minDeliveryTime={item.minDeliveryTime}
                      maxDeliveryTime={item.maxDeliveryTime}
                    />
                  ))}
                </ScrollView>
              </Animatable.View>

              {/* --- MAP PREVIEW SECTION --- */}
              <Animatable.View animation="fadeInUp" duration={800} delay={600} className="px-4 mt-6">
                <SectionTitle title="Autour de vous 📍" onPress={() => setModalVisible(true)} />
                <Text className="text-xs text-gray-400 -mt-2 mb-3">Découvrez les pépites et offres exclusives de votre quartier</Text>

                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  className="h-48 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative"
                >
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: -4.325,
                      longitude: 15.322,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.0121,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    liteMode={true} // Optimized for lists
                  />
                  {/* Overlay to catch taps if MapView eats them, or just to show interactivity */}
                  <View className="absolute inset-0 bg-transparent" />

                  {/* Floating Pill on Map */}
                  <View className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-full shadow-md flex-row items-center">
                    <MapPinIcon size={14} color="#77b5fe" />
                    <Text className="text-xs font-bold text-gray-800 ml-1">Voir la carte</Text>
                  </View>
                </TouchableOpacity>
              </Animatable.View>

              {/* --- ALL RESTAURANTS SECTION --- */}
              <Animatable.View animation="fadeInUp" duration={800} delay={600} className="px-4 mt-2">
                <SectionTitle title="Tous les restaurants" onPress={() => { }} />

                {/* List filtered restaurants */}
                {filteredRestaurants.map((item, index) => {
                  return (
                    <RestaurantItem
                      key={index}
                      id={item.id}
                      title={item.name}
                      rating={item.rating}
                      description={item.description}
                      address={item.address}
                      genre={item.genre}
                      image={item.image}
                      lat={item.lat}
                      lng={item.lng}
                      minDeliveryTime={item.minDeliveryTime}
                      maxDeliveryTime={item.maxDeliveryTime}
                    />
                  );
                })}
              </Animatable.View>

            </>
          )}
        </ScrollView>
      )}


      {/* Map Modal Premium */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          {/* Dismiss tap area */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
            className="absolute top-0 left-0 right-0 bottom-0"
          />

          <Animatable.View
            animation="slideInUp"
            duration={500}
            className="bg-white rounded-t-3xl h-[85%] shadow-2xl relative"
          >
            {/* Handle Bar */}
            <View className="items-center pt-3 pb-2">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </View>

            {/* Header with Search */}
            <View className="px-5 pb-4 z-10">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-extrabold text-gray-800">Choisir une adresse</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                  <XCircleIcon color="#4B5563" size={24} />
                </TouchableOpacity>
              </View>

              {/* Address Search Autocomplete */}
              <AddressSearchAutocomplete
                onSelectAddress={(address) => {
                  setSelectedLocation(address);
                  console.log('📍 Adresse sélectionnée:', address);
                }}
              />

              {/* 📍 Bouton "Utiliser ma position actuelle" */}
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const result = await getCurrentLocation();
                    if (result?.location) {
                      setSelectedLocation({
                        latitude: result.location.latitude,
                        longitude: result.location.longitude,
                        address: result.address?.formattedAddress,
                        district: result.address?.displayName,
                      });
                    }
                  } catch (error) {
                    console.error('Erreur GPS:', error);
                  }
                }}
                className="flex-row items-center bg-blue-50 p-3 rounded-xl mt-3 border border-blue-100"
              >
                <View className="bg-primary p-2 rounded-full mr-3">
                  <MapPinIcon size={18} color="white" />
                </View>
                <Text className="text-primary font-semibold">Utiliser ma position actuelle</Text>
              </TouchableOpacity>
            </View>

            {/* Map Container */}
            <View className="flex-1 relative bg-gray-100 overflow-hidden rounded-t-2xl">
              <MapView
                style={{ flex: 1 }}
                region={selectedLocation ? {
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                } : {
                  latitude: -4.325,
                  longitude: 15.322,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
              >
                {/* 📍 PIN ROUGE pour l'adresse sélectionnée */}
                {selectedLocation && (
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    }}
                    title={selectedLocation.district || "Votre adresse"}
                    description={selectedLocation.address}
                    pinColor="#EF4444"
                  />
                )}
              </MapView>

              {/* Floating "My Location" Button */}
              <TouchableOpacity className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-lg border border-gray-100 active:bg-gray-50">
                <MapPinIcon size={24} color="#77b5fe" />
              </TouchableOpacity>

              {/* Bottom Address Card */}
              <View className="absolute bottom-8 left-5 right-5 bg-white p-4 rounded-2xl shadow-xl flex-row items-center justify-between border border-gray-100">
                <View className="flex-1 mr-4">
                  <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Adresse sélectionnée</Text>
                  <Text className="text-gray-900 font-bold text-base" numberOfLines={1}>
                    {selectedLocation?.address || formattedAddress || 'Kinshasa, Gombe'}
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-primary px-6 py-3 rounded-xl shadow-md active:scale-95 duration-150"
                  onPress={() => {
                    // Sauvegarder l'adresse dans le contexte
                    if (selectedLocation) {
                      setSelectedAddress({
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                        formattedAddress: selectedLocation.address || selectedLocation.formattedAddress,
                        displayName: selectedLocation.district || selectedLocation.address,
                        name: selectedLocation.district || '',
                      });
                    }
                    setModalVisible(false);
                  }}
                >
                  <Text className="text-white font-bold">Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animatable.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default Home;
