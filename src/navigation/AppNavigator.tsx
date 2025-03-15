import React, { useContext } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import AuthContext from '../contexts/AuthContext';

export type AppStackParamList = {
  Auth: undefined;
  Main: undefined;
  GameDetails: { gameId: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

// Configure deep linking
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['sportea://', 'https://vzigidvhgyvketpnruqa.supabase.co'],
  config: {
    screens: {
      Auth: {
        path: 'auth',
        // Nested navigators need their own screen mappings
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'reset-password',
          EmailConfirmation: 'verify', // Path for email confirmation
        },
      },
      Main: 'main',
      GameDetails: 'game/:gameId',
    },
  },
};

const AppNavigator = () => {
  const { isSignedIn } = useContext(AuthContext);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
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
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 