import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebAppView } from './components/WebAppView';
import { TodoList } from './app/components/TodoList';

type RootStackParamList = {
  Home: undefined;
  Tasks: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): React.ReactNode {
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
        <Stack.Screen 
          name="Tasks" 
          component={() => (
            <div className="container mx-auto py-8">
              <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
                <TodoList />
              </div>
            </div>
          )}
          options={{ 
            title: 'Tasks'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 