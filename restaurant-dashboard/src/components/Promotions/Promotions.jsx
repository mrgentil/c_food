import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';
import { useRestaurant } from '../../contexts/RestaurantContext';

const Promotions = () => {
    const { restaurantId, restaurant } = useRestaurant();
    const [promotions, setPromotions] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        dishId: '',
        discountPercent: 10,
        startDate: '',
        endDate: '',
    });

    // Fetch promotions
    useEffect(() => {
        if (!restaurantId) return;

        const promosRef = collection(db, 'promotions');
        const q = query(promosRef, where('restaurantId', '==', restaurantId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const promosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPromotions(promosData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    // Fetch dishes for dropdown
    useEffect(() => {
        if (!restaurantId) return;

        const fetchDishes = async () => {
            const dishesRef = collection(db, 'dishes');
            const q = query(dishesRef, where('restaurantId', '==', restaurantId));
            const snapshot = await getDocs(q);
            const dishesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDishes(dishesData);
        };

        fetchDishes();
    }, [restaurantId]);

    const resetForm = () => {
        setFormData({
            dishId: '',
            discountPercent: 10,
            startDate: '',
            endDate: '',
        });
        setEditingPromo(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedDish = dishes.find(d => d.id === formData.dishId);
        if (!selectedDish) {
            alert('Veuillez sélectionner un plat');
            return;
        }

        const promoData = {
            restaurantId,
            restaurantName: restaurant?.name || '',
            dishId: formData.dishId,
            dishName: selectedDish.name,
            dishImage: selectedDish.image || '',
            originalPrice: selectedDish.price,
            discountPercent: Number(formData.discountPercent),
            discountedPrice: Math.round(selectedDish.price * (1 - formData.discountPercent / 100)),
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            isActive: true,
            updatedAt: serverTimestamp(),
        };

        try {
            if (editingPromo) {
                await updateDoc(doc(db, 'promotions', editingPromo.id), promoData);
            } else {
                promoData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'promotions'), promoData);
            }
            resetForm();
        } catch (error) {
            console.error('Error saving promotion:', error);
            alert('Erreur lors de la sauvegarde');
        }
    };

    const handleEdit = (promo) => {
        setFormData({
            dishId: promo.dishId,
            discountPercent: promo.discountPercent,
            startDate: promo.startDate?.toDate?.().toISOString().split('T')[0] || '',
            endDate: promo.endDate?.toDate?.().toISOString().split('T')[0] || '',
        });
        setEditingPromo(promo);
        setShowForm(true);
    };

    const handleDelete = async (promoId) => {
        if (!confirm('Supprimer cette promotion ?')) return;
        try {
            await deleteDoc(doc(db, 'promotions', promoId));
        } catch (error) {
            console.error('Error deleting promotion:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const toggleActive = async (promo) => {
        try {
            await updateDoc(doc(db, 'promotions', promo.id), {
                isActive: !promo.isActive,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error toggling promotion:', error);
        }
    };

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
                    <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
                    <p className="text-gray-500 text-sm">Gérez vos offres spéciales et réductions</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Nouvelle Promo
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">
                        {editingPromo ? 'Modifier la promotion' : 'Créer une promotion'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plat</label>
                            <select
                                value={formData.dishId}
                                onChange={(e) => setFormData({ ...formData, dishId: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Sélectionner un plat</option>
                                {dishes.map(dish => (
                                    <option key={dish.id} value={dish.id}>
                                        {dish.name} - {formatPrice(dish.price)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Réduction (%)</label>
                            <input
                                type="number"
                                min="5"
                                max="90"
                                value={formData.discountPercent}
                                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                            >
                                {editingPromo ? 'Modifier' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Promotions List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {promotions.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">local_offer</span>
                        <p className="text-gray-500">Aucune promotion</p>
                        <p className="text-gray-400 text-sm">Créez votre première offre spéciale !</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Plat</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Réduction</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Prix</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Période</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {promotions.map((promo) => (
                                <tr key={promo.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            {promo.dishImage && (
                                                <img src={promo.dishImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                            )}
                                            <span className="font-medium text-gray-900">{promo.dishName}</span>
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
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => toggleActive(promo)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                                title={promo.isActive ? 'Mettre en pause' : 'Activer'}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {promo.isActive ? 'pause' : 'play_arrow'}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(promo)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                                title="Modifier"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(promo.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Supprimer"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Promotions;
