import { StatusBar } from "expo-status-bar";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./navigation/RootNavigator";
import { store } from "./store.js";
import { Provider } from "react-redux";
import { Text, View } from "react-native";
import { AuthContextProvder } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import "./global.css";

export default function App() {
  return (
    <Provider store={store}>
      <AuthContextProvder>
        <LocationProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </LocationProvider>
      </AuthContextProvder>
    </Provider>
  );
}
