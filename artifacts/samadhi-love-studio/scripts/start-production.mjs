import { createGateway, gatewayConfig } from "./production-gateway.mjs";

try {
  const config = gatewayConfig();
  const server = createGateway(config);
  server.requestTimeout = 310_000;
  server.listen(config.port, "0.0.0.0", () => {
    console.log(`Studio production gateway listening on port ${config.port}.`);
  });
  server.on("error", () => {
    console.error("Studio production gateway could not start. Check the allocated port and hosting configuration.");
    process.exitCode = 1;
  });
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.once(signal, () => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
} catch (error) {
  // Configuration errors contain setting names, never values.
  console.error(error.message);
  process.exitCode = 1;
}
