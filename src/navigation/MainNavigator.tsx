import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import FindGamesScreen from '../screens/FindGamesScreen';
import CreateGameScreen from '../screens/CreateGameScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MatchmakingScreen from '../screens/MatchmakingScreen';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import ManageGameScreen from '../screens/ManageGameScreen';
import { COLORS } from '../constants/theme';
import { createStackNavigator } from '@react-navigation/stack';

// We'll implement these screens later
// Just creating placeholders for the navigation structure
const NotificationsScreen = () => null;

// Main tab navigator parameter list
export type MainTabParamList = {
  Dashboard: undefined;
  FindGames: undefined;
  CreateGame: undefined;
  Matchmaking: undefined;
  Profile: undefined;
};

// Stack navigator parameter list that includes GameDetails
export type MainStackParamList = {
  MainTabs: undefined;
  GameDetails: { gameId: string };
  ManageGame: { gameId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// Tab Navigator component
const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.disabled,
        tabBarLabelStyle: { fontSize: 12 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="FindGames"
        component={FindGamesScreen}
        options={{
          tabBarLabel: 'Find Games',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="CreateGame"
        component={CreateGameScreen}
        options={{
          tabBarLabel: 'Host Game',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Matchmaking"
        component={MatchmakingScreen}
        options={{
          tabBarLabel: 'Match',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator that includes both tabs and the GameDetails screen
const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen 
        name="GameDetails" 
        component={GameDetailsScreen}
        options={{ headerShown: true, title: 'Game Details' }}
      />
      <Stack.Screen 
        name="ManageGame" 
        component={ManageGameScreen}
        options={{ headerShown: true, title: 'Manage Game' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;