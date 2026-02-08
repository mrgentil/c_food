import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 💾 STORAGE UTILITY
 * Helper functions for AsyncStorage management
 */

const STORAGE_KEYS = {
    HAS_SEEN_LOCATION_PERMISSION: 'hasSeenLocationPermission',
    LOCATION_PERMISSION_GRANTED: 'locationPermissionGranted',
    HAS_SEEN_ONBOARDING: 'hasSeenOnboarding',
    USER: 'user',
};

// Check if user has seen location permission screen
export const hasSeenLocationPermission = async () => {
    try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_LOCATION_PERMISSION);
        return value === 'true';
    } catch (error) {
        console.error('Error checking location permission flag:', error);
        return false;
    }
};

// Check if location permission was granted
export const isLocationPermissionGranted = async () => {
    try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PERMISSION_GRANTED);
        return value === 'true';
    } catch (error) {
        console.error('Error checking location permission status:', error);
        return false;
    }
};

// Check if user has seen onboarding
export const hasSeenOnboarding = async () => {
    try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
        return value === 'true';
    } catch (error) {
        console.error('Error checking onboarding flag:', error);
        return false;
    }
};

// Set location permission seen flag
export const setLocationPermissionSeen = async (granted = false) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_LOCATION_PERMISSION, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_PERMISSION_GRANTED, granted ? 'true' : 'false');
    } catch (error) {
        console.error('Error setting location permission flags:', error);
    }
};

// Set onboarding seen flag
export const setOnboardingSeen = async () => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    } catch (error) {
        console.error('Error setting onboarding flag:', error);
    }
};

// Clear all flags (for testing/debugging)
export const clearAllFlags = async () => {
    try {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.HAS_SEEN_LOCATION_PERMISSION,
            STORAGE_KEYS.LOCATION_PERMISSION_GRANTED,
            STORAGE_KEYS.HAS_SEEN_ONBOARDING,
        ]);
        console.log('✅ All flags cleared');
    } catch (error) {
        console.error('Error clearing flags:', error);
    }
};

// Get initial route based on flags
export const getInitialRoute = async () => {
    try {
        const seenLocation = await hasSeenLocationPermission();
        const seenOnboarding = await hasSeenOnboarding();
        const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        // Flow logic
        if (!seenLocation) return 'LocationPermission';
        if (!seenOnboarding) return 'Onboarding';
        if (!user) return 'SignIn';
        return 'Home';
    } catch (error) {
        console.error('Error getting initial route:', error);
        return 'LocationPermission';
    }
};

export default {
    hasSeenLocationPermission,
    isLocationPermissionGranted,
    hasSeenOnboarding,
    setLocationPermissionSeen,
    setOnboardingSeen,
    clearAllFlags,
    getInitialRoute,
    STORAGE_KEYS,
};
