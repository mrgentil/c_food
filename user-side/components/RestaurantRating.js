import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StarIcon } from 'react-native-heroicons/solid';
import { StarIcon as StarOutline } from 'react-native-heroicons/outline';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const RestaurantRating = ({ restaurantId, size = 'small' }) => {
    const [averageRating, setAverageRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const ratingsRef = collection(db, 'ratings');
        const q = query(ratingsRef, where('restaurantId', '==', restaurantId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setAverageRating(0);
                setTotalRatings(0);
                setLoading(false);
                return;
            }

            const ratings = snapshot.docs.map(doc => doc.data().rating);
            const sum = ratings.reduce((acc, rating) => acc + rating, 0);
            const avg = sum / ratings.length;

            setAverageRating(avg);
            setTotalRatings(ratings.length);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    if (loading) {
        return <ActivityIndicator size="small" color="#FBBF24" />;
    }

    if (totalRatings === 0) {
        return size === 'large' ? (
            <Text className="text-gray-400 text-sm">Pas encore de notations</Text>
        ) : null;
    }

    const starSize = size === 'large' ? 20 : 14;

    return (
        <View className="flex-row items-center">
            <StarIcon size={starSize} color="#FBBF24" />
            <Text className={`ml-1 font-bold ${size === 'large' ? 'text-base' : 'text-sm'} text-gray-700`}>
                {averageRating.toFixed(1)}
            </Text>
            {size === 'large' && (
                <Text className="ml-1 text-gray-500 text-sm">
                    ({totalRatings} avis)
                </Text>
            )}
        </View>
    );
};

export default RestaurantRating;
