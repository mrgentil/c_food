import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Initialize Firebase Auth with AsyncStorage persistence
import { getAuth } from "firebase/auth";
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}
export { auth };

// Initialize Storage
import { getStorage } from "firebase/storage";
export const storage = getStorage(app);
