import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useRestaurant } from '../../contexts/RestaurantContext';

const Reviews = () => {
    const { restaurantId, restaurant, loading: contextLoading } = useRestaurant();
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

            // Calculate stats
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

    const StarRating = ({ rating }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`material-symbols-outlined text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                >
                    star
                </span>
            ))}
        </div>
    );

    if (contextLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Avis Clients</h1>
                    <p className="text-gray-500 text-sm">Consultez les retours de vos clients</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Average Score Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900 mb-2">
                            {stats.average.toFixed(1)}
                        </div>
                        <StarRating rating={Math.round(stats.average)} />
                        <p className="text-gray-500 text-sm mt-2">
                            Basé sur {stats.total} avis
                        </p>
                    </div>
                </div>

                {/* Distribution Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2">
                    <h3 className="font-semibold text-gray-800 mb-4">Répartition des notes</h3>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = stats.distribution[star] || 0;
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-sm font-medium text-gray-700">{star}</span>
                                        <span className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-500 w-10 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Derniers avis</h3>

                {reviews.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">rate_review</span>
                        <p className="text-gray-500">Aucun avis pour le moment</p>
                        <p className="text-gray-400 text-sm">Les avis de vos clients apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="font-medium text-gray-900">{review.userName || 'Client anonyme'}</div>
                                        <div className="text-xs text-gray-400">{formatDate(review.createdAt)}</div>
                                    </div>
                                    <StarRating rating={review.rating} />
                                </div>
                                {review.comment && (
                                    <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reviews;
