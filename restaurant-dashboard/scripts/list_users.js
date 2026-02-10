const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, limit } = require("firebase/firestore");

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

async function listUsers() {
    console.log("Listing users...");
    const q = query(collection(db, "user"), limit(50));
    const snap = await getDocs(q);

    snap.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id} | Name: ${d.firstName} ${d.lastName} | Email: ${d.email} | Role: ${d.role}`);
    });
    process.exit(0);
}

listUsers();
