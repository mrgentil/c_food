import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

/**
 * 🔐 AUTH CONTEXT - Dashboard Unifié
 * Gère l'authentification et les rôles pour Admin et Restaurant
 */

const AuthContext = createContext();

// Constantes de rôles
export const ROLES = {
    ADMIN: 'admin',
    RESTAURANT: 'restaurant',
    DRIVER: 'driver',
    CLIENT: 'client'
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Écouter les changements d'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await fetchUserProfile(firebaseUser.uid);
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Récupérer le profil utilisateur depuis Firestore
    const fetchUserProfile = async (uid) => {
        try {
            const userRef = doc(db, 'user', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const profile = { id: userSnap.id, ...userSnap.data() };
                setUserProfile(profile);
                return profile;
            } else {
                setError('Profil utilisateur introuvable');
                setUserProfile(null);
                return null;
            }
        } catch (err) {
            console.error('Erreur récupération profil:', err);
            setError(err.message);
            return null;
        }
    };

    // Connexion
    const signIn = async (email, password) => {
        setError(null);
        setLoading(true);

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const profile = await fetchUserProfile(result.user.uid);

            // Vérifier que l'utilisateur a le bon rôle
            if (profile && (profile.role === ROLES.ADMIN || profile.role === ROLES.RESTAURANT)) {
                return { success: true, user: result.user, profile };
            } else {
                // Déconnexion si rôle non autorisé
                await firebaseSignOut(auth);
                throw new Error('Accès non autorisé. Seuls les administrateurs et propriétaires de restaurant peuvent se connecter.');
            }
        } catch (err) {
            console.error('Erreur connexion:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Déconnexion
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserProfile(null);
        } catch (err) {
            console.error('Erreur déconnexion:', err);
            setError(err.message);
        }
    };

    // Helpers de rôle
    const isAdmin = userProfile?.role === ROLES.ADMIN;
    const isRestaurant = userProfile?.role === ROLES.RESTAURANT;
    const isAuthenticated = !!user && !!userProfile;

    // Vérifier si l'utilisateur a un rôle spécifique
    const hasRole = (role) => userProfile?.role === role;

    // Vérifier si l'utilisateur peut accéder à une ressource
    const canAccess = (requiredRoles) => {
        if (!userProfile?.role) return false;
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(userProfile.role);
        }
        return userProfile.role === requiredRoles;
    };

    const value = {
        user,
        userProfile,
        loading,
        error,
        signIn,
        signOut,
        isAdmin,
        isRestaurant,
        isAuthenticated,
        hasRole,
        canAccess,
        ROLES
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook pour accéder au contexte d'authentification
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

export default AuthContext;
