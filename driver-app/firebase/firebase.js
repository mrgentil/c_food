import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ============================================
// 🔥 CONFIGURATION FIREBASE UNIFIÉE
// Projet: c-food-15d90 (même que user-side)
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyDBNF48YL1FQFZuMlMSoQKceOeTHItBtmw",
  authDomain: "c-food-15d90.firebaseapp.com",
  projectId: "c-food-15d90",
  storageBucket: "c-food-15d90.firebasestorage.app",
  messagingSenderId: "398344015743",
  appId: "1:398344015743:web:12b089411326e33d48944a",
};

// Initialize Firebase app (singleton pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
