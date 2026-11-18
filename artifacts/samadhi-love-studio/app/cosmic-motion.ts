/** Keep user-triggered navigation calm without overriding reduced-motion preferences. */
export function cosmicScrollBehavior(): ScrollBehavior {
  return typeof window!=="undefined"&&typeof window.matchMedia==="function"&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches?"smooth":"auto";
}
