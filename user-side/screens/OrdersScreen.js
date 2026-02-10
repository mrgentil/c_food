import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ClockIcon, CheckCircleIcon, TruckIcon, XCircleIcon, ShoppingBagIcon, ChevronRightIcon } from 'react-native-heroicons/outline';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { UserAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const OrdersScreen = () => {
    const { user } = UserAuth();
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const ordersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const sortedOrders = ordersData.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });

            setOrders(sortedOrders);
            setLoading(false);
            setRefreshing(false);
        }, (error) => {
            console.error('Error fetching orders:', error);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Date inconnue';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatPrice = (price) => {
        if (typeof price !== 'number') return '0 CDF';
        return new Intl.NumberFormat('fr-CD', { style: 'decimal', minimumFractionDigits: 0 }).format(price) + ' CDF';
    };

    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return { text: 'Livré', color: 'bg-blue-100 text-blue-700', icon: CheckCircleIcon };
            case 'delivering':
                return { text: 'En route', color: 'bg-blue-50 text-blue-600', icon: TruckIcon };
            case 'preparing':
                return { text: 'Cuisine', color: 'bg-orange-100 text-orange-700', icon: FireIcon };
            case 'pending':
                return { text: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon };
            case 'cancelled':
                return { text: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircleIcon };
            default:
                return { text: status || 'Inconnu', color: 'bg-gray-100 text-gray-700', icon: QuestionMarkCircleIcon };
        }
    };

    // Helper needed for icon definition above
    const FireIcon = require('react-native-heroicons/outline').FireIcon;
    const QuestionMarkCircleIcon = require('react-native-heroicons/outline').QuestionMarkCircleIcon;

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color="#0EA5E9" />
            </SafeAreaView>
        );
    }

    const createTestOrder = async () => {
        setLoading(true);
        try {
            // 1. Récupérer TOUS les vrais restaurants (limite 20)
            const restosRef = collection(db, "restaurants");
            const snapshot = await getDocs(query(restosRef, limit(20)));

            if (snapshot.empty) {
                alert("Aucun restaurant trouvé !");
                setLoading(false);
                return;
            }

            const restos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const PLATS = ["Poulet Mayo", "Riz Cantonais", "Fufu Sauce Graine", "Makayabu", "Chawarma Poulet", "Pizza Marguerite", "Burger Spécial", "Brochettes de Boeuf", "Liboke de Poisson", "Salade Composée"];

            // 2. Générer 10 commandes
            let count = 0;
            for (let i = 0; i < 10; i++) {
                const randomResto = restos[Math.floor(Math.random() * restos.length)];
                const randomPlat = PLATS[Math.floor(Math.random() * PLATS.length)];
                const price = (Math.floor(Math.random() * 20) + 10) * 1000; // Prix entre 10000 et 30000 FC

                await addDoc(collection(db, "orders"), {
                    restaurantName: randomResto.name || "Restaurant Inconnu",
                    restaurantId: randomResto.id,
                    restaurantAddress: randomResto.address || "Kinshasa, RDC",
                    restaurantImage: randomResto.image || "https://links.papareact.com/wru",
                    restaurantLatitude: randomResto.lat || -4.322447,
                    restaurantLongitude: randomResto.lng || 15.307045,

                    userId: user.uid,
                    userFirstName: "Moi", // Nom du user connecté
                    userLastName: "Client",
                    userLatitude: -4.3316 + (Math.random() * 0.01),
                    userLongitude: 15.3130 + (Math.random() * 0.01),
                    userAddress: "Avenue Kasa-Vubu, Kinshasa",

                    city: "Kinshasa",
                    district: "Gombe",

                    items: [{
                        id: `item-${Date.now()}-${i}`,
                        name: randomPlat,
                        price: price,
                        quantity: 1,
                        image: randomResto.image || "https://links.papareact.com/wru"
                    }],

                    total: price + 2000,
                    deliveryFee: 2000,
                    status: "pending",
                    paymentMethod: "cash",
                    paymentStatus: "pending",
                    driverId: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                count++;
            }
            alert(`✅ ${count} Commandes réalistes générées !`);
            onRefresh();
        } catch (e) {
            alert("Erreur: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-5 py-4 bg-white shadow-sm z-10">
                <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">Mes Commandes</Text>
                <Text className="text-gray-400 font-medium">Suivez vos délices en temps réel</Text>
            </View>

            <ScrollView
                className="flex-1 px-4 pt-4"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0EA5E9']} />}
            >
                {orders.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <ShoppingBagIcon size={80} color="#D1D5DB" />
                        <Text className="text-gray-500 text-lg mt-4 font-bold">Le calme plat...</Text>
                        <Text className="text-gray-400 text-sm mb-6">Commandez quelque chose de bon !</Text>
                    </View>
                ) : (
                    orders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <TouchableOpacity
                                key={order.id}
                                onPress={() => navigation.navigate('Order Details', { order })}
                                className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 active:scale-95 duration-200"
                            >
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1">
                                        <View className="flex-row items-center space-x-2">
                                            <View className="bg-gray-100 p-2 rounded-xl">
                                                <ShoppingBagIcon size={20} color="black" />
                                            </View>
                                            <View>
                                                <Text className="text-lg font-bold text-gray-900">{order.restaurantName || "Restaurant"}</Text>
                                                <Text className="text-gray-400 text-xs">{formatDate(order.createdAt)}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Status Pill */}
                                    <View className={`px-3 py-1 rounded-full flex-row items-center space-x-1 ${statusInfo.color.includes('green')
                                        ? statusInfo.color.replace('green', 'blue')
                                        : statusInfo.color
                                        }`}>
                                        <StatusIcon size={12} color="currentColor" style={{ opacity: 0.7 }} />
                                        <Text className={`text-xs font-bold ${statusInfo.color.split(' ')[1]}`}>
                                            {statusInfo.text}
                                        </Text>
                                    </View>
                                </View>

                                {/* Order Summary Line */}
                                <View className="flex-row justify-between items-center border-t border-gray-50 pt-3">
                                    <Text className="text-gray-500 font-medium text-sm">
                                        {order.items?.length || 0} articles
                                    </Text>
                                    <View className="flex-row items-center space-x-2">
                                        <Text className="font-extrabold text-lg text-gray-900">{formatPrice(order.total)}</Text>
                                        <ChevronRightIcon size={16} color="#D1D5DB" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View className="h-24" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default OrdersScreen;
