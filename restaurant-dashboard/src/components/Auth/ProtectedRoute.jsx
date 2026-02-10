import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, ROLES } from '../../contexts/AuthContext';

/**
 * 🛡️ PROTECTED ROUTE
 * Composant HOC pour protéger les routes selon le rôle
 * 
 * @param {React.Component} children - Composant enfant à afficher
 * @param {string|string[]} allowedRoles - Rôle(s) autorisé(s) pour cette route
 */
const ProtectedRoute = ({ children, allowedRoles = [ROLES.ADMIN, ROLES.RESTAURANT] }) => {
    const { user, userProfile, loading, isAuthenticated, canAccess } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // Non connecté → Rediriger vers login
            if (!isAuthenticated) {
                router.replace('/login');
                return;
            }

            // Connecté mais rôle non autorisé
            if (!canAccess(allowedRoles)) {
                router.replace('/unauthorized');
                return;
            }
        }
    }, [loading, isAuthenticated, userProfile, allowedRoles, router]);

    // Afficher un loader pendant la vérification
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#4318FF] mx-auto"></div>
                    <p className="mt-4 text-[#A3AED0] font-medium">Chargement...</p>
                </div>
            </div>
        );
    }

    // Non authentifié ou rôle non autorisé → Ne rien afficher (redirection en cours)
    if (!isAuthenticated || !canAccess(allowedRoles)) {
        return null;
    }

    // Tout est OK → Afficher le contenu
    return children;
};

export default ProtectedRoute;
