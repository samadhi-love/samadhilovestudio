"use client";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import {brand} from "./brand";

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const origin = typeof window === "undefined" ? "" : window.location.origin;

const display = '"Syne", "Space Grotesk", ui-sans-serif, system-ui, sans-serif';
const clerkAppearance = {
  theme: dark,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: "/",
    logoImageUrl: `${origin}/favicon.svg`,
  },
  variables: {
    colorPrimary: "#a77bff",
    colorPrimaryForeground: "#0b0820",
    colorForeground: "#eef1ff",
    colorMutedForeground: "#c9cdf0",
    colorDanger: "#ff9fc8",
    colorBackground: "#0e0c24",
    colorInput: "#100d2b",
    colorInputForeground: "#eef1ff",
    colorNeutral: "#eef1ff",
    fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    borderRadius: "14px",
  },
  elements: {
    rootBox: { width: "100%", maxWidth: "440px", minWidth: 0, display: "flex", justifyContent: "center" },
    cardBox: { background: "linear-gradient(160deg, rgba(22,17,54,.92), rgba(9,7,26,.94))", border: "1px solid rgba(167,123,255,.32)", borderRadius: "26px", width: "100%", maxWidth: "100%", minWidth: 0, overflow: "hidden", boxShadow: "0 30px 90px rgba(4,3,13,.8), inset 0 1px 0 rgba(255,255,255,.06)" },
    card: { background: "transparent", boxShadow: "none", border: 0, borderRadius: 0, width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" as const, padding: "clamp(20px, 5vw, 32px)" },
    footer: { background: "rgba(167,123,255,.06)", boxShadow: "none", border: 0, borderRadius: 0 },
    headerTitle: { fontFamily: display, fontWeight: 800, fontSize: "26px", letterSpacing: "-.02em", color: "#eef1ff" },
    headerSubtitle: { color: "#c9cdf0" },
    socialButtonsBlockButton: { background: "rgba(127,233,255,.06)", border: "1px solid rgba(127,233,255,.24)", borderRadius: "999px", "&:hover": { background: "rgba(127,233,255,.12)" } },
    socialButtonsBlockButtonText: { color: "#eef1ff", fontWeight: 600 },
    formFieldLabel: { color: "#c9cdf0", fontWeight: 600 },
    formFieldInput: { background: "#100d2b", border: "1px solid rgba(167,123,255,.34)", color: "#eef1ff", borderRadius: "12px", "&::placeholder": { color: "#8d92bf", opacity: 1 } },
    formButtonPrimary: { background: "linear-gradient(100deg, #7fe9ff, #a77bff 55%, #ff5fd2)", color: "#0b0820", fontWeight: 700, borderRadius: "999px", boxShadow: "none", textTransform: "none" as const, letterSpacing: ".01em", "&:hover": { filter: "brightness(1.08)" } },
    footerActionLink: { color: "#7fe9ff", fontWeight: 650 },
    footerActionText: { color: "#c9cdf0" },
    dividerText: { color: "#a9afd8" },
    dividerLine: { background: "rgba(167,123,255,.22)" },
    identityPreviewEditButton: { color: "#7fe9ff" },
    formFieldSuccessText: { color: "#9ff0d4" },
    alert: { background: "rgba(255,95,210,.1)", border: "1px solid rgba(255,95,210,.4)" },
    alertText: { color: "#ffd6f1" },
    otpCodeFieldInput: { background: "#100d2b", color: "#eef1ff", borderColor: "rgba(167,123,255,.4)" },
    logoBox: { height: "44px" },
    logoImage: { height: "44px", width: "44px" },
  },
};

export function StudioAuthProvider({ children,serverHostname }: { children: ReactNode;serverHostname:string }) {
  // Client components are also evaluated during server rendering. Resolve per
  // render, using the trusted server hostname instead of inventing an empty one.
  const clerkPubKey = publishableKeyFromHost(
    typeof window === "undefined" ? serverHostname : window.location.hostname,
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  );
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/creator"
      signUpFallbackRedirectUrl="/creator"
      afterSignOutUrl="/"
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: brand.slogan } },
        signUp: { start: { title: "Create your free account", subtitle: brand.slogan } },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export default StudioAuthProvider;
