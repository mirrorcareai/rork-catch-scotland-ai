import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    console.log("[Notifications] Starting push registration flow");

    if (!Device.isDevice) {
      console.warn("[Notifications] Push notifications require a physical device");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log("[Notifications] Existing permission status", existingStatus);

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("[Notifications] Requested permission status", status);
    }

    if (finalStatus !== "granted") {
      console.warn("[Notifications] Push permission not granted, aborting registration");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
      });
      console.log("[Notifications] Android notification channel configured");
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      null;

    if (!projectId) {
      console.warn("[Notifications] Missing projectId in Constants. Skipping token fetch to avoid crash.");
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[Notifications] Received Expo push token", token.data);
    return token.data;
  } catch (error) {
    console.warn("[Notifications] Failed to register push notifications", error);
    return null;
  }
}
