/**
 * A sign-in link may return only to a page on this app, never an external site
 * or another authentication route. Shared by server links and client forms.
 */
export function safeStudioReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/creator";
  try {
    const url = new URL(value, "https://studio.invalid");
    if (url.origin !== "https://studio.invalid") return "/creator";
    const reserved = ["/sign-in", "/sign-up", "/sign-out", "/callback", "/signin-with-chatgpt", "/signout-with-chatgpt"];
    if (reserved.some(path => url.pathname === path || url.pathname.startsWith(path + "/")))
      return "/creator";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/creator";
  }
}
