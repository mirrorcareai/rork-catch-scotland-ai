import React, { useMemo, useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/75kfqijjrb5wz5fkoeeel" }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom }]}>
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
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  logoContainer: {
    paddingBottom: 25,
  },
  logo: {
    width: 340,
    height: 238,
  },
  body: {
    flex: 1,
    backgroundColor: DARK_TEAL,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: -90,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800" as const,
    color: "#ffffff",
    textAlign: "center",
  },
  loginBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderRadius: 6,
    backgroundColor: MINT,
    borderWidth: 1,
    borderColor: "#111",
  },
  loginText: { color: "#111", letterSpacing: 1, fontWeight: "800" as const },
});
