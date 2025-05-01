#!/bin/bash

# Install dependencies for matchmaking functionality
echo "Installing dependencies for matchmaking functionality..."

# Navigation and UI components
npm install --save @react-navigation/stack
npm install --save react-native-multiple-select
npm install --save @react-native-community/slider
npm install --save lottie-react-native

# Expo location for matchmaking based on proximity
npm install --save expo-location

echo "Dependencies installed successfully!"
