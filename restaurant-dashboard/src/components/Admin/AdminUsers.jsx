import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, secondaryAuth } from '../../firebase/firebase';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        role: 'client',
        city: 'Kinshasa',
    });
    const [saving, setSaving] = useState(false);
    const itemsPerPage = 8;

    // Villes RDC
    const cities = ["Kinshasa", "Lubumbashi", "Goma", "Kisangani", "Mbuji-Mayi", "Kananga", "Bukavu", "Likasi"];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const usersSnap = await getDocs(collection(db, 'user'));
            const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const updateRole = async (userId, newRole) => {
        const oldRole = users.find(u => u.id === userId)?.role;
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        try {
            const userRef = doc(db, 'user', userId);
            await updateDoc(userRef, { role: newRole, updatedAt: serverTimestamp() });
        } catch (error) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: oldRole } : u));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer cet utilisateur ?")) return;
        try {
            await deleteDoc(doc(db, 'user', id));
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (error) { console.error(error); }
    };

    // 🆕 Créer un nouvel utilisateur
    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password || !formData.firstName) {
            alert("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setSaving(true);
        try {
            // Créer le compte Firebase Auth via secondaryAuth (pour ne pas déconnecter l'admin)
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                formData.email,
                formData.password
            );

            const newUser = userCredential.user;

            // Créer le profil Firestore
            await setDoc(doc(db, 'user', newUser.uid), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
                city: formData.city,
                loyaltyPoints: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Rafraîchir la liste
            setUsers(prev => [...prev, {
                id: newUser.uid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
                city: formData.city,
            }]);

            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phoneNumber: '',
                role: 'client',
                city: 'Kinshasa',
            });
            setShowModal(false);
            alert('✅ Utilisateur créé avec succès !');

        } catch (error) {
            console.error('Erreur création utilisateur:', error);
            alert('Erreur: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = filter === 'all' || u.role === filter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
            (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
            (u.email && u.email.toLowerCase().includes(searchLower)) ||
            (u.phoneNumber && u.phoneNumber.includes(searchTerm));
        return matchesRole && matchesSearch;
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getRoleBadge = (role) => {
        const badges = {
            admin: 'bg-purple-100 text-purple-700',
            driver: 'bg-green-100 text-green-700',
            restaurant: 'bg-orange-100 text-orange-700',
            client: 'bg-blue-100 text-blue-700',
        };
        return badges[role] || 'bg-gray-100 text-gray-700';
    };

    if (loading) return <div className="p-10">Chargement...</div>;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-black dark:text-white">Utilisateurs</h2>
                {/* 🆕 Bouton Ajouter */}
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3C50E0] px-5 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                >
                    <span className="text-xl">+</span> Nouvel Utilisateur
                </button>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex gap-2 flex-wrap">
                    {['all', 'client', 'driver', 'restaurant', 'admin'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded px-3 py-1 text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-[#3C50E0] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            {f === 'all' ? 'Tous' : f === 'client' ? 'Clients' : f === 'driver' ? 'Livreurs' : f === 'restaurant' ? 'Restos' : 'Admins'}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Rechercher (Nom, Email, Tel)..."
                    className="w-full rounded border border-stroke bg-transparent py-2 pl-4 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary sm:w-1/3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Utilisateur</th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Contact</th>
                                <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">Ville</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Rôle</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {user.firstName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-black dark:text-white">{user.firstName} {user.lastName}</h5>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white text-sm">{user.phoneNumber || '-'}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <span className="text-sm bg-gray-100 px-2 py-0.5 rounded">📍 {user.city || 'Kinshasa'}</span>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <select
                                            value={user.role || 'client'}
                                            onChange={(e) => updateRole(user.id, e.target.value)}
                                            className={`rounded px-2 py-1 text-sm font-medium border-0 ${getRoleBadge(user.role)}`}
                                        >
                                            <option value="client">Client</option>
                                            <option value="driver">Livreur</option>
                                            <option value="restaurant">Resto</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Supprimer"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between py-4">
                        <span className="text-sm font-medium text-gray-600">Page {currentPage} / {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded px-3 py-1 border hover:bg-gray-100 disabled:opacity-50">Préc.</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded px-3 py-1 border hover:bg-gray-100 disabled:opacity-50">Suiv.</button>
                        </div>
                    </div>
                )}
            </div>

            {/* 🆕 Modal Création Utilisateur */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">👤 Nouvel Utilisateur</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
                                        placeholder="Jean"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
                                        placeholder="Dupont"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
                                    placeholder="jean@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
                                    placeholder="Min. 6 caractères"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
                                    placeholder="+243 999 999 999"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="client">Client</option>
                                        <option value="driver">Livreur</option>
                                        <option value="restaurant">Restaurant</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                    <select
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none"
                                    >
                                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2.5 bg-[#3C50E0] text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    {saving ? 'Création...' : '✅ Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
