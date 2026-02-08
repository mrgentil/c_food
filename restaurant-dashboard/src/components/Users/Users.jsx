import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, clients, drivers, restaurants

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, orderBy("createdAt", "desc"));

                const querySnapshot = await getDocs(q);
                const usersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setUsers(usersData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Filter users by role
    const filteredUsers = users.filter(user => {
        if (filter === "all") return true;
        if (filter === "clients") return user.role === "client" || !user.role;
        if (filter === "drivers") return user.role === "driver";
        if (filter === "restaurants") return user.role === "restaurant";
        return true;
    });

    const stats = {
        total: users.length,
        clients: users.filter(u => u.role === "client" || !u.role).length,
        drivers: users.filter(u => u.role === "driver").length,
        restaurants: users.filter(u => u.role === "restaurant").length,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des utilisateurs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gray-900">Utilisateurs</h1>
                <p className="text-gray-500 mt-2">Gérez tous les utilisateurs de la plateforme</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div
                    onClick={() => setFilter("all")}
                    className={`cursor-pointer rounded-3xl p-6 shadow-xl transition-all hover:scale-105 ${filter === "all"
                            ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white"
                            : "bg-white border border-gray-100"
                        }`}
                >
                    <p className={`text-sm font-semibold uppercase tracking-wide ${filter === "all" ? "text-sky-100" : "text-gray-500"}`}>
                        Total
                    </p>
                    <p className={`text-4xl font-black mt-2 ${filter === "all" ? "text-white" : "text-gray-900"}`}>
                        {stats.total}
                    </p>
                </div>

                <div
                    onClick={() => setFilter("clients")}
                    className={`cursor-pointer rounded-3xl p-6 shadow-xl transition-all hover:scale-105 ${filter === "clients"
                            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                            : "bg-white border border-gray-100"
                        }`}
                >
                    <p className={`text-sm font-semibold uppercase tracking-wide ${filter === "clients" ? "text-green-100" : "text-gray-500"}`}>
                        Clients
                    </p>
                    <p className={`text-4xl font-black mt-2 ${filter === "clients" ? "text-white" : "text-gray-900"}`}>
                        {stats.clients}
                    </p>
                </div>

                <div
                    onClick={() => setFilter("drivers")}
                    className={`cursor-pointer rounded-3xl p-6 shadow-xl transition-all hover:scale-105 ${filter === "drivers"
                            ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white"
                            : "bg-white border border-gray-100"
                        }`}
                >
                    <p className={`text-sm font-semibold uppercase tracking-wide ${filter === "drivers" ? "text-orange-100" : "text-gray-500"}`}>
                        Livreurs
                    </p>
                    <p className={`text-4xl font-black mt-2 ${filter === "drivers" ? "text-white" : "text-gray-900"}`}>
                        {stats.drivers}
                    </p>
                </div>

                <div
                    onClick={() => setFilter("restaurants")}
                    className={`cursor-pointer rounded-3xl p-6 shadow-xl transition-all hover:scale-105 ${filter === "restaurants"
                            ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white"
                            : "bg-white border border-gray-100"
                        }`}
                >
                    <p className={`text-sm font-semibold uppercase tracking-wide ${filter === "restaurants" ? "text-purple-100" : "text-gray-500"}`}>
                        Restaurants
                    </p>
                    <p className={`text-4xl font-black mt-2 ${filter === "restaurants" ? "text-white" : "text-gray-900"}`}>
                        {stats.restaurants}
                    </p>
                </div>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl p-16 text-center border border-gray-100">
                    <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                        <p className="text-gray-500">Essayez de changer le filtre</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                    <th className="px-6 py-4 text-left">
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nom</span>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email</span>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Téléphone</span>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Rôle</span>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Adresse</span>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Status</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-all duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {user.firstName || user.lastName
                                                            ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                                            : "N/A"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-700">{user.email || "N/A"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-700">{user.phoneNumber || "N/A"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === "driver"
                                                    ? "bg-orange-100 text-orange-700"
                                                    : user.role === "restaurant"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : "bg-green-100 text-green-700"
                                                }`}>
                                                {user.role === "driver" ? "🚗 Livreur" :
                                                    user.role === "restaurant" ? "🍽️ Restaurant" :
                                                        "👤 Client"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-700 text-sm truncate max-w-xs">
                                                {user.address || "Non défini"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                ✓ Actif
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
