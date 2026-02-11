import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { collection, onSnapshot, orderBy, query, addDoc, deleteDoc, doc, serverTimestamp, where, updateDoc } from 'firebase/firestore';

const RestaurantPromoCodes = () => {
    const { restaurant } = useRestaurant();
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const [newPromo, setNewPromo] = useState({
        code: '',
        type: 'percentage',
        value: 10,
        minOrder: 0,
        isActive: true,
        expiryDate: ''
    });

    useEffect(() => {
        if (!restaurant?.id) return;

        const q = query(
            collection(db, 'promoCodes'),
            where('restaurantId', '==', restaurant.id),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPromos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [restaurant]);

    const handleAddPromo = async (e) => {
        e.preventDefault();
        if (!restaurant?.id) return;

        try {
            await addDoc(collection(db, 'promoCodes'), {
                ...newPromo,
                code: newPromo.code.toUpperCase(),
                value: Number(newPromo.value),
                minOrder: Number(newPromo.minOrder),
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                createdAt: serverTimestamp(),
                expiryDate: newPromo.expiryDate ? new Date(newPromo.expiryDate) : null
            });
            setShowAddModal(false);
            setNewPromo({ code: '', type: 'percentage', value: 10, minOrder: 0, isActive: true, expiryDate: '' });
        } catch (error) {
            console.error("Error adding promo:", error);
            alert("Erreur lors de l'ajout");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        await updateDoc(doc(db, 'promoCodes', id), {
            isActive: !currentStatus
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Supprimer ce code promo ?")) {
            await deleteDoc(doc(db, 'promoCodes', id));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#111C44]">Mes Codes Promos</h1>
                    <p className="text-gray-400 text-sm">Créez des réductions exclusives pour vos clients</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                    <span className="material-icons-outlined text-lg">add</span>
                    Nouveau Code
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promos.map((promo) => (
                    <div key={promo.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${promo.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-[#111C44] tracking-widest">{promo.code}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => toggleStatus(promo.id, promo.isActive)} className="text-gray-400 hover:text-blue-500">
                                    <span className="material-icons-outlined">{promo.isActive ? 'pause_circle' : 'play_circle'}</span>
                                </button>
                                <button onClick={() => handleDelete(promo.id)} className="text-gray-400 hover:text-red-500">
                                    <span className="material-icons-outlined">delete</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Réduction</span>
                                <span className="text-lg font-bold text-green-500">
                                    {promo.value}{promo.type === 'percentage' ? '%' : ' FC'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Panier Minimum</span>
                                <span className="font-bold">{promo.minOrder.toLocaleString()} FC</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                                {promo.expiryDate ? `Expire le ${new Date(promo.expiryDate.seconds * 1000).toLocaleDateString()}` : 'Validité illimitée'}
                            </span>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${promo.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {promo.isActive ? 'ACTIF' : 'INACTIF'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <h2 className="text-xl font-bold text-[#111C44] mb-6">Nouveau Code Promo</h2>
                        <form onSubmit={handleAddPromo} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Code (ex: MANGER15)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold"
                                    value={newPromo.code}
                                    onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Type</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold"
                                        value={newPromo.type}
                                        onChange={e => setNewPromo({ ...newPromo, type: e.target.value })}
                                    >
                                        <option value="percentage">Pourcentage (%)</option>
                                        <option value="fixed">Montant Fixe (FC)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Valeur</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold"
                                        value={newPromo.value}
                                        onChange={e => setNewPromo({ ...newPromo, value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Date d'expiration (Opt)</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold"
                                    value={newPromo.expiryDate}
                                    onChange={e => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-400 font-bold hover:text-gray-600">Annuler</button>
                                <button type="submit" className="flex-1 bg-blue-600 py-3 rounded-xl text-white font-bold hover:bg-blue-700">Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantPromoCodes;
