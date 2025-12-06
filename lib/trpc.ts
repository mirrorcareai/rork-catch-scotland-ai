import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import Constants from "expo-constants";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

const DEFAULT_FALLBACK_URL = "https://example.invalid" as const;

type ExtraConfig = { apiBaseUrl?: string; rorkApiBaseUrl?: string } | undefined;

export const trpc = createTRPCReact<AppRouter>();

const readExtraBaseUrl = () => {
  const extra = Constants.expoConfig?.extra as ExtraConfig;
  if (!extra) {
    return undefined;
  }
  if (typeof extra.apiBaseUrl === "string" && extra.apiBaseUrl.length > 0) {
    return extra.apiBaseUrl;
  }
  if (typeof extra.rorkApiBaseUrl === "string" && extra.rorkApiBaseUrl.length > 0) {
    return extra.rorkApiBaseUrl;
  }
  return undefined;
};

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  const extraUrl = readExtraBaseUrl();
  if (extraUrl) {
    return extraUrl;
  }

  console.warn("[trpc] Missing EXPO_PUBLIC_RORK_API_BASE_URL; using placeholder URL until configured");
  return DEFAULT_FALLBACK_URL;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getApiBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
