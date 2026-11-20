import { brand } from "../../brand";
import { studioAccess } from "../../studio-access";
import { StatusBoard } from "./status-board";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const access = await studioAccess();
  if (access.role !== "owner") return <main className="listener-shell"><h1>Owner access required</h1><a href="/owner">Owner entrance</a></main>;
  return <main className="listener-shell music-tools app-status">
    <header className="listener-hero"><p className="eyebrow">{brand.name} · OWNER</p><h1>App status</h1>
      <p>How the app is doing over the last 24 hours, measured against its targets. Read-only.</p>
      <div className="actions"><a href="/owner">Back to the studio</a><a href="/admin">Launch administration</a></div></header>
    <StatusBoard/>
  </main>;
}
