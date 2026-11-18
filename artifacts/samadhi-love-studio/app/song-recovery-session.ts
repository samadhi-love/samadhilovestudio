const attempted=new Set<string>();

/** One completed automatic recovery pass per account/tab session. An incomplete
 * pass or a later interrupted creation can re-arm it without replaying music. */
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

export function retryAutomaticSongRecovery(workspace:string){
  attempted.delete(workspace);
  try{window.sessionStorage.setItem("samadhi:paid-audio-recovery:v1:"+workspace,"0");}
  catch{/* The in-memory guard is re-armed even when browser storage is blocked. */}
}
