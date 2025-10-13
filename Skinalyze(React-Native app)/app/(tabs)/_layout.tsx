import { Tabs } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Fontisto from '@expo/vector-icons/Fontisto';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
export default function TabsLayout() {
  return (
    <>
      <StatusBar style="dark"/>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "coral",
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#000",
          headerTitleAlign: "center",

        }}
      >
        <Tabs.Screen
          name="profile"
          options={{ title: "Profile", tabBarIcon: ({ color }) => { return <AntDesign name="user" size={24} color={color} /> } }}
        />
        <Tabs.Screen
          name="doc"
          options={{ title: "Dermatologists", tabBarIcon: ({ color, focused }) => { return focused ? <FontAwesome6 name="user-doctor" size={24} color={color} />:<Fontisto name="doctor" size={24} color={color} />   } }}
        />
        <Tabs.Screen
          name="index"
          options={{ title: "Scan", tabBarIcon: ({ color, focused }) => { return focused ? <Ionicons name="analytics" size={24} color={color} /> : <Ionicons name="analytics-outline" size={24} color="black" /> } }}
        />
      </Tabs>
    </>
  );
}
