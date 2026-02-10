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
                    <div className="w-16 h-16 border-4 border-[#4318FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#A3AED0]">Chargement des statistiques...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="font-dm-sans text-[#2B3674]">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-[#A3AED0] mb-1">Restaurant / Vue d'ensemble</p>
                    <h1 className="text-[34px] font-bold text-[#2B3674] tracking-tight">Tableau de Bord</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#2B3674] text-sm font-bold shadow-sm hover:shadow-md transition-all">
                        <span className="text-lg">📊</span>
                        Exporter
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Orders */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-[#A3AED0] uppercase mb-1 tracking-wider">Total Commandes</p>
                            <h4 className="text-3xl font-bold text-[#2B3674]">{stats.totalOrders}</h4>
                        </div>
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl bg-[#ECF2FF] text-[#4318FF]">
                            📦
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                        <span className="text-sm font-bold text-[#05CD99] flex items-center">
                            <span className="text-lg">↑</span> +12%
                        </span>
                        <span className="text-xs text-[#A3AED0] font-medium">ce mois</span>
                    </div>
                </div>

                {/* Revenue */}
                <div className="bg-gradient-to-br from-[#4318FF] to-[#868CFF] rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(67,24,255,0.25)] text-white flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-white/70 uppercase mb-1 tracking-wider">Chiffre d'Affaires</p>
                            <h4 className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} FC</h4>
                        </div>
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl bg-white/20 backdrop-blur">
                            💰
                        </div>
                    </div>
                    <p className="text-sm text-white/80 font-medium">Total cumulé</p>
                </div>

                {/* Pending Orders */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-[#A3AED0] uppercase mb-1 tracking-wider">En Attente</p>
                            <h4 className="text-3xl font-bold text-[#2B3674]">{stats.pendingOrders}</h4>
                        </div>
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl bg-[#FFF6DA] text-[#FFB547]">
                            ⏳
                        </div>
                    </div>
                    <p className="text-sm text-[#A3AED0] font-medium">À traiter rapidement</p>
                </div>

                {/* Today's Revenue */}
                <div className="bg-gradient-to-br from-[#111C44] to-[#1B254B] rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(17,28,68,0.25)] text-white flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-white/70 uppercase mb-1 tracking-wider">Aujourd'hui</p>
                            <h4 className="text-3xl font-bold">{stats.todayRevenue.toLocaleString()} FC</h4>
                        </div>
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl bg-white/10 backdrop-blur">
                            📅
                        </div>
                    </div>
                    <p className="text-sm text-white/80 font-medium">Revenus du jour</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Performance Chart */}
                <div className="bg-white rounded-[20px] p-8 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
                    <h3 className="text-lg font-bold text-[#2B3674] mb-6">Performance des Commandes</h3>

                    {/* Simple Bar Chart using CSS */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-[#A3AED0]">Terminées</span>
                                <span className="text-sm font-bold text-[#05CD99]">{stats.completedOrders}</span>
                            </div>
                            <div className="h-3 bg-[#F4F7FE] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#05CD99] to-[#05CD99]/70 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-[#A3AED0]">En Attente</span>
                                <span className="text-sm font-bold text-[#FFB547]">{stats.pendingOrders}</span>
                            </div>
                            <div className="h-3 bg-[#F4F7FE] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#FFB547] to-[#FFB547]/70 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-[#A3AED0]">En Cours</span>
                                <span className="text-sm font-bold text-[#4318FF]">
                                    {stats.totalOrders - stats.completedOrders - stats.pendingOrders}
                                </span>
                            </div>
                            <div className="h-3 bg-[#F4F7FE] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.totalOrders > 0 ? ((stats.totalOrders - stats.completedOrders - stats.pendingOrders) / stats.totalOrders) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-white rounded-[20px] p-8 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
                    <h3 className="text-lg font-bold text-[#2B3674] mb-6">Analyse Financière</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#F4F7FE] rounded-2xl border border-[#E9EDF7]">
                            <div>
                                <p className="text-sm font-semibold text-[#A3AED0]">Valeur Moy. Commande</p>
                                <p className="text-2xl font-bold text-[#2B3674] mt-1">{Math.round(stats.avgOrderValue).toLocaleString()} FC</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-[#ECF2FF] flex items-center justify-center text-2xl">💰</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#F4F7FE] rounded-2xl border border-[#E9EDF7]">
                            <div>
                                <p className="text-sm font-semibold text-[#A3AED0]">Taux de Complétion</p>
                                <p className="text-2xl font-bold text-[#2B3674] mt-1">
                                    {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-[#E1FFF4] flex items-center justify-center text-2xl">✅</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#F4F7FE] rounded-2xl border border-[#E9EDF7]">
                            <div>
                                <p className="text-sm font-semibold text-[#A3AED0]">Commandes Livrées</p>
                                <p className="text-2xl font-bold text-[#2B3674] mt-1">{stats.completedOrders}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-[#ECF2FF] flex items-center justify-center text-2xl">🚀</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[20px] p-8 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
                <h3 className="text-lg font-bold text-[#2B3674] mb-6">Actions Rapides</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-6 bg-gradient-to-br from-[#4318FF] to-[#868CFF] text-white rounded-2xl hover:shadow-xl hover:shadow-[#4318FF]/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="font-bold text-lg">Voir Commandes</p>
                        <p className="text-white/70 text-sm mt-1">{stats.pendingOrders} en attente</p>
                    </button>

                    <button className="p-6 bg-gradient-to-br from-[#111C44] to-[#1B254B] text-white rounded-2xl hover:shadow-xl hover:shadow-[#111C44]/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <div className="text-3xl mb-2">🍽️</div>
                        <p className="font-bold text-lg">Gérer Menu</p>
                        <p className="text-white/70 text-sm mt-1">Ajouter des plats</p>
                    </button>

                    <button className="p-6 bg-white border-2 border-[#E9EDF7] text-[#2B3674] rounded-2xl hover:shadow-xl hover:border-[#4318FF]/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <div className="text-3xl mb-2">⚙️</div>
                        <p className="font-bold text-lg">Paramètres</p>
                        <p className="text-[#A3AED0] text-sm mt-1">Configuration</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
