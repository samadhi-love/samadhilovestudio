import type { Metadata } from "next";
import {brand,brandDescription} from "./brand";
import { StudioErrorBoundary } from "./studio-error-boundary";
import "./globals.css";
import { CosmicChannel } from "./cosmic-channel";
import { StudioAuthProvider } from "./auth-provider";
import {headers} from "next/headers";
import {serverStorage} from "./server/storage";
import {authRequestHostname} from "./server/auth-hostname";
import "./cosmic-channel.css";
import "./studio-theme.css";
import "./radio-scenes.css";
import "./lyric-caption-templates.css";
import "./lyric-video-pro.css";
import "./av-timeline.css";
import "./genre-picker.css";
import "./workspace-palette.css";
import "./audio-controls.css";
import "./song-card.css";
import "./meditative-vibes.css";
import "./credits/credits.css";
import "./members/membership.css";
import "./song-presets.css";
import "./creator-workspace.css";
import "./mobile-studio.css";
import "./creative-play.css";
import "./cosmic-theme.css";

export const metadata: Metadata = {
  title: brand.name,
  description: brandDescription,
  openGraph:{title:brand.name,description:brandDescription,siteName:brand.name},
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const serverHostname=authRequestHostname(await headers(),serverStorage.STUDIO_PUBLIC_ORIGIN);
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/><link rel="stylesheet" precedence="studio-fonts" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"/></head><body><StudioAuthProvider serverHostname={serverHostname}><StudioErrorBoundary>{children}</StudioErrorBoundary><CosmicChannel/></StudioAuthProvider></body></html>;
}
