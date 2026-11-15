import { studioAccess } from "../../studio-access";
import { ModerationConsole } from "./queue";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  if ((await studioAccess()).role !== "owner")
    return <main className="listener-shell"><div className="listener-hero"><h1>Owner access required</h1><a href="/community">Back to Community</a></div></main>;
  return <ModerationConsole/>;
}
