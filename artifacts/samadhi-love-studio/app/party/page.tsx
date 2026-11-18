import {brand} from "../brand";
import { studioAccess, privateWorkspace } from "../studio-access";
import { redirect } from "next/navigation";
import { legacyPageRedirect } from "../studio-routes";
import { chatGPTSignInPath } from "../chatgpt-auth";
import { PartyMix } from "./studio";
import "./party.css";
export const dynamic = "force-dynamic";
export default async function PartyPage() {
  const access = await studioAccess();
  if (!access.id)
    return (
      <main className="party-shell">
        <p className="eyebrow">{brand.name}</p>
        <h1>Party Mix</h1>
        <p>
          Sign in to build a set, save it to your profile, and discover parties.
        </p>
        <a className="primary" href={chatGPTSignInPath("/party")}>
          Continue with ChatGPT
        </a>
        <a className="secondary" href="/party-offline.html">
          Open offline parties
        </a>
      </main>
    );
  const workspace = await privateWorkspace();
  if (workspace) redirect(legacyPageRedirect("/party", workspace.role));
  return <PartyMix />;
}
