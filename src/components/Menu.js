import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

import HomeScreen from './HomeScreen';
import ListScreen from './ListScreen';
import PostScreen2 from './PostScreen2';
import ConsoleScreen from './ConsoleScreen'; // Import the ConsoleScreen component

const Tab = createBottomTabNavigator();

export default function Menu() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4682B4',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 5,
            paddingTop: 5,
          },
          headerStyle: {
            backgroundColor: '#4682B4',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" color={color} size={size} />
            ),
            title: 'Início',
          }}
        />
        <Tab.Screen
          name="List"
          component={ListScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="list" color={color} size={size} />
            ),
            title: 'Jogos',
          }}
        />
        <Tab.Screen
          name="Post"
          component={PostScreen2}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="tag" color={color} size={size} />
            ),
            title: 'Promoções',
          }}
        />
        <Tab.Screen
          name="Console"
          component={ConsoleScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="gamepad" color={color} size={size} />
            ),
            title: 'Consoles',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}