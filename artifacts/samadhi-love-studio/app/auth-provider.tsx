"use client";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";

const clerkPubKey = publishableKeyFromHost(
  typeof window === "undefined" ? "" : window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const origin = typeof window === "undefined" ? "" : window.location.origin;

const clerkAppearance = {
  theme: dark,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: "/",
    logoImageUrl: `${origin}/favicon.svg`,
  },
  variables: {
    colorPrimary: "#ffc5a4",
    colorPrimaryForeground: "#2b1827",
    colorForeground: "#fbf2ee",
    colorMutedForeground: "#b9aabd",
    colorDanger: "#ffb5c2",
    colorBackground: "#211925",
    colorInput: "#1b1521",
    colorInputForeground: "#fbf2ee",
    colorNeutral: "#fbf2ee",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    borderRadius: "8px",
  },
  elements: {
    rootBox: { width: "100%", maxWidth: "440px", minWidth: 0, display: "flex", justifyContent: "center" },
    cardBox: { background: "#211925", border: "1px solid #623e58", borderRadius: "16px", width: "100%", maxWidth: "440px", minWidth: 0, overflow: "hidden", boxShadow: "0 20px 70px #08050a" },
    card: { background: "transparent", boxShadow: "none", border: 0, borderRadius: 0 },
    footer: { background: "transparent", boxShadow: "none", border: 0, borderRadius: 0 },
    headerTitle: { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400, fontSize: "28px", letterSpacing: "-.03em", color: "#fbf2ee" },
    headerSubtitle: { color: "#d9cbd8" },
    socialButtonsBlockButton: { background: "#2a2030", border: "1px solid #46364b" },
    socialButtonsBlockButtonText: { color: "#fbf2ee", fontWeight: 600 },
    formFieldLabel: { color: "#d9cbd8", fontWeight: 600 },
    formFieldInput: { background: "#1b1521", border: "1px solid #49384e", color: "#fbf2ee" },
    formButtonPrimary: { background: "#ffc5a4", color: "#2b1827", fontWeight: 650, boxShadow: "none" },
    footerActionLink: { color: "#ffc49f", fontWeight: 650 },
    footerActionText: { color: "#b9aabd" },
    dividerText: { color: "#b9aabd" },
    dividerLine: { background: "#362b3c" },
    identityPreviewEditButton: { color: "#ffc49f" },
    formFieldSuccessText: { color: "#a8dcc4" },
    alert: { background: "#442b39", border: "1px solid #765269" },
    alertText: { color: "#ffd1bf" },
    otpCodeFieldInput: { background: "#1b1521", color: "#fbf2ee", borderColor: "#49384e" },
    logoBox: { height: "44px" },
    logoImage: { height: "44px", width: "44px" },
  },
};

export function StudioAuthProvider({ children }: { children: ReactNode }) {
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
        signIn: { start: { title: "Welcome back", subtitle: "Sign in for your songs and lyric videos." } },
        signUp: { start: { title: "Create your Studio account", subtitle: "Free to start. Write, record and release from one place." } },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export default StudioAuthProvider;
