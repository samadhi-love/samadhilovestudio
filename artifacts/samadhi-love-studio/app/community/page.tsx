import { chatGPTSignInPath, chatGPTSignOutPath } from "../chatgpt-auth";
import { privateWorkspace, studioAccess } from "../studio-access";
import { Community } from "./community";
import { redirect } from "next/navigation";
import { legacyPageRedirect } from "../studio-routes";

export const dynamic = "force-dynamic";

export default async function CommunityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, access, workspace] = await Promise.all([searchParams, studioAccess(), privateWorkspace()]);
  const search = new URLSearchParams();
  for (const key of ["song", "artist", "ref"]) {
    const value = params[key];
    if (typeof value === "string" && /^[a-zA-Z0-9_-]{1,96}$/.test(value)) search.set(key, value);
  }
  if (workspace && !search.size) redirect(legacyPageRedirect("/community", workspace.role));
  const query = search.size ? "?" + search.toString() : "";
  return <Community songId={search.get("song")} artistId={search.get("artist")} shareRef={search.get("ref") ?? undefined}
    signIn={chatGPTSignInPath("/community" + query)} signOut={access.id ? chatGPTSignOutPath("/community") : undefined}
    studioLink={workspace ? workspace.role === "owner" ? "/owner" : "/creator" : undefined}/>;
}
