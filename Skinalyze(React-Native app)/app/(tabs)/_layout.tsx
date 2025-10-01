import { Tabs } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
export default function TabsLayout() {
  return (

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
        options={{ title: "Profile", tabBarIcon:({color}) =>{return <AntDesign name="user" size={24} color={color} />} }}
      />
      <Tabs.Screen
        name="index"
        options={{ title: "Scan", tabBarIcon: ({ color, focused }) => { return focused ? <Ionicons name="analytics" size={24} color={color} /> : <Ionicons name="analytics-outline" size={24} color="black" /> } }}
      />
    </Tabs>
  );
}
