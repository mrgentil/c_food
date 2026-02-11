import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, onSnapshot, orderBy, query, addDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';

const AdminPromoCodes = () => {
    const [promos, setPromos] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPromo, setNewPromo] = useState({
        code: '',
        type: 'percentage',
        value: 10,
        minOrder: 0,
        restaurantId: '',
        isActive: true,
        expiryDate: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'promoCodes'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPromos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        // Fetch restaurants for the selector
        const fetchRestos = async () => {
            const snap = await getDocs(collection(db, 'restaurants'));
            setRestaurants(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        };
        fetchRestos();

        return () => unsubscribe();
    }, []);

    const handleAddPromo = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'promoCodes'), {
                ...newPromo,
                code: newPromo.code.toUpperCase(),
                value: Number(newPromo.value),
                minOrder: Number(newPromo.minOrder),
                createdAt: serverTimestamp(),
                expiryDate: newPromo.expiryDate ? new Date(newPromo.expiryDate) : null
            });
            setShowAddModal(false);
            setNewPromo({ code: '', type: 'percentage', value: 10, minOrder: 0, restaurantId: '', isActive: true, expiryDate: '' });
        } catch (error) {
            console.error("Error adding promo:", error);
            alert("Erreur lors de l'ajout");
        }
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
                    <h1 className="text-2xl font-bold text-[#111C44]">Codes Promos</h1>
                    <p className="text-gray-400 text-sm">Gérez les réductions globales ou par restaurant</p>
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
                    <div key={promo.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${promo.restaurantId ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {promo.restaurantId ? 'Resto Spécifique' : 'Global Code'}
                                </span>
                                <h3 className="text-xl font-bold text-[#111C44] mt-2 tracking-widest">{promo.code}</h3>
                            </div>
                            <button onClick={() => handleDelete(promo.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                <span className="material-icons-outlined">delete</span>
                            </button>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Réduction</span>
                                <span className="font-bold text-green-500">{promo.value}{promo.type === 'percentage' ? '%' : ' FC'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Min. Commande</span>
                                <span className="font-bold">{promo.minOrder} FC</span>
                            </div>
                            {promo.restaurantId && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Restaurant</span>
                                    <span className="font-bold text-amber-600 truncate max-w-[150px]">
                                        {restaurants.find(r => r.id === promo.restaurantId)?.name || 'Inconnu'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] text-gray-300">
                                {promo.expiryDate ? `Expire: ${new Date(promo.expiryDate.seconds * 1000).toLocaleDateString()}` : 'Pas d\'expiration'}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${promo.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl scale-in-center">
                        <h2 className="text-xl font-bold text-[#111C44] mb-6">Créer un Code Promo</h2>
                        <form onSubmit={handleAddPromo} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Code (ex: BIENVENUE)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold"
                                    value={newPromo.code}
                                    onChange={e => setNewPromo({ ...newPromo, code: e.target.value })}
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
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Restaurant (Optionnel)</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold"
                                    value={newPromo.restaurantId}
                                    onChange={e => setNewPromo({ ...newPromo, restaurantId: e.target.value })}
                                >
                                    <option value="">Tous les restaurants (Global)</option>
                                    {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-400 font-bold hover:text-gray-600 transition-all">Annuler</button>
                                <button type="submit" className="flex-1 bg-blue-600 py-3 rounded-xl text-white font-bold hover:bg-blue-700 transition-all">Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPromoCodes;
