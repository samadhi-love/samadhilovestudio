import { redirect } from "next/navigation";
import { legacyPageRedirect } from "../studio-routes";
import { privateWorkspace } from "../studio-access";
import { chatGPTSignInPath } from "../chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function CreditsPage() {
  const workspace = await privateWorkspace();
  if (!workspace) return <main className="listener-shell"><h1>Your credits and usage</h1><p>Sign in to your private creator account.</p><a className="primary" target="_top" href={chatGPTSignInPath("/credits")}>Sign in</a><p><a href="/creator">Create a private workspace</a></p></main>;
  const role: string = workspace.role;
  redirect(legacyPageRedirect("/credits", role));
}
