import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
    HomeIcon as HomeOutline,
    HeartIcon as HeartOutline,
    ClipboardDocumentListIcon as OrdersOutline,
    UserIcon as UserOutline
} from 'react-native-heroicons/outline';
import {
    HomeIcon as HomeSolid,
    HeartIcon as HeartSolid,
    ClipboardDocumentListIcon as OrdersSolid,
    UserIcon as UserSolid
} from 'react-native-heroicons/solid';
import { View } from 'react-native';

import Home from '../screens/Home';
import FavoritesScreen from '../screens/FavoritesScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false, // Hide labels for cleaner look
                tabBarActiveTintColor: '#0EA5E9',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 0,
                    height: 80, // Taller for better touch area
                    paddingTop: 10,

                    // Floating effect
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    elevation: 10, // Android shadow
                    shadowColor: '#000000', // iOS shadow
                    shadowOffset: { width: 0, height: -5 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let IconComponent;

                    if (route.name === 'HomeTab') {
                        IconComponent = focused ? HomeSolid : HomeOutline;
                    } else if (route.name === 'FavoritesTab') {
                        IconComponent = focused ? HeartSolid : HeartOutline;
                    } else if (route.name === 'OrdersTab') {
                        IconComponent = focused ? OrdersSolid : OrdersOutline;
                    } else if (route.name === 'ProfileTab') {
                        IconComponent = focused ? UserSolid : UserOutline;
                    }

                    if (!IconComponent) IconComponent = HomeOutline;

                    // Modern Active State: Scale up slightly and bold color
                    return (
                        <View className={`items-center justify-center ${focused ? 'bg-sky-50 p-2 rounded-full' : ''}`}>
                            <IconComponent size={focused ? 32 : 28} color={color} />
                            {focused && (
                                <View className="h-1.5 w-1.5 bg-[#0EA5E9] rounded-full mt-1" />
                            )}
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={Home}
                options={{
                    tabBarLabel: 'Accueil',
                }}
            />
            <Tab.Screen
                name="FavoritesTab"
                component={FavoritesScreen}
                options={{
                    tabBarLabel: 'Favoris',
                }}
            />
            <Tab.Screen
                name="OrdersTab"
                component={OrdersScreen}
                options={{
                    tabBarLabel: 'Commandes',
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profil',
                }}
            />
        </Tab.Navigator >
    );
};

export default TabNavigator;
