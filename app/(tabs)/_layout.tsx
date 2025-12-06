import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";

const CANVAS = "#abd9d6" as const;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.canvas}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: CANVAS,
  },
});
