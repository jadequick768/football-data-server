import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import MatchScreen from './src/screens/MatchScreen';
import WatchScreen from './src/screens/WatchScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Matches' }} />
        <Stack.Screen name="Match" component={MatchScreen} options={{ title: 'Match' }} />
        <Stack.Screen name="Watch" component={WatchScreen} options={{ title: 'Watch' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
