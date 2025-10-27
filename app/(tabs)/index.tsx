import React, { useMemo, useRef } from "react";
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

const LOGO_URI = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/86vz17l8sg0iaq4aq58ks" as const;

// Match chatbot background from Typebot theme: #abd9d6
const CHAT_BG = "#abd9d6" as const;
const ACCENT = "#436f78" as const;

export default function HomeLoginScreen() {
  const router = useRouter();
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
      <View style={styles.centerWrap}>
        <Image
          source={{ uri: LOGO_URI }}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Catch Scotland logo"
        />

        <Text style={styles.title} testID="home-title">Catch Scotland</Text>
        <Text style={styles.subtitle} testID="home-subtitle">Staff AI Portal - Demo</Text>

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

      <View style={styles.bottomInset} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CHAT_BG },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  logo: { width: "70%", maxWidth: 340, height: Platform.select({ web: 200, default: 180 }) as number },
  title: { marginTop: 8, fontSize: 40, lineHeight: 48, fontWeight: "800" as const, color: "#15373c" },
  subtitle: { marginTop: 6, fontSize: 16, color: "#1e4d55" },
  loginBtn: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: ACCENT,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  loginText: { color: ACCENT, letterSpacing: 2, fontWeight: "800" as const },
  bottomInset: { height: 32 },
});
