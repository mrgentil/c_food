import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { GiftIcon, CheckBadgeIcon } from "react-native-heroicons/solid";
import * as Animatable from "react-native-animatable";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { UserAuth } from "../contexts/AuthContext";

const LoyaltyCard = () => {
    const { user } = UserAuth();
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [rewardAvailable, setRewardAvailable] = useState(false);

    const TARGET_ORDERS = 5;
    const REWARD_AMOUNT = 10000; // 10,000 FC de réduction

    useEffect(() => {
        const fetchLoyaltyData = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, "user", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    const points = data.loyaltyPoints || 0;
                    setLoyaltyPoints(points);
                    setRewardAvailable(data.loyaltyRewardAvailable || false);
                }
            } catch (error) {
                console.error("Error fetching loyalty data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLoyaltyData();
    }, [user]);

    const handleClaimReward = async () => {
        if (loyaltyPoints < TARGET_ORDERS || claiming) return;

        setClaiming(true);
        try {
            const userRef = doc(db, "user", user.uid);

            // Create reward record
            await addDoc(collection(db, "loyaltyRewards"), {
                userId: user.uid,
                amount: REWARD_AMOUNT,
                claimedAt: serverTimestamp(),
                used: false,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            });

            // Reset points and mark reward as available
            await updateDoc(userRef, {
                loyaltyPoints: 0,
                loyaltyRewardAvailable: true,
            });

            setLoyaltyPoints(0);
            setRewardAvailable(true);
            alert("🎁 Félicitations ! Vous avez gagné 10 000 FC de réduction sur votre prochaine commande !");
        } catch (error) {
            console.error("Error claiming reward:", error);
            alert("Erreur lors de la réclamation. Réessayez.");
        } finally {
            setClaiming(false);
        }
    };

    const progress = Math.min((loyaltyPoints / TARGET_ORDERS) * 100, 100);
    const canClaim = loyaltyPoints >= TARGET_ORDERS;

    if (loading) {
        return (
            <View className="mx-4 mt-6 bg-[#0EA5E9] rounded-2xl p-5 items-center justify-center h-32">
                <ActivityIndicator color="white" />
            </View>
        );
    }

    // If user has unclaimed reward
    if (rewardAvailable) {
        return (
            <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                duration={2000}
                className="mx-4 mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-5 shadow-lg"
                style={{ backgroundColor: '#F59E0B' }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg">🎁 Récompense Active !</Text>
                        <Text className="text-yellow-100 text-sm mt-1">
                            -10 000 FC sur votre prochaine commande
                        </Text>
                    </View>
                    <CheckBadgeIcon color="white" size={40} />
                </View>
            </Animatable.View>
        );
    }

    return (
        <Animatable.View
            animation="fadeInUp"
            duration={1000}
            className="mx-4 mt-6 bg-[#0EA5E9] rounded-2xl p-5 shadow-lg shadow-blue-200"
        >
            <View className="flex-row justify-between items-start">
                <View>
                    <Text className="text-white font-bold text-lg">Fidélité C-Food 🏆</Text>
                    <Text className="text-blue-50 text-xs mt-1">Gagnez un repas gratuit !</Text>
                </View>
                <View className="bg-white/20 p-2 rounded-full">
                    <GiftIcon color="white" size={24} />
                </View>
            </View>

            <View className="mt-4">
                <View className="flex-row justify-between mb-2">
                    <Text className="text-white font-bold text-xs">{loyaltyPoints} commandes</Text>
                    <Text className="text-white/80 text-xs">Objectif : {TARGET_ORDERS}</Text>
                </View>

                {/* Progress Bar Container */}
                <View className="h-2 bg-black/10 rounded-full overflow-hidden">
                    {/* Progress Fill */}
                    <Animatable.View
                        animation="slideInLeft"
                        duration={1500}
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </View>
            </View>

            {canClaim ? (
                <TouchableOpacity
                    onPress={handleClaimReward}
                    disabled={claiming}
                    className="mt-3 bg-yellow-400 py-2 px-4 rounded-xl active:bg-yellow-500"
                >
                    <Text className="text-yellow-900 font-bold text-center">
                        {claiming ? "Réclamation..." : "🎁 Réclamer ma récompense !"}
                    </Text>
                </TouchableOpacity>
            ) : (
                <Text className="text-white/80 text-[10px] mt-3 italic">
                    Plus que {TARGET_ORDERS - loyaltyPoints} commande{TARGET_ORDERS - loyaltyPoints > 1 ? 's' : ''} pour débloquer votre récompense !
                </Text>
            )}
        </Animatable.View>
    );
};

export default LoyaltyCard;
