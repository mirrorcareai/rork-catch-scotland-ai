import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: "#abd9d6" }}>
        <Slot />
      </View>
    </SafeAreaProvider>
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
