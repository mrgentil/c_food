import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, onSnapshot, orderBy, query, doc, deleteDoc } from 'firebase/firestore';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, positive (4-5), negative (1-3)
    const [stats, setStats] = useState({
        total: 0,
        average: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    useEffect(() => {
        const ratingsRef = collection(db, 'ratings');
        const q = query(ratingsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setReviews(reviewsData);

            // Calculate global stats
            if (reviewsData.length > 0) {
                const total = reviewsData.length;
                const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
                const average = sum / total;

                const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                reviewsData.forEach(r => {
                    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
                });

                setStats({ total, average, distribution });
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (reviewId) => {
        if (!confirm('Supprimer cet avis ?')) return;
        try {
            await deleteDoc(doc(db, 'ratings', reviewId));
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredReviews = reviews.filter(r => {
        if (filter === 'positive') return r.rating >= 4;
        if (filter === 'negative') return r.rating <= 3;
        return true;
    });

    const StarRating = ({ rating }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`material-symbols-outlined text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                    star
                </span>
            ))}
        </div>
    );

    if (loading) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Avis</h1>
                    <p className="text-gray-500 text-sm">Vue globale de tous les avis clients</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Avis</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-yellow-500">{stats.average.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Note Moyenne</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-green-500">
                        {stats.distribution[5] + stats.distribution[4]}
                    </div>
                    <div className="text-sm text-gray-500">Avis Positifs (4-5★)</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-red-500">
                        {stats.distribution[1] + stats.distribution[2] + stats.distribution[3]}
                    </div>
                    <div className="text-sm text-gray-500">Avis Négatifs (1-3★)</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {[
                    { key: 'all', label: 'Tous' },
                    { key: 'positive', label: '✨ Positifs' },
                    { key: 'negative', label: '⚠️ Négatifs' }
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === key
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Restaurant</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Client</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Note</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Commentaire</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredReviews.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-gray-500">
                                    Aucun avis trouvé
                                </td>
                            </tr>
                        ) : (
                            filteredReviews.map((review) => (
                                <tr key={review.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-900 text-sm">{review.restaurantName || '-'}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-gray-700">{review.userName || 'Anonyme'}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <StarRating rating={review.rating} />
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-gray-600 max-w-xs truncate">
                                            {review.comment || <span className="text-gray-400 italic">Aucun commentaire</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-xs text-gray-500">{formatDate(review.createdAt)}</div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Supprimer"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminReviews;
