import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeftIcon, MapPinIcon, ClockIcon, CheckCircleIcon, ReceiptPercentIcon, ClipboardDocumentListIcon } from 'react-native-heroicons/outline';
import { StarIcon } from 'react-native-heroicons/solid';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';

import RatingModal from '../components/RatingModal';
import PaymentModal from '../components/PaymentModal';
import AnimatedButton from '../components/AnimatedButton';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { order } = route.params;
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [updating, setUpdating] = useState(false);

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

  const getStatusSteps = () => {
    const status = order.status?.toLowerCase();
    return [
      {
        label: 'Commande passée',
        completed: true,
        time: formatDate(order.createdAt)
      },
      {
        label: 'Préparation',
        completed: ['preparing', 'delivering', 'delivered'].includes(status),
        time: status === 'preparing' ? 'En cours de cuisine...' : null
      },
      {
        label: 'En livraison',
        completed: ['delivering', 'delivered'].includes(status),
        time: status === 'delivering' ? 'Le livreur arrive...' : null
      },
      {
        label: 'Livré',
        completed: status === 'delivered',
        time: status === 'delivered' ? 'Bon appétit !' : null
      },
    ];
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <Animatable.View animation="fadeInDown" className="bg-white px-5 py-4 shadow-sm border-b border-gray-100 flex-row items-center z-10">
        <TouchableOpacity onPress={navigation.goBack} className="bg-gray-100 p-2 rounded-full mr-4">
          <ArrowLeftIcon size={20} color="black" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-extrabold text-gray-900">Suivi de commande</Text>
          <Text className="text-gray-500 text-xs font-mono">ID: {order.id.slice(0, 8)}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100' : 'bg-sky-100'}`}>
          <Text className={`font-bold text-xs ${order.status === 'delivered' ? 'text-green-700' : 'text-sky-700'}`}>
            {order.status === 'delivered' ? 'Terminée' : 'En cours'}
          </Text>
        </View>
      </Animatable.View>

      <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

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
                <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${step.completed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'
                  }`}>
                  {step.completed ? (
                    <CheckCircleIcon size={16} color="white" />
                  ) : (
                    <View className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </View>
                {index < getStatusSteps().length - 1 && (
                  <View className={`w-0.5 h-10 -mb-2 mt-1 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </View>

              {/* Step Info */}
              <View className="flex-1 pt-1">
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
            {/* Decorative circles */}
            <View className="absolute -left-3 -top-3 bg-white/20 w-10 h-10 rounded-full" />
            <View className="absolute -right-3 -bottom-3 bg-white/20 w-16 h-16 rounded-full" />

            <ClipboardDocumentListIcon size={24} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg tracking-widest uppercase">Ticket de Caisse</Text>
          </View>

          {/* Restaurant Info */}
          <View className="p-4 items-center border-b border-dashed border-gray-200">
            <Image
              source={{ uri: order.restaurantImage }}
              className="w-16 h-16 rounded-full border-4 border-gray-50 mb-2"
            />
            <Text className="font-bold text-xl text-gray-800 text-center">{order.restaurantName}</Text>
            <Text className="text-gray-500 text-xs text-center">{order.restaurantAddress}</Text>
          </View>

          {/* Items List */}
          <View className="p-4 bg-gray-50/50">
            {order.items?.map((item, index) => (
              <View key={index} className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center flex-1">
                  <Text className="font-bold text-gray-600 mr-2">{item.quantity}x</Text>
                  <Text className="text-gray-800 flex-1" numberOfLines={1}>{item.name}</Text>
                </View>
                <Text className="font-bold text-gray-700">{formatPrice(item.price)}</Text>
              </View>
            ))}
          </View>

          {/* Jagged Divider (simulated with standard dashed border for now) */}
          <View className="h-0 border-t-2 border-dashed border-gray-300 mx-4 my-2" />

          {/* Totals */}
          <View className="p-5">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Sous-total</Text>
              <Text className="font-medium text-gray-800">{formatPrice(order.subtotal || 0)}</Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-500">Livraison</Text>
              <Text className="font-medium text-gray-800">{formatPrice(order.deliveryFee || 0)}</Text>
            </View>
            <View className="flex-row justify-between pt-4 border-t border-gray-100">
              <Text className="text-xl font-black text-gray-900">Total</Text>
              <Text className="text-xl font-black text-[#0EA5E9]">{formatPrice(order.total)}</Text>
            </View>
          </View>

          {/* Bottom Sawtooth effect simulated with transparent bg if possible, or just rounded bottom */}
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
            <Text className="font-bold text-gray-800 text-base">{order.userAddress}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">{order.userFirstName} {order.userLastName}</Text>
          </View>
        </Animatable.View>

        {/* Payment Logic */}
        <Animatable.View animation="fadeInUp" delay={600} className="mt-6 mb-8">
          {(!order.paymentReference && !order.paymentMethod) ? (
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

              <Text className="font-bold text-gray-800 mb-3 ml-2">Choisir un moyen de paiement</Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => { setSelectedOperator('airtel'); setShowPaymentModal(true); }}
                  className="flex-1 bg-white p-3 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
                >
                  <View className="bg-red-100 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <Text className="text-xl">📱</Text>
                  </View>
                  <Text className="font-bold text-gray-700 text-xs">Airtel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setSelectedOperator('mpesa'); setShowPaymentModal(true); }}
                  className="flex-1 bg-white p-3 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
                >
                  <View className="bg-green-100 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <Text className="text-xl">💚</Text>
                  </View>
                  <Text className="font-bold text-gray-700 text-xs">M-Pesa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setSelectedOperator('orange'); setShowPaymentModal(true); }}
                  className="flex-1 bg-white p-3 rounded-2xl items-center shadow-sm border border-gray-100 active:scale-95 duration-150"
                >
                  <View className="bg-orange-100 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <Text className="text-xl">🟠</Text>
                  </View>
                  <Text className="font-bold text-gray-700 text-xs">Orange</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className={`p-4 rounded-2xl border flex-row items-center shadow-sm ${order.paymentStatus === 'paid' ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'
              }`}>
              <View className={`p-3 rounded-full mr-3 bg-white`}>
                <Text className="text-2xl">
                  {order.paymentStatus === 'paid' ? '✅' : '⏳'}
                </Text>
              </View>
              <View>
                <Text className={`font-bold text-lg ${order.paymentStatus === 'paid' ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                  {order.paymentStatus === 'paid' ? 'Payé' : 'En vérification'}
                </Text>
                <Text className="text-gray-600 text-xs">
                  Méthode: <Text className="font-bold">{order.paymentMethod}</Text>
                </Text>
                {order.paymentReference && (
                  <Text className="text-gray-500 text-[10px] font-mono mt-0.5">REF: {order.paymentReference}</Text>
                )}
              </View>
            </View>
          )}

          {/* Rating Button */}
          {order.status?.toLowerCase() === 'delivered' && (
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
        restaurant={{ id: order.restaurantId, name: order.restaurantName }}
        order={order}
      />

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedOperator(null);
        }}
        operator={selectedOperator}
        amount={order.total}
        onSubmit={async (paymentDetails) => {
          setUpdating(true);
          try {
            const orderRef = doc(db, 'orders', order.id);
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
              [{ text: 'OK', onPress: () => navigation.goBack() }]
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
