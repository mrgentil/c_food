import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase/firebase';

/**
 * 🏪 RESTAURANT CONTEXT
 * Gère l'état du restaurant lié au compte connecté
 * Remplace le restaurantId codé en dur par un système dynamique
 */

const RestaurantContext = createContext();

export const RestaurantProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Écouter l'état de connexion
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (!currentUser) {
                setUserProfile(null);
                setRestaurant(null);
                setLoading(false);
                return;
            }

            // 2. Récupérer le profil utilisateur
            try {
                const userRef = doc(db, 'user', currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const profile = userSnap.data();
                    setUserProfile(profile);

                    // 3. Si l'utilisateur a un rôle restaurant, chercher son restaurant
                    if (profile.role === 'restaurant') {
                        fetchUserRestaurant(currentUser.uid);
                    } else if (profile.role === 'admin') {
                        // Admin n'a pas besoin d'un restaurant associé
                        setLoading(false);
                        setError(null);
                    } else {
                        setLoading(false);
                        setError('Ce compte n\'est pas associé à un restaurant.');
                    }
                } else {
                    setLoading(false);
                    setError('Profil utilisateur introuvable.');
                }
            } catch (err) {
                console.error('Erreur chargement profil:', err);
                setError(err.message);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Chercher le restaurant dont l'ownerId correspond à l'utilisateur
    const fetchUserRestaurant = (userId) => {
        const restaurantsRef = collection(db, 'restaurants');
        const q = query(restaurantsRef, where('ownerId', '==', userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const restaurantDoc = snapshot.docs[0];
                setRestaurant({
                    id: restaurantDoc.id,
                    ...restaurantDoc.data()
                });
                setError(null);
            } else {
                setError('Aucun restaurant associé à ce compte.');
                setRestaurant(null);
            }
            setLoading(false);
        }, (err) => {
            console.error('Erreur récupération restaurant:', err);
            setError(err.message);
            setLoading(false);
        });

        return unsubscribe;
    };

    // Déconnexion
    const signOut = async () => {
        try {
            await auth.signOut();
        } catch (err) {
            console.error('Erreur déconnexion:', err);
        }
    };

    const value = {
        user,
        userProfile,
        restaurant,
        restaurantId: restaurant?.id || null,
        loading,
        error,
        signOut,
        isAuthenticated: !!user,
        isRestaurantOwner: userProfile?.role === 'restaurant',
        isAdmin: userProfile?.role === 'admin',
    };

    return (
        <RestaurantContext.Provider value={value}>
            {children}
        </RestaurantContext.Provider>
    );
};

/**
 * Hook pour accéder au contexte Restaurant
 * @returns {Object} { user, restaurant, restaurantId, loading, error, signOut, ... }
 */
export const useRestaurant = () => {
    const context = useContext(RestaurantContext);
    if (!context) {
        throw new Error('useRestaurant doit être utilisé dans un RestaurantProvider');
    }
    return context;
};

export default RestaurantContext;
