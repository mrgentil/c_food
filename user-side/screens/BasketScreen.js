import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { selectRestaurant } from "../features/restaurantSlice";
import { selectUser } from "../features/userSlice";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeftIcon, TrashIcon, CreditCardIcon, MinusIcon, PlusIcon } from "react-native-heroicons/outline";
import * as Animatable from "react-native-animatable";
import {
  removeFromBasket,
  increaseQuantity,
  decreaseQuantity,
  selectBasketItems,
  selectBasketTotal,
} from "../features/basketSlice";
import { UserAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { db } from "../firebase";
import {
  doc,
  collection,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  limit
} from "firebase/firestore";
import PaymentModal from "../components/PaymentModal";
import AnimatedButton from "../components/AnimatedButton";
import AddressSearchAutocomplete from "../components/AddressSearchAutocomplete";
import { XCircleIcon, PencilIcon, MapPinIcon, ClipboardDocumentListIcon, TicketIcon, CheckCircleIcon } from "react-native-heroicons/outline";
import { Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert } from "react-native";

const BasketScreen = () => {
  const navigation = useNavigation();
  const basketTotal = useSelector(selectBasketTotal);
  const restaurant = useSelector(selectRestaurant);
  const dbUser = useSelector(selectUser);
  const items = useSelector(selectBasketItems);
  const [groupItemsInBucket, setGroupItemsInBucket] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Delivery Details State
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [deliveryCoordinates, setDeliveryCoordinates] = useState(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressList, setShowAddressList] = useState(true); // Toggle between list and search

  // Initialize delivery address from user profile
  useEffect(() => {
    if (dbUser?.address) {
      setDeliveryAddress(dbUser.address);
      if (dbUser.latitude && dbUser.longitude) {
        setDeliveryCoordinates({ latitude: dbUser.latitude, longitude: dbUser.longitude });
      }
    }
  }, [dbUser]);

  // Fetch Saved Addresses
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'user', user.uid, 'addresses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSavedAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const dispatch = useDispatch();
  const { user } = UserAuth();
  const { getDistance } = useLocation();

  // Smart Time Calculation
  const [estimatedTime, setEstimatedTime] = useState(null);

  useEffect(() => {
    if (restaurant?.lat && restaurant?.lng) {
      // Target: Delivery Coords (Manual) > User Profile Coords > Default 0
      const targetLat = deliveryCoordinates?.latitude || dbUser?.latitude;
      const targetLng = deliveryCoordinates?.longitude || dbUser?.longitude;

      if (targetLat && targetLng) {
        const distKm = getDistance(restaurant.lat, restaurant.lng, targetLat, targetLng);

        // Formula: 5 min/km + 20 min prep time
        const travelTime = Math.ceil(distKm * 5);
        const prepTime = 20;
        const totalMin = travelTime + prepTime;

        // Range: Total to Total + 10
        setEstimatedTime(`${totalMin}-${totalMin + 10}`);
      }
    }
  }, [restaurant, dbUser, deliveryCoordinates]);

  // Define deliveryFee with fallback (Temporarily 0 as requested)
  const deliveryFee = 0;

  useEffect(() => {
    const groupItems = items.reduce((results, item) => {
      (results[item.id] = results[item.id] || []).push(item);
      return results;
    }, {});
    setGroupItemsInBucket(groupItems);
  }, [items]);

  // Handle Promo Code Validation
  const applyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setValidatingPromo(true);

    try {
      const promoRef = collection(db, "promoCodes");
      const q = query(
        promoRef,
        where("code", "==", promoCodeInput.trim().toUpperCase()),
        where("isActive", "==", true),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Désolé", "Ce code promo n'existe pas ou est expiré.");
        setAppliedPromo(null);
        setDiscountAmount(0);
      } else {
        const promoData = querySnapshot.docs[0].data();

        // 🏨 NEW: Check Restaurant Restriction
        if (promoData.restaurantId && promoData.restaurantId !== restaurant.id) {
          Alert.alert("Invalide", "Ce code n'est pas valable pour ce restaurant.");
          setValidatingPromo(false);
          return;
        }

        // Check Minimum Order Amount
        if (basketTotal < (promoData.minOrder || 0)) {
          Alert.alert("Montant insuffisant", `Ce code nécessite un panier d'au moins ${formatPrice(promoData.minOrder)}.`);
          return;
        }

        // Check Expiry Date
        if (promoData.expiryDate && promoData.expiryDate.toDate() < new Date()) {
          Alert.alert("Expiré", "Ce code promo a expiré.");
          return;
        }

        setAppliedPromo(promoData);

        // Calculate Discount
        let calculatedDiscount = 0;
        if (promoData.type === "percentage") {
          calculatedDiscount = (basketTotal * promoData.value) / 100;
        } else {
          calculatedDiscount = promoData.value;
        }

        setDiscountAmount(calculatedDiscount);
        Alert.alert("Félicitations !", `Réduction de ${formatPrice(calculatedDiscount)} appliquée ! 🎉`);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error("Error applying promo:", error);
      Alert.alert("Erreur", "Un problème est survenu lors de la validation du code.");
    } finally {
      setValidatingPromo(false);
    }
  };

  // Recalculate discount if basket total changes
  useEffect(() => {
    if (appliedPromo) {
      if (appliedPromo.type === "percentage") {
        setDiscountAmount((basketTotal * appliedPromo.value) / 100);
      } else {
        setDiscountAmount(appliedPromo.value);
      }
    }
  }, [basketTotal, appliedPromo]);



  const ordersCollection = collection(db, "orders");

  const createOrder = async (paymentDetails) => {
    setLoading(true);

    try {
      // Prepare items array with full details
      const orderItems = Object.entries(groupItemsInBucket).map(([key, items]) => ({
        id: key,
        name: items[0]?.name,
        price: items[0]?.price,
        quantity: items.length,
        image: items[0]?.image || restaurant.image,
      }));

      const newOrderRef = await addDoc(ordersCollection, {
        restaurantName: restaurant.name,
        restaurantId: restaurant.id,
        restaurantAddress: restaurant.address,
        restaurantImage: restaurant.image,
        restaurantLatitude: restaurant.lat,
        restaurantLongitude: restaurant.lng,
        userId: user.uid,
        userFirstName: dbUser?.firstName || "Inconnu",
        userLastName: dbUser?.lastName || "",

        // Use modified delivery details or fallback to profile
        userLatitude: deliveryCoordinates?.latitude || dbUser?.latitude || 0,
        userLongitude: deliveryCoordinates?.longitude || dbUser?.longitude || 0,
        userAddress: deliveryAddress || dbUser?.address || "Non défini",

        // 🌍 NOUVEAU: Champs pour le filtrage par ville (RDC)
        // On essaie d'extraire la ville de l'adresse ou du profil, sinon par défaut "Kinshasa"
        city: (deliveryAddress || dbUser?.address || "").toLowerCase().includes("lubumbashi") ? "Lubumbashi"
          : (deliveryAddress || dbUser?.address || "").toLowerCase().includes("goma") ? "Goma"
            : "Kinshasa",
        district: (deliveryAddress || dbUser?.address || "").split(",")[0] || "Inconnu", // Tentative d'extraction du quartier/commune

        deliveryInstructions: deliveryInstructions.trim(), // Add instructions

        userPhoneNumber: dbUser?.phoneNumber || "",
        deliveryFee: deliveryFee,
        total: basketTotal + deliveryFee - discountAmount,
        promoCode: appliedPromo?.code || null,
        discountAmount: discountAmount,
        paymentMethod: paymentDetails.operator,
        paymentPhone: paymentDetails.phoneNumber,
        paymentReference: paymentDetails.transactionRef,
        shwaryTransactionId: paymentDetails.fullResponse?.id || null, // Store Shwary ID

        status: "pending",
        paymentStatus: paymentDetails.paymentVerificationStatus || "paid", // 'paid' (sandbox), 'manual_check' (override)
        paymentPhone: paymentDetails.phoneNumber,
        paymentReference: paymentDetails.transactionRef,

        // 🚗 Multi-Vendor: Driver assignment (null until a driver accepts)
        driverId: null,
        driverName: null,
        driverPhone: null,
        driverLocation: null,

        // ⏱️ Order lifecycle timestamps
        orderedAt: serverTimestamp(),
        acceptedAt: null,      // When restaurant accepts
        pickedUpAt: null,      // When driver picks up
        deliveredAt: null,     // When delivered to customer

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Order created with ID:", newOrderRef.id);
      navigation.navigate("PreparingOrderScreen");
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Erreur lors de la création de la commande: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-CD', {
      minimumFractionDigits: 0,
    }).format(price) + ' CDF';
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Animatable.View animation="fadeIn" duration={500} className="items-center px-10">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <TrashIcon size={64} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">Votre panier est vide</Text>
          <Text className="text-gray-500 text-center mb-8">Découvrez de délicieux plats près de chez vous !</Text>
          <AnimatedButton
            title="Retourner à l'accueil"
            onPress={() => navigation.goBack()}
            containerStyle="w-full"
          />
        </Animatable.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <Animatable.View animation="fadeInDown" className="bg-white px-5 py-4 shadow-sm border-b border-gray-100 z-10">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={navigation.goBack}
              className="bg-gray-100 p-2 rounded-full mr-4"
            >
              <ArrowLeftIcon size={20} color="black" />
            </TouchableOpacity>

            <View className="flex-1">
              <Text className="text-xl font-extrabold text-gray-900">Mon Panier</Text>
              <Text className="text-gray-500 text-xs font-bold">
                {restaurant?.name || "Restaurant"}
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* Delivery Info */}
        <Animatable.View animation="fadeInUp" delay={200} className="bg-[#E0F2FE] mx-4 mt-4 p-4 rounded-2xl flex-row items-center border border-sky-100">
          <Image
            source={{ uri: "https://links.papareact.com/wru" }}
            className="h-9 w-9 bg-gray-300 p-4 rounded-full mr-3"
          />
          <View className="flex-1">
            <Text className="font-bold text-sky-900">
              Livraison en {estimatedTime || (restaurant?.minDeliveryTime || 20) + '-' + (restaurant?.maxDeliveryTime || 30)} min
            </Text>
            <Text className="text-sky-700 text-xs">Calculé selon votre distance 📍</Text>
          </View>
        </Animatable.View>

        {/* Editable Delivery Settings */}
        <View className="mx-4 mt-3 space-y-3">
          {/* Address Selector */}
          <TouchableOpacity
            onPress={() => setShowAddressModal(true)}
            className="flex-row items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50"
          >
            <MapPinIcon size={20} color="#0EA5E9" />
            <View className="flex-1 ml-3">
              <Text className="text-xs text-gray-400 font-bold uppercase">Adresse de livraison</Text>
              <Text className="text-gray-800 font-bold" numberOfLines={3}>
                {deliveryAddress || "Sélectionner une adresse..."}
              </Text>
            </View>
            <PencilIcon size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Instructions Input */}
          <View className="flex-row items-start bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <ClipboardDocumentListIcon size={24} color="#0EA5E9" style={{ marginTop: 2 }} />
            <View className="flex-1 ml-4">
              <Text className="text-xs text-gray-400 font-bold uppercase mb-2">Note pour le livreur (Optionnel)</Text>
              <TextInput
                placeholder="Code porte, étage, sonnez fort..."
                placeholderTextColor="#9CA3AF"
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                className="p-0 text-gray-800 font-medium text-base leading-5"
                multiline={true}
                style={{ minHeight: 60, textAlignVertical: 'top' }}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          </View>
        </View>

        {/* Items List */}
        <ScrollView className="flex-1 px-4 mt-6" contentContainerStyle={{ paddingBottom: 250 }} showsVerticalScrollIndicator={false}>
          {Object.entries(groupItemsInBucket).map(([key, items], index) => (
            <Animatable.View
              animation="fadeInLeft"
              delay={300 + (index * 100)}
              key={key}
              className="bg-white p-3 mb-3 rounded-2xl shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center">
                <Image
                  source={{ uri: items[0]?.image || restaurant?.image }}
                  className="h-16 w-16 rounded-xl bg-gray-200 mr-3"
                />

                <View className="flex-1">
                  <Text className="font-bold text-gray-800 text-base" numberOfLines={1}>{items[0]?.name}</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {formatPrice(items[0]?.price)} / unité
                  </Text>
                  <Text className="font-bold text-[#0EA5E9] text-base mt-1">
                    {formatPrice(items[0]?.price * items.length)}
                  </Text>
                </View>

                {/* Quantity Controls */}
                <View className="flex-row items-center bg-gray-50 rounded-xl p-1">
                  <TouchableOpacity
                    onPress={() => {
                      if (items.length > 1) {
                        dispatch(decreaseQuantity({ id: key }));
                      } else {
                        dispatch(removeFromBasket({ id: key }));
                      }
                    }}
                    className="bg-white w-9 h-9 rounded-lg items-center justify-center shadow-sm border border-gray-100 active:bg-gray-100"
                  >
                    {items.length === 1 ? (
                      <TrashIcon size={18} color="#EF4444" />
                    ) : (
                      <MinusIcon size={18} color="#6B7280" />
                    )}
                  </TouchableOpacity>

                  <Text className="font-bold text-gray-800 text-lg w-10 text-center">
                    {items.length}
                  </Text>

                  <TouchableOpacity
                    onPress={() => dispatch(increaseQuantity({ id: key }))}
                    className="bg-[#0EA5E9] w-9 h-9 rounded-lg items-center justify-center shadow-sm active:bg-[#0284C7]"
                  >
                    <PlusIcon size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animatable.View>
          ))}

          {/* Promo Code Input */}
          <Animatable.View animation="fadeInUp" delay={550} className="bg-white p-4 mx-4 mt-6 rounded-2xl shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-3">
              <TicketIcon size={20} color="#0EA5E9" />
              <Text className="ml-2 font-bold text-gray-800">Code Promo</Text>
            </View>

            <View className="flex-row space-x-2">
              <View className="flex-1 relative">
                <TextInput
                  placeholder="Entrez votre code"
                  value={promoCodeInput}
                  onChangeText={(txt) => setPromoCodeInput(txt.toUpperCase())}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-700 h-14"
                  editable={!appliedPromo}
                />
                {appliedPromo && (
                  <View className="absolute right-3 top-3">
                    <CheckCircleIcon size={32} color="#10B981" />
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={appliedPromo ? () => { setAppliedPromo(null); setDiscountAmount(0); setPromoCodeInput(""); } : applyPromoCode}
                disabled={validatingPromo}
                className={`px-6 rounded-xl justify-center items-center h-14 ${appliedPromo ? 'bg-red-50' : 'bg-[#0EA5E9]'}`}
              >
                {validatingPromo ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className={`font-bold ${appliedPromo ? 'text-red-500' : 'text-white'}`}>
                    {appliedPromo ? "Retirer" : "Appliquer"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {appliedPromo && (
              <Text className="text-[#10B981] text-xs mt-2 font-bold ml-1">
                ✓ Code "{appliedPromo.code}" appliqué avec succès !
              </Text>
            )}
          </Animatable.View>

          {/* Payment Section Title */}
          <Animatable.View animation="fadeInUp" delay={600} className="mt-6 mb-2">
            <Text className="text-lg font-extrabold text-gray-800 px-2">Paiement 💳</Text>
          </Animatable.View>

          {/* Payment Options Grid */}
          <Animatable.View animation="fadeInUp" delay={700} className="flex-row flex-wrap gap-3 mb-6">
            <TouchableOpacity
              onPress={() => { setSelectedOperator('airtel'); setShowPaymentModal(true); }}
              className="w-[48%] bg-white p-4 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
            >
              <Image
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Airtel_logo.svg/2560px-Airtel_logo.svg.png" }}
                className="h-12 w-12 mb-2"
                resizeMode="contain"
              />
              <Text className="font-bold text-gray-700 text-xs">Airtel Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSelectedOperator('mpesa'); setShowPaymentModal(true); }}
              className="w-[48%] bg-white p-4 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
            >
              <Image
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/2560px-M-PESA_LOGO-01.svg.png" }}
                className="h-12 w-16 mb-2"
                resizeMode="contain"
              />
              <Text className="font-bold text-gray-700 text-xs">M-Pesa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSelectedOperator('orange'); setShowPaymentModal(true); }}
              className="w-[48%] bg-white p-4 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
            >
              <Image
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/2560px-Orange_logo.svg.png" }}
                className="h-12 w-12 mb-2"
                resizeMode="contain"
              />
              <Text className="font-bold text-gray-700 text-xs">Orange Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSelectedOperator('visa'); setShowPaymentModal(true); }}
              className="w-[48%] bg-white p-4 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
            >
              <Image
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" }}
                className="h-12 w-16 mb-2"
                resizeMode="contain"
              />
              <Text className="font-bold text-gray-700 text-xs">Visa / MasterCard</Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>

        {/* Bottom Floating Summary */}
        <Animatable.View animation="slideInUp" duration={500} className="absolute bottom-0 w-full bg-white p-5 rounded-t-3xl shadow-2xl z-20">
          <View className="flex-row justify-between mb-4">
            <Text className="text-gray-500">Sous-total</Text>
            <Text className="font-bold text-gray-800">{formatPrice(basketTotal)}</Text>
          </View>
          {deliveryFee > 0 && (
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-500">Frais de livraison</Text>
              <Text className="font-bold text-gray-800">{formatPrice(deliveryFee)}</Text>
            </View>
          )}

          {discountAmount > 0 && (
            <View className="flex-row justify-between mb-4">
              <Text className="text-green-500 font-bold italic">Réduction (Promo)</Text>
              <Text className="font-bold text-green-500">-{formatPrice(discountAmount)}</Text>
            </View>
          )}

          <View className="flex-row justify-between items-center mb-5 pt-4 border-t border-gray-100">
            <Text className="font-black text-xl text-gray-900">Total</Text>
            <Text className="font-black text-xl text-[#0EA5E9]">{formatPrice(basketTotal + deliveryFee - discountAmount)}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowPaymentModal(true)} // Default to showing modal to pick payment if not picking from grid
            className="bg-[#0EA5E9] rounded-2xl p-4 flex-row items-center justify-center shadow-lg shadow-blue-200 active:bg-[#0284C7]"
          >
            <Text className="text-white font-extrabold text-lg mr-2">Commander</Text>
            <Text className="text-white font-extrabold text-lg bg-blue-600/30 px-2 py-0.5 rounded text-xs overflow-hidden">
              {formatPrice(basketTotal + deliveryFee - discountAmount)}
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        {/* Payment Modal */}
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOperator(null);
          }}
          operator={selectedOperator || 'airtel'} // Default fallback if generic button clicked
          amount={basketTotal + deliveryFee - discountAmount}
          onSubmit={async (paymentDetails) => {
            setShowPaymentModal(false);
            await createOrder(paymentDetails);
          }}
          defaultPhone={dbUser?.phoneNumber}
        />

        {/* Address Selection Modal */}
        <Modal
          visible={showAddressModal}
          animationType="slide"
          presentationStyle="pageSheet" // iOS centric nice look
          onRequestClose={() => setShowAddressModal(false)}
        >
          <SafeAreaView className="flex-1 bg-white">
            <View className="px-4 py-4 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-lg font-extrabold text-gray-900">Modifier l'adresse</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)} className="bg-gray-100 p-2 rounded-full">
                <XCircleIcon size={24} color="black" />
              </TouchableOpacity>
            </View>

            <View className="p-4 flex-1">
              <Text className="text-gray-500 mb-4">
                {showAddressList ? "Sélectionnez une adresse enregistrée ou recherchez-en une nouvelle." : "Recherchez une nouvelle adresse."}
              </Text>

              {/* Toggle Search/List */}
              <View className="flex-row mb-4 bg-gray-100 p-1 rounded-lg">
                <TouchableOpacity
                  onPress={() => setShowAddressList(true)}
                  className={`flex-1 py-1 rounded-md items-center ${showAddressList ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`font-bold ${showAddressList ? 'text-gray-900' : 'text-gray-500'}`}>Mes Adresses</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowAddressList(false)}
                  className={`flex-1 py-1 rounded-md items-center ${!showAddressList ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`font-bold ${!showAddressList ? 'text-gray-900' : 'text-gray-500'}`}>Nouvelle recherche</Text>
                </TouchableOpacity>
              </View>

              {showAddressList ? (
                <ScrollView className="flex-1">
                  {savedAddresses.length > 0 ? (
                    savedAddresses.map((addr) => (
                      <TouchableOpacity
                        key={addr.id}
                        onPress={() => {
                          setDeliveryAddress(addr.address);
                          setDeliveryCoordinates({ latitude: addr.latitude, longitude: addr.longitude });
                          if (addr.instructions) setDeliveryInstructions(addr.instructions);
                          setShowAddressModal(false);
                        }}
                        className="bg-white p-3 mb-2 rounded-xl border border-gray-100 flex-row items-center active:bg-sky-50 active:border-sky-200"
                      >
                        <View className="bg-gray-50 p-2 rounded-full mr-3">
                          <MapPinIcon size={20} color="#0EA5E9" />
                        </View>
                        <View>
                          <Text className="font-bold text-gray-800">{addr.name}</Text>
                          <Text className="text-gray-500 text-xs w-64" numberOfLines={1}>{addr.address}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View className="items-center py-10">
                      <Text className="text-gray-400 text-center">Aucune adresse enregistrée.</Text>
                      <TouchableOpacity onPress={() => setShowAddressList(false)} className="mt-2">
                        <Text className="text-[#0EA5E9] font-bold">Rechercher une adresse</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              ) : (
                <AddressSearchAutocomplete
                  onSelectAddress={(data) => {
                    setDeliveryAddress(data.address);
                    setDeliveryCoordinates({
                      latitude: data.latitude,
                      longitude: data.longitude
                    });
                    setShowAddressModal(false);
                  }}
                />
              )}
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BasketScreen;
