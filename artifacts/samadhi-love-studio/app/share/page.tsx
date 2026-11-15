import type { Metadata } from "next";
import { SharedSong } from "./shared-song";
export const metadata: Metadata = { title: "Shared song · SAMADHI LOVE", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function SharePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <SharedSong token={typeof params.token === "string" && /^[a-f0-9]{64}$/.test(params.token) ? params.token : ""}/>;
}
