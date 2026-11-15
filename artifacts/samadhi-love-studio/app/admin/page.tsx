import { billingReady, paymentMode } from "../billing/config";
import { desc } from "drizzle-orm";
import { getDb } from "../../db";
import { creatorAccounts } from "../../db/schema";
import { creatorBetaEnabled } from "../creator-accounts";
import { studioAccess } from "../studio-access";
import { AccountRow } from "./account-row";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await studioAccess();
  if (access.role !== "owner") return <main className="listener-shell"><h1>Owner access required</h1><a href="/owner">Owner entrance</a></main>;
  const accounts = await getDb().select().from(creatorAccounts).orderBy(desc(creatorAccounts.createdAt)).limit(100);
  const today = new Date().toISOString().slice(0, 10);
  return <main className="listener-shell music-tools">
    <header className="listener-hero"><p className="eyebrow">SAMADHI LOVE · OWNER</p><h1>Launch administration</h1><div className="actions"><a href="/owner">Back to the studio</a><a href="/community/moderation">Community moderation</a></div></header>
    <section className="section"><h2>Launch status</h2>
      <p>Creator registration: {creatorBetaEnabled() ? "Enabled for visitors allowed by Sites" : "Closed"}</p>
      <p>Billing: {billingReady() ? `${paymentMode()} integration configured; live checkout still validates each price` : "Setup pending · checkout closed"}. <a href="/members">Membership &amp; billing</a> · <a href="/credits">Credits, beta allowances &amp; production recovery</a></p>
      <p>Creator generation: Each creator supplies their own ElevenLabs API key. Daily limits count validated requests sent for generation, including provider errors. ElevenLabs reports actual credit usage in provider settings when permitted.</p>
      <p>Privacy: Creator data is scoped to the signed-in account. The listener room serves only tracks the studio owner selects.</p>
      <p>Commercial use depends on your provider plan and the rights to any uploads or samples. <a href="https://elevenlabs.io/music-terms" target="_blank" rel="noreferrer">Eleven Music terms</a></p>
    </section>
    <section className="section"><h2>Recent creator accounts</h2>{!accounts.length && <p>No creator accounts have registered.</p>}</section>
    {accounts.map(account => <AccountRow key={account.id} account={{ ...account, attempts: account.usageDay === today ? account.attempts : 0 }}/>)}
  </main>;
}
