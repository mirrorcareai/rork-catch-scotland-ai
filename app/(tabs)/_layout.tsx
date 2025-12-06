import { Tabs } from "expo-router";
import React from "react";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          // No icon to keep the bar visually hidden across platforms
        }}
      />
      {/* chat route remains accessible but is not a tab */}
    </Tabs>
  );
}
