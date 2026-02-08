import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "../navigation/AuthStack";
import AppStack from "../navigation/AppStack";
import { UserAuth } from "../contexts/AuthContext";

const RootNavigator = () => {
  const Stack = createNativeStackNavigator();
  const { user } = UserAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true
      }}
    >
      {user ? (
        <Stack.Screen name="App" component={AppStack} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
