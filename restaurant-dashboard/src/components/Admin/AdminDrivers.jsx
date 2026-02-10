import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { db } from '../../firebase/firebase';

// Configuration Firebase (pour créer une app secondaire)
const firebaseConfig = {
    apiKey: "AIzaSyDBNF48YL1FQFZuMlMSoQKceOeTHItBtmw",
    authDomain: "c-food-15d90.firebaseapp.com",
    projectId: "c-food-15d90",
    storageBucket: "c-food-15d90.firebasestorage.app",
    messagingSenderId: "398344015743",
    appId: "1:398344015743:web:12b089411326e33d48944a",
};

const AdminDrivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        vehicleType: 'moto',
        city: 'Kinshasa'
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const usersRef = collection(db, 'user');
            const q = query(usersRef, where('role', '==', 'driver'));
            const snap = await getDocs(q);
            setDrivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Erreur chargement livreurs:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', vehicleType: 'moto', city: 'Kinshasa' });
        setFormError('');
        setEditingDriver(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setFormData({
            firstName: driver.firstName || '',
            lastName: driver.lastName || '',
            email: driver.email || '',
            password: '',
            phoneNumber: driver.phoneNumber || '',
            vehicleType: driver.vehicleType || 'moto',
            city: driver.city || 'Kinshasa'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            if (editingDriver) {
                const driverRef = doc(db, 'user', editingDriver.id);
                await updateDoc(driverRef, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    vehicleType: formData.vehicleType,
                    city: formData.city,
                    updatedAt: serverTimestamp()
                });
                setDrivers(prev => prev.map(d => d.id === editingDriver.id ? { ...d, ...formData } : d));
            } else {
                if (!formData.email || !formData.password) throw new Error('Email et mot de passe requis');
                if (formData.password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères');

                // 🔥 Utiliser une app Firebase SECONDAIRE pour ne pas déconnecter l'admin
                const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp_' + Date.now());
                const secondaryAuth = getAuth(secondaryApp);

                try {
                    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);

                    const userRef = doc(db, 'user', userCredential.user.uid);
                    await setDoc(userRef, {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phoneNumber: formData.phoneNumber,
                        vehicleType: formData.vehicleType,
                        city: formData.city,
                        role: 'driver',
                        isActive: true,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });

                    setDrivers(prev => [...prev, { id: userCredential.user.uid, ...formData, role: 'driver', isActive: true }]);
                    await secondaryAuth.signOut();
                } finally {
                    await deleteApp(secondaryApp);
                }
            }

            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Erreur:', error);
            if (error.code === 'auth/email-already-in-use') setFormError('Cet email est déjà utilisé');
            else if (error.code === 'auth/invalid-email') setFormError('Email invalide');
            else if (error.code === 'auth/weak-password') setFormError('Mot de passe trop faible');
            else setFormError(error.message || 'Une erreur est survenue');
        } finally {
            setFormLoading(false);
        }
    };

    const toggleDriverStatus = async (driver) => {
        try {
            const driverRef = doc(db, 'user', driver.id);
            await updateDoc(driverRef, { isActive: !driver.isActive, updatedAt: serverTimestamp() });
            setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, isActive: !d.isActive } : d));
        } catch (error) { console.error('Erreur mise à jour statut:', error); }
    };

    const deleteDriver = async (driver) => {
        if (!confirm(`Supprimer le livreur ${driver.firstName} ${driver.lastName} ?`)) return;
        try {
            await deleteDoc(doc(db, 'user', driver.id));
            setDrivers(prev => prev.filter(d => d.id !== driver.id));
        } catch (error) { console.error('Erreur suppression:', error); }
    };

    const filteredDrivers = drivers.filter(d => {
        const search = searchTerm.toLowerCase();
        return (d.firstName?.toLowerCase().includes(search) || d.lastName?.toLowerCase().includes(search) ||
            d.email?.toLowerCase().includes(search) || d.phoneNumber?.includes(search));
    });

    const getVehicleIcon = (type) => {
        switch (type) {
            case 'moto': return '🏍️';
            case 'velo': return '🚲';
            case 'voiture': return '🚗';
            default: return '🛵';
        }
    };

    if (loading) return <div className="p-10">Chargement...</div>;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white">Livreurs</h2>
                    <p className="text-sm text-gray-500">{drivers.length} livreur(s) enregistré(s)</p>
                </div>
                <button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-lg bg-[#3C50E0] px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90">
                    <span>+</span> Ajouter un livreur
                </button>
            </div>

            <div className="mb-6">
                <input type="text" placeholder="Rechercher..." className="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-4 outline-none focus:border-primary sm:w-1/2"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrivers.map(driver => (
                    <div key={driver.id} className="rounded-xl border border-stroke bg-white p-6 shadow-default hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                                    {driver.firstName?.charAt(0) || 'L'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-black">{driver.firstName} {driver.lastName}</h3>
                                    <p className="text-sm text-gray-500">{driver.email}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${driver.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {driver.isActive !== false ? 'Actif' : 'Inactif'}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <span>📱</span><span className="text-sm">{driver.phoneNumber || 'Non renseigné'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span>{getVehicleIcon(driver.vehicleType)}</span><span className="text-sm capitalize">{driver.vehicleType || 'moto'}</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">📍 {driver.city || 'Kinshasa'}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-stroke">
                            <button onClick={() => openEditModal(driver)} className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">Modifier</button>
                            <button onClick={() => toggleDriverStatus(driver)} className={`flex-1 py-2 text-sm font-medium rounded-lg ${driver.isActive !== false ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>
                                {driver.isActive !== false ? 'Désactiver' : 'Activer'}
                            </button>
                            <button onClick={() => deleteDriver(driver)} className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100">🗑️</button>
                        </div>
                    </div>
                ))}

                {filteredDrivers.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <span className="text-6xl mb-4 block">🛵</span>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun livreur</h3>
                        <p className="text-gray-500 mb-4">Ajoutez votre premier livreur pour commencer</p>
                        <button onClick={openAddModal} className="rounded-lg bg-[#3C50E0] px-5 py-2.5 text-sm font-medium text-white">+ Ajouter un livreur</button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-stroke flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">{editingDriver ? '✏️ Modifier' : '🛵 Nouveau livreur'}</h3>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">⚠️ {formError}</div>}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full rounded-lg border border-stroke py-2.5 px-4 outline-none focus:border-primary" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full rounded-lg border border-stroke py-2.5 px-4 outline-none focus:border-primary" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-lg border border-stroke py-2.5 px-4 outline-none focus:border-primary" required disabled={!!editingDriver} />
                            </div>

                            {!editingDriver && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full rounded-lg border border-stroke py-2.5 px-4 outline-none focus:border-primary" placeholder="Min. 6 caractères" required />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full rounded-lg border border-stroke py-2.5 px-4 outline-none focus:border-primary" placeholder="+243..." />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ville d'opération (RDC)</label>
                                <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full rounded-lg border border-stroke py-2.5 px-4 outline-none focus:border-primary">
                                    <option value="Kinshasa">Kinshasa</option>
                                    <option value="Lubumbashi">Lubumbashi</option>
                                    <option value="Goma">Goma</option>
                                    <option value="Matadi">Matadi</option>
                                    <option value="Kisangani">Kisangani</option>
                                    <option value="Bukavu">Bukavu</option>
                                    <option value="Kolwezi">Kolwezi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de véhicule</label>
                                <select value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                    className="w-full rounded-lg border border-stroke py-2.5 px-4 outline-none focus:border-primary">
                                    <option value="moto">🏍️ Moto</option>
                                    <option value="velo">🚲 Vélo</option>
                                    <option value="voiture">🚗 Voiture</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Annuler</button>
                                <button type="submit" disabled={formLoading}
                                    className="flex-1 py-3 text-white bg-[#3C50E0] rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50">
                                    {formLoading ? 'Chargement...' : (editingDriver ? 'Enregistrer' : 'Créer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDrivers;
