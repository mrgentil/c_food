import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { useRestaurant } from "../contexts/RestaurantContext";

// Components
import Dashboard from "./Dashboard/Dashboard";
import Users from "./Users/Users";
import Orders from "./Orders/Orders";
import OrderHistory from "./OrderHistory/OrderHistory";
import Menu from "./Menu/Menu";
import Settings from "./Settings/Settings";
import Reviews from "./Reviews/Reviews";
import Promotions from "./Promotions/Promotions";

// Admin Components
import AdminDashboard from "./Admin/AdminDashboard";
import AdminRestaurants from "./Admin/AdminRestaurants";
import AdminUsers from "./Admin/AdminUsers";
import AdminOrders from "./Admin/AdminOrders";
import AdminReviews from "./Admin/AdminReviews";
import AdminPromotions from "./Admin/AdminPromotions";

const Sidebar = () => {
  const [active, setActive] = useState(0);
  const router = useRouter();

  const { userProfile, signOut, isAdmin } = useAuth();
  const { restaurant } = useRestaurant();

  // Navigation Data
  const adminNavigation = [
    { name: "Dashboard", category: "PRINCIPAL", icon: "grid_view", component: <AdminDashboard /> },
    { name: "Restaurants", category: "GESTION", icon: "restaurant", component: <AdminRestaurants /> },
    { name: "Utilisateurs", category: "GESTION", icon: "group", component: <AdminUsers /> },
    { name: "Commandes", category: "GESTION", icon: "shopping_cart", component: <AdminOrders /> },
    { name: "Promotions", category: "VUE", icon: "local_offer", component: <AdminPromotions /> },
    { name: "Avis Clients", category: "MODÉRATION", icon: "reviews", component: <AdminReviews /> },
  ];

  const restaurantNavigation = [
    { name: "Tableau de Bord", category: "PRINCIPAL", icon: "dashboard", component: <Dashboard /> },
    { name: "Commandes", category: "GESTION", icon: "receipt_long", component: <Orders /> },
    { name: "Menu", category: "GESTION", icon: "restaurant_menu", component: <Menu /> },
    { name: "Promotions", category: "GESTION", icon: "local_offer", component: <Promotions /> },
    { name: "Avis Clients", category: "GESTION", icon: "reviews", component: <Reviews /> },
    { name: "Historique", category: "GESTION", icon: "history", component: <OrderHistory /> },
    { name: "Paramètres", category: "SYSTÈME", icon: "settings", component: <Settings /> },
  ];

  const navigation = isAdmin ? adminNavigation : restaurantNavigation;
  const displayName = isAdmin
    ? `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`
    : restaurant?.name || 'Mon Restaurant';

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Helper to render icon based on Google Material Symbols or Emoji fallback
  const renderIcon = (iconName) => {
    // Mapping simple names to emojis for now to ensure visual consistency without external lib dependency if not present
    const icons = {
      'grid_view': 'dashboard',
      'restaurant': 'store',
      'group': 'people',
      'shopping_cart': 'shopping_bag',
      'dashboard': 'analytics',
      'receipt_long': 'receipt',
      'restaurant_menu': 'menu_book',
      'history': 'history',
      'settings': 'settings'
    };
    return <span className="material-icons-outlined text-lg">{icons[iconName] || 'circle'}</span>;
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-dm-sans">

      {/* SIDEBAR - Deep Navy Fintech Style */}
      <aside className="w-[290px] h-screen bg-[#111C44] text-white flex flex-col transition-all duration-300 fixed left-0 top-0 z-50">

        {/* LOGO */}
        <div className="h-24 flex items-center justify-center border-b border-white/10 mx-6 mb-6">
          <h1 className="text-2xl font-bold tracking-wider uppercase">C-FOOD <span className="text-blue-400">ADMIN</span></h1>
        </div>

        {/* SCROLLABLE NAV */}
        <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          {navigation.map((item, index) => {
            // Section Header Logic
            const showCategory = index === 0 || navigation[index - 1].category !== item.category;

            return (
              <div key={index}>
                {showCategory && (
                  <p className="px-4 mt-6 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {item.category}
                  </p>
                )}

                <button
                  onClick={() => setActive(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative mb-1
                                        ${active === index
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {/* Icon Placeholder (If using Material Icons font in Head, otherwise simpler) */}
                  <span className={`material-symbols-outlined text-[20px] ${active === index ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {/* Fallback to simple shapes if no icon lib */}
                    {item.name.substring(0, 2).toUpperCase()}
                  </span>

                  <span className="font-medium text-sm tracking-wide">{item.name}</span>

                  {/* Active Right Border visual trick if needed, but the button bg is cleaner */}
                  {active === index && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-md hidden"></div>}
                </button>
              </div>
            );
          })}
        </nav>

        {/* BOTTOM / USER */}
        <div className="mx-4 mb-6 mt-auto">
          <div className="bg-[#1B254B] rounded-2xl p-4 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all"></div>

            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold border-2 border-[#111C44] shadow-sm">
                {displayName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{displayName}</p>
                <p className="text-xs text-gray-400">En ligne</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-center transition-colors flex items-center justify-center gap-2"
            >
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 ml-[290px] bg-[#F4F7FE] min-h-screen relative overflow-y-auto">
        {/* Top spacer / or content starts directly */}
        <div className="p-6 md:p-8 xl:p-10 max-w-[1600px] mx-auto">
          {navigation[active]?.component}
        </div>
      </main>

    </div>
  );
};

export default Sidebar;
