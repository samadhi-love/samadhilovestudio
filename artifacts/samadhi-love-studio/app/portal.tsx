import { chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";
import {VersualLanding} from "./landing";
import {brand} from "./brand";
import { studioAccess } from "./studio-access";
import { SubscriberRoom } from "./subscriber-room";
import Studio from "./studio";
import { redirect } from "next/navigation";

export async function Portal({ requested }: { requested?: "owner" | "subscriber" }) {
  const access = await studioAccess();
  if (!requested && access.id) redirect("/creator");
  if (!requested) return <VersualLanding/>;
  if (access.role === "owner" && requested !== "subscriber")
    return <Studio signOut={chatGPTSignOutPath("/owner")}/>;
  if (access.role !== "guest" && requested !== "owner")
    return <SubscriberRoom signOut={chatGPTSignOutPath("/subscriber")} ownerPreview={access.role === "owner"}/>;
  return <main className="listener-shell">
    <div className="listener-hero">
      <img src="/favicon.svg" alt=""/>
      <p className="eyebrow">{brand.name} · PRIVATE TEST</p>
      <h1>{requested === "owner" ? "Owner sign-in" : "Find your frequency."}</h1>
      <p>{access.role === "subscriber" ? "This account has subscriber access. Switch accounts to enter the owner studio." : `Sign in with your ${brand.name} account. Your old host's login does not automatically transfer here.`}</p>
      <div className="actions">
        {access.role === "subscriber" ? <a className="primary" href={chatGPTSignOutPath("/owner")} target="_top">Switch to owner account</a> :
          <a className="primary" href={chatGPTSignInPath(requested === "owner" ? "/owner" : "/subscriber")} target="_top">{requested === "owner" ? "Sign in as owner" : "Subscriber sign-in"}</a>}
        <a className="secondary" href="/community">Discover music</a>
        <a className="secondary" href={requested === "owner" ? "/subscriber" : "/owner"}>{requested === "owner" ? "Subscriber entrance" : "Owner entrance"}</a>
      </div>
    </div>
  </main>;
}
