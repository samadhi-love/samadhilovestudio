// Only names enter Wrangler configuration. Values remain managed secrets.
// Local .env/.dev.vars bindings retain their existing Wrangler precedence.
export function studioWorkerSecrets(command, localBindings = {}, source = process.env) {
  // The Cloudflare plugin can emit local secrets into dist/.dev.vars on build.
  // An empty allowlist prevents copying any development secret to build output.
  if (command !== "serve") return { required: [] };
  const names = new Set(Object.keys(localBindings));
  for (const name of ["STUDIO_ELEVENLABS_VAULT_KEY", "vault"]) {
    if (source[name] !== undefined) names.add(name);
  }
  return { required: [...names] };
}
