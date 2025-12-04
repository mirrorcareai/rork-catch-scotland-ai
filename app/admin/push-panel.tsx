import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BellRing, CheckCircle2, Loader2, RefreshCw, Send, ShieldCheck, Smartphone } from "lucide-react-native";
import { getApiBaseUrl } from "@/lib/trpc";

interface PushDevice {
  phone: string;
  token: string;
  registeredAt: number;
}

interface SendPayload {
  token: string;
  title: string;
  message: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

const fetchDevices = async (): Promise<PushDevice[]> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/devices`);
  if (!response.ok) {
    throw new Error("Failed to load devices");
  }
  const payload = (await response.json()) as { devices?: PushDevice[] };
  return payload.devices ?? [];
};

export default function AdminPushPanelScreen() {
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | "info">("info");
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  const {
    data: devices = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin", "devices"],
    queryFn: fetchDevices,
  });

  const {
    mutateAsync: sendPushAsync,
    isPending: isSending,
    variables: lastVariables,
  } = useMutation({
    mutationFn: async (payload: SendPayload) => {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/send-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as ApiResponse;
      if (!response.ok || !json.success) {
        throw new Error(json.message ?? "Failed to send notification");
      }
      return json;
    },
  });

  const animatePanel = useCallback(
    (toValue: number) => {
      Animated.spring(sendButtonScale, {
        toValue,
        useNativeDriver: true,
        speed: 18,
        bounciness: 7,
      }).start();
    },
    [sendButtonScale]
  );

  const handleSend = useCallback(
    async (token: string) => {
      if (!title.trim() || !message.trim()) {
        setFormError("Enter both a title and message first");
        return;
      }

      setFormError(null);
      setStatusMessage(null);
      try {
        console.log("[AdminPushPanel] Sending push", token);
        await sendPushAsync({ token, title: title.trim(), message: message.trim() });
        setStatusTone("success");
        setStatusMessage("Notification sent successfully");
      } catch (error) {
        setStatusTone("error");
        const errorMessage = error instanceof Error ? error.message : "Failed to send notification";
        setStatusMessage(errorMessage);
        console.error("[AdminPushPanel] Send error", error);
      }
    },
    [message, sendPushAsync, title]
  );

  const isSendingToToken = useCallback(
    (token: string) => {
      if (!lastVariables) return false;
      return isSending && lastVariables.token === token;
    },
    [isSending, lastVariables]
  );

  const lastUpdated = useMemo(() => {
    if (devices.length === 0) return null;
    const newest = devices[0]?.registeredAt;
    if (!newest) return null;
    const date = new Date(newest);
    return date.toLocaleString();
  }, [devices]);

  const renderDevice = (device: PushDevice) => {
    const shortToken = `${device.token.slice(0, 12)}…${device.token.slice(-6)}`;
    const sending = isSendingToToken(device.token);

    return (
      <View key={device.token} style={styles.deviceCard} testID="admin-device-card">
        <View style={styles.deviceHeader}>
          <View style={styles.deviceIconWrap}>
            <Smartphone color="#0f1f1f" size={18} />
          </View>
          <View style={styles.deviceMeta}>
            <Text style={styles.devicePhone}>{device.phone || "Unknown"}</Text>
            <Text style={styles.deviceToken}>{shortToken}</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.deviceButton, sending && styles.deviceButtonDisabled]}
          onPress={() => handleSend(device.token)}
          disabled={sending || !title.trim() || !message.trim()}
          testID="admin-send-device-btn"
        >
          {sending ? <ActivityIndicator color="#041414" /> : <Send color="#041414" size={16} />}            
          <Text style={styles.deviceButtonText}>{sending ? "Sending" : "Send test"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.root} testID="admin-push-screen">
      <Stack.Screen
        options={{
          title: "Push Control",
          headerStyle: { backgroundColor: "#031112" },
          headerTintColor: "#e9fffa",
          headerShadowVisible: false,
        }}
      />
      <LinearGradient
        colors={["#031112", "#062728", "#0b3535"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#8ffff0" />}
      >
        <Animated.View style={[styles.panel, { transform: [{ scale: sendButtonScale }] }]} testID="admin-form">
          <TouchableOpacity
            activeOpacity={0.95}
            onPressIn={() => animatePanel(0.985)}
            onPressOut={() => animatePanel(1)}
            disabled
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.panelHeader}>
            <ShieldCheck color="#0c2223" size={28} />
            <View>
              <Text style={styles.panelTitle}>Compose notification</Text>
              <Text style={styles.panelSubtitle}>Write a title & message, then send a quick test.</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notification title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Wellbeing Reminder"
              placeholderTextColor="#5b6b6b"
              style={styles.input}
              testID="admin-title-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message body</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Don't forget to check in before your shift"
              placeholderTextColor="#5b6b6b"
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="admin-message-input"
            />
          </View>

          {formError && (
            <View style={[styles.statusStrip, styles.statusError]} testID="admin-form-error">
              <BellRing color="#3b0c0c" size={16} />
              <Text style={styles.statusText}>{formError}</Text>
            </View>
          )}

          {statusMessage && (
            <View
              style={[
                styles.statusStrip,
                statusTone === "success" ? styles.statusSuccess : statusTone === "error" ? styles.statusError : styles.statusInfo,
              ]}
              testID="admin-status"
            >
              {statusTone === "success" ? <CheckCircle2 color="#0e2a0f" size={16} /> : statusTone === "error" ? <BellRing color="#3b0c0c" size={16} /> : <Loader2 color="#0c2333" size={16} />}
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.devicesSection} testID="admin-device-section">
          <View style={styles.devicesHeader}>
            <Text style={styles.devicesTitle}>Registered devices</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()} testID="admin-refresh-btn">
              <RefreshCw color="#031112" size={16} />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {lastUpdated && <Text style={styles.timestamp}>Updated {lastUpdated}</Text>}

          {isLoading && (
            <View style={styles.loaderRow} testID="admin-device-loading">
              <ActivityIndicator color="#9fe7da" />
              <Text style={styles.loaderText}>Loading devices…</Text>
            </View>
          )}

          {!isLoading && devices.length === 0 && (
            <View style={styles.emptyState} testID="admin-empty">
              <Text style={styles.emptyTitle}>No devices registered yet</Text>
              <Text style={styles.emptyBody}>Ask teammates to register their device from the home screen.</Text>
            </View>
          )}

          {devices.map(renderDevice)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  panel: {
    backgroundColor: "#f9fffd",
    borderRadius: 28,
    padding: 24,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  panelHeader: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#031112",
  },
  panelSubtitle: {
    marginTop: 4,
    color: "#476060",
    fontSize: 14,
  },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#3c5757",
    fontWeight: "700",
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#c5dfdb",
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: "#031112",
    backgroundColor: "#fff",
  },
  textarea: {
    minHeight: 110,
  },
  statusStrip: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusSuccess: {
    backgroundColor: "#e1f7e6",
    borderColor: "#8cd7a0",
    borderWidth: 1,
  },
  statusError: {
    backgroundColor: "#ffe8e8",
    borderColor: "#ffbdbd",
    borderWidth: 1,
  },
  statusInfo: {
    backgroundColor: "#e5f1ff",
    borderColor: "#b4d4ff",
    borderWidth: 1,
  },
  devicesSection: {
    backgroundColor: "#052525",
    borderRadius: 32,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "#0e3c3d",
  },
  devicesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  devicesTitle: {
    color: "#e7fffb",
    fontSize: 20,
    fontWeight: "800",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#9fe7da",
  },
  refreshText: {
    fontWeight: "700",
    color: "#031112",
  },
  timestamp: {
    color: "#7dd3c9",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loaderText: {
    color: "#e7fffb",
    fontWeight: "600",
  },
  emptyState: {
    borderRadius: 20,
    borderStyle: "dashed",
    borderColor: "#1a4a4a",
    borderWidth: 1,
    padding: 20,
    backgroundColor: "#063232",
    gap: 4,
  },
  emptyTitle: {
    color: "#e7fffb",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyBody: {
    color: "#a9cfc8",
    fontSize: 14,
  },
  deviceCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#083737",
    gap: 16,
    borderWidth: 1,
    borderColor: "#0e4d4d",
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#9fe7da",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceMeta: { flex: 1 },
  devicePhone: {
    color: "#f4fffd",
    fontWeight: "700",
    fontSize: 16,
  },
  deviceToken: {
    color: "#a7cbc3",
    fontSize: 12,
    marginTop: 2,
  },
  deviceButton: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: "#cfeee6",
  },
  deviceButtonDisabled: {
    opacity: 0.65,
  },
  deviceButtonText: {
    fontWeight: "700",
    color: "#031112",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});
