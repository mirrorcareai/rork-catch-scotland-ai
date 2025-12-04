import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { getAllPushDevices, savePushToken } from "./services/push-token-store";

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.post("/push/register", async (c) => {
  try {
    const body = await c.req.json<{ phone?: string; token?: string }>();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!phone || !token) {
      return c.json({ success: false, message: "phone and token are required" }, 400);
    }
    await savePushToken(phone, token);
    console.log(`Registered push token for ${phone}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to register push token", error);
    return c.json({ success: false, message: "Unable to register push token" }, 500);
  }
});

app.get("/admin/devices", async (c) => {
  try {
    const devices = await getAllPushDevices();
    return c.json({ devices });
  } catch (error) {
    console.error("Failed to load devices", error);
    return c.json({ devices: [], message: "Unable to load devices" }, 500);
  }
});

app.post("/admin/send-push", async (c) => {
  try {
    const body = await c.req.json<{ token?: string; title?: string; message?: string }>();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!token || !title || !message) {
      return c.json({ success: false, message: "token, title, and message are required" }, 400);
    }

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        title,
        body: message,
        sound: "default",
        priority: "high",
      }),
    });

    const payload = (await expoResponse.json()) as Record<string, unknown>;
    const hasError = !expoResponse.ok || (Array.isArray(payload.errors) && payload.errors.length > 0);

    if (hasError) {
      const errorMessage = Array.isArray(payload.errors) && payload.errors[0]?.message ? (payload.errors[0] as { message: string }).message : "Failed to send notification";
      console.error("Expo push error", payload);
      return c.json({ success: false, message: errorMessage }, 502);
    }

    return c.json({ success: true, ticket: payload.data ?? payload });
  } catch (error) {
    console.error("Failed to send push notification", error);
    return c.json({ success: false, message: "Unable to send notification" }, 500);
  }
});

export default app;
