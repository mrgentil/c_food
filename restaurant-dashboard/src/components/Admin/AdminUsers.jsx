import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

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

    const filteredUsers = users.filter(u => {
        const matchesRole = filter === 'all' || u.role === filter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
            (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
            (u.phoneNumber && u.phoneNumber.includes(searchTerm));
        return matchesRole && matchesSearch;
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <div className="p-10">Chargement...</div>;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-black dark:text-white">Utilisateurs</h2>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex gap-2">
                    {['all', 'client', 'driver', 'restaurant', 'admin'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded px-3 py-1 text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-[#3C50E0] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            {f === 'all' ? 'Tous' : f}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Rechercher (Nom/Tel)..."
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
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Nom</th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Contact</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Rôle</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">{user.firstName} {user.lastName}</h5>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white text-sm">{user.phoneNumber || '-'}</p>
                                        <p className="text-sm text-gray-500 truncate max-w-[150px]">{user.address}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <select
                                            value={user.role || 'client'}
                                            onChange={(e) => updateRole(user.id, e.target.value)}
                                            className="rounded border border-stroke bg-transparent py-1 px-2 text-sm outline-none focus:border-primary"
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
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
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
        </div >
    );
};

export default AdminUsers;
