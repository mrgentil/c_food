import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

const AdminPromotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, expired

    useEffect(() => {
        const promosRef = collection(db, 'promotions');
        const q = query(promosRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const promosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPromotions(promosData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-CD').format(price) + ' FC';
    };

    const isExpired = (endDate) => {
        if (!endDate) return false;
        const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
        return end < new Date();
    };

    const isActive = (promo) => {
        return promo.isActive && !isExpired(promo.endDate);
    };

    const filteredPromotions = promotions.filter(promo => {
        if (filter === 'active') return isActive(promo);
        if (filter === 'expired') return isExpired(promo.endDate);
        return true;
    });

    // Stats
    const stats = {
        total: promotions.length,
        active: promotions.filter(p => isActive(p)).length,
        expired: promotions.filter(p => isExpired(p.endDate)).length,
    };

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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Vue des Promotions</h1>
                <p className="text-gray-500 text-sm">Toutes les promotions des restaurants (lecture seule)</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Promos</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-green-500">{stats.active}</div>
                    <div className="text-sm text-gray-500">Actives</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-gray-400">{stats.expired}</div>
                    <div className="text-sm text-gray-500">Expirées</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {[
                    { key: 'all', label: 'Toutes' },
                    { key: 'active', label: '✅ Actives' },
                    { key: 'expired', label: '⏰ Expirées' }
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

            {/* Promotions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Restaurant</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Plat</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Réduction</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Prix</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Période</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPromotions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-gray-500">
                                    Aucune promotion trouvée
                                </td>
                            </tr>
                        ) : (
                            filteredPromotions.map((promo) => (
                                <tr key={promo.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <span className="font-medium text-gray-900">{promo.restaurantName || '-'}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            {promo.dishImage && (
                                                <img src={promo.dishImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                            )}
                                            <span className="text-gray-700">{promo.dishName}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold text-sm">
                                            -{promo.discountPercent}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <span className="text-gray-400 line-through text-sm">{formatPrice(promo.originalPrice)}</span>
                                            <span className="ml-2 font-bold text-green-600">{formatPrice(promo.discountedPrice)}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                        {formatDate(promo.startDate)} → {formatDate(promo.endDate)}
                                    </td>
                                    <td className="py-3 px-4">
                                        {isExpired(promo.endDate) ? (
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-medium">Expirée</span>
                                        ) : promo.isActive ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">Active</span>
                                        ) : (
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-medium">Pause</span>
                                        )}
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

export default AdminPromotions;
