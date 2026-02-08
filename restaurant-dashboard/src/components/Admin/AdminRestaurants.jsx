import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Menu from '../Menu/Menu';
import ImageWithFallback from '../ImageWithFallback';
import ImageUpload from '../ImageUpload';

/**
 * 🍽️ ADMIN - GESTION DES RESTAURANTS
 * Style: TailAdmin Data Table
 */
const AdminRestaurants = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRestaurant, setCurrentRestaurant] = useState(null);
    const [formData, setFormData] = useState({ name: '', genre: '', address: '', image: '', status: 'pending' });

    // Menu Modal State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuRestaurant, setMenuRestaurant] = useState(null);

    const openMenu = (restaurant) => {
        setMenuRestaurant(restaurant);
        setIsMenuOpen(true);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        setMenuRestaurant(null);
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const restaurantsSnap = await getDocs(collection(db, 'restaurants'));
            const restaurantsList = restaurantsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRestaurants(restaurantsList);
        } catch (error) {
            console.error('Erreur chargement restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentRestaurant) {
                const ref = doc(db, 'restaurants', currentRestaurant.id);
                await updateDoc(ref, { ...formData, updatedAt: serverTimestamp() });
                setRestaurants(prev => prev.map(r => r.id === currentRestaurant.id ? { ...r, ...formData } : r));
            } else {
                const docRef = await addDoc(collection(db, 'restaurants'), {
                    ...formData,
                    rating: 0,
                    createdAt: serverTimestamp()
                });
                setRestaurants(prev => [...prev, { id: docRef.id, ...formData, rating: 0 }]);
            }
            closeModal();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer ce restaurant ?")) return;
        try {
            await deleteDoc(doc(db, 'restaurants', id));
            setRestaurants(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const updateStatus = async (restaurantId, newStatus) => {
        try {
            const restaurantRef = doc(db, 'restaurants', restaurantId);
            await updateDoc(restaurantRef, { status: newStatus, updatedAt: serverTimestamp() });
            setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, status: newStatus } : r));
        } catch (error) { console.error(error); }
    };

    // Modal Helpers
    const openModal = (restaurant = null) => {
        if (restaurant) {
            setCurrentRestaurant(restaurant);
            setFormData({
                name: restaurant.name || '',
                genre: restaurant.genre || '',
                address: restaurant.address || '',
                image: restaurant.image || '',
                status: restaurant.status || 'pending'
            });
        } else {
            setCurrentRestaurant(null);
            setFormData({ name: '', genre: '', address: '', image: '', status: 'pending' });
        }
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setCurrentRestaurant(null); };

    // Filter & Pagination
    const filteredRestaurants = restaurants.filter(r => {
        const matchesStatus = filter === 'all' || r.status === filter;
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });
    const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);
    const paginatedRestaurants = filteredRestaurants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading && restaurants.length === 0) return <div className="p-10 text-center">Chargement...</div>;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-black dark:text-white">
                    Gestion Restaurants
                </h2>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center justify-center rounded-md bg-primary py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    style={{ backgroundColor: '#3C50E0' }} // TailAdmin Primary Blue
                >
                    Ajouter Restaurant
                </button>
            </div>

            {/* Filter & Search */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex gap-2">
                    {['all', 'approved', 'pending', 'suspended'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${filter === f ? 'bg-[#3C50E0] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            {f === 'all' ? 'Tous' : f === 'approved' ? 'Actifs' : f === 'pending' ? 'Attente' : 'Suspendus'}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full rounded border border-stroke bg-transparent py-2 pl-4 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary sm:w-1/3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table Container - TailAdmin Style */}
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                    Restaurant (Nom & Adresse)
                                </th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                    Genre
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Status
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRestaurants.map((restaurant) => (
                                <tr key={restaurant.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                            <div className="h-12 w-12 rounded-xl bg-[#F4F7FE] flex items-center justify-center overflow-hidden text-blue-500">
                                                <ImageWithFallback
                                                    src={restaurant.image}
                                                    alt={restaurant.name}
                                                    className="h-full w-full object-cover"
                                                    fallback={<span className="material-symbols-outlined text-2xl">store</span>}
                                                />
                                            </div>
                                            <p className="text-sm text-black dark:text-white">
                                                <span className="font-medium block">{restaurant.name}</span>
                                                <span className="text-xs text-bodydark">{restaurant.address}</span>
                                            </p>
                                        </div>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{restaurant.genre}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${restaurant.status === 'approved' ? 'bg-success text-success' :
                                            restaurant.status === 'suspended' ? 'bg-danger text-danger' : 'bg-warning text-warning'
                                            }`}>
                                            {restaurant.status === 'approved' ? 'Actif' : restaurant.status === 'suspended' ? 'Suspendu' : 'En attente'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button onClick={() => openMenu(restaurant)} className="text-gray-400 hover:text-orange-500 transition-colors mx-2" title="Gérer le Menu">
                                                <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
                                            </button>
                                            <button onClick={() => openModal(restaurant)} className="text-gray-400 hover:text-[#4318FF] transition-colors mx-2">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(restaurant.id)} className="text-gray-400 hover:text-red-500 transition-colors mx-2" title="Supprimer">
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                            {restaurant.status === 'pending' && (
                                                <button onClick={() => updateStatus(restaurant.id, 'approved')} className="text-green-500 hover:text-green-700 transition-colors mx-2" title="Valider">
                                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white rounded-[20px] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#2B3674]">{currentRestaurant ? 'Modifier' : 'Ajouter'} Restaurant</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-[#2B3674] transition-colors rounded-lg hover:bg-gray-100 p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#2B3674] mb-2 uppercase">Nom du restaurant</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-xl border border-gray-200 bg-[#F4F7FE] py-3 px-4 font-medium text-[#2B3674] outline-none focus:border-[#4318FF] transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#2B3674] mb-2 uppercase">Genre</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border border-gray-200 bg-[#F4F7FE] py-3 px-4 font-medium text-[#2B3674] outline-none focus:border-[#4318FF] transition-all"
                                        value={formData.genre}
                                        onChange={e => setFormData({ ...formData, genre: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#2B3674] mb-2 uppercase">Statut</label>
                                    <select
                                        className="w-full rounded-xl border border-gray-200 bg-[#F4F7FE] py-3 px-4 font-medium text-[#2B3674] outline-none focus:border-[#4318FF] transition-all"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="approved">Actif</option>
                                        <option value="suspended">Suspendu</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#2B3674] mb-2 uppercase">Adresse</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-gray-200 bg-[#F4F7FE] py-3 px-4 font-medium text-[#2B3674] outline-none focus:border-[#4318FF] transition-all"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#2B3674] mb-2 uppercase">Image du Restaurant</label>
                                <ImageUpload
                                    initialValue={formData.image}
                                    onUpload={(url) => setFormData({ ...formData, image: url })}
                                />
                            </div>
                            <button className="w-full rounded-xl bg-[#4318FF] py-3.5 mt-2 font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all">
                                Sauvegarder
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Menu Modal */}
            {isMenuOpen && menuRestaurant && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-5xl bg-[#F4F7FE] rounded-[20px] shadow-2xl h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-[#2B3674]">Menu du Restaurant</h3>
                                <p className="text-sm text-gray-400">{menuRestaurant.name}</p>
                            </div>
                            <button onClick={closeMenu} className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-red-500 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Menu Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <Menu restaurantId={menuRestaurant.id} />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminRestaurants;
