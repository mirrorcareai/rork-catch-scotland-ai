import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      console.log("[Notifications] Push tokens are unavailable on web");
      return null;
    }

    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;

    if (status !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status;
    }

    if (status !== "granted") {
      console.log("[Notifications] Permission denied");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    console.log("[Notifications] Expo push token", token.data);
    return token.data;
  } catch (error) {
    console.error("[Notifications] Failed to register", error);
    return null;
  }
}

export function useRegisterPushNotifications(onToken?: (token: string | null) => void) {
  useEffect(() => {
    let isMounted = true;

    registerForPushNotifications().then((token) => {
      if (!isMounted) return;
      onToken?.(token);
    });

    return () => {
      isMounted = false;
    };
  }, [onToken]);
}
