import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        avgOrderValue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const ordersRef = collection(db, "orders");
                const q = query(ordersRef, orderBy("createdAt", "desc"));

                const querySnapshot = await getDocs(q);
                const orders = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                // Calculate stats
                const pending = orders.filter(o => o.status === "pending" || o.paymentStatus === "pending_verification").length;
                const completed = orders.filter(o => o.status === "delivered").length;
                const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

                // Today's revenue
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayOrders = orders.filter(o => {
                    if (!o.createdAt) return false;
                    const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                    return orderDate >= today;
                });
                const todayRev = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                setStats({
                    totalOrders: orders.length,
                    pendingOrders: pending,
                    completedOrders: completed,
                    totalRevenue: revenue,
                    todayRevenue: todayRev,
                    avgOrderValue: orders.length > 0 ? revenue / orders.length : 0,
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching stats:", error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des statistiques...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gray-900">Tableau de Bord</h1>
                <p className="text-gray-500 mt-2">Vue d'ensemble de vos performances</p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Orders */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Total Commandes</p>
                            <p className="text-4xl font-black text-gray-900 mt-2">{stats.totalOrders}</p>
                            <p className="text-green-600 text-sm font-medium mt-2">↗ +12% ce mois</p>
                        </div>
                        <div className="bg-gradient-to-br from-sky-100 to-blue-100 p-4 rounded-2xl">
                            <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Revenue */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-xl text-white hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-semibold uppercase tracking-wide">Chiffre d'Affaires</p>
                            <p className="text-4xl font-black mt-2">{(stats.totalRevenue).toLocaleString()} FC</p>
                            <p className="text-green-200 text-sm font-medium mt-2">Total cumulé</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">En Attente</p>
                            <p className="text-4xl font-black text-gray-900 mt-2">{stats.pendingOrders}</p>
                            <p className="text-orange-600 text-sm font-medium mt-2">⏳ À traiter</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-4 rounded-2xl">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Today's Revenue */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 shadow-xl text-white hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-semibold uppercase tracking-wide">Aujourd'hui</p>
                            <p className="text-4xl font-black mt-2">{(stats.todayRevenue).toLocaleString()} FC</p>
                            <p className="text-purple-200 text-sm font-medium mt-2">Revenue du jour</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Performance Chart */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Performance des Commandes</h3>

                    {/* Simple Bar Chart using CSS */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-600">Terminées</span>
                                <span className="text-sm font-bold text-green-600">{stats.completedOrders}</span>
                            </div>
                            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-600">En Attente</span>
                                <span className="text-sm font-bold text-orange-600">{stats.pendingOrders}</span>
                            </div>
                            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-600">En Cours</span>
                                <span className="text-sm font-bold text-sky-600">
                                    {stats.totalOrders - stats.completedOrders - stats.pendingOrders}
                                </span>
                            </div>
                            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.totalOrders > 0 ? ((stats.totalOrders - stats.completedOrders - stats.pendingOrders) / stats.totalOrders) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Analyse Financière</h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border-2 border-sky-200">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Valeur Moy. Commande</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{Math.round(stats.avgOrderValue).toLocaleString()} FC</p>
                            </div>
                            <div className="text-4xl">💰</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Taux de Complétion</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">
                                    {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                                </p>
                            </div>
                            <div className="text-4xl">✅</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Revenue Moyen/Jour</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{Math.round(stats.todayRevenue).toLocaleString()} FC</p>
                            </div>
                            <div className="text-4xl">📈</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Actions Rapides</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-6 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-2xl hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="font-bold text-lg">Voir Commandes</p>
                        <p className="text-sky-100 text-sm mt-1">{stats.pendingOrders} en attente</p>
                    </button>

                    <button className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                        <div className="text-3xl mb-2">🍽️</div>
                        <p className="font-bold text-lg">Gérer Menu</p>
                        <p className="text-green-100 text-sm mt-1">Ajouter des plats</p>
                    </button>

                    <button className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                        <div className="text-3xl mb-2">⚙️</div>
                        <p className="font-bold text-lg">Paramètres</p>
                        <p className="text-purple-100 text-sm mt-1">Configuration</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
