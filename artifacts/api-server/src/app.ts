import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware, clerkClient, getAuth } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(
    getClerkProxyHost(req) ?? "",
    process.env.CLERK_PUBLISHABLE_KEY,
  ),
})));

// The existing Vinext server asks this fixed internal service to verify the
// browser's session. No visitor-supplied identity headers are trusted.
app.get("/api/replit-auth/session", async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to your studio." });
    return;
  }
  try {
    const user = await clerkClient.users.getUser(userId);
    const primary = user.emailAddresses.find(address => address.id === user.primaryEmailAddressId);
    if (!primary || primary.verification?.status !== "verified") {
      res.status(403).json({ error: "Verify your email before entering the studio." });
      return;
    }
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    res.json({ userId: user.id, email: primary.emailAddress, fullName, displayName: fullName || user.username || primary.emailAddress });
  } catch {
    req.log.error("Unable to resolve the authenticated studio account");
    res.status(503).json({ error: "Sign-in verification is temporarily unavailable." });
  }
});

app.use("/api", router);

export default app;
