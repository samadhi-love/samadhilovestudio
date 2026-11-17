import { initializeRuntime } from "./storage/runtime.mjs";
import {supervise} from "./storage/supervisor.mjs";
import {fileURLToPath} from "node:url";

if(!process.argv.includes("--studio-server-child")){
  await supervise(fileURLToPath(import.meta.url));
}else try {
  const { config } = await initializeRuntime();
  process.env.NODE_ENV = "production";
  // Configure trust before Vinext's proxy module is imported. Otherwise HTTPS
  // browser Origins appear as HTTP behind Replit's TLS proxy and saves fail CSRF.
  // Only this configured host is trusted, never an arbitrary forwarded host.
  process.env.VINEXT_TRUSTED_HOSTS = new URL(config.publicOrigin).host;
  const { startProdServer } = await import("vinext/server/prod-server");
  await startProdServer({ port: config.port, host: "0.0.0.0" });
} catch (error) {
  console.error(error instanceof Error ? error.message : "Studio startup checks failed.");
  process.exitCode = 1;
}
