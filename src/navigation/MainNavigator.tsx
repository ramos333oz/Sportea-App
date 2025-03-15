import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import DashboardScreen from '../screens/DashboardScreen';

// We'll implement these screens later
// Just creating placeholders for the navigation structure
const FindGamesScreen = () => null;
const CreateGameScreen = () => null;
const ProfileScreen = () => null;
const NotificationsScreen = () => null;

// Main tab navigator parameter list
export type MainTabParamList = {
  Dashboard: undefined;
  FindGames: undefined;
  CreateGame: undefined;
  Profile: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'FindGames') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'CreateGame') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.disabled,
        headerShown: true,
        tabBarStyle: { 
          height: 60,
          paddingBottom: 8, 
          paddingTop: 8 
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="FindGames" component={FindGamesScreen} options={{ title: 'Find Games' }} />
      <Tab.Screen 
        name="CreateGame" 
        component={CreateGameScreen}
        options={{ 
          title: 'Host Game',
          tabBarLabelStyle: { color: COLORS.primary }
        }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator; 