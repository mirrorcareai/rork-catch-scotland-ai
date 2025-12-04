const pushTokenStore = new Map<string, string>();

export const savePushToken = async (phone: string, token: string) => {
  pushTokenStore.set(phone, token);
};

export const getPushToken = async (phone: string) => {
  return pushTokenStore.get(phone);
};
