import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebAppView } from './components/WebAppView';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={WebAppView}
          options={{ 
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 