import React from "react";
import { Tabs } from "expo-router";
import { Home, MessageCircle } from "lucide-react-native";

const ACTIVE_TINT = "#15373c" as const;
const INACTIVE_TINT = "#5e7b85" as const;
const TAB_BG = "#f3f7f8" as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopColor: "#d1e0e3",
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}
