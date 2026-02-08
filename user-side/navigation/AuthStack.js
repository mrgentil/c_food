import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignIn from "../screens/SignIn";
import SignUp from "../screens/SignUp";
import UserDetails from "../screens/UserDetails";
import OnboardingScreen from "../screens/OnboardingScreen";
import LocationPermissionScreen from "../screens/LocationPermissionScreen";
import SplashScreen from "../screens/SplashScreen";
import { StatusBar } from "expo-status-bar";

const AuthStack = () => {
  const Stack = createNativeStackNavigator();

  return (
    <>
      <StatusBar hidden={false} style="light" />

      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen
          name="LocationPermission"
          component={LocationPermissionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignIn}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUp}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="User Details"
          component={UserDetails}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </>
  );
}

export default AuthStack