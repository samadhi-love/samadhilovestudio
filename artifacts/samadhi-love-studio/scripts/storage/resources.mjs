// Production resource identifiers and credentials belong in Replit Secrets.
// No fallback may point a clean checkout at an existing live database/bucket.
export function resourceConfig(source = process.env) {
  const names = {
    accountId: "CLOUDFLARE_ACCOUNT_ID",
    databaseId: "CLOUDFLARE_D1_DATABASE_ID",
    databaseName: "CLOUDFLARE_D1_DATABASE_NAME",
    bucket: "STUDIO_R2_BUCKET_NAME",
  };
  const missing = Object.values(names).filter(name => !source[name]?.trim());
  if (missing.length) throw new Error(`Add ${missing.join(", ")} in Replit Secrets before starting production.`);
  const values = Object.fromEntries(Object.entries(names).map(([key,name])=>[key,source[name].trim()]));
  if (!/^[a-f0-9]{32}$/i.test(values.accountId)) throw new Error("CLOUDFLARE_ACCOUNT_ID must be the 32-character Cloudflare account identifier.");
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(values.databaseId)) throw new Error("CLOUDFLARE_D1_DATABASE_ID must be the existing database UUID.");
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(values.bucket)) throw new Error("STUDIO_R2_BUCKET_NAME must be the existing private R2 bucket name.");
  return values;
}
