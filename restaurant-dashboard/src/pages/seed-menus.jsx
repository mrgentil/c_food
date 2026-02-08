import { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import Head from 'next/head';
import Link from 'next/link';

const MENU_ITEMS = [
    { name: "Poulet Braisé", description: "Poulet grillé aux épices africaines, servi avec des bananes plantains", price: 8500, image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80" },
    { name: "Pizza Margherita", description: "Pizza classique avec sauce tomate, mozzarella et basilic frais", price: 12000, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80" },
    { name: "Burger Deluxe", description: "Burger juteux avec fromage, bacon, laitue et sauce maison", price: 9500, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80" },
    { name: "Spaghetti Bolognaise", description: "Pâtes fraîches avec sauce à la viande mijotée", price: 7500, image: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=800&q=80" },
    { name: "Salade César", description: "Laitue romaine, croûtons, parmesan et sauce César", price: 6000, image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80" },
    { name: "Poisson Grillé", description: "Poisson frais grillé avec légumes de saison", price: 11000, image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=800&q=80" },
    { name: "Riz Sauté aux Légumes", description: "Riz parfumé sauté avec légumes croquants et sauce soja", price: 5500, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80" },
    { name: "Brochettes de Bœuf", description: "Brochettes de bœuf marinées aux herbes, servies avec frites", price: 10000, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
    { name: "Wrap Poulet", description: "Tortilla de blé avec poulet grillé, légumes et sauce yaourt", price: 6500, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80" },
    { name: "Tiramisu", description: "Dessert italien au mascarpone et café", price: 4500, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80" }
];

export default function SeedMenus() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [done, setDone] = useState(false);

    const addLog = (message) => {
        setLogs(prev => [...prev, message]);
    };

    const handleSeed = async () => {
        setLoading(true);
        setLogs([]);
        setDone(false);

        try {
            addLog("🚀 Démarrage du seeding...");

            // Get all restaurants
            const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
            const restaurants = [];
            restaurantsSnapshot.forEach(doc => restaurants.push({ id: doc.id, ...doc.data() }));

            addLog(`📍 ${restaurants.length} restaurants trouvés`);

            let total = 0;
            for (const restaurant of restaurants) {
                addLog(`\n🍽️ ${restaurant.name || restaurant.id}`);

                for (const dish of MENU_ITEMS) {
                    await addDoc(collection(db, "dishes"), {
                        name: dish.name,
                        description: dish.description,
                        price: dish.price,
                        image: dish.image,
                        restaurantId: restaurant.id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    addLog(`   ✅ ${dish.name}`);
                    total++;
                }
            }

            addLog(`\n🎉 TERMINÉ ! ${total} plats ajoutés.`);
            setDone(true);

        } catch (error) {
            addLog(`❌ Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Seed Menus | Dashboard</title>
            </Head>
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">🍔 Seed Menus</h1>
                        <p className="text-gray-600 mb-6">
                            Ce script va ajouter 10 plats à chaque restaurant de la base de données.
                        </p>

                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={handleSeed}
                                disabled={loading}
                                className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "⏳ En cours..." : "🚀 Lancer le Seeding"}
                            </button>
                            <Link href="/" className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">
                                ← Retour
                            </Link>
                        </div>

                        {/* Console */}
                        <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                            {logs.length === 0 ? (
                                <p className="text-gray-500">Console prête...</p>
                            ) : (
                                logs.map((log, i) => (
                                    <p key={i} className="text-green-400 whitespace-pre-wrap">{log}</p>
                                ))
                            )}
                        </div>

                        {done && (
                            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg font-bold text-center">
                                ✅ Seeding terminé avec succès !
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
