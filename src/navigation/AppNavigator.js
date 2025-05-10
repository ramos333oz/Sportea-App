import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import ChatScreen from '../screens/ChatScreen';
import TestRealtimeScreen from '../screens/TestRealtimeScreen';

// Import the linking configuration from the TypeScript file
import { linking } from './AppNavigator.tsx';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is signed in
          <>
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
            <Stack.Screen
              name="TestRealtime"
              component={TestRealtimeScreen}
              options={{
                headerShown: true,
                title: 'Test Realtime',
                headerTitleAlign: 'center',
              }}
            />
          </>
        ) : (
          // No user is signed in
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;