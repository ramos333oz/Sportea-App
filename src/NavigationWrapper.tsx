import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from './contexts/AuthContext';
import AuthNavigator from './navigation/AuthNavigator';
import MainNavigator from './navigation/MainNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GameDetailsScreen from './screens/GameDetailsScreen';
import { linking, AppStackParamList } from './navigation/AppNavigator'; // Assuming linking config is exported from AppNavigator

const Stack = createNativeStackNavigator<AppStackParamList>();

const NavigationWrapper = () => {
  const { isSignedIn, isLoading } = useAuth(); // Assuming isLoading is available

  // Optional: Add a loading state check
  if (isLoading) {
    // Render a loading indicator, e.g., SplashScreen or ActivityIndicator
    // return <SplashScreen /> or <ActivityIndicator />;
    return null; // Or a basic loading indicator
  }

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

export default NavigationWrapper; 