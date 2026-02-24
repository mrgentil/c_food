import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeftIcon, StarIcon } from 'react-native-heroicons/solid';
import { StatusBar } from 'expo-status-bar';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const ReviewsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { restaurantId, restaurantName } = route.params;

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    useEffect(() => {
        if (!restaurantId) return;

        const ratingsRef = collection(db, 'ratings');
        const q = query(
            ratingsRef,
            where('restaurantId', '==', restaurantId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setReviews(reviewsData);

            if (reviewsData.length > 0) {
                const total = reviewsData.length;
                const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
                const average = sum / total;

                const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                reviewsData.forEach(r => {
                    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
                });

                setStats({ average, total, distribution });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const StarRating = ({ rating, size = 16 }) => (
        <div className="flex-row items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                    key={star}
                    size={size}
                    color={star <= rating ? '#FBBF24' : '#D1D5DB'}
                />
            ))}
        </div>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-4 py-4 bg-white shadow-sm border-b border-gray-100">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-full">
                        <ArrowLeftIcon size={20} color="black" />
                    </TouchableOpacity>
                    <View className="flex-1 ml-4">
                        <Text className="text-xl font-extrabold text-gray-900">Avis clients</Text>
                        <Text className="text-gray-500 text-xs italic" numberOfLines={1}>{restaurantName}</Text>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#0EA5E9" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false}>
                        {/* Stats Summary */}
                        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex-row items-center">
                            <View className="items-center justify-center border-r border-gray-100 pr-6 mr-6">
                                <Text className="text-5xl font-extrabold text-gray-900">{stats.average.toFixed(1)}</Text>
                                <View className="flex-row mt-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <StarIcon key={s} size={12} color={s <= Math.round(stats.average) ? '#FBBF24' : '#D1D5DB'} />
                                    ))}
                                </View>
                                <Text className="text-gray-400 text-[10px] mt-2 font-bold uppercase">{stats.total} avis</Text>
                            </View>

                            <View className="flex-1 space-y-1">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = stats.distribution[star] || 0;
                                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                    return (
                                        <View key={star} className="flex-row items-center">
                                            <Text className="text-[10px] font-bold text-gray-500 w-3">{star}</Text>
                                            <View className="flex-1 h-1.5 bg-gray-100 rounded-full mx-2 overflow-hidden">
                                                <View className="h-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                                            </View>
                                            <Text className="text-[10px] text-gray-400 w-4 text-right">{count}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Reviews List */}
                        <Text className="text-lg font-extrabold text-gray-800 mb-4 ml-1">Commentaires</Text>

                        {reviews.length === 0 ? (
                            <View className="items-center justify-center py-20">
                                <Text className="text-gray-400 font-medium">Aucun avis pour le moment</Text>
                            </View>
                        ) : (
                            reviews.map((review, index) => (
                                <View key={review.id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                                    <View className="flex-row justify-between items-start mb-2">
                                        <View>
                                            <Text className="font-bold text-gray-800">{review.userName || 'Client anonyme'}</Text>
                                            <Text className="text-[10px] text-gray-400">{formatDate(review.createdAt)}</Text>
                                        </View>
                                        <View className="flex-row">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <StarIcon key={s} size={14} color={s <= review.rating ? '#FBBF24' : '#D1D5DB'} />
                                            ))}
                                        </View>
                                    </View>
                                    {review.comment ? (
                                        <Text className="text-gray-600 text-sm leading-5 italic">"{review.comment}"</Text>
                                    ) : (
                                        <Text className="text-gray-300 text-xs italic">Aucun commentaire laissé</Text>
                                    )}
                                </View>
                            ))
                        )}
                        <View className="h-10" />
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
    );
};

export default ReviewsScreen;
