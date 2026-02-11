import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RestaurantDetails from "../screens/RestaurantDetails";
import BasketScreen from "../screens/BasketScreen";
import UserDetails from "../screens/UserDetails";
import OptionsScreen from "../screens/OptionsScreen";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";
import PreparingOrderScreen from "../screens/PreparingOrderScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WalletScreen from "../screens/WalletScreen";
import FidelityScreen from "../screens/FidelityScreen";
import GiftCardScreen from "../screens/GiftCardScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import ChatScreen from "../screens/ChatScreen";
import AddressBookScreen from "../screens/AddressBookScreen";
import { UserAuth } from "../contexts/AuthContext";
import TabNavigator from "./TabNavigator";

const AppStack = () => {
  const Stack = createNativeStackNavigator();
  const { dbUser } = UserAuth();

  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="UserDetails"
        component={UserDetails}
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />

      <Stack.Screen
        name="Options"
        component={OptionsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Restaurant"
        component={RestaurantDetails}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Basket"
        component={BasketScreen}
        options={{ presentation: "modal", headerShown: false }}
      />

      <Stack.Screen
        name="PreparingOrderScreen"
        component={PreparingOrderScreen}
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />

      <Stack.Screen
        name="Order Details"
        component={OrderDetailsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Fidelity" component={FidelityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GiftCard" component={GiftCardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddressBook" component={AddressBookScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AppStack;
