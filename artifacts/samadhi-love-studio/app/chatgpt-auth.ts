import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeStudioReturnPath } from "./auth-return-path";

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
  // Fixed loopback proxy: credentials never go to a client-selected host.
  const response = await fetch("http://127.0.0.1:80/api/replit-auth/session", {
    headers: {
      cookie,
      "x-forwarded-host": incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "",
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
