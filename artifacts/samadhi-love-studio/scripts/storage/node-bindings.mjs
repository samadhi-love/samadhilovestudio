// This module is aliased only into the Node server build, never the browser.
export const env = new Proxy({}, {
  get(_target, name) {
    const bindings = globalThis[Symbol.for("samadhi.node.bindings")];
    // Builds must not open storage connections or include credentials.
    if (!bindings) throw new Error("Node storage has not passed its startup checks.");
    return bindings[name];
  },
});
