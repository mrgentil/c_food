import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [driverProfile, setDriverProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Récupérer le profil du livreur
                const userRef = doc(db, 'user', firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const profile = userSnap.data();
                    // Vérifier que c'est bien un livreur
                    if (profile.role === 'driver') {
                        setUser(firebaseUser);
                        setDriverProfile({ id: userSnap.id, ...profile });
                    } else {
                        // Pas un livreur, déconnecter
                        await firebaseSignOut(auth);
                        setUser(null);
                        setDriverProfile(null);
                    }
                }
            } else {
                setUser(null);
                setDriverProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Connexion
    const signIn = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);

            // Vérifier le rôle
            const userRef = doc(db, 'user', result.user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const profile = userSnap.data();
                if (profile.role === 'driver') {
                    setDriverProfile({ id: userSnap.id, ...profile });
                    return { success: true };
                } else {
                    await firebaseSignOut(auth);
                    return { success: false, error: 'Accès réservé aux livreurs' };
                }
            } else {
                await firebaseSignOut(auth);
                return { success: false, error: 'Profil non trouvé' };
            }
        } catch (error) {
            console.error('Erreur connexion:', error);
            return { success: false, error: 'Email ou mot de passe incorrect' };
        }
    };

    // Déconnexion
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setDriverProfile(null);
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    };

    // Placeholder for refreshProfile, as it was included in the value object but not defined
    const refreshProfile = async () => {
        if (user && user.uid) {
            const userRef = doc(db, 'user', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setDriverProfile({ id: userSnap.id, ...userSnap.data() });
            }
        }
    };

    const toggleOnlineStatus = async () => {
        if (!driverProfile?.id) return;
        const newStatus = !driverProfile.isOnline;
        try {
            const driverRef = doc(db, 'user', driverProfile.id); // Changed 'drivers' to 'user' to match existing logic
            await updateDoc(driverRef, {
                isOnline: newStatus,
                lastSeen: new Date().toISOString()
            });
            // Update local state immediately for UI responsiveness
            setDriverProfile(prev => ({ ...prev, isOnline: newStatus }));
        } catch (error) {
            console.error("Error toggling online status:", error);
            Alert.alert("Erreur", "Impossible de changer le statut");
        }
    };

    const value = {
        user,
        driverProfile,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshProfile,
        toggleOnlineStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
