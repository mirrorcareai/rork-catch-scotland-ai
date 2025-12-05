import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ExternalLink, RefreshCcw } from "lucide-react-native";
import WebView from "react-native-webview";

const CHAT_URL = "https://typebot.co/catch-scotland-v2-1-2blwkou" as const;
const LOGO_URI = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/86vz17l8sg0iaq4aq58ks" as const;

function HeaderActions({ onOpenExternal, onReload, onBack }: { onOpenExternal: () => void; onReload: () => void; onBack: () => void }) {
  return (
    <View style={styles.headerActions}>
      <TouchableOpacity testID="chat-back" onPress={onBack} style={styles.iconBtn}>
        <ArrowLeft color="#111" size={18} />
      </TouchableOpacity>
      <TouchableOpacity testID="chat-reload" onPress={onReload} style={styles.iconBtn}>
        <RefreshCcw color="#111" size={18} />
      </TouchableOpacity>
      <TouchableOpacity testID="chat-open-external" onPress={onOpenExternal} style={styles.iconBtn}>
        <ExternalLink color="#111" size={18} />
      </TouchableOpacity>
    </View>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBox} testID="chat-error">
      <Text style={styles.errorTitle}>Unable to load chat</Text>
      <Text style={styles.errorMsg}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn} testID="chat-retry">
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ChatScreen() {
  const [key, setKey] = useState<number>(0);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const source = useMemo(() => ({ uri: CHAT_URL }), []);

  const openExternal = useCallback(async () => {
    try {
      console.log("[Chat] Opening external browser", { url: CHAT_URL });
      setIsOpening(true);
      await WebBrowser.openBrowserAsync(CHAT_URL);
    } catch (e) {
      console.error("[Chat] Failed to open external browser", e);
      alert("Could not open browser. Please copy and paste this link: " + CHAT_URL);
    } finally {
      setIsOpening(false);
    }
  }, []);

  const reload = useCallback(() => {
    console.log("[Chat] Reload requested");
    setLoadError(null);
    setKey((k) => k + 1);
  }, []);

  const goBackHome = useCallback(() => {
    console.log("[Chat] Back to Home requested");
    try {
      router.replace("/");
    } catch (e) {
      console.error("[Chat] Failed to navigate home", e);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log("[Chat] Focused");
      return () => console.log("[Chat] Blurred");
    }, [])
  );

  const webView = React.useMemo(() => {
    if (Platform.OS === "web") {
      return (
        <View key={`iframe-${key}`} style={styles.iframeWrap}>
          <iframe
            title="Catch Chatbot"
            src={CHAT_URL}
            style={styles.iframe as any}
            onError={() => setLoadError("The chat page could not be embedded. Use the open button.")}
          />
        </View>
      );
    }

    return (
      <WebView
        key={`wv-${key}`}
        testID="chat-webview"
        source={source}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="small" />
            <Text style={styles.loaderText}>Loading chat…</Text>
          </View>
        )}
        onError={(e: any) => {
          console.error("[Chat] WebView error", e?.nativeEvent || e);
          setLoadError("The chat failed to load inside the app.");
        }}
        onHttpError={(e: any) => {
          console.error("[Chat] HTTP error", e?.nativeEvent || e);
          setLoadError("The chat page returned an error.");
        }}
        onShouldStartLoadWithRequest={(request) => {
          console.log("[Chat] Navigation request", request.url);
          return true;
        }}
        allowsBackForwardNavigationGestures
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        style={styles.webview}
      />
    );
  }, [key, source]);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top }]} testID="chat-topbar">
        <Image source={{ uri: LOGO_URI }} style={styles.topLogo} resizeMode="contain" accessibilityLabel="Catch Scotland logo" />
        <Text style={styles.topTitle}>Catch Scotland Staff Portal</Text>
      </View>

      {loadError ? (
        <ErrorBox message={loadError} onRetry={reload} />
      ) : (
        webView
      )}

      <View style={styles.fabRow} pointerEvents="box-none">
        <HeaderActions onOpenExternal={openExternal} onReload={reload} onBack={goBackHome} />
      </View>

      {isOpening && (
        <View style={styles.openingOverlay} pointerEvents="none">
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}

const CHAT_BG = "#abd9d6" as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CHAT_BG },
  topBar: {
    minHeight: 56,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topLogo: { width: 36, height: 36 },
  topTitle: { fontSize: 14, fontWeight: "700" as const, color: "#15373c" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: "#ffffffcc" },
  webview: { flex: 1, backgroundColor: "transparent" },
  loader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  loaderText: { fontSize: 14, color: "#666" },
  errorBox: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: "#fff3f3", borderWidth: 1, borderColor: "#ffd0d0" },
  errorTitle: { fontSize: 16, fontWeight: "700" as const, color: "#b00020", marginBottom: 4 },
  errorMsg: { color: "#8a1c1c" },
  retryBtn: { marginTop: 12, alignSelf: "flex-start", backgroundColor: "#b00020", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" as const },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  fallbackText: { fontSize: 16, color: "#333", marginBottom: 12, textAlign: "center" },
  openBtn: { backgroundColor: "#007AFF", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  openBtnText: { color: "#fff", fontWeight: "700" as const },
  openingOverlay: { position: "absolute", top: 12, right: 12 },
  iframeWrap: { flex: 1 },
  iframe: { width: "100%", height: "100%", border: 0 } as const,
  fabRow: { position: "absolute", right: 12, bottom: 20, flexDirection: "row", gap: 10 },
});