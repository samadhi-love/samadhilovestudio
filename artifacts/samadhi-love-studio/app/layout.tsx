import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SAMADHI LOVE Studio",
  description: "A private creative workspace for original music, from first frequency to release.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const serverHostname=authRequestHostname(await headers(),serverStorage.STUDIO_PUBLIC_ORIGIN);
  return <html lang="en"><body><StudioAuthProvider serverHostname={serverHostname}><StudioErrorBoundary>{children}</StudioErrorBoundary><CosmicChannel/></StudioAuthProvider></body></html>;
}
