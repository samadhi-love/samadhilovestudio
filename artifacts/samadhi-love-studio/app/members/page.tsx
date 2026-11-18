import {brand} from "../brand";
import { redirect } from "next/navigation";
import { legacyPageRedirect } from "../studio-routes";
import { chatGPTSignInPath, chatGPTSignOutPath } from "../chatgpt-auth";
import { privateWorkspace, studioAccess } from "../studio-access";
import { creatorAccount, creatorBetaEnabled } from "../creator-accounts";
import { plans, type Plan } from "../credits/data";
import { RegisterCreator } from "../creator/register";
import { MemberDashboard } from "./member-dashboard";
export const dynamic = "force-dynamic";
export default async function MembersPage({ searchParams }: { searchParams: Promise<{ plan?: string; checkout?: string }> }) {
  const params = await searchParams, plan: Plan = typeof params.plan === "string" && Object.hasOwn(plans, params.plan) ? params.plan as Plan : "free";
  const [access, workspace] = await Promise.all([studioAccess(), privateWorkspace()]);
  if (workspace && params.plan === undefined && params.checkout === undefined) redirect(legacyPageRedirect("/members", workspace.role));
  if (workspace) return <MemberDashboard selectedPlan={typeof params.plan === "string" && Object.hasOwn(plans, params.plan) ? plan : undefined} returned={params.checkout === "returned"} signOut={chatGPTSignOutPath("/members")}/>;
  const account = access.role === "subscriber" ? await creatorAccount(access.id) : null;
  return <main className="member-shell member-login"><header className="member-nav"><a className="brand" href="/community"><img src="/favicon.svg" alt=""/><strong>{brand.name}</strong></a><a href="/plans">Compare plans</a></header><section className="member-login-card"><p className="eyebrow">BECOME A MEMBER</p><h1>Your own space<br/>to create.</h1><p>Start with a free private workspace. {plan !== "free" ? `${plans[plan].name} is your selected plan; it will not be activated or billed by registration.` : "No card is required."}</p>
    {!access.id ? <><a className="primary" target="_top" href={chatGPTSignInPath("/members?plan=" + plan)}>Continue with ChatGPT</a><p className="muted">Sign in securely, then choose your creator name. New creator registration is currently for adults 18 and older.</p></> : account?.suspended ? <p role="alert">This creator account is suspended. Membership purchases cannot bypass that restriction.</p> : !creatorBetaEnabled() ? <p>Creator registration is currently closed. Existing libraries remain preserved.</p> : <RegisterCreator plan={plan} memberFlow/>}
    <p><a href="/membership-notice">Read the membership notice</a></p><a href="/community">Return to public music</a></section></main>;
}
