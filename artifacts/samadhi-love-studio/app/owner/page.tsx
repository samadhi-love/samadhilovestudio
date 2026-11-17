import { Portal } from "../portal";
import { ownerSetup } from "../studio-access";
import { ClaimOwner } from "./claim";

export const dynamic = "force-dynamic";

export default async function Page() {
  const setup = await ownerSetup();
  if (setup && !setup.claimed) return <ClaimOwner blocked={setup.blocked} storageAvailable={setup.storageAvailable}/>;
  return <Portal requested="owner"/>;
}
