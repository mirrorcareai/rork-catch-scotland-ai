export interface PushDevice {
  phone: string;
  token: string;
  registeredAt: number;
}

const pushTokenStore = new Map<string, PushDevice>();

export const savePushToken = async (phone: string, token: string) => {
  pushTokenStore.set(token, {
    phone,
    token,
    registeredAt: Date.now(),
  });
};

export const getPushToken = async (phone: string) => {
  for (const device of pushTokenStore.values()) {
    if (device.phone === phone) {
      return device.token;
    }
  }
  return undefined;
};

export const getAllPushDevices = async (): Promise<PushDevice[]> => {
  return Array.from(pushTokenStore.values()).sort((a, b) => b.registeredAt - a.registeredAt);
};
