import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a specific route
 */
export function navigate(name, params) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    } else {
        console.log("🚀 [NavigationUtils] Ref not ready, queuing navigation to:", name);
        // You could implement a small queue here if needed
    }
}

/**
 * Go back to previous screen
 */
export function goBack() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
    }
}

/**
 * Reset navigation state
 */
export function reset(state) {
    if (navigationRef.isReady()) {
        navigationRef.reset(state);
    }
}
