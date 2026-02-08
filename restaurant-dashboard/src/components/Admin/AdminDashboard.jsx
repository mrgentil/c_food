import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * 📊 ADMIN DASHBOARD
 * Vue d'ensemble de toute la plateforme
 */
const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalRestaurants: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        activeDrivers: 0
    });
    const [chartData, setChartData] = useState({
        revenueSeries: [{ name: 'Revenus', data: Array(12).fill(0) }],
        statusSeries: [0, 0, 0] // Delivered, Active, Cancelled
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const restaurantsSnap = await getDocs(collection(db, 'restaurants'));
            const usersSnap = await getDocs(collection(db, 'user'));
            const ordersSnap = await getDocs(collection(db, 'orders'));

            let totalRevenue = 0;
            let pendingOrders = 0;
            const revenueByMonth = Array(12).fill(0);
            let deliveredCount = 0;
            let activeCount = 0;
            let cancelledCount = 0;

            ordersSnap.docs.forEach(doc => {
                const order = doc.data();
                totalRevenue += order.total || 0;
                if (order.status === 'pending') pendingOrders++;

                if (order.status === 'delivered') deliveredCount++;
                else if (order.status === 'cancelled') cancelledCount++;
                else activeCount++;

                if (order.createdAt) {
                    const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                    if (!isNaN(date.getTime())) {
                        const month = date.getMonth();
                        revenueByMonth[month] += (order.total || 0);
                    }
                }
            });

            const driversCount = usersSnap.docs.filter(doc => doc.data().role === 'driver').length;

            setStats({
                totalRestaurants: restaurantsSnap.size,
                totalUsers: usersSnap.size,
                totalOrders: ordersSnap.size,
                totalRevenue,
                pendingOrders,
                activeDrivers: driversCount
            });

            setChartData({
                revenueSeries: [{ name: 'Revenus', data: revenueByMonth }],
                statusSeries: [deliveredCount, activeCount, cancelledCount]
            });

        } catch (error) {
            console.error('Erreur stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('fr-CD', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' FC';

    // Helper for formatting large numbers in charts (e.g. 10k)
    const kFormatter = (num) => {
        return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num);
    };

    const statCards = [
        { label: 'Restaurants', value: stats.totalRestaurants, icon: '🍽️', color: 'text-orange-600 bg-orange-100' },
        { label: 'Utilisateurs', value: stats.totalUsers, icon: '👥', color: 'text-blue-600 bg-blue-100' },
        { label: 'Commandes', value: stats.totalOrders, icon: '📦', color: 'text-green-600 bg-green-100' },
        { label: 'Revenus Total', value: formatCurrency(stats.totalRevenue), icon: '💰', color: 'text-yellow-600 bg-yellow-100' },
        { label: 'En Attente', value: stats.pendingOrders, icon: '⏳', color: 'text-purple-600 bg-purple-100' },
        { label: 'Livreurs', value: stats.activeDrivers, icon: '🚗', color: 'text-cyan-600 bg-cyan-100' },
    ];

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <div className="font-dm-sans text-[#2B3674]">
            {/* TOP HEADER */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Administration / Vue d'ensemble</p>
                    <h1 className="text-[34px] font-bold text-[#2B3674] tracking-tight">Tableau de Bord</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#2B3674] text-sm font-bold shadow-sm hover:shadow-md transition-all">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Exporter les stats
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4318FF] text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all">
                        <span className="text-xl">+</span>
                        Créer un élément
                    </button>
                </div>
            </div>

            {/* KPI CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-[#A3AED0] uppercase mb-1 tracking-wider">{stat.label}</p>
                                <h4 className="text-3xl font-bold text-[#2B3674]">{stat.value}</h4>
                            </div>

                            {/* Icon Container */}
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl shadow-sm ${index === 0 ? 'bg-[#FFF7EC] text-[#FF9F43]' :
                                    index === 1 ? 'bg-[#ECF2FF] text-[#4318FF]' :
                                        index === 2 ? 'bg-[#EBFBF5] text-[#05CD99]' :
                                            'bg-[#FEF2F2] text-[#EF4444]'
                                }`}>
                                {stat.icon}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-auto">
                            <span className="text-sm font-bold text-[#05CD99] flex items-center">
                                <span className="text-lg">↑</span> +12.5%
                            </span>
                            <span className="text-xs text-[#A3AED0] font-medium">vs mois précédent</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ACTIONS RAPIDES */}
            <h3 className="text-lg font-bold text-[#2B3674] mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Créer Restaurant', icon: '+', color: 'bg-white text-[#2B3674]' },
                    { label: 'Notification Masse', icon: '📢', color: 'bg-[#FFF7EC] text-[#FF9F43]' },
                    { label: 'Enregistrer Paiement', icon: '💰', color: 'bg-[#EBFBF5] text-[#05CD99]' },
                    { label: 'Générer Rapport', icon: '📊', color: 'bg-[#F4F7FE] text-[#4318FF]' }
                ].map((action, i) => (
                    <button key={i} className="flex items-center gap-4 bg-white p-4 rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] hover:shadow-lg transition-all">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-[#F4F7FE] text-[#4318FF]' :
                                i === 1 ? 'bg-[#FFF7EC] text-[#FF9F43]' :
                                    i === 2 ? 'bg-[#EBFBF5] text-[#05CD99]' :
                                        'bg-[#F4F7FE] text-[#A3AED0]'
                            }`}>
                            {action.icon}
                        </div>
                        <span className="font-bold text-[#2B3674] text-sm">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* BAR CHART */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#2B3674]">Évolution des Revenus</h3>
                        <button className="bg-[#F4F7FE] p-2 rounded-lg text-[#4318FF] hover:bg-gray-100">
                            📊
                        </button>
                    </div>
                    <div className="h-[300px] w-full">
                        <ReactApexChart
                            options={{
                                chart: { type: 'bar', toolbar: { show: false } },
                                colors: ['#4318FF'],
                                plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
                                dataLabels: { enabled: false },
                                grid: { show: true, borderColor: '#F3F4F6', strokeDashArray: 5 },
                                xaxis: {
                                    categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                                    axisBorder: { show: false },
                                    axisTicks: { show: false },
                                    labels: { style: { colors: '#A3AED0', fontSize: '12px' } }
                                },
                                yaxis: { labels: { style: { colors: '#A3AED0', fontSize: '12px' }, formatter: (val) => kFormatter(val) } },
                                tooltip: { theme: 'light', y: { formatter: (val) => formatCurrency(val) } }
                            }}
                            series={chartData.revenueSeries}
                            type="bar" height={300}
                        />
                    </div>
                </div>

                {/* DONUT CHART */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#2B3674]">Répartition par statut</h3>
                    </div>
                    <div className="flex items-center justify-center h-[300px]">
                        <ReactApexChart
                            options={{
                                chart: { type: 'donut' },
                                colors: ['#05CD99', '#4318FF', '#111C44'],
                                labels: ['Livrées', 'En cours', 'Annulées'],
                                legend: { position: 'bottom', labels: { colors: '#A3AED0' } },
                                plotOptions: {
                                    pie: {
                                        donut: {
                                            size: '75%', labels: {
                                                show: true,
                                                name: { show: true, fontSize: '14px', fontFamily: 'DM Sans', color: '#A3AED0' },
                                                value: { show: true, fontSize: '30px', fontFamily: 'DM Sans', fontWeight: 'bold', color: '#2B3674' },
                                                total: { show: true, showAlways: true, label: 'Total', fontSize: '14px', color: '#A3AED0' }
                                            }
                                        }
                                    }
                                },
                                dataLabels: { enabled: false },
                                stroke: { show: false }
                            }}
                            series={chartData.statusSeries}
                            type="donut" height={300}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
