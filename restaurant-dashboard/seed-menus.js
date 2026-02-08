// ==========================================
// 🍔 SCRIPT DE SEEDING - MENUS
// Exécutez avec: node seed-menus.js
// ==========================================

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc } = require('firebase/firestore');

// Configuration Firebase (même que le projet)
const firebaseConfig = {
    apiKey: "AIzaSyDBNF48YL1FQFZuMlMSoQKceOeTHItBtmw",
    authDomain: "c-food-15d90.firebaseapp.com",
    projectId: "c-food-15d90",
    storageBucket: "c-food-15d90.firebasestorage.app",
    messagingSenderId: "398344015743",
    appId: "1:398344015743:web:12b089411326e33d48944a",
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🍽️ Liste des plats variés avec images Unsplash
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

async function seedMenus() {
    console.log("🚀 Démarrage du seeding des menus...\n");

    try {
        // 1. Récupérer tous les restaurants
        const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
        const restaurants = [];
        restaurantsSnapshot.forEach(doc => restaurants.push({ id: doc.id, ...doc.data() }));

        console.log(`📍 ${restaurants.length} restaurants trouvés\n`);

        if (restaurants.length === 0) {
            console.error("❌ Aucun restaurant trouvé !");
            process.exit(1);
        }

        // 2. Pour chaque restaurant, ajouter les 10 plats
        let total = 0;
        for (const restaurant of restaurants) {
            console.log(`🍽️  ${restaurant.name || restaurant.id}`);

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
                process.stdout.write(`   ✅ ${dish.name}\n`);
                total++;
            }
            console.log("");
        }

        console.log(`\n🎉 TERMINÉ ! ${total} plats ajoutés au total.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Erreur:", error.message);
        process.exit(1);
    }
}

seedMenus();
