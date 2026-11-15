import { chatGPTSignInPath, chatGPTSignOutPath } from "../chatgpt-auth";
import { creatorAccount, creatorBetaEnabled } from "../creator-accounts";
import { studioAccess } from "../studio-access";
import Studio from "../studio";
import { RegisterCreator } from "./register";

export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const access = await studioAccess();
  const open = creatorBetaEnabled();
  const account = open && access.role === "subscriber" ? await creatorAccount(access.id) : null;
  if (open && account && !account.suspended) return <Studio creatorName={account.displayName} signOut={chatGPTSignOutPath("/creator")}/>;

  return <main className="listener-shell"><div className="listener-hero">
    <p className="eyebrow">SAMADHI LOVE · CREATOR ACCOUNTS</p><h1>Your private workspace</h1>
    {!open ? <p>Creator registration is currently closed.</p> : account?.suspended ? <p>This creator account is suspended.</p> :
      access.role === "guest" ? <><p>Sign in to start a song, make a lyric video, or return to your private projects.</p><a className="primary" href={chatGPTSignInPath("/creator")} target="_top">Sign in to My Studio</a><p><a href="/sign-up?return_to=%2Fcreator">Create a Studio account</a></p></> :
      access.role === "owner" ? <a className="primary" href="/owner">Open the owner studio</a> : <>
        <p>Your songs, prompts, recordings, favorites, and provider key stay in your account. Generation uses your own provider key and plan.</p>
        <RegisterCreator/>
      </>}
    <div className="actions"><a href="/members">Member account</a><a href="/plans">Plans &amp; subscriptions</a><a href="/subscriber">Listening room</a></div>
  </div></main>;
}
