/**
 * Single server-only D1/R2 boundary. This is deliberately binding-compatible so
 * existing routes/engines retain streaming, conditional writes and bound SQL.
 * Production bindings are direct Node adapters; preview bindings are emulated.
 */
import { env as bindings } from "cloudflare:workers";
import {storageBindings} from "./storage-service";
export {storageBindings} from "./storage-service";
// Reads remain request-scoped: never cache an owner's binding or credentials.
export const serverStorage:Cloudflare.Env=storageBindings(bindings);
