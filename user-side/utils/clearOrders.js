/**
 * Script de nettoyage Firebase
 * Supprime toutes les commandes et ratings
 * 
 * UTILISATION:
 * 1. Ouvrez un terminal dans le dossier user-side
 * 2. Exécutez: node utils/clearOrders.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

// Configuration Firebase (même que dans firebase.js)
const firebaseConfig = {
    apiKey: "AIzaSyCkDyFx9M_BVJSa2fU9XDVC-WRmXxR9FVg",
    authDomain: "food-delivery-de464.firebaseapp.com",
    projectId: "food-delivery-de464",
    storageBucket: "food-delivery-de464.firebasestorage.app",
    messagingSenderId: "389002092880",
    appId: "1:389002092880:web:6c68e68b405889a7ed0aa5"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction pour supprimer toutes les commandes
const clearOrders = async () => {
    console.log("🗑️  Suppression des commandes en cours...");

    try {
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const deletePromises = ordersSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ ${ordersSnapshot.size} commandes supprimées !`);
        return ordersSnapshot.size;
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des commandes:", error);
        throw error;
    }
};

// Fonction pour supprimer toutes les notations (optionnel)
const clearRatings = async () => {
    console.log("🗑️  Suppression des notations en cours...");

    try {
        const ratingsSnapshot = await getDocs(collection(db, "ratings"));
        const deletePromises = ratingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ ${ratingsSnapshot.size} notations supprimées !`);
        return ratingsSnapshot.size;
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des notations:", error);
        throw error;
    }
};

// Fonction principale
const main = async () => {
    console.log("\n🔥 SCRIPT DE NETTOYAGE FIREBASE 🔥\n");
    console.log("⚠️  ATTENTION: Cette action est IRRÉVERSIBLE !\n");

    try {
        // Supprime les commandes
        const ordersDeleted = await clearOrders();

        // Supprime les notations (décommentez si vous voulez aussi supprimer les ratings)
        // const ratingsDeleted = await clearRatings();

        console.log("\n✨ Nettoyage terminé avec succès !");
        console.log(`📊 Total: ${ordersDeleted} commandes supprimées\n`);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Le nettoyage a échoué:", error.message);
        process.exit(1);
    }
};

// Exécuter le script
main();
