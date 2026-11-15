import { handleStripeEvent, verifyStripeSignature } from "../../../billing/service";
import { CreditError } from "../../../credits/account-ledger";
import { privateHeaders } from "../../studio/store";
import { readBoundedText, recoverableRoute } from "../../studio/request-errors";
export const dynamic = "force-dynamic";
async function webhook(request: Request) {
  const raw = await readBoundedText(request, 256000);
  if (!await verifyStripeSignature(raw, request.headers.get("stripe-signature"))) return Response.json({ error: "Invalid or expired payment signature." }, { status: 400, headers: privateHeaders });
  let event;
  try { event = JSON.parse(raw); } catch { return Response.json({ error: "Invalid payment event." }, { status: 400, headers: privateHeaders }); }
  try { await handleStripeEvent(event); }
  catch (error) { if (error instanceof CreditError) return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders }); throw error; }
  return Response.json({ received: true }, { headers: privateHeaders });
}
export const POST = recoverableRoute(webhook, "Verified payment processing is temporarily unavailable. Retry this event.");
