import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotifications() {
  try {
    // 1. Only real devices can get push tokens
    if (!Device.isDevice) {
      console.log('[Notifications] Skipping push registration: not running on a physical device.');
      return null;
    }

    // 2. Ask for permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Push permission not granted, skipping token registration.');
      return null;
    }

    // 3. Resolve the Expo projectId
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      null;

    if (!projectId) {
      console.warn(
        '[Notifications] Missing projectId in Constants. Skipping getExpoPushTokenAsync to avoid crash.'
      );
      return null;
    }

    // 4. Get the Expo push token with projectId
    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    console.log('[Notifications] Registered Expo push token:', token.data);
    return token.data;
  } catch (error) {
    // Use warn/log so Expo Go doesn’t treat it as a fatal error
    console.warn('[Notifications] Failed to register push notifications:', error);
    return null;
  }
}

