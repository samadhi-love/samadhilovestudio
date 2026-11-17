import { privateWorkspace } from "../../studio-access";
import { redirect } from "next/navigation";
import { legacyPageRedirect } from "../../studio-routes";

export const dynamic = "force-dynamic";

export default async function ArtistDashboardPage({ searchParams }: { searchParams: Promise<{ recording?: string | string[] }> }) {
  const workspace = await privateWorkspace();
  if (!workspace) return <main className="listener-shell"><div className="listener-hero"><h1>Artist workspace required</h1>
    <p>Sign in to an artist workspace to publish songs and see private listening statistics.</p><a href="/community">Back to Community</a></div></main>;
  const { recording } = (await searchParams) ?? {};
  // The Artist Dashboard now lives in My Songs (fold-out) and in each song's Release step.
  const role: string = workspace.role;
  redirect(legacyPageRedirect("/community/artist-dashboard", role, typeof recording === "string" ? recording : undefined));
}
