import { collection, writeBatch, doc, setDoc, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// 👥 UTILISATEURS DE DÉMONSTRATION
// Chaque restaurant a son propre propriétaire unique
// ==========================================
const demoUsersData = [
    // 🚗 LIVREUR
    {
        id: "demo_driver",
        firstName: "Patrick",
        lastName: "Livreur",
        phoneNumber: "0898765432",
        address: "Matonge, Kinshasa",
        latitude: -4.340,
        longitude: 15.290,
        role: "driver",
        driverInfo: {
            vehicleType: "moto",
            licensePlate: "KIN-1234-AB",
            status: "available",
        }
    },
    // 🍽️ PROPRIÉTAIRES DE RESTAURANTS (1 par restaurant)
    {
        id: "owner_ntemba",
        firstName: "Joseph",
        lastName: "Ntemba",
        phoneNumber: "0811111111",
        address: "Avenue de la Libération, Gombe, Kinshasa",
        latitude: -4.325,
        longitude: 15.322,
        role: "restaurant",
    },
    {
        id: "owner_maman_colonel",
        firstName: "Marie",
        lastName: "Colonel",
        phoneNumber: "0822222222",
        address: "Bandalungwa, Kinshasa",
        latitude: -4.331,
        longitude: 15.298,
        role: "restaurant",
    },
    {
        id: "owner_limoncello",
        firstName: "Marco",
        lastName: "Rossi",
        phoneNumber: "0833333333",
        address: "Gombe, Kinshasa",
        latitude: -4.301,
        longitude: 15.315,
        role: "restaurant",
    },
    {
        id: "owner_kayser",
        firstName: "Pierre",
        lastName: "Kayser",
        phoneNumber: "0844444444",
        address: "Boulevard du 30 Juin, Kinshasa",
        latitude: -4.305,
        longitude: 15.310,
        role: "restaurant",
    },
    {
        id: "owner_opoeta",
        firstName: "Carlos",
        lastName: "Poeta",
        phoneNumber: "0855555555",
        address: "Haut-Commandement, Kinshasa",
        latitude: -4.315,
        longitude: 15.320,
        role: "restaurant",
    },
    {
        id: "owner_bacchus",
        firstName: "François",
        lastName: "Bacchus",
        phoneNumber: "0866666666",
        address: "Avenue Tombalbaye, Kinshasa",
        latitude: -4.308,
        longitude: 15.328,
        role: "restaurant",
    },
    {
        id: "owner_nganda",
        firstName: "Paul",
        lastName: "Nganda",
        phoneNumber: "0877777777",
        address: "Matonge, Kinshasa",
        latitude: -4.335,
        longitude: 15.305,
        role: "restaurant",
    },
    {
        id: "owner_sushi",
        firstName: "Kenji",
        lastName: "Tanaka",
        phoneNumber: "0888888888",
        address: "La Gombe, Kinshasa",
        latitude: -4.312,
        longitude: 15.318,
        role: "restaurant",
    },
    {
        id: "owner_chaumiere",
        firstName: "Claire",
        lastName: "Dupont",
        phoneNumber: "0899999999",
        address: "Binza, Kinshasa",
        latitude: -4.318,
        longitude: 15.292,
        role: "restaurant",
    },
    {
        id: "owner_mama_rosie",
        firstName: "Rosie",
        lastName: "Mama",
        phoneNumber: "0800000000",
        address: "Lemba, Kinshasa",
        latitude: -4.340,
        longitude: 15.285,
        role: "restaurant",
    },
];

// ==========================================
// 🍽️ RESTAURANTS (avec ownerId lié au propriétaire)
// ==========================================
const restaurantsData = [
    {
        name: "Chez Ntemba",
        ownerId: "owner_ntemba",  // 🔗 Lié à Joseph Ntemba
        rating: 4.5,
        genre: "Congolais",
        address: "Avenue de la Libération, Gombe, Kinshasa",
        description: "Le meilleur du poulet mayo et des grillades congolaises.",
        image: "https://images.unsplash.com/photo-1600688675496-e636b563d702?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.325,
        lng: 15.322,
        minDeliveryTime: 30,
        maxDeliveryTime: 45,
        deliveryFee: 2000,
    },
    {
        name: "Maman Colonel",
        ownerId: "owner_maman_colonel",  // 🔗 Lié à Marie Colonel
        rating: 4.8,
        genre: "Traditionnel",
        address: "Bandalungwa, Kinshasa",
        description: "Authentique cuisine kinoise, liboke et fufu.",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.331,
        lng: 15.298,
        minDeliveryTime: 40,
        maxDeliveryTime: 60,
        deliveryFee: 2500,
    },
    {
        name: "Limoncello",
        ownerId: "owner_limoncello",  // 🔗 Lié à Marco Rossi
        rating: 4.6,
        genre: "Italien",
        address: "Gombe, Kinshasa",
        description: "Pizzas au feu de bois et pâtes fraîches.",
        image: "https://images.unsplash.com/photo-1574071318500-10e525049968?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.301,
        lng: 15.315,
        minDeliveryTime: 25,
        maxDeliveryTime: 40,
        deliveryFee: 3000,
    },
    {
        name: "Eric Kayser",
        ownerId: "owner_kayser",  // 🔗 Lié à Pierre Kayser
        rating: 4.7,
        genre: "Boulangerie",
        address: "Boulevard du 30 Juin, Kinshasa",
        description: "Pâtisseries françaises et sandwichs gourmets.",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.305,
        lng: 15.310,
        minDeliveryTime: 20,
        maxDeliveryTime: 35,
        deliveryFee: 1500,
    },
    {
        name: "O'Poeta",
        ownerId: "owner_opoeta",  // 🔗 Lié à Carlos Poeta
        rating: 4.4,
        genre: "International",
        address: "Haut-Commandement, Kinshasa",
        description: "Cadre agréable pour dîner en famille.",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.315,
        lng: 15.320,
        minDeliveryTime: 35,
        maxDeliveryTime: 50,
        deliveryFee: 2000,
    },
    {
        name: "Le Bacchus",
        ownerId: "owner_bacchus",  // 🔗 Lié à François Bacchus
        rating: 4.9,
        genre: "Gastronomique",
        address: "Avenue Tombalbaye, Kinshasa",
        description: "Haute cuisine française dans un cadre élégant.",
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.308,
        lng: 15.328,
        minDeliveryTime: 45,
        maxDeliveryTime: 60,
        deliveryFee: 3500,
    },
    {
        name: "Nganda Center",
        ownerId: "owner_nganda",  // 🔗 Lié à Paul Nganda
        rating: 4.3,
        genre: "Bar & Grill",
        address: "Matonge, Kinshasa",
        description: "Brochettes, makala et ambiance conviviale.",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.335,
        lng: 15.305,
        minDeliveryTime: 30,
        maxDeliveryTime: 45,
        deliveryFee: 1800,
    },
    {
        name: "Sushi Kin",
        ownerId: "owner_sushi",  // 🔗 Lié à Kenji Tanaka
        rating: 4.5,
        genre: "Japonais",
        address: "La Gombe, Kinshasa",
        description: "Sushis frais et cuisine asiatique raffinée.",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.312,
        lng: 15.318,
        minDeliveryTime: 30,
        maxDeliveryTime: 45,
        deliveryFee: 2800,
    },
    {
        name: "La Chaumière",
        ownerId: "owner_chaumiere",  // 🔗 Lié à Claire Dupont
        rating: 4.6,
        genre: "Français",
        address: "Binza, Kinshasa",
        description: "Crêpes, salades et cuisine française authentique.",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.318,
        lng: 15.292,
        minDeliveryTime: 35,
        maxDeliveryTime: 50,
        deliveryFee: 2200,
    },
    {
        name: "Mama Rosie's",
        ownerId: "owner_mama_rosie",  // 🔗 Lié à Rosie Mama
        rating: 4.7,
        genre: "Fast Food",
        address: "Lemba, Kinshasa",
        description: "Burgers, frites et poulet croustillant à l'américaine.",
        image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        lat: -4.340,
        lng: 15.285,
        minDeliveryTime: 20,
        maxDeliveryTime: 35,
        deliveryFee: 1500,
    },
];

const dishesData = [
    {
        name: "Poulet Mayo",
        description: "Poulet grillé avec une sauce mayonnaise onctueuse et épices.",
        price: 15000,
        image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Liboke de Poisson",
        description: "Poisson mariné cuit dans des feuilles de bananier.",
        price: 12000,
        image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Fufu + Pondu",
        description: "Fufu de manioc accompagné de feuilles de manioc.",
        price: 8000,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Pizza Margherita",
        description: "Pizza classique avec mozzarella, tomate et basilic.",
        price: 18000,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Brochettes Mixtes",
        description: "Assortiment de brochettes de bœuf, poulet et chèvre.",
        price: 10000,
        image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Makemba na Mbika",
        description: "Bananes plantains avec feuilles de patate douce.",
        price: 7000,
        image: "https://images.unsplash.com/photo-1587334212707-ano780c5eee8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Burger Classique",
        description: "Burger juteux avec fromage, salade, tomate et sauce maison.",
        price: 9000,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Sushi Mixte 12pcs",
        description: "Assortiment de 12 pièces de sushis frais variés.",
        price: 22000,
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Crêpe Nutella",
        description: "Crêpe française garnie de Nutella et bananes.",
        price: 5000,
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Pâtes Carbonara",
        description: "Pâtes fraîches à la crème, lardons et parmesan.",
        price: 14000,
        image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
];

// Function to clear existing data
const clearCollections = async () => {
    console.log("Clearing old data...");

    try {
        // Delete all restaurants
        const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
        const restaurantDeletes = restaurantsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(restaurantDeletes);
        console.log(`Deleted ${restaurantsSnapshot.size} restaurants`);

        // Delete all dishes
        const dishesSnapshot = await getDocs(collection(db, "dishes"));
        const dishDeletes = dishesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(dishDeletes);
        console.log(`Deleted ${dishesSnapshot.size} dishes`);

        return {
            restaurantsDeleted: restaurantsSnapshot.size,
            dishesDeleted: dishesSnapshot.size
        };
    } catch (error) {
        console.error("Error clearing collections:", error);
        throw error;
    }
};

export const seedDatabase = async () => {
    try {
        // Step 1: Clear old data
        const deleted = await clearCollections();

        // ==========================================
        // 👥 STEP 2: Create Demo Users
        // ==========================================
        console.log("Seeding Demo Users...");

        for (const user of demoUsersData) {
            const userRef = doc(db, "user", user.id);
            await setDoc(userRef, {
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                address: user.address,
                latitude: user.latitude,
                longitude: user.longitude,
                role: user.role,
                ...(user.driverInfo && { driverInfo: user.driverInfo }),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            console.log(`User created: ${user.firstName} ${user.lastName} (${user.role})`);
        }

        // ==========================================
        // 🍽️ STEP 3: Create Restaurants (each with its own owner)
        // ==========================================
        console.log("Seeding Restaurants...");

        const restaurantIds = [];

        for (const restaurant of restaurantsData) {
            const resRef = doc(collection(db, "restaurants"));
            await setDoc(resRef, {
                ...restaurant,
                // 🏪 Multi-Vendor: ownerId already defined in restaurantsData
                status: "approved", // pending | approved | suspended
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            restaurantIds.push(resRef.id);
            console.log(`Restaurant added: ${restaurant.name} → Owner: ${restaurant.ownerId} (ID: ${resRef.id})`);
        }

        // ==========================================
        // 🍔 STEP 4: Create Dishes
        // ==========================================
        console.log("Seeding Dishes...");

        const batch = writeBatch(db);
        let dishCount = 0;

        for (const restaurantId of restaurantIds) {
            for (const dish of dishesData) {
                const dishRef = doc(collection(db, "dishes"));
                batch.set(dishRef, {
                    ...dish,
                    restaurantId: restaurantId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                dishCount++;
            }
        }

        await batch.commit();

        // ==========================================
        // 🎯 STEP 5: Create Promotions
        // ==========================================
        console.log("Seeding Promotions...");

        const promoBatch = writeBatch(db);
        let promoCount = 0;

        // Get some dishes to create promos for
        const dishesSnapshot = await getDocs(collection(db, "dishes"));
        const allDishes = dishesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get restaurants for promo data
        const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
        const allRestaurants = restaurantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Create promotions for first 5 unique dishes
        const usedDishes = new Set();
        for (const restaurant of allRestaurants.slice(0, 5)) {
            const restaurantDishes = allDishes.filter(d => d.restaurantId === restaurant.id);
            if (restaurantDishes.length === 0) continue;

            const dish = restaurantDishes[0];
            if (usedDishes.has(dish.id)) continue;
            usedDishes.add(dish.id);

            const discountPercent = [15, 20, 25, 30, 40][promoCount % 5];
            const now = new Date();
            const startDate = new Date(now);
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + 7); // Valid for 7 days

            const promoRef = doc(collection(db, "promotions"));
            promoBatch.set(promoRef, {
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                dishId: dish.id,
                dishName: dish.name,
                dishImage: dish.image || '',
                originalPrice: dish.price,
                discountPercent: discountPercent,
                discountedPrice: Math.round(dish.price * (1 - discountPercent / 100)),
                startDate: startDate,
                endDate: endDate,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            promoCount++;
            console.log(`Promo added: -${discountPercent}% on ${dish.name} at ${restaurant.name}`);
        }

        await promoBatch.commit();

        // ==========================================
        // ✅ Summary
        // ==========================================
        const ownerCount = demoUsersData.filter(u => u.role === 'restaurant').length;
        const driverCount = demoUsersData.filter(u => u.role === 'driver').length;

        console.log(`Database seeded successfully!`);
        console.log(`- Deleted: ${deleted.restaurantsDeleted} old restaurants, ${deleted.dishesDeleted} old dishes`);
        console.log(`- Created: ${demoUsersData.length} demo users (${ownerCount} owners, ${driverCount} driver)`);
        console.log(`- Created: ${restaurantIds.length} restaurants`);
        console.log(`- Created: ${dishCount} dishes`);
        console.log(`- Created: ${promoCount} promotions`);

        alert(`✅ Base de données mise à jour !\n\n🗑️ Supprimés:\n- ${deleted.restaurantsDeleted} restaurants\n- ${deleted.dishesDeleted} plats\n\n✨ Créés:\n- ${ownerCount} propriétaires de restaurant\n- ${driverCount} livreur\n- ${restaurantIds.length} restaurants\n- ${dishCount} plats\n- ${promoCount} promotions 🎯\n\n🔗 Chaque restaurant est lié à son propre propriétaire !`);
    } catch (error) {
        console.error("Error seeding database:", error);
        alert("❌ Erreur lors du remplissage : " + error.message);
    }
};

