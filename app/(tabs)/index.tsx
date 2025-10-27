import React, { useMemo, useRef } from "react";
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOGO_URI = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/1jted3w11djg8r5b9t2fn" as const;

// New palette to match the provided mock
const DARK_TEAL = "#3f6b71" as const; // main background for body
const MINT = "#cfeae5" as const; // button background

export default function HomeLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };

  const pressStyle = useMemo(() => [{ transform: [{ scale }] }], [scale]);

  const goLogin = () => {
    console.log("[Home] Login pressed");
    router.push("/chat");
  };

  return (
    <View style={styles.container} testID="home-container">
      <View style={[styles.topWhite, { paddingTop: insets.top }]} testID="home-hero">
        <Image
          source={{ uri: LOGO_URI }}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Catch Scotland logo"
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} testID="home-title">Catch Scotland{"\n"}Staff Portal</Text>

        <Animated.View style={pressStyle}>
          <TouchableOpacity
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={goLogin}
            style={styles.loginBtn}
            activeOpacity={0.8}
            testID="home-login-btn"
          >
            <Text style={styles.loginText}>LOGIN</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_TEAL },
  topWhite: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  logo: {
    width: "70%",
    maxWidth: 360,
    height: Platform.select({ web: 220, default: 200 }) as number,
    marginTop: 12,
    marginBottom: 8,
  },
  body: {
    flex: 1,
    backgroundColor: DARK_TEAL,
    alignItems: "center",
    paddingTop: 16,
  },
  title: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800" as const,
    color: "#ffffff",
    textAlign: "center",
  },
  loginBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderRadius: 6,
    backgroundColor: MINT,
    borderWidth: 1,
    borderColor: "#111",
  },
  loginText: { color: "#111", letterSpacing: 1, fontWeight: "800" as const },
});
