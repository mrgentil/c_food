import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { navigationRef } from "../App";

import { ArrowLeftIcon, MapPinIcon, CheckCircleIcon, ClipboardDocumentListIcon, PhoneIcon, ChatBubbleLeftRightIcon } from 'react-native-heroicons/outline';
import { StarIcon } from 'react-native-heroicons/solid';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';

import RatingModal from '../components/RatingModal';
import PaymentModal from '../components/PaymentModal';
import AnimatedButton from '../components/AnimatedButton';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot, getDoc, collection } from 'firebase/firestore';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

const OrderDetailsScreen = ({ route }) => {
  // const route = useRoute();
  // const navigation = useNavigation();
  const navigation = navigationRef.current;

  const { order } = route.params;

  // État local avec mise à jour temps réel
  const [orderData, setOrderData] = useState(order);
  const [driverInfo, setDriverInfo] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);


  const [updating, setUpdating] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // Nouveau state pour les non-lus
  const [lastRead, setLastRead] = useState(null); // Pour suivre ce qu'on a lu

  // 🔴 ÉCOUTE EN TEMPS RÉEL de la commande
  useEffect(() => {
    const orderRef = doc(db, 'orders', order.id);
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedOrder = { id: docSnap.id, ...docSnap.data() };
        setOrderData(updatedOrder);

        // Si un livreur est assigné, récupérer ses infos
        if (updatedOrder.driverId && !driverInfo) {
          fetchDriverInfo(updatedOrder.driverId);
        }
      }
    });

    return () => unsubscribe();
  }, [order.id]);

  // 🔔 ÉCOUTE DES MESSAGES NON LUS
  useEffect(() => {
    if (!order.id) return;

    // On écoute la sous-collection 'chat'
    // Idéalement on filtrerait sur senderType != 'client' et !read
    // Pour simplifier ici, on compte juste les messages du driver
    // Dans une vraie app, on gérerait le statut 'read' dans la DB.
    // Ici on va faire simple: on compte tous les messages du driver.
    // Si on voulait faire "non lus", il faudrait stocker le lastReadTimestamp localement ou en DB.
    // Pour l'instant, affichons juste un point rouge s'il y a des messages du driver récents.

    // Mieux : On écoute tous les messages.
    const chatRef = collection(db, 'orders', order.id, 'chat');
    // Pas de query complexe pour l'instant pour éviter les index manquants
    const unsubscribeChat = onSnapshot(chatRef, (snapshot) => {
      // Compter les messages qui ne sont PAS de moi (donc du driver)
      // Et qui sont "nouveaux" (optionnel, sinon on affiche juste le total)
      // Pour l'UX "Notification", on va dire que si le dernier message est du driver, on met le badge.

      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => d.data());
        // Trier par date
        docs.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));

        const lastMsg = docs[docs.length - 1];
        if (lastMsg && lastMsg.senderType === 'driver') {
          // Si le dernier message est du driver, on considère qu'il y a une notif
          // On pourrait affiner avec un état 'read'.
          setUnreadCount(1);
        } else {
          setUnreadCount(0);
        }
      }
    });

    return () => unsubscribeChat();
  }, [order.id]);

  // Récupérer les infos du livreur
  const fetchDriverInfo = async (driverId) => {
    try {
      const driverRef = doc(db, 'user', driverId);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        setDriverInfo({ id: driverSnap.id, ...driverSnap.data() });
      }
    } catch (error) {
      console.error('Erreur récupération livreur:', error);
    }
  };

  // Appeler le livreur
  const callDriver = () => {
    if (driverInfo?.phoneNumber) {
      Linking.openURL(`tel:${driverInfo.phoneNumber}`);
    } else {
      Alert.alert('Erreur', 'Numéro du livreur non disponible');
    }
  };

  // Ouvrir le chat avec le livreur
  const openChat = () => {
    if (driverInfo) {
      navigation.navigate('ChatScreen', {
        orderId: orderData.id,
        driverId: driverInfo.id,
        driverName: `${driverInfo.firstName || ''} ${driverInfo.lastName || ''}`.trim() || 'Livreur',
        driverPhoto: driverInfo.photoURL
      });
    } else {
      Alert.alert('Erreur', 'Livreur non encore assigné');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-CD', {
      minimumFractionDigits: 0,
    }).format(price) + ' CDF';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 📐 Formule Haversine - Calcul de distance réelle en km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ⏱️ ESTIMATION DU TEMPS DE LIVRAISON
  const getDeliveryEstimate = () => {
    const status = orderData.status?.toLowerCase();

    // Si déjà livrée ou annulée, pas d'estimation
    if (status === 'delivered' || status === 'cancelled') return null;

    // Calcul de la distance restaurant → client
    const distance = calculateDistance(
      orderData.restaurantLatitude,
      orderData.restaurantLongitude,
      orderData.userLatitude,
      orderData.userLongitude
    );

    if (!distance) return null;

    // Paramètres réalistes pour Kinshasa
    const AVERAGE_SPEED_KMH = 20; // Vitesse moyenne moto avec trafic
    const PREP_TIME_MIN = status === 'pending' ? 15 : (status === 'preparing' ? 10 : 0); // Temps de préparation
    const PICKUP_TIME_MIN = status === 'picked_up' ? 0 : 5; // Temps pour récupérer

    // Calcul du temps de trajet en minutes
    const travelTimeMin = Math.round((distance / AVERAGE_SPEED_KMH) * 60);
    const totalTimeMin = PREP_TIME_MIN + PICKUP_TIME_MIN + travelTimeMin;

    // Progression basée sur le statut
    let progress = 0;
    if (status === 'pending') progress = 0.1;
    else if (status === 'accepted') progress = 0.2;
    else if (status === 'preparing') progress = 0.4;
    else if (status === 'picked_up') progress = 0.7;

    return {
      distance: distance.toFixed(1),
      travelTime: travelTimeMin,
      totalTime: totalTimeMin,
      progress: progress,
      status: status
    };
  };

  const deliveryEstimate = getDeliveryEstimate();

  const getStatusSteps = () => {
    const status = orderData.status?.toLowerCase();
    return [
      {
        label: 'Commande passée',
        completed: true,
        time: formatDate(orderData.createdAt),
        icon: '📝'
      },
      {
        label: 'Acceptée',
        completed: ['accepted', 'preparing', 'picked_up', 'delivered'].includes(status),
        time: status === 'accepted' ? '✅ Restaurant a accepté' : null,
        icon: '👍'
      },
      {
        label: 'En cuisine',
        completed: ['preparing', 'picked_up', 'delivered'].includes(status),
        time: status === 'preparing' ? '🍳 Le restaurant prépare votre commande...' : null,
        icon: '👨‍🍳'
      },
      {
        label: 'En livraison',
        completed: ['picked_up', 'delivered'].includes(status),
        time: status === 'picked_up' ? '🚗 Le livreur est en route !' : null,
        icon: '🛵'
      },
      {
        label: 'Livrée',
        completed: status === 'delivered',
        time: status === 'delivered' ? '🎉 Bon appétit !' : null,
        icon: '🏠'
      },
    ];
  };

  const getStatusColor = () => {
    const status = orderData.status?.toLowerCase();
    if (status === 'delivered') return { bg: 'bg-green-100', text: 'text-green-700', label: 'Livrée' };
    if (status === 'picked_up') return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En livraison' };
    if (status === 'preparing') return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En cuisine' };
    if (status === 'accepted') return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Acceptée' };
    if (status === 'cancelled') return { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulée' };
    return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' };
  };

  const statusStyle = getStatusColor();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <Animatable.View animation="fadeInDown" className="bg-white px-5 py-4 shadow-sm border-b border-gray-100 flex-row items-center z-10">
        <TouchableOpacity onPress={() => navigationRef.current?.goBack()} className="bg-gray-100 p-2 rounded-full mr-4">
          <ArrowLeftIcon size={20} color="black" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-xl font-extrabold text-gray-900">Suivi de commande</Text>
          <Text className="text-gray-500 text-xs font-mono">ID: {orderData.id.slice(0, 8)}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
          <Text className={`font-bold text-xs ${statusStyle.text}`}>
            {statusStyle.label}
          </Text>
        </View>
      </Animatable.View>

      <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* 🗺️ CARTE DE SUIVI LIVE */}
        {(orderData.status === 'picked_up' || orderData.status === 'arrived_at_customer') && (
          <Animatable.View animation="zoomIn" duration={800} className="h-60 rounded-3xl overflow-hidden mb-6 shadow-md border border-gray-100">
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: orderData.driverLatitude || orderData.restaurantLatitude || -4.4419,
                longitude: orderData.driverLongitude || orderData.restaurantLongitude || 15.2663,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              {/* Restaurant Marker */}
              <Marker
                coordinate={{
                  latitude: orderData.restaurantLatitude,
                  longitude: orderData.restaurantLongitude
                }}
                title={orderData.restaurantName}
              >
                <View className="bg-gray-800 p-2 rounded-full border-2 border-white">
                  <MaterialIcons name="restaurant" size={16} color="white" />
                </View>
              </Marker>

              {/* User/Home Marker */}
              <Marker
                coordinate={{
                  latitude: orderData.userLatitude,
                  longitude: orderData.userLongitude
                }}
                title="Ma Maison"
              >
                <View className="bg-[#0EA5E9] p-2 rounded-full border-2 border-white">
                  <MaterialIcons name="home" size={18} color="white" />
                </View>
              </Marker>

              {/* 🛵 MOTO LIVE MARKER */}
              {orderData.driverLatitude && (
                <Marker
                  coordinate={{
                    latitude: orderData.driverLatitude,
                    longitude: orderData.driverLongitude
                  }}
                  title="Votre livreur"
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <Animatable.View
                    animation="pulse"
                    iterationCount="infinite"
                    className="bg-green-500 p-2 rounded-full border-2 border-white"
                  >
                    <FontAwesome5 name="motorcycle" size={16} color="white" />
                  </Animatable.View>
                </Marker>
              )}
            </MapView>
          </Animatable.View>
        )}

        {/* ⏱️ CARTE D'ESTIMATION DE TEMPS */}
        {deliveryEstimate && (
          <Animatable.View animation="fadeInUp" className="bg-white rounded-3xl p-5 mb-6 shadow-md shadow-gray-200 border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">⏱️</Text>
                <View>
                  <Text className="text-gray-500 text-xs font-medium">Livraison estimée dans</Text>
                  <Text className="text-3xl font-extrabold text-gray-900">{deliveryEstimate.totalTime} min</Text>
                </View>
              </View>
              <View className="bg-blue-50 px-3 py-2 rounded-xl">
                <Text className="text-blue-600 text-xs font-bold">📍 {deliveryEstimate.distance} km</Text>
              </View>
            </View>

            {/* Barre de progression */}
            <View className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <View
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${deliveryEstimate.progress * 100}%` }}
              />
            </View>

            {/* Étapes visuelles */}
            <View className="flex-row justify-between mt-1">
              <View className="items-center">
                <Text className="text-lg">🍽️</Text>
                <Text className="text-gray-400 text-[10px]">Resto</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg">👨‍🍳</Text>
                <Text className="text-gray-400 text-[10px]">Cuisine</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg">🛵</Text>
                <Text className="text-gray-400 text-[10px]">Route</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg">🏠</Text>
                <Text className="text-gray-400 text-[10px]">Vous</Text>
              </View>
            </View>

            {/* Message contextuel */}
            <View className="mt-3 bg-gray-50 rounded-xl p-3">
              <Text className="text-gray-600 text-xs text-center">
                {deliveryEstimate.status === 'pending' && '⏳ En attente de confirmation du restaurant...'}
                {deliveryEstimate.status === 'accepted' && '✅ Le restaurant a accepté votre commande !'}
                {deliveryEstimate.status === 'preparing' && '🍳 Votre repas est en préparation...'}
                {deliveryEstimate.status === 'picked_up' && `🛵 Le livreur arrive dans ~${deliveryEstimate.travelTime} min !`}
              </Text>
            </View>
          </Animatable.View>
        )}

        {/* 🚗 CARTE LIVREUR - Affichée dès qu'un livreur est assigné et commande non annulée */}
        {driverInfo && orderData.status !== 'cancelled' && (
          <Animatable.View animation="fadeInUp" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-5 mb-6 shadow-lg">
            <View className="flex-row items-center mb-4">
              <Image
                source={{ uri: driverInfo.photoURL || 'https://via.placeholder.com/80' }}
                className="w-16 h-16 rounded-full border-3 border-white"
              />
              <View className="flex-1 ml-4">
                <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">Votre livreur</Text>
                <Text className="text-white text-xl font-bold">
                  {driverInfo.firstName || ''} {driverInfo.lastName || ''}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="bg-white/20 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-xs">🛵 En route</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Boutons Appel & Chat */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={callDriver}
                className="flex-1 bg-white rounded-2xl py-3 flex-row items-center justify-center"
              >
                <PhoneIcon size={20} color="#3B82F6" />
                <Text className="text-blue-500 font-bold ml-2">Appeler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openChat}
                className="flex-1 bg-white/20 rounded-2xl py-3 flex-row items-center justify-center border border-white/30"
              >
                <ChatBubbleLeftRightIcon size={20} color="white" />
                <Text className="text-white font-bold ml-2">Message</Text>
                {unreadCount > 0 && (
                  <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                    <Text className="text-white text-[10px] font-bold">!</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}

        {/* Status Timeline Card */}
        <Animatable.View animation="fadeInUp" delay={100} className="bg-white rounded-3xl p-5 shadow-md shadow-gray-200 mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">📦 Étapes de livraison</Text>

          {getStatusSteps().map((step, index) => (
            <Animatable.View
              animation="fadeInLeft"
              delay={200 + (index * 100)}
              key={index}
              className="flex-row items-start mb-5 last:mb-0"
            >
              {/* Timeline Dot & Line */}
              <View className="items-center mr-4">
                <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${step.completed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'
                  }`}>
                  {step.completed ? (
                    <Text className="text-lg">{step.icon}</Text>
                  ) : (
                    <View className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </View>
                {index < getStatusSteps().length - 1 && (
                  <View className={`w-0.5 h-10 -mb-2 mt-1 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </View>

              {/* Step Info */}
              <View className="flex-1 pt-2">
                <Text className={`font-bold text-base ${step.completed ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.label}
                </Text>
                {step.time && (
                  <Text className="text-[#0EA5E9] text-xs font-medium mt-0.5">{step.time}</Text>
                )}
              </View>
            </Animatable.View>
          ))}
        </Animatable.View>

        {/* Receipt Style Summary */}
        <Animatable.View animation="fadeInUp" delay={300} className="bg-white rounded-t-xl overflow-hidden shadow-sm mx-1">
          {/* Header Receipt */}
          <View className="bg-[#0EA5E9] p-4 flex-row items-center justify-center relative overflow-hidden">
            <View className="absolute -left-3 -top-3 bg-white/20 w-10 h-10 rounded-full" />
            <View className="absolute -right-3 -bottom-3 bg-white/20 w-16 h-16 rounded-full" />
            <ClipboardDocumentListIcon size={24} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg tracking-widest uppercase">Ticket de Caisse</Text>
          </View>

          {/* Restaurant Info */}
          <View className="p-4 items-center border-b border-dashed border-gray-200">
            <Image
              source={{ uri: orderData.restaurantImage }}
              className="w-16 h-16 rounded-full border-4 border-gray-50 mb-2"
            />
            <Text className="font-bold text-xl text-gray-800 text-center">{orderData.restaurantName}</Text>
            <Text className="text-gray-500 text-xs text-center">{orderData.restaurantAddress}</Text>
          </View>

          {/* Items List */}
          <View className="p-4 bg-gray-50/50">
            {orderData.items?.map((item, index) => (
              <View key={index} className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center flex-1">
                  <Text className="font-bold text-gray-600 mr-2">{item.quantity}x</Text>
                  <Text className="text-gray-800 flex-1" numberOfLines={1}>{item.name}</Text>
                </View>
                <Text className="font-bold text-gray-700">{formatPrice(item.price)}</Text>
              </View>
            ))}
          </View>

          <View className="h-0 border-t-2 border-dashed border-gray-300 mx-4 my-2" />

          {/* Totals */}
          <View className="p-5">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Sous-total</Text>
              <Text className="font-medium text-gray-800">{formatPrice(orderData.subtotal || 0)}</Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-500">Livraison</Text>
              <Text className="font-medium text-gray-800">{formatPrice(orderData.deliveryFee || 0)}</Text>
            </View>
            <View className="flex-row justify-between pt-4 border-t border-gray-100">
              <Text className="text-xl font-black text-gray-900">Total</Text>
              <Text className="text-xl font-black text-[#0EA5E9]">{formatPrice(orderData.total)}</Text>
            </View>
          </View>

          <View className="h-4 bg-white" />
        </Animatable.View>
        <View className="-mt-2 h-4 mx-1 bg-transparent border-t border-dashed border-gray-300 relative z-10" />

        {/* Address Card */}
        <Animatable.View animation="fadeInUp" delay={500} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-6 flex-row items-center">
          <View className="bg-sky-50 p-3 rounded-full mr-4">
            <MapPinIcon size={24} color="#0EA5E9" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Livraison à</Text>
            <Text className="font-bold text-gray-800 text-base">{orderData.userAddress}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">{orderData.userFirstName} {orderData.userLastName}</Text>
          </View>
        </Animatable.View>

        {/* Payment Logic */}
        <Animatable.View animation="fadeInUp" delay={600} className="mt-6 mb-8">
          {(orderData.paymentMethod === 'Paiement à la livraison' && orderData.paymentStatus === 'pending') ? (
            <View>
              <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 flex-row items-center">
                <View className="bg-white p-2 rounded-full mr-3 text-center">
                  <Text className="text-xl">🛵</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-blue-800">Paiement à la livraison</Text>
                  <Text className="text-blue-600 text-xs">Vous pouvez payer maintenant ou à l'arrivée.</Text>
                </View>
              </View>

              <Text className="font-bold text-gray-800 mb-3 ml-2">Payer numériquement maintenant 💳</Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => { setSelectedOperator('airtel'); setShowPaymentModal(true); }}
                  className="flex-1 bg-white p-3 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
                >
                  <Image
                    source={require('../assets/logos/airtel-money.png')}
                    className="w-12 h-12 mb-2"
                    resizeMode="contain"
                  />
                  <Text className="font-bold text-gray-700 text-xs">Airtel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setSelectedOperator('mpesa'); setShowPaymentModal(true); }}
                  className="flex-1 bg-white p-3 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
                >
                  <Image
                    source={require('../assets/logos/mpesa.png')}
                    className="w-12 h-12 mb-2"
                    resizeMode="contain"
                  />
                  <Text className="font-bold text-gray-700 text-xs">M-Pesa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setSelectedOperator('orange'); setShowPaymentModal(true); }}
                  className="flex-1 bg-white p-3 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
                >
                  <Image
                    source={require('../assets/logos/orange-money.png')}
                    className="w-12 h-12 mb-2"
                    resizeMode="contain"
                  />
                  <Text className="font-bold text-gray-700 text-xs">Orange</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setSelectedOperator('visa'); setShowPaymentModal(true); }}
                  className="flex-1 bg-white p-3 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
                >
                  <Image
                    source={require('../assets/logos/visa.png')}
                    className="w-12 h-12 mb-2"
                    resizeMode="contain"
                  />
                  <Text className="font-bold text-gray-700 text-xs">Carte</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (orderData.paymentStatus === 'pending' && !orderData.paymentMethod) ? (
            <View>
              <View className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4 flex-row items-center">
                <View className="bg-white p-2 rounded-full mr-3">
                  <Text>⚠️</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-red-800">Paiement requis</Text>
                  <Text className="text-red-600 text-xs">Réglez votre commande pour la valider.</Text>
                </View>
              </View>
              {/* Similar Payment Options as above could be here if needed */}
            </View>
          ) : (
            <View className={`p-4 rounded-2xl border flex-row items-center shadow-sm ${orderData.paymentStatus === 'paid' ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'
              }`}>
              <View className={`p-3 rounded-full mr-3 bg-white`}>
                <Text className="text-2xl">
                  {orderData.paymentStatus === 'paid' ? '✅' : '⏳'}
                </Text>
              </View>
              <View>
                <Text className={`font-bold text-lg ${orderData.paymentStatus === 'paid' ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                  {orderData.paymentStatus === 'paid' ? 'Payé' : 'En vérification'}
                </Text>
                <Text className="text-gray-600 text-xs">
                  Méthode: <Text className="font-bold">{orderData.paymentMethod}</Text>
                </Text>
                {orderData.paymentReference && (
                  <Text className="text-gray-500 text-[10px] font-mono mt-0.5">REF: {orderData.paymentReference}</Text>
                )}
              </View>
            </View>
          )}


          {/* Rating Button */}
          {orderData.status?.toLowerCase() === 'delivered' && (
            <View className="mt-6">
              <AnimatedButton
                title="Noter le restaurant"
                variant="secondary"
                onPress={() => setShowRatingModal(true)}
                icon={<StarIcon size={20} color="#F59E0B" />}
                containerStyle="border-amber-200 bg-amber-50"
                textStyle="text-amber-700"
              />
            </View>
          )}
        </Animatable.View>

      </ScrollView>

      {/* MODALS */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        restaurant={{ id: orderData.restaurantId, name: orderData.restaurantName }}
        order={orderData}
      />

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedOperator(null);
        }}
        operator={selectedOperator}
        amount={orderData.total}
        onSubmit={async (paymentDetails) => {
          setUpdating(true);
          try {
            const orderRef = doc(db, 'orders', orderData.id);
            await updateDoc(orderRef, {
              paymentMethod: paymentDetails.operator,
              paymentPhone: paymentDetails.phoneNumber,
              paymentReference: paymentDetails.transactionRef,
              paymentStatus: 'pending_verification',
              updatedAt: new Date(),
            });

            Alert.alert(
              'Paiement enregistré ! ✅',
              'Votre paiement sera vérifié sous peu.',
              [{ text: 'OK', onPress: () => navigationRef.current?.goBack() }]

            );
          } catch (error) {
            console.error('Error updating payment:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le paiement.');
          } finally {
            setUpdating(false);
            setShowPaymentModal(false);
          }
        }}
      />
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;
