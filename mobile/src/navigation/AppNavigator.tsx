import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ReportsScreen from '../screens/ReportsScreen';
import WeatherImpactScreen from '../screens/WeatherImpactScreen';
import MapPreviewScreen from '../screens/MapPreviewScreen';
import PipelineScreen from '../screens/PipelineScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0f172a',
          },
          headerTintColor: '#f8fafc',
          headerTitleStyle: {
            fontWeight: '700',
          },
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
          },
          tabBarActiveTintColor: '#38bdf8',
          tabBarInactiveTintColor: '#94a3b8',
          sceneStyle: {
            backgroundColor: '#0f172a',
          },
        }}
      >
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="Weather" component={WeatherImpactScreen} />
        <Tab.Screen name="Map" component={MapPreviewScreen} />
        <Tab.Screen name="Pipeline" component={PipelineScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
