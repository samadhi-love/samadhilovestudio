import { redirect } from "next/navigation";
import { Portal } from "../portal";
import { privateWorkspace } from "../studio-access";
import { legacyPageRedirect } from "../studio-routes";

export const dynamic = "force-dynamic";

export default async function Page() {
  const workspace = await privateWorkspace();
  if (workspace) { const role: string = workspace.role; redirect(legacyPageRedirect("/subscriber", role)); }
  return <Portal requested="subscriber"/>;
}
