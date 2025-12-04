import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { savePushToken } from "./services/push-token-store";

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

export default app;
