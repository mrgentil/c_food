import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import RestaurantCardHero from './RestaurantCardHero';
import SectionTitle from './SectionTitle';
import * as Animatable from 'react-native-animatable';

const TopRatedSection = ({ restaurants }) => {
    const [topRated, setTopRated] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRatings = async () => {
            if (!restaurants || restaurants.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const ratingsRef = collection(db, 'ratings');
                const ratingsSnapshot = await getDocs(ratingsRef);

                console.log('📊 Ratings found:', ratingsSnapshot.size);

                // Calculate average rating per restaurant
                const ratingsByRestaurant = {};
                ratingsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (!ratingsByRestaurant[data.restaurantId]) {
                        ratingsByRestaurant[data.restaurantId] = { sum: 0, count: 0 };
                    }
                    ratingsByRestaurant[data.restaurantId].sum += data.rating;
                    ratingsByRestaurant[data.restaurantId].count += 1;
                });

                // Attach average to restaurants
                const restaurantsWithRatings = restaurants
                    .map(restaurant => {
                        const ratingsData = ratingsByRestaurant[restaurant.id];
                        const avgRating = ratingsData
                            ? ratingsData.sum / ratingsData.count
                            : 0;
                        const reviewCount = ratingsData?.count || 0;
                        return { ...restaurant, avgRating, reviewCount };
                    })
                    .filter(r => r.avgRating >= 3.5 && r.reviewCount >= 1) // 3.5+ stars with 1+ review
                    .sort((a, b) => b.avgRating - a.avgRating)
                    .slice(0, 5);

                console.log('⭐ Top rated restaurants:', restaurantsWithRatings.length);

                // If no rated restaurants, show top 3 as "popular" (fallback for demo)
                if (restaurantsWithRatings.length === 0 && ratingsSnapshot.size === 0) {
                    // No ratings at all - show first 3 restaurants as placeholder
                    const fallback = restaurants.slice(0, 3).map(r => ({
                        ...r,
                        avgRating: 0,
                        reviewCount: 0
                    }));
                    setTopRated(fallback);
                    console.log('📌 Using fallback (no ratings yet)');
                } else {
                    setTopRated(restaurantsWithRatings);
                }
            } catch (error) {
                console.error('Error fetching ratings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRatings();
    }, [restaurants]);

    if (loading) {
        return null;
    }

    // Always show section (even with fallback)
    if (topRated.length === 0) {
        return null;
    }

    const hasRatings = topRated.some(r => r.reviewCount > 0);

    return (
        <Animatable.View animation="fadeInUp" duration={800} delay={520} className="mt-4">
            <SectionTitle
                title={hasRatings ? "Les Mieux Notés ⭐" : "Populaires 🔥"}
                onPress={() => { }}
            />
            <Text className="text-xs text-gray-400 px-4 -mt-2 mb-2">
                {hasRatings
                    ? "Nos restaurants les plus appréciés par les clients"
                    : "Découvrez nos restaurants vedettes"
                }
            </Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                className="pt-2"
            >
                {topRated.map((item, index) => (
                    <RestaurantCardHero
                        key={item.id}
                        id={item.id}
                        title={item.name}
                        rating={item.avgRating > 0 ? item.avgRating.toFixed(1) : null}
                        description={item.description}
                        address={item.address}
                        image={item.image}
                        genre={item.genre}
                        minDeliveryTime={item.minDeliveryTime}
                        maxDeliveryTime={item.maxDeliveryTime}
                        isTopRated={item.avgRating >= 4}
                    />
                ))}
            </ScrollView>
        </Animatable.View>
    );
};

export default TopRatedSection;
