// Script pour créer des promotions de test via Node.js
// Usage: node scripts/seed-promos.js

const { initializeApp } = require('firebase/app');
const {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    Timestamp
} = require('firebase/firestore');

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDBNF48YL1FQFZuMlMSoQKceOeTHItBtmw",
    authDomain: "c-food-15d90.firebaseapp.com",
    projectId: "c-food-15d90",
    storageBucket: "c-food-15d90.firebasestorage.app",
    messagingSenderId: "398344015743",
    appId: "1:398344015743:web:12b089411326e33d48944a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedPromotions() {
    console.log("🎯 Seeding Promotions...\n");

    try {
        // Clear existing promotions
        console.log("🗑️  Clearing old promotions...");
        const promosSnapshot = await getDocs(collection(db, "promotions"));
        for (const docSnap of promosSnapshot.docs) {
            await deleteDoc(doc(db, "promotions", docSnap.id));
        }
        console.log(`   Deleted ${promosSnapshot.size} old promotions\n`);

        // Get restaurants and dishes
        const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
        const dishesSnapshot = await getDocs(collection(db, "dishes"));

        const restaurants = restaurantsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const dishes = dishesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        console.log(`📊 Found ${restaurants.length} restaurants, ${dishes.length} dishes\n`);

        // Create promotions
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 7);

        const discounts = [15, 20, 25, 30, 40];
        let created = 0;

        for (let i = 0; i < Math.min(5, restaurants.length); i++) {
            const restaurant = restaurants[i];
            const restaurantDishes = dishes.filter(d => d.restaurantId === restaurant.id);

            if (restaurantDishes.length === 0) {
                console.log(`   ⚠️  No dishes for "${restaurant.name}", skipping...`);
                continue;
            }

            const dish = restaurantDishes[0];
            const discountPercent = discounts[i % 5];

            const promoRef = doc(collection(db, "promotions"));
            await setDoc(promoRef, {
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                dishId: dish.id,
                dishName: dish.name,
                dishImage: dish.image || '',
                originalPrice: dish.price,
                discountPercent: discountPercent,
                discountedPrice: Math.round(dish.price * (1 - discountPercent / 100)),
                startDate: Timestamp.fromDate(now),
                endDate: Timestamp.fromDate(endDate),
                isActive: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });

            console.log(`   ✅ -${discountPercent}% on "${dish.name}" at ${restaurant.name}`);
            created++;
        }

        console.log(`\n🎉 Done! Created ${created} promotions.`);
        console.log("📱 Reload your mobile app to see 'Bons Plans' section!\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

seedPromotions();
