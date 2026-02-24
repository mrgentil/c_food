import "./global.css";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigator from "./navigation/RootNavigator";
import { store } from "./store.js";
import { Provider } from "react-redux";
import { Text, View } from "react-native";
import { AuthContextProvder } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { StripeProvider } from "@stripe/stripe-react-native";

export const navigationRef = createNavigationContainerRef();

export default function App() {
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
      <StripeProvider publishableKey="pk_test_51QoWeoLASsPujTLuG43gDK0IIxX4jLRaMbHLOuMgGQNEINx6vwGeQV94IAy42PeJz3fF6uwhxXTX9qcN7cKt8aeD00SctIdDZO">
        <Provider store={store}>
          <AuthContextProvder>
            <LocationProvider>
              <NotificationProvider navigationRef={navigationRef}>
                <NavigationContainer ref={navigationRef}>
                  <RootNavigator />
                </NavigationContainer>
              </NotificationProvider>
            </LocationProvider>
          </AuthContextProvder>
        </Provider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
