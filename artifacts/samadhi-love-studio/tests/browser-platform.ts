// Radix observes the actual JSDOM tree. Resolve the constructor from each test's
// current window instead of mocking observation or reusing a closed test window.
Object.defineProperty(globalThis, "MutationObserver", {
  configurable: true,
  get: () => globalThis.window?.MutationObserver,
});
Object.defineProperty(globalThis, "Node", {
  configurable: true,
  get: () => globalThis.window?.Node,
});
