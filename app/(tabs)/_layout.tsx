import { Tabs } from 'expo-router';
import { ScanBarcode, Package } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Tara',
          tabBarIcon: ({ size, color }) => (
            <ScanBarcode size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Envanter',
          tabBarIcon: ({ size, color }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
