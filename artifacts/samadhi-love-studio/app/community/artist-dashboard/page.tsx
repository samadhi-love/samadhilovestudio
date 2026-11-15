import { privateWorkspace } from "../../studio-access";
import { ArtistConsole } from "./studio";

export const dynamic = "force-dynamic";

export default async function ArtistDashboardPage({ searchParams }: { searchParams: Promise<{ recording?: string | string[] }> }) {
  const workspace = await privateWorkspace();
  if (!workspace) return <main className="listener-shell"><div className="listener-hero"><h1>Artist workspace required</h1>
    <p>Sign in to an artist workspace to publish songs and see private listening statistics.</p><a href="/community">Back to Community</a></div></main>;
  const { recording } = (await searchParams) ?? {};
  return <ArtistConsole selectedRecording={typeof recording === "string" ? recording : undefined} studioHref={workspace.role === "owner" ? "/owner" : "/creator"} moderator={workspace.role === "owner"}/>;
}
