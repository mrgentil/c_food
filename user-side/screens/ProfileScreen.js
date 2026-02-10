import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  UserIcon,
  ChevronRightIcon,
  MapPinIcon,
  BellIcon,
  WalletIcon,
  GiftIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  SquaresPlusIcon,
  ArrowRightOnRectangleIcon,
  GlobeAltIcon,
  QuestionMarkCircleIcon,
  PencilIcon
} from 'react-native-heroicons/outline';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import { UserAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, signOutUser } = UserAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔵 COULEUR PRINCIPALE (Bleu Ciel)
  const PRIMARY_COLOR = "#0EA5E9";

  useEffect(() => {
    if (!user?.uid) return;

    // Écoute en temps réel des données utilisateur
    const unsubscribe = onSnapshot(doc(db, 'user', user.uid), (doc) => {
      setUserData(doc.data());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => signOutUser() }
    ]);
  };

  const menuItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <BellIcon size={24} color="#F59E0B" />, // Jaune ambre
      onPress: () => Alert.alert('Bientôt', 'Centre de notifications à venir !'),
      bgColor: 'bg-amber-50'
    },
    {
      id: 'address',
      title: 'Carnet d\'adresses',
      icon: <MapPinIcon size={24} color={PRIMARY_COLOR} />, // Bleu ciel
      onPress: () => navigation.navigate("AddressBook"), // Redirige vers le carnet d'adresses
      bgColor: 'bg-sky-50'
    },
    {
      id: 'wallet',
      title: 'Mon Portefeuille',
      icon: <WalletIcon size={24} color="#10B981" />,
      onPress: () => navigation.navigate('Wallet'),
      bgColor: 'bg-emerald-50'
    },
    {
      id: 'gift',
      title: 'Cartes Cadeaux',
      icon: <GiftIcon size={24} color="#EC4899" />,
      onPress: () => navigation.navigate('GiftCard'),
      bgColor: 'bg-pink-50'
    },
    {
      id: 'cashback',
      title: 'Cashback',
      icon: <TrophyIcon size={24} color="#8B5CF6" />,
      onPress: () => navigation.navigate('Fidelity'), // Consolidated Cashback & Fidelity
      bgColor: 'bg-violet-50'
    },
    {
      id: 'fidelity',
      title: 'Points de Fidélité',
      icon: <CurrencyDollarIcon size={24} color="#F59E0B" />,
      onPress: () => navigation.navigate('Fidelity'),
      bgColor: 'bg-yellow-50'
    },
    {
      id: 'annonces',
      title: 'Annonces',
      icon: <MegaphoneIcon size={24} color="#EF4444" />,
      onPress: () => navigation.navigate('Announcements'),
      bgColor: 'bg-red-50'
    },
    {
      id: 'plus',
      title: 'Plus',
      icon: <SquaresPlusIcon size={24} color="#6B7280" />,
      onPress: () => Alert.alert('Plus', 'Autres paramètres à venir.'),
      bgColor: 'bg-gray-100'
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />

      {/* 🟦 HEADER BLEU CIEL (Style Propre) */}
      <View className="bg-[#0EA5E9] pt-14 pb-8 px-5 rounded-b-[30px] shadow-lg">
        <View className="flex-row items-center space-x-4">
          {/* Avatar avec cercle blanc */}
          <View className="bg-white p-1 rounded-full shadow-md">
            <Image
              source={{ uri: userData?.photoURL || "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" }}
              className="h-16 w-16 rounded-full bg-gray-200"
            />
          </View>

          {/* Infos Utilisateur */}
          <View className="flex-1">
            <Text className="text-white text-xl font-bold truncate">
              {userData?.firstName || "Utilisateur"} {userData?.lastName || ""}
            </Text>
            <Text className="text-blue-100 text-sm mb-2 opacity-90">
              {user?.email}
            </Text>

            {/* Bouton Modifier (Pill shape blanc) */}
            <TouchableOpacity
              onPress={() => navigation.navigate("UserDetails")}
              className="bg-white/20 self-start px-3 py-1 rounded-full border border-white/30 flex-row items-center"
            >
              <Text className="text-white text-xs font-semibold mr-1">Modifier profil</Text>
              <PencilIcon size={10} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>

        {/* Liste des Menus */}
        <View className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 mb-20">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              className={`flex-row items-center justify-between p-4 ${index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''} active:bg-gray-50 rounded-xl`}
            >
              <View className="flex-row items-center space-x-4">
                <View className={`p-2 rounded-xl ${item.bgColor}`}>
                  {item.icon}
                </View>
                <Text className="text-gray-700 font-semibold text-[15px]">{item.title}</Text>
              </View>
              <ChevronRightIcon size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}

          {/* Séparateur Déconnexion */}
          <View className="h-4 bg-gray-50 w-full my-2" />

          {/* Bouton Déconnexion */}
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-between p-4 active:bg-red-50 rounded-xl"
          >
            <View className="flex-row items-center space-x-4">
              <View className="p-2 rounded-xl bg-red-50">
                <ArrowRightOnRectangleIcon size={24} color="#EF4444" />
              </View>
              <Text className="text-red-500 font-bold text-[15px]">Déconnexion</Text>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
