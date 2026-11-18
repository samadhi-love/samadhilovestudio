/** The configured public origin is the production trust anchor, not a visitor's
 * forwarded headers. Preview can use its incoming hostname when no origin is set. */
export function authRequestHostname(incoming:Pick<Headers,"get">,publicOrigin?:string){
  if(publicOrigin?.trim()){
    const origin=new URL(publicOrigin);
    if(origin.protocol!=="https:"||origin.username||origin.password||origin.pathname!=="/"||origin.search||origin.hash)
      throw new Error("Check STUDIO_PUBLIC_ORIGIN before loading Studio sign-in.");
    return origin.hostname;
  }
  const authority=(incoming.get("x-forwarded-host")||incoming.get("host")||"").split(",")[0].trim();
  if(!authority||/[\s/\\?#@]/.test(authority))
    throw new Error("Studio sign-in hostname is unavailable. Check STUDIO_PUBLIC_ORIGIN or open the Studio preview directly.");
  const hostname=new URL("http://"+authority).hostname;
  if(!hostname)throw new Error("Studio sign-in hostname is unavailable.");
  return hostname;
}
