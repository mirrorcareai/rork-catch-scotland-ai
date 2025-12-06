import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyRound, PhoneCall } from "lucide-react-native";

interface AdminAuthProps {
  onAuthenticated: () => void;
  apiBaseUrl: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

type Stage = "enter" | "verify";

export default function AdminAuth({ onAuthenticated, apiBaseUrl }: AdminAuthProps) {
  const [phone, setPhone] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [stage, setStage] = useState<Stage>("enter");
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Enter your admin phone number to receive a secure PIN");
  const buttonScale = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetLoading = useCallback((value: boolean) => {
    if (!isMountedRef.current) {
      console.log("[AdminAuth] Skipping setLoading, component unmounted");
      return;
    }
    setLoading(value);
  }, [setLoading]);

  const safeSetStatusMessage = useCallback((value: string) => {
    if (!isMountedRef.current) {
      console.log("[AdminAuth] Skipping setStatusMessage, component unmounted");
      return;
    }
    setStatusMessage(value);
  }, [setStatusMessage]);

  const safeSetStage = useCallback((value: Stage) => {
    if (!isMountedRef.current) {
      console.log("[AdminAuth] Skipping setStage, component unmounted");
      return;
    }
    setStage(value);
  }, [setStage]);

  const ensureApiBaseUrl = useCallback(() => {
    if (!apiBaseUrl) {
      console.warn("[AdminAuth] Missing apiBaseUrl prop");
      Alert.alert("Configuration error", "API base URL is not configured.");
      return false;
    }
    return true;
  }, [apiBaseUrl]);

  const parseResponse = useCallback(async (response: Response) => {
    let payload: ApiResponse = { success: false };
    try {
      payload = (await response.json()) as ApiResponse;
    } catch (error) {
      console.error("[AdminAuth] Failed to parse response JSON", error);
    }
    return payload;
  }, []);

  const animateButton = useCallback(
    (toValue: number) => {
      Animated.spring(buttonScale, {
        toValue,
        useNativeDriver: true,
        speed: 18,
        bounciness: 8,
      }).start();
    },
    [buttonScale],
  );

  const handleRequestPin = useCallback(async () => {
    if (!ensureApiBaseUrl()) return;
    const trimmed = phone.trim();
    if (trimmed.length < 6) {
      Alert.alert("Invalid phone", "Please enter a valid phone number.");
      return;
    }

    console.log("[AdminAuth] Requesting PIN for", trimmed);
    safeSetLoading(true);
    safeSetStatusMessage("Sending secure PIN to your device…");

    try {
      const res = await fetch(`${apiBaseUrl}/admin/request-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await parseResponse(res);
      if (res.ok && data.success) {
        safeSetStage("verify");
        safeSetStatusMessage("PIN sent. Please check your messages and enter the code below.");
      } else {
        console.warn("[AdminAuth] request-pin failed", data);
        Alert.alert("Error", data.message ?? "Unable to send PIN.");
        safeSetStatusMessage("Failed to send PIN. Please double-check your phone number and try again.");
      }
    } catch (error) {
      console.error("[AdminAuth] request-pin network error", error);
      Alert.alert("Error", "Something went wrong while requesting the PIN.");
      safeSetStatusMessage("Network error. Please try again in a moment.");
    } finally {
      safeSetLoading(false);
    }
  }, [apiBaseUrl, ensureApiBaseUrl, parseResponse, phone, safeSetLoading, safeSetStage, safeSetStatusMessage]);

  const handleVerifyPin = useCallback(async () => {
    if (!ensureApiBaseUrl()) return;
    const trimmedPhone = phone.trim();
    const trimmedPin = pin.trim();
    if (trimmedPin.length < 4) {
      Alert.alert("Invalid PIN", "Please enter the 4-digit PIN sent to you.");
      return;
    }

    console.log("[AdminAuth] Verifying PIN for", trimmedPhone);
    safeSetLoading(true);
    safeSetStatusMessage("Verifying credentials…");

    try {
      const res = await fetch(`${apiBaseUrl}/admin/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmedPhone, pin: trimmedPin }),
      });
      const data = await parseResponse(res);
      if (res.ok && data.success) {
        console.log("[AdminAuth] PIN verified successfully");
        safeSetStatusMessage("Authenticated! Loading admin tools…");
        onAuthenticated();
      } else {
        console.warn("[AdminAuth] verify-pin failed", data);
        Alert.alert("Error", data.message ?? "PIN verification failed.");
        safeSetStatusMessage("PIN verification failed. Please try again.");
      }
    } catch (error) {
      console.error("[AdminAuth] verify-pin network error", error);
      Alert.alert("Error", "Something went wrong while verifying the PIN.");
      safeSetStatusMessage("Network error. Please try again in a moment.");
    } finally {
      safeSetLoading(false);
    }
  }, [apiBaseUrl, ensureApiBaseUrl, onAuthenticated, parseResponse, phone, pin, safeSetLoading, safeSetStatusMessage]);

  const buttonLabel = useMemo(() => {
    if (loading) {
      return "Please wait…";
    }
    return stage === "enter" ? "Send Code" : "Verify";
  }, [loading, stage]);

  const disabled = useMemo(() => {
    if (loading) return true;
    if (stage === "enter") {
      return phone.trim() === "";
    }
    return phone.trim() === "" || pin.trim() === "";
  }, [loading, phone, pin, stage]);

  return (
    <View style={styles.container} testID="admin-auth-root">
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <PhoneCall color="#0f1f1f" size={22} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Admin Access</Text>
            <Text style={styles.subtitle}>Securely authenticate with your phone number and one-time PIN.</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. +1 555 010 2233"
            placeholderTextColor="#7b8d90"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={stage === "enter"}
            textContentType="telephoneNumber"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={stage === "enter" ? handleRequestPin : undefined}
            testID="admin-auth-phone-input"
          />
        </View>

        {stage === "verify" && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PIN code</Text>
            <TextInput
              style={styles.input}
              placeholder="4-digit PIN"
              placeholderTextColor="#7b8d90"
              keyboardType="number-pad"
              value={pin}
              onChangeText={setPin}
              maxLength={6}
              textContentType="oneTimeCode"
              returnKeyType="done"
              onSubmitEditing={handleVerifyPin}
              testID="admin-auth-pin-input"
            />
          </View>
        )}

        <View style={styles.statusPill}>
          <KeyRound color="#0f1f1f" size={18} />
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, disabled ? styles.buttonDisabled : null]}
            onPressIn={() => animateButton(0.97)}
            onPressOut={() => animateButton(1)}
            onPress={stage === "enter" ? handleRequestPin : handleVerifyPin}
            disabled={disabled}
            testID="admin-auth-submit-button"
          >
            {loading ? <ActivityIndicator color="#0f1f1f" /> : <Text style={styles.buttonLabel}>{buttonLabel}</Text>}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f0f5f6",
  },
  card: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "#ffffff",
    gap: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: "#e4f6f3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#0f1f1f",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#516869",
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontWeight: "700" as const,
    color: "#314344",
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cdd9db",
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 14, android: 10, default: 12 }),
    fontSize: 16,
    color: "#0f1f1f",
    backgroundColor: "#f8fbfb",
  },
  statusPill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d4e7e3",
    padding: 14,
    backgroundColor: "#ecf7f4",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusText: {
    flex: 1,
    color: "#1f2f2f",
    fontSize: 14,
    lineHeight: 20,
  },
  buttonWrapper: {
    alignSelf: "stretch",
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    backgroundColor: "#8de0cf",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0f1f1f",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "800" as const,
    letterSpacing: 0.8,
    color: "#0f1f1f",
  },
});
