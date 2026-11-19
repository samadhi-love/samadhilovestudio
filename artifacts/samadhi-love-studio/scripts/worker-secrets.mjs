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
  // The project credential is available only to the explicitly configured owner
  // setup path. Visitors still require their own encrypted provider connection.
  if (source.STUDIO_OWNER_EMAIL?.trim()) {
    names.add("STUDIO_OWNER_EMAIL");
    if (source.ELEVENLABS_API_KEY !== undefined) names.add("ELEVENLABS_API_KEY");
    const falName = Object.keys(source).find(name => name === "FAL_KEY") ?? Object.keys(source).find(name => /^fal[_-]?key$/i.test(name.trim()));
    if (falName) names.add(falName);
  }
  return { required: [...names] };
}
