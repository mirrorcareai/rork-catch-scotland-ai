import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import RegisterDevice from "@/components/RegisterDevice";

interface BoundaryState {
  hasError: boolean;
  message?: string;
}

class DeviceRegisterBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  public state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): BoundaryState {
    console.error("[RegisterDeviceScreen] Uncaught error", error);
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RegisterDeviceScreen] componentDidCatch", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback} testID="register-fallback">
          <Text style={styles.fallbackTitle}>Something went wrong</Text>
          <Text style={styles.fallbackMessage}>{this.state.message ?? "Please restart the app."}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RegisterDeviceScreen() {
  return (
    <DeviceRegisterBoundary>
      <Stack.Screen
        options={{
          title: "Register Device",
          headerStyle: { backgroundColor: "#051616" },
          headerTintColor: "#f0fffd",
          headerShadowVisible: false,
        }}
      />

      <View style={styles.container} testID="register-device-screen">
        <LinearGradient
          colors={["#031010", "#0b2c2c", "#063838"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.copyBlock}>
              <Text style={styles.kicker}>Push alerts</Text>
              <Text style={styles.heading}>Register this device</Text>
              <Text style={styles.body}>
                Link your phone so rota updates, urgent bulletins, and shift reminders land instantly. Registration only takes a
                moment and keeps your notifications secure.
              </Text>
            </View>

            <RegisterDevice />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </DeviceRegisterBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  copyBlock: {
    gap: 8,
  },
  kicker: {
    color: "#7fe7d7",
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700" as const,
  },
  heading: {
    fontSize: 32,
    color: "#f6fffc",
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  body: {
    color: "#b8d6d4",
    fontSize: 15,
    lineHeight: 22,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#021010",
  },
  fallbackTitle: { fontSize: 22, fontWeight: "700" as const, color: "#fff" },
  fallbackMessage: { marginTop: 8, color: "#d2f5ef", textAlign: "center" },
});
