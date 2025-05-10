import React from 'react';
import { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import ChatScreen from '../screens/ChatScreen';

export type AppStackParamList = {
  Auth: undefined;
  Main: undefined;
  GameDetails: { gameId: string };
  Chat: { matchId: string };
};

// Configure and EXPORT deep linking
export const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [
    'sportea://', 
    'https://vzigidvhgyvketpnruqa.supabase.co',
    'exp://10.0.2.2:8083',
    'exp://127.0.0.1:8083',
    'exp://localhost:8083',
    'exp://192.168.1.118:8083' // Example specific IP, might need adjustment
  ],
  config: {
    screens: {
      Auth: {
        path: 'auth',
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'reset-password',
          EmailConfirmation: 'verify', 
        },
      },
      Main: 'main',
      GameDetails: 'game/:gameId',
      Chat: 'chat/:matchId',
    },
  },
};

const Stack = createNativeStackNavigator<AppStackParamList>();

// This component now just defines the stack structure
// The logic to choose between Auth/Main is moved to NavigationWrapper
const AppNavigatorStructure = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
       {/* Define all possible screens here */}
       {/* The wrapper will decide which flow to show */}
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen 
        name="GameDetails" 
        component={GameDetailsScreen} 
        options={{
          headerShown: true,
          title: 'Game Details',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{
          headerShown: true,
          title: 'Chat',
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
};

// Export the structure component if needed elsewhere, or just use it internally
// Usually, you might not need to export this structure directly.
export default AppNavigatorStructure; // Or adjust export as needed