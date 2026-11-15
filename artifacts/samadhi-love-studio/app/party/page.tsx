import { studioAccess } from "../studio-access";
import { chatGPTSignInPath } from "../chatgpt-auth";
import { PartyMix } from "./studio";
import "./party.css";
export const dynamic = "force-dynamic";
export default async function PartyPage() {
  const access = await studioAccess();
  if (!access.id)
    return (
      <main className="party-shell">
        <p className="eyebrow">SAMADHI LOVE</p>
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
  return <PartyMix />;
}
