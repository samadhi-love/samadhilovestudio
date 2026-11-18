const attempted=new Set<string>();

/** One automatic recovery attempt per account/tab session; manual recovery is
 * never gated. The in-memory guard also works if browser storage is blocked. */
export function claimAutomaticSongRecovery(workspace:string){
  if(attempted.has(workspace))return false;
  attempted.add(workspace);
  try{
    const key="samadhi:paid-audio-recovery:v1:"+workspace;
    if(window.sessionStorage.getItem(key)==="1")return false;
    window.sessionStorage.setItem(key,"1");
  }catch{/* The module guard still prevents repeated automatic scans. */}
  return true;
}
