import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import AuthContext from '../contexts/AuthContext';

export type AppStackParamList = {
  Auth: undefined;
  Main: undefined;
  GameDetails: { gameId: string };
};

const Stack = createStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  const { isSignedIn } = useContext(AuthContext);

  return (
    <NavigationContainer>
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