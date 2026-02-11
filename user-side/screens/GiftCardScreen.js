import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftIcon, GiftIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { UserAuth } from '../contexts/AuthContext';

const GiftCardScreen = () => {
    const navigation = useNavigation();
    const { user } = UserAuth();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleActivateCard = async () => {
        if (!code.trim()) {
            Alert.alert("Erreur", "Veuillez entrer un code.");
            return;
        }

        if (!user?.uid) {
            Alert.alert("Erreur", "Vous devez être connecté.");
            return;
        }

        setLoading(true);
        try {
            // 1. Check if gift card exists and is not used
            const q = query(
                collection(db, 'giftCards'),
                where('code', '==', code.trim().toUpperCase()),
                where('isUsed', '==', false),
                limit(1)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert("Invalide", "Ce code est invalide ou déjà utilisé.");
                setLoading(false);
                return;
            }

            const cardDoc = querySnapshot.docs[0];
            const cardData = cardDoc.data();
            const cardAmount = cardData.value;

            // 2. Update User Wallet
            const userRef = doc(db, 'user', user.uid);
            await updateDoc(userRef, {
                walletBalance: increment(cardAmount)
            });

            // 3. Mark Card as Used
            await updateDoc(doc(db, 'giftCards', cardDoc.id), {
                isUsed: true,
                usedBy: user.uid,
                usedAt: serverTimestamp()
            });

            // 4. Create Transaction Record
            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                type: 'credit',
                amount: cardAmount,
                description: `Carte Cadeau activée (${code.trim().toUpperCase()})`,
                method: 'Gift Card',
                createdAt: serverTimestamp()
            });

            Alert.alert("Succès", `Félicitations ! ${cardAmount.toLocaleString()} FC ont été ajoutés à votre portefeuille. 🎉`);
            setCode('');
            navigation.goBack();

        } catch (error) {
            console.error("Activation Error:", error);
            Alert.alert("Erreur", "Impossible d'activer la carte. Réessayez plus tard.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-white rounded-full shadow-sm">
                        <ArrowLeftIcon size={20} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-800">Cartes Cadeaux</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="px-4 pt-4">
                    {/* Add Gift Card Section */}
                    <View className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                        <View className="items-center mb-4">
                            <View className="bg-pink-100 p-4 rounded-full mb-2">
                                <GiftIcon size={32} color="#EC4899" />
                            </View>
                            <Text className="font-bold text-lg text-gray-800">Ajouter une carte</Text>
                            <Text className="text-gray-400 text-center text-sm px-4">
                                Entrez le code de votre carte cadeau pour l'ajouter à votre solde.
                            </Text>
                        </View>

                        <TextInput
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            placeholderTextColor="#9CA3AF"
                            value={code}
                            onChangeText={(txt) => setCode(txt.toUpperCase())}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-center font-bold tracking-widest text-[#EC4899]"
                            autoCapitalize="characters"
                        />

                        <TouchableOpacity
                            onPress={handleActivateCard}
                            disabled={loading}
                            className={`bg-[#EC4899] py-4 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Activer</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* My Gift Cards List */}
                    <Text className="text-lg font-bold text-gray-800 mb-4">Vos cartes actives</Text>

                    <View className="items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Text className="text-gray-400 font-medium">Aucune carte active</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default GiftCardScreen;
