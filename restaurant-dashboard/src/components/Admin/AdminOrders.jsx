import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp, where, increment } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchOrders();
        fetchDrivers();
    }, []);

    const fetchOrders = async () => {
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    // 🚗 Récupérer les livreurs disponibles
    const fetchDrivers = async () => {
        try {
            const usersRef = collection(db, 'user');
            const q = query(usersRef, where('role', '==', 'driver'));
            const snap = await getDocs(q);
            setDrivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) { console.error('Erreur chargement livreurs:', error); }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const order = orders.find(o => o.id === orderId);
            const previousStatus = order?.status;

            await updateDoc(orderRef, { status: newStatus, updatedAt: serverTimestamp() });

            // 🎯 Increment loyalty points when order is delivered
            if (newStatus === 'delivered' && previousStatus !== 'delivered' && order?.userId) {
                const userRef = doc(db, 'user', order.userId);
                await updateDoc(userRef, {
                    loyaltyPoints: increment(1)
                });
                console.log(`🏆 Loyalty point added for user ${order.userId}`);
            }

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) { console.error(error); }
    };

    // 🚗 Assigner un livreur à une commande
    const assignDriver = async (orderId, driverId) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const driver = drivers.find(d => d.id === driverId);

            await updateDoc(orderRef, {
                driverId: driverId,
                driverName: driver ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() : '',
                driverPhone: driver?.phoneNumber || '',
                updatedAt: serverTimestamp()
            });

            setOrders(prev => prev.map(o => o.id === orderId ? {
                ...o,
                driverId,
                driverName: driver ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() : ''
            } : o));

            setShowDriverModal(false);
            setSelectedOrder(null);
        } catch (error) { console.error('Erreur assignation livreur:', error); }
    };

    // Ouvrir le modal d'assignation
    const openDriverModal = (order) => {
        setSelectedOrder(order);
        setShowDriverModal(true);
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('fr-CD').format(amount) + ' FC';
    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = filter === 'all' || o.status === filter;
        const searchLower = searchTerm.toLowerCase();
        return matchesStatus && (o.id.includes(searchLower) || (o.restaurantName && o.restaurantName.toLowerCase().includes(searchLower)));
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStatusInfo = (status) => {
        const map = {
            pending: { color: 'text-warning bg-warning', label: 'En attente' },
            accepted: { color: 'text-primary bg-primary', label: 'Acceptée' },
            preparing: { color: 'text-warning bg-warning', label: 'Cuisine' },
            picked_up: { color: 'text-primary bg-primary', label: 'Livraison' },
            delivered: { color: 'text-success bg-success', label: 'Livrée' },
            cancelled: { color: 'text-danger bg-danger', label: 'Annulée' }
        };
        return map[status] || { color: 'text-gray-500 bg-gray-100', label: status };
    };

    if (loading) return <div className="p-10">Chargement...</div>;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-black dark:text-white">Commandes</h2>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">🚗 {drivers.length} livreur(s)</span>
                    {/* 🆕 Bouton Tout Accepter */}
                    <button
                        onClick={async () => {
                            const pendingOrders = orders.filter(o => o.status === 'pending');
                            if (pendingOrders.length === 0) {
                                alert('Aucune commande en attente !');
                                return;
                            }
                            if (!confirm(`Accepter ${pendingOrders.length} commande(s) en attente ?`)) return;

                            for (const order of pendingOrders) {
                                await updateOrderStatus(order.id, 'preparing');
                            }
                            alert(`✅ ${pendingOrders.length} commandes passées en cuisine !`);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                    >
                        ✅ Tout Accepter
                    </button>
                </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['all', 'pending', 'accepted', 'preparing', 'picked_up', 'delivered', 'cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded px-3 py-1 text-sm font-medium transition-colors capitalize whitespace-nowrap ${filter === f ? 'bg-[#3C50E0] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            {f === 'all' ? 'Toutes' : f === 'picked_up' ? 'Livraison' : f}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Rechercher (ID, Resto)..."
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
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">ID & Date</th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Restaurant</th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Client</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Total</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Livreur</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Statut</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map((order) => {
                                const statusInfo = getStatusInfo(order.status);
                                return (
                                    <tr key={order.id}>
                                        <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                            <h5 className="font-bold text-black dark:text-white font-mono">#{order.id.slice(0, 6)}</h5>
                                            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                        </td>
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            <p className="text-black dark:text-white text-sm">{order.restaurantName}</p>
                                        </td>
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            <p className="text-black dark:text-white text-sm">{order.userFirstName} {order.userLastName}</p>
                                        </td>
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            <p className="text-black dark:text-white font-medium">{formatCurrency(order.total)}</p>
                                        </td>
                                        {/* Colonne Livreur */}
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            {order.driverId ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <span className="text-sm text-green-700 font-medium">{order.driverName || 'Assigné'}</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => openDriverModal(order)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                                                >
                                                    <span>🚗</span> Assigner
                                                </button>
                                            )}
                                        </td>
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            <p className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </p>
                                        </td>
                                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className="rounded border border-stroke bg-transparent py-1 px-2 text-sm outline-none focus:border-primary"
                                            >
                                                <option value="pending">En attente</option>
                                                <option value="accepted">Acceptée</option>
                                                <option value="preparing">En cuisine</option>
                                                <option value="picked_up">En livraison</option>
                                                <option value="delivered">Livrée</option>
                                                <option value="cancelled">Annulée</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
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

            {/* 🚗 Modal d'assignation de livreur */}
            {showDriverModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">🚗 Assigner un livreur</h3>
                            <button
                                onClick={() => { setShowDriverModal(false); setSelectedOrder(null); }}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Commande</p>
                            <p className="font-bold text-gray-800">#{selectedOrder.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">{selectedOrder.restaurantName} → {selectedOrder.userFirstName}</p>
                        </div>

                        <p className="text-sm font-medium text-gray-700 mb-3">Choisir un livreur :</p>

                        {drivers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-4xl mb-2">😕</p>
                                <p>Aucun livreur disponible</p>
                                <p className="text-xs mt-1">Ajoutez des utilisateurs avec le rôle "driver"</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {drivers.map(driver => (
                                    <button
                                        key={driver.id}
                                        onClick={() => assignDriver(selectedOrder.id, driver.id)}
                                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                                            {driver.photoURL ? (
                                                <img src={driver.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : '🧑'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">
                                                {driver.firstName || ''} {driver.lastName || 'Livreur'}
                                            </p>
                                            <p className="text-xs text-gray-500">{driver.phoneNumber || 'Pas de téléphone'}</p>
                                        </div>
                                        <span className="text-blue-500">→</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => { setShowDriverModal(false); setSelectedOrder(null); }}
                            className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
