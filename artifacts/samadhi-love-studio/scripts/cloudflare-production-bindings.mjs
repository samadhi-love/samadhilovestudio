export function cloudflareProductionBindings(source = process.env) {
  const required = name => {
    const value = source[name]?.trim();
    if (!value) throw new Error(`${name} is required for a production Worker build. No resources were created.`);
    return value;
  };
  const account = required("CLOUDFLARE_ACCOUNT_ID");
  const database = required("STUDIO_D1_DATABASE_ID");
  const databaseName = required("STUDIO_D1_DATABASE_NAME");
  const bucket = required("STUDIO_R2_BUCKET_NAME");
  const name = required("STUDIO_CLOUDFLARE_WORKER_NAME");
  const publicOrigin = required("STUDIO_PUBLIC_ORIGIN");
  if (!/^[a-f0-9]{32}$/i.test(account)) throw new Error("CLOUDFLARE_ACCOUNT_ID must be a valid account identifier.");
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(database) ||
      database === "00000000-0000-4000-8000-000000000000") {
    throw new Error("STUDIO_D1_DATABASE_ID must identify the existing production database, not a placeholder.");
  }
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error("STUDIO_R2_BUCKET_NAME must identify an existing R2 bucket.");
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) throw new Error("STUDIO_CLOUDFLARE_WORKER_NAME must be a valid Worker name.");
  let url;
  try { url = new URL(publicOrigin); } catch { throw new Error("STUDIO_PUBLIC_ORIGIN must be an HTTPS origin."); }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("STUDIO_PUBLIC_ORIGIN must be an HTTPS origin without a path or credentials.");
  }
  return {
    name, account_id: account,
    vars: { STUDIO_CREATOR_BETA: "1", STUDIO_PUBLIC_ORIGIN: url.origin },
    d1_databases: [{ binding: "DB", database_name: databaseName, database_id: database, migrations_dir: "./drizzle" }],
    r2_buckets: [{ binding: "BUCKET", bucket_name: bucket }],
  };
}
