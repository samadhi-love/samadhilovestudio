/** D1 binding-compatible adapter. Never interpolate parameters or retry writes. */
export class D1Http {
  constructor({ accountId, databaseId, token, transport = fetch }) {
    this.url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    this.token = token;
    this.transport = transport;
  }
  prepare(sql) {
    if (typeof sql !== "string" || !sql.trim()) throw new Error("D1 requires SQL.");
    return new Statement(this, sql);
  }
  async query(statements) {
    if(!statements.length)return [];
    const queries=statements.map(s=>({sql:s.sql,params:s.params}));
    let response;
    try {
      response = await this.transport(this.url, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(45_000),
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        // D1 REST accepts a query object or {batch:[...]}, not a bare array.
        // Keep a batch in one request; never replay ambiguous writes.
        body: JSON.stringify(queries.length===1?queries[0]:{batch:queries}),
      });
    } catch {
      throw new Error("D1 request was not confirmed. Do not automatically repeat a write.");
    }
    if (!response.ok) throw new Error(`D1 request failed (HTTP ${response.status}).`);
    let body;
    try { body = await response.json(); }
    catch { throw new Error("D1 returned an unreadable result. No automatic retry was made."); }
    if (!body.success || !Array.isArray(body.result) || body.result.length !== statements.length ||
        body.result.some(r => r.success === false || r.error)) {
      throw new Error("D1 rejected the request. No automatic retry was made.");
    }
    return body.result.map(r => ({ ...r, success: true, results: r.results ?? [], meta: r.meta ?? {} }));
  }
  async batch(statements) {
    if (!statements.length) return [];
    if (statements.some(s => !(s instanceof Statement) || s.db !== this)) throw new Error("Invalid D1 batch.");
    // One D1 API request keeps the batch's transaction boundary intact.
    return this.query(statements);
  }
}
class Statement {
  constructor(db, sql, params = []) { this.db = db; this.sql = sql; this.params = params; }
  bind(...params) {
    const normalized = params.map(p => {
      if (p === null || typeof p === "string" || (typeof p === "number" && Number.isFinite(p))) return p;
      if (p instanceof ArrayBuffer || ArrayBuffer.isView(p)) return Array.from(new Uint8Array(p.buffer ?? p, p.byteOffset ?? 0, p.byteLength));
      throw new Error("Unsupported D1 bound parameter.");
    });
    return new Statement(this.db, this.sql, normalized);
  }
  async all() { return (await this.db.query([this]))[0]; }
  async run() { return this.all(); }
  async first(column) {
    const row = (await this.all()).results[0] ?? null;
    return row && column !== undefined ? row[column] : row;
  }
  async raw({ columnNames = false } = {}) {
    const rows = (await this.all()).results;
    const columns = Object.keys(rows[0] ?? {});
    const values = rows.map(row => columns.map(key => row[key]));
    return columnNames ? [columns, ...values] : values;
  }
}
