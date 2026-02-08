import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";


const firebaseConfig = {
  apiKey: "AIzaSyDBNF48YL1FQFZuMlMSoQKceOeTHItBtmw",
  authDomain: "c-food-15d90.firebaseapp.com",
  projectId: "c-food-15d90",
  storageBucket: "c-food-15d90.firebasestorage.app",
  messagingSenderId: "398344015743",
  appId: "1:398344015743:web:12b089411326e33d48944a",
};

// Initialize Firebase app
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

//init database with specific settings to avoid connection issues
import { initializeFirestore } from "firebase/firestore";
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});


