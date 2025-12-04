import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, Smartphone } from "lucide-react-native";
import { registerForPushNotifications } from "@/lib/notifications";
import { getApiBaseUrl } from "@/lib/trpc";

interface RegisterDeviceProps {
  phone?: string;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
}

export default function RegisterDevice({ phone }: RegisterDeviceProps) {
  const [phoneInput, setPhoneInput] = useState<string>(phone ?? "");
  const [token, setToken] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("Ready to register your device");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRequestingToken, setIsRequestingToken] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const registerMutation = useMutation({
    mutationFn: async ({ phoneNumber, expoToken }: { phoneNumber: string; expoToken: string }) => {
      const response = await fetch(`${apiBaseUrl}/push/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, token: expoToken }),
      });

      let payload: RegisterResponse = { success: false };
      try {
        payload = (await response.json()) as RegisterResponse;
      } catch (error) {
        console.error("[RegisterDevice] Failed to parse response", error);
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to register device right now");
      }

      return payload;
    },
    onSuccess: () => {
      setStatusType("success");
      setStatusMessage("Device registered for alerts.");
    },
    onError: () => {
      setStatusType("error");
      setStatusMessage("Registration failed. Please try again.");
    },
  });

  const { mutateAsync, isPending, isSuccess } = registerMutation;

  const shortToken = useMemo(() => {
    if (!token) return null;
    if (token.length <= 16) return token;
    return `${token.slice(0, 9)}…${token.slice(-6)}`;
  }, [token]);

  const isBusy = isRequestingToken || isPending;

  const animateButton = useCallback(
    (toValue: number) => {
      Animated.spring(buttonScale, {
        toValue,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
    },
    [buttonScale]
  );

  const handleSubmit = useCallback(async () => {
    if (isBusy) {
      console.log("[RegisterDevice] Ignoring submit while busy");
      return;
    }

    const trimmed = phoneInput.trim();
    if (trimmed.length < 6) {
      setErrorMessage("Please enter a valid phone number");
      return;
    }

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn("[RegisterDevice] Haptics selection failed", error);
    }

    Keyboard.dismiss();
    setErrorMessage(null);
    setPermissionDenied(false);
    setStatusType("idle");
    setStatusMessage("Requesting push notification permission…");
    setIsRequestingToken(true);

    let mutationStarted = false;

    try {
      console.log("[RegisterDevice] Requesting push token for", trimmed);
      const expoToken = await registerForPushNotifications();

      if (!expoToken) {
        setPermissionDenied(true);
        setStatusType("error");
        setStatusMessage("Push permissions are required to register this device");
        throw new Error("Push permissions are required to register this device");
      }

      setToken(expoToken);
      setStatusMessage("Registering device with Catch Scotland servers…");
      console.log("[RegisterDevice] Sending token to backend");
      mutationStarted = true;
      await mutateAsync({ phoneNumber: trimmed, expoToken });

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.warn("[RegisterDevice] Haptics success failed", error);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setErrorMessage(message);
      if (!mutationStarted) {
        setStatusType("error");
        setStatusMessage(message);
      }
      console.error("[RegisterDevice] Registration error", error);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (hapticsError) {
        console.warn("[RegisterDevice] Haptics error failed", hapticsError);
      }
    } finally {
      setIsRequestingToken(false);
    }
  }, [isBusy, mutateAsync, phoneInput]);

  const buttonLabel = isSuccess ? "Re-register device" : "Register device";

  return (
    <View style={styles.card} testID="register-device-card">
      <View style={styles.cardHeader}>
        <ShieldCheck color="#0f1f1f" size={28} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.title} testID="register-title">
            Secure this device
          </Text>
          <Text style={styles.subtitle}>Enter your phone number to link this device for push notifications.</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Phone number</Text>
        <TextInput
          testID="register-phone-input"
          value={phoneInput}
          onChangeText={setPhoneInput}
          placeholder="e.g. +44 7123 456789"
          placeholderTextColor="#7a8f8f"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          style={styles.input}
          autoCapitalize="none"
          importantForAutofill="yes"
        />
      </View>

      {errorMessage && (
        <View style={styles.errorBox} testID="register-error">
          <Text style={styles.errorText}>{errorMessage}</Text>
          {permissionDenied && <Text style={styles.errorHint}>Please enable push notifications in your device settings and try again.</Text>}
        </View>
      )}

      <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]} testID="register-button-wrapper">
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.button, isBusy ? styles.buttonDisabled : null]}
          onPressIn={() => animateButton(0.97)}
          onPressOut={() => animateButton(1)}
          onPress={handleSubmit}
          disabled={isBusy}
          testID="register-submit-btn"
        >
          {isBusy ? (
            <ActivityIndicator color="#0f1f1f" />
          ) : (
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.statusBox} testID="register-status-box">
        <View style={styles.statusHeader}>
          <Smartphone color="#0f1f1f" size={18} />
          <Text style={styles.statusLabel}>Status</Text>
        </View>
        <Text
          style={[
            styles.statusMessage,
            statusType === "success" ? styles.statusSuccess : null,
            statusType === "error" ? styles.statusError : null,
          ]}
        >
          {statusMessage}
        </Text>
        {token && (
          <View style={styles.tokenPill} testID="register-token-pill">
            <Text style={styles.tokenLabel}>Expo push token</Text>
            <Text style={styles.tokenValue}>{shortToken}</Text>
            <Text style={styles.tokenMeta}>{Platform.select({ ios: "iOS", android: "Android", web: "Web" })}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 28,
    padding: 24,
    backgroundColor: "#f7fbfb",
    gap: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  headerTextWrap: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#082122",
  },
  subtitle: {
    marginTop: 4,
    color: "#446162",
    fontSize: 14,
    lineHeight: 20,
  },
  fieldGroup: { gap: 8 },
  label: {
    fontSize: 13,
    letterSpacing: 0.4,
    color: "#365354",
    textTransform: "uppercase",
    fontWeight: "700" as const,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c6d8d8",
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 14, android: 10, default: 12 }),
    fontSize: 16,
    color: "#0b2425",
    backgroundColor: "#fff",
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ffb4b4",
    padding: 14,
    backgroundColor: "#fff5f5",
    gap: 6,
  },
  errorText: { color: "#b32727", fontWeight: "700" as const },
  errorHint: { color: "#b32727", fontSize: 13, lineHeight: 18 },
  buttonWrapper: { alignSelf: "stretch" },
  button: {
    borderRadius: 18,
    backgroundColor: "#9ae5d6",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#082122",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: "#082122",
    letterSpacing: 0.8,
  },
  statusBox: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#e7f4f2",
    borderWidth: 1,
    borderColor: "#c6e3df",
    gap: 10,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusLabel: {
    fontWeight: "700" as const,
    fontSize: 14,
    color: "#0f1f1f",
    textTransform: "uppercase",
  },
  statusMessage: {
    color: "#1f3535",
    fontSize: 15,
    lineHeight: 20,
  },
  statusSuccess: {
    color: "#0b4c3e",
  },
  statusError: {
    color: "#b32727",
  },
  tokenPill: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d5ebea",
    gap: 4,
  },
  tokenLabel: {
    fontSize: 12,
    color: "#426160",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700" as const,
  },
  tokenValue: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#082122",
  },
  tokenMeta: {
    fontSize: 13,
    color: "#537070",
  },
});
