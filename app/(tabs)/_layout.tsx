import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import Colors from "@/constants/colors";

const GLOBAL_CANVAS = "#102f33" as const;

export default function TabLayout() {
  return (
    <View style={styles.canvas}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.tint,
          headerShown: false,
          tabBarStyle: styles.hiddenTabBar,
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
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenTabBar: {
    height: 0,
    borderTopWidth: 0,
    position: "absolute",
    backgroundColor: GLOBAL_CANVAS,
  },
  canvas: {
    flex: 1,
    backgroundColor: GLOBAL_CANVAS,
  },
});
