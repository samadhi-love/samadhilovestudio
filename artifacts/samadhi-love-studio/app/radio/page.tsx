import{studioAccess}from"../studio-access";
import{chatGPTSignInPath}from"../chatgpt-auth";
import{SharedRadio}from"../shared-radio";
import{redirect}from"next/navigation";
import{privateWorkspace}from"../studio-access";
import{legacyPageRedirect}from"../studio-routes";
export const dynamic="force-dynamic";
export default async function RadioPage(){const[access,workspace]=await Promise.all([studioAccess(),privateWorkspace()]);if(workspace){const role:string=workspace.role;redirect(legacyPageRedirect("/radio",role));}return<main className="listener-shell"><header className="listener-top"><a className="listener-brand" href="/">SAMADHI LOVE</a><div className="actions"><a className="secondary small" href="/community">Community</a><a className="secondary small" href={access.role==="owner"?"/owner":"/creator"}>Creator studio</a><a className="secondary small" href="/subscriber">Listening room</a></div></header><section className="listener-hero"><p className="eyebrow">POSITIVE VIBES · ORIGINAL VOICES</p><h1>SAMADHI LOVE Radio</h1><p>A shared listening programme with reviewed submissions from the Studio community.</p></section>{access.id?<SharedRadio/>:<p className="notice">Sign in to listen and review submission eligibility. <a href={chatGPTSignInPath("/radio")}>Sign in</a></p>}</main>;}
