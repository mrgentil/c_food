/**
 * 🎭 RÔLES UTILISATEURS
 * Définition centralisée des rôles pour l'application multi-vendeur
 */

export const ROLES = {
    CLIENT: 'client',
    DRIVER: 'driver',
    RESTAURANT: 'restaurant',
    ADMIN: 'admin'
};

/**
 * Vérifie si un rôle est valide
 * @param {string} role - Le rôle à vérifier
 * @returns {boolean}
 */
export const isValidRole = (role) => {
    return Object.values(ROLES).includes(role);
};

/**
 * Obtient le libellé français d'un rôle
 * @param {string} role - Le rôle
 * @returns {string}
 */
export const getRoleLabel = (role) => {
    const labels = {
        [ROLES.CLIENT]: 'Client',
        [ROLES.DRIVER]: 'Livreur',
        [ROLES.RESTAURANT]: 'Restaurant',
        [ROLES.ADMIN]: 'Administrateur'
    };
    return labels[role] || 'Inconnu';
};

/**
 * Obtient l'icône emoji d'un rôle
 * @param {string} role - Le rôle
 * @returns {string}
 */
export const getRoleIcon = (role) => {
    const icons = {
        [ROLES.CLIENT]: '👤',
        [ROLES.DRIVER]: '🚗',
        [ROLES.RESTAURANT]: '🍽️',
        [ROLES.ADMIN]: '👑'
    };
    return icons[role] || '❓';
};

export default ROLES;
