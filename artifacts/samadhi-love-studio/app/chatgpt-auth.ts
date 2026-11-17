import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeStudioReturnPath } from "./auth-return-path";
import { env } from "cloudflare:workers";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const SIGN_IN_PATH = "/sign-in";
const SIGN_OUT_PATH = "/sign-out";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const incoming = await headers();
  const cookie = incoming.get("cookie") ?? "";
  if (!/(?:^|;\s*)__session=/.test(cookie)) return null;
  // Production Workers cannot reach Replit's loopback interface. Use only the
  // configured public origin, never a visitor-selected host or redirect.
  let origin = "http://127.0.0.1:80";
  if (process.env.NODE_ENV !== "development") {
    const configured = new URL(env.STUDIO_PUBLIC_ORIGIN ?? "");
    if (configured.protocol !== "https:" || configured.username || configured.password ||
        configured.pathname !== "/" || configured.search || configured.hash) {
      throw new Error("Studio public origin is not configured.");
    }
    origin = configured.origin;
  }
  const verifiedHost = new URL(origin).host;
  const response = await fetch(origin + "/api/replit-auth/session", {
    headers: {
      cookie,
      "x-forwarded-host": process.env.NODE_ENV === "development"
        ? incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "" : verifiedHost,
      "x-forwarded-proto": "https",
    },
    cache: "no-store",
    // Workers only supports follow/manual. Never follow a redirect with cookies.
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Studio sign-in verification is unavailable.");
  const user = await response.json() as ChatGPTUser;
  if (typeof user.userId !== "string" || typeof user.email !== "string")
    throw new Error("Invalid verified studio identity.");
  return user;
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeStudioReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  // Keep the original exported name so existing studio tools need no rewrite.
  // Signing out always returns to the public home.
  return SIGN_OUT_PATH;
}
