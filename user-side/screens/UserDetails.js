import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions
} from "react-native";
import { UserAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Removed
import { StatusBar } from "expo-status-bar";

import { ROLES } from "../constants/roles";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import {
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from "react-native-heroicons/outline";
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const UserDetails = () => {
  const [locationPermission, setLocationPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [photoURL, setPhotoURL] = useState(null);

  // Wizard Steps State - Renamed to 'step' to potential ReferenceError
  const [step, setStep] = useState(1);
  const totalSteps = 2; // Step 1: Info, Step 2: Location

  const { user, signOutUser } = UserAuth();
  const { location: storedLocation, address: storedAddress, formattedAddress } = useLocation();

  useEffect(() => {
    loadUserData();
    getLocationPermission();
  }, []);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!uri) return null;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `user-avatars/${user.uid}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image: ", error);
      throw error;
    }
  };

  const loadUserData = async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, "user", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPhoneNumber(data.phoneNumber || "");
        setAddress(data.address || "");
        setPhotoURL(data.photoURL || null); // Load existing photo
        if (data.latitude && data.longitude) {
          setLocation({
            latitude: data.latitude,
            longitude: data.longitude
          });
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const getLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Nous avons besoin de votre localisation pour la livraison.");
      return;
    }
    setLocationPermission(status);
    getLocation();
  };

  const getLocation = async () => {
    // D'abord vérifier si on a déjà une position stockée
    if (storedLocation && storedAddress) {
      setLocation(storedLocation);
      setAddress(formattedAddress || `${storedAddress.district}, ${storedAddress.city}`);
      return;
    }

    // Sinon, récupérer une nouvelle position
    setIsLocationLoading(true);
    try {
      let { coords } = await Location.getCurrentPositionAsync({});
      setLocation(coords);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude
      });

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const formattedAddress = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}`;
        setAddress(formattedAddress.trim());
      }
    } catch (error) {
      console.log("Erreur localisation:", error);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handlePhoneNumberChange = (text) => {
    const formattedPhoneNumber = text.replace(/\D/g, "");
    const limitedPhoneNumber = formattedPhoneNumber.slice(0, 10);
    setPhoneNumber(limitedPhoneNumber);
  };

  // Cloudinary Configuration
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dul9gmbzj/image/upload";
  const UPLOAD_PRESET = "c_food";

  const uploadToCloudinary = async (uri) => {
    if (!uri) return null;

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        type: "image/jpeg", // or query the type from picker result
        name: "avatar.jpg",
      });
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "user-avatars"); // Optional: Organize in folders

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        }
      });

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("Cloudinary upload failed: " + (data.error?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Cloudinary Error:", error);
      throw error;
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!firstName || !lastName || !phoneNumber || phoneNumber.length < 10) {
        Alert.alert("Champs manquants", "Veuillez remplir vos informations personnelles.");
        return;
      }
      setStep(2);
    } else {
      onSave();
    }
  };

  const onSave = async () => {
    if (!address || !location) {
      Alert.alert("Adresse manquante", "Veuillez vérifier votre adresse de livraison.");
      return;
    }

    setIsLoading(true);
    try {
      let finalPhotoURL = photoURL;

      // Only upload if it's a local file URI
      if (photoURL && photoURL.startsWith('file://')) {
        finalPhotoURL = await uploadToCloudinary(photoURL);
      }

      await setDoc(doc(db, "user", user.uid), {
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        address: address,
        photoURL: finalPhotoURL, // Save Cloudinary URL
        latitude: location.latitude,
        longitude: location.longitude,
        // 🎭 Multi-Vendor: Role & Timestamps
        role: ROLES.CLIENT,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });

    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible d'enregistrer le profil : " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F0F9FF]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

            {/* Wizard Header Progress */}
            <View className="px-6 pt-4 pb-2 relative">
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  } else {
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    } else {
                      // Fallback if no history (e.g. from deep link or reset) -> Go to Main
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                      });
                    }
                  }
                }}
                className="absolute left-6 top-4 z-10 p-2 bg-white rounded-full shadow-sm"
              >
                <ArrowLeftIcon size={20} color="#0EA5E9" />
              </TouchableOpacity>

              <View className="flex-row items-center justify-center space-x-2 mb-4">
                <View className={`h-2 rounded-full flex-1 ${step >= 1 ? 'bg-[#0EA5E9]' : 'bg-gray-200'}`} />
                <View className={`h-2 rounded-full flex-1 ${step >= 2 ? 'bg-[#0EA5E9]' : 'bg-gray-200'}`} />
              </View>
              <Text className="text-gray-400 text-center text-xs font-bold uppercase tracking-widest">Étape {step} sur {totalSteps}</Text>
            </View>

            {/* Avatar Picker Section */}
            <View className="items-center justify-center py-6">
              <TouchableOpacity onPress={pickImage} className="relative">
                <Animatable.View animation="pulse" iterationCount="infinite" duration={2000}>
                  {photoURL ? (
                    <Image
                      source={{ uri: photoURL }}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={{ uri: step === 1 ? "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" : "https://cdn-icons-png.flaticon.com/512/9800/9800512.png" }}
                      className="w-32 h-32"
                      resizeMode="contain"
                    />
                  )}
                </Animatable.View>
                {step === 1 && (
                  <View className="absolute bottom-0 right-0 bg-[#0EA5E9] p-2 rounded-full shadow-md border-2 border-white">
                    <UserIcon size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
              {step === 1 && (
                <Text className="text-[#0EA5E9] font-bold mt-2 text-xs uppercase tracking-widest">
                  {photoURL ? "Modifier la photo" : "Ajouter une photo"}
                </Text>
              )}
            </View>

            {/* Main Card */}
            <Animatable.View
              animation="fadeInUp"
              duration={800}
              className="flex-1 bg-white rounded-t-[40px] px-6 pt-8 pb-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
            >
              <View className="mb-6">
                <Text className="text-3xl font-extrabold text-gray-800 text-center">
                  {step === 1 ? "Qui êtes-vous ?" : "Où livrer ?"}
                </Text>
                <Text className="text-gray-500 text-center mt-2 font-medium px-8">
                  {step === 1 ? "Dites-nous comment vous appeler." : "Indiquez votre adresse pour que le livreur vous trouve."}
                </Text>
              </View>

              {step === 1 && (
                <Animatable.View animation="fadeInRight" className="space-y-4">
                  {/* Personal Info Inputs */}
                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-bold ml-3 mb-1.5 text-xs uppercase">Prénom</Text>
                      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-[#0EA5E9] focus:bg-white transition-all">
                        <UserIcon size={20} color="#9CA3AF" />
                        <TextInput
                          className="flex-1 ml-2 text-gray-800 font-semibold"
                          value={firstName}
                          onChangeText={setFirstName}
                          placeholder="Jean"
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-bold ml-3 mb-1.5 text-xs uppercase">Nom</Text>
                      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-[#0EA5E9] focus:bg-white transition-all">
                        <TextInput
                          className="flex-1 ml-2 text-gray-800 font-semibold"
                          value={lastName}
                          onChangeText={setLastName}
                          placeholder="Dupont"
                        />
                      </View>
                    </View>
                  </View>

                  <View>
                    <Text className="text-gray-700 font-bold ml-3 mb-1.5 text-xs uppercase">Téléphone</Text>
                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-[#0EA5E9] focus:bg-white transition-all">
                      <PhoneIcon size={20} color="#9CA3AF" />
                      <TextInput
                        className="flex-1 ml-3 text-gray-800 font-semibold"
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        keyboardType="phone-pad"
                        placeholder="081 234 5678"
                      />
                    </View>
                  </View>
                </Animatable.View>
              )}

              {step === 2 && (
                <Animatable.View animation="fadeInRight" className="space-y-4">
                  {/* Location Inputs */}
                  <View>
                    <Text className="text-gray-700 font-bold ml-3 mb-1.5 text-xs uppercase">Adresse de livraison</Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                      <View className="flex-row items-center mb-2">
                        <MapPinIcon size={20} color="#0EA5E9" />
                        <Text className="ml-2 text-xs text-gray-500">
                          {address ? "✓ Détectée automatiquement" : "En attente..."}
                        </Text>
                      </View>
                      <TextInput
                        className="text-gray-800 font-semibold min-h-[60px]"
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Votre adresse de livraison..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        editable={true}
                        style={{
                          textAlignVertical: 'top',
                          paddingTop: 8,
                        }}
                      />
                      {isLocationLoading && (
                        <View className="absolute right-4 top-4">
                          <ActivityIndicator size="small" color="#0EA5E9" />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Map Preview */}
                  <View className="mt-2 rounded-3xl overflow-hidden border-2 border-white shadow-lg h-40 relative">
                    {location ? (
                      <MapView
                        className="w-full h-full"
                        initialRegion={{
                          latitude: location.latitude || 0,
                          longitude: location.longitude || 0,
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                      >
                        <Marker
                          coordinate={{
                            latitude: location.latitude || 0,
                            longitude: location.longitude || 0,
                          }}
                        />
                      </MapView>
                    ) : (
                      <View className="flex-1 justify-center items-center bg-gray-100">
                        <ActivityIndicator size="large" color="#0EA5E9" />
                        <Text className="text-gray-400 mt-2 font-medium">Géolocalisation...</Text>
                      </View>
                    )}
                    <View className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded-md shadow-sm">
                      <Text className="text-[10px] font-bold text-gray-600">Aperçu</Text>
                    </View>
                  </View>
                </Animatable.View>
              )}

              {/* Action Button */}
              <View className="mt-8">
                <TouchableOpacity
                  onPress={handleNextStep}
                  disabled={isLoading}
                  className={`w-full items-center py-4 rounded-2xl shadow-lg shadow-blue-400/40 active:scale-95 duration-100 flex-row justify-center ${isLoading ? "bg-[#0EA5E9]/70" : "bg-[#0EA5E9]"}`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-center text-white font-bold text-lg mr-2 uppercase tracking-wider">
                        {step === 1 ? "Continuer" : "Terminer"}
                      </Text>
                      {step === 1 ? <ArrowRightIcon size={20} color="white" /> : <CheckBadgeIcon size={20} color="white" />}
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={signOutUser} className="mt-6 self-center">
                  <Text className="text-red-400 font-semibold text-sm">Annuler et se déconnecter</Text>
                </TouchableOpacity>
              </View>

            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default UserDetails;
