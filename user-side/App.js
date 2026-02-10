import "./global.css";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigator from "./navigation/RootNavigator";
import { store } from "./store.js";
import { Provider } from "react-redux";
import { Text, View } from "react-native";
import { AuthContextProvder } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { NotificationProvider } from "./contexts/NotificationContext";

export const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
