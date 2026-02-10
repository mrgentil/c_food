const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, serverTimestamp } = require("firebase/firestore");

// Config de votre projet
const firebaseConfig = {
    apiKey: "AIzaSyDBNF48YL1FQFZuMlMSoQKceOeTHItBtmw",
    authDomain: "c-food-15d90.firebaseapp.com",
    projectId: "c-food-15d90",
    storageBucket: "c-food-15d90.firebasestorage.app",
    messagingSenderId: "398344015743",
    appId: "1:398344015743:web:12b089411326e33d48944a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestOrder() {
    try {
        const orderData = {
            restaurantName: "Chez Ntemba Test",
            restaurantId: "test-resto-id",
            restaurantAddress: "Gombe, Kinshasa",
            restaurantImage: "https://links.papareact.com/wru",
            restaurantLatitude: -4.322447,
            restaurantLongitude: 15.307045,

            userId: "test-user-id",
            userFirstName: "Test",
            userLastName: "Client RDC",
            userLatitude: -4.3316,
            userLongitude: 15.3130,
            userAddress: "Boulevard du 30 Juin, Kinshasa, RDC",
            city: "Kinshasa", // 👈 TEST CRUCIAL RDC
            district: "Gombe",

            items: [
                { id: "item1", name: "Poulet Mayo", price: 15000, quantity: 1, image: "https://links.papareact.com/wru" }
            ],

            total: 15000,
            deliveryFee: 2000,
            status: "preparing", // 👈 Pour qu'elle soit visible direct par le livreur
            paymentMethod: "cash",
            paymentStatus: "pending",

            driverId: null, // Libre

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "orders"), orderData);
        console.log("✅ Commande RDC créée avec ID: ", docRef.id);
        console.log("📍 Ville: Kinshasa | Statut: preparing");
    } catch (e) {
        console.error("Erreur ajout document: ", e);
    }
}

createTestOrder();
