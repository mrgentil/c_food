import { navigationRef } from "../App";

/**
 * Utilitaire de navigation sécurisé pour contourner les bugs de contexte de React 19.
 * Utilise la référence globale plutôt que les hooks.
 */

export const navigate = (name, params) => {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    } else {
        console.warn("🧭 [Navigation] Tentative de navigation avant que le container soit prêt.");
    }
};

export const goBack = () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
    }
};

export const reset = (state) => {
    if (navigationRef.isReady()) {
        navigationRef.reset(state);
    }
};

export default {
    navigate,
    goBack,
    reset
};
