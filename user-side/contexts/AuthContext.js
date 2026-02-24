import { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ROLES } from "../constants/roles";
import { registerForPushNotificationsAsync } from "../utils/notificationHelper";

const UserContext = createContext();

/**
 * 🔐 AUTH CONTEXT PROVIDER
 * Gère l'authentification et expose les informations utilisateur + rôle
 */
export const AuthContextProvder = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const provider = new GoogleAuthProvider();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email);
      setUser(currentUser);

      if (currentUser?.uid) {
        try {
          const userRef = doc(db, "user", currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setDbUser(userData);
            console.log("✅ DB USER loaded:", userData.firstName);

            // Register for Push Notifications
            setTimeout(async () => {
              try {
                const token = await registerForPushNotificationsAsync();
                if (token && userData.expoPushToken !== token) {
                  await updateDoc(userRef, {
                    expoPushToken: token,
                    updatedAt: new Date()
                  });
                  console.log("🚀 Push token updated in DB");
                }
              } catch (tokenError) {
                console.error("❌ Error registering push token:", tokenError);
              }
            }, 3000); // Small delay to ensure everything is ready
          } else {
            console.log("⚠️ User authenticated but no Firestore doc found. Redirecting to UserDetails...");
            setDbUser(null);
          }
        } catch (error) {
          console.error("❌ Error fetching user data:", error);
          setDbUser(null);
        }
      } else {
        setDbUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // 🔑 AUTHENTICATION METHODS
  // ==========================================

  const createUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signOutUser = () => {
    return signOut(auth);
  };

  const signInUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = () => {
    return signInWithPopup(auth, provider);
  };

  // ==========================================
  // 🎭 ROLE HELPERS
  // ==========================================

  /**
   * Récupère le rôle de l'utilisateur
   * @returns {string|null} Le rôle de l'utilisateur ou null
   */
  const userRole = useMemo(() => dbUser?.role || null, [dbUser]);

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param {string} role - Le rôle à vérifier (utiliser ROLES.XXX)
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return dbUser?.role === role;
  };

  /**
   * Vérifie si l'utilisateur est un client
   * @returns {boolean}
   */
  const isClient = useMemo(() => hasRole(ROLES.CLIENT), [dbUser]);

  /**
   * Vérifie si l'utilisateur est un livreur
   * @returns {boolean}
   */
  const isDriver = useMemo(() => hasRole(ROLES.DRIVER), [dbUser]);

  /**
   * Vérifie si l'utilisateur est un propriétaire de restaurant
   * @returns {boolean}
   */
  const isRestaurant = useMemo(() => hasRole(ROLES.RESTAURANT), [dbUser]);

  /**
   * Vérifie si l'utilisateur est un administrateur
   * @returns {boolean}
   */
  const isAdmin = useMemo(() => hasRole(ROLES.ADMIN), [dbUser]);

  // ==========================================
  // 📦 CONTEXT VALUE
  // ==========================================

  const value = {
    // Auth state
    user,
    dbUser,
    loading,
    isAuthenticated: !!user,

    // Auth methods
    createUser,
    signOutUser,
    signInUser,
    signInWithGoogle,

    // Role helpers
    userRole,
    hasRole,
    isClient,
    isDriver,
    isRestaurant,
    isAdmin,

    // Constants
    ROLES,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte d'authentification
 * @returns {Object} Le contexte d'authentification complet
 */
export const UserAuth = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("UserAuth must be used within an AuthContextProvider");
  }
  return context;
};

export default UserContext;
