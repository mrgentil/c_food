import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./src/utils/navigationUtils";

import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Navigation from "./src/navigation";
import { AuthProvider } from "./src/contexts/AuthContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";

// Navigation ref moved to utils/navigationUtils.js


export default function App() {
  console.log("🚀 [App-Driver] App STARTING (Senior Fix v2)");

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <SafeAreaProvider>
          <AuthProvider>
            <NotificationProvider navigationRef={navigationRef}>
              <Navigation />
              <StatusBar style="light" />
            </NotificationProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
