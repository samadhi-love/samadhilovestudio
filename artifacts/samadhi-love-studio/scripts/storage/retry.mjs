// Only callers that can prove replay is safe may use this helper.
export function temporaryFailure(error) {
  const status=error?.status??error?.statusCode??error?.$metadata?.httpStatusCode;
  if(status!==undefined)return status===429||(status>=500&&status<=599);
  if(["TimeoutError","NetworkError"].includes(error?.name))return true;
  if(["ECONNRESET","ECONNREFUSED","ETIMEDOUT","EAI_AGAIN","UND_ERR_CONNECT_TIMEOUT","UND_ERR_SOCKET"].includes(error?.code))return true;
  if(error?.name==="TypeError"&&/fetch failed|network|failed to fetch|load failed/i.test(error.message??""))return true;
  return error?.cause?temporaryFailure(error.cause):false;
}
const wait=(ms,signal)=>new Promise((resolve,reject)=>{
  const abort=()=>{clearTimeout(timer);reject(signal.reason);};
  const timer=setTimeout(()=>{signal?.removeEventListener("abort",abort);resolve();},ms);
  if(signal?.aborted)abort();else signal?.addEventListener("abort",abort,{once:true});
});
/** @param {()=>Promise<any>} operation
 * @param {{signal?:AbortSignal,sleep?:(ms:number,signal?:AbortSignal)=>Promise<any>,delays?:number[]}} options */
export async function retryRead(operation,{signal,sleep=wait,delays=[1000,3000]}={}) {
  for(let attempt=0;;attempt++){
    signal?.throwIfAborted();
    try {
      const result=await operation();
      if(result&&typeof result.status==="number"&&(result.status===429||result.status>=500&&result.status<=599)){
        // Some providers use 429 even when credits/permissions cannot recover.
        let permanent=false;
        if(result.headers?.get("content-type")?.includes("json")){
          const body=await result.clone().json().catch(()=>null);
          const code=body?.detail?.status??body?.detail?.code??body?.error?.code??body?.code;
          permanent=/quota|credit|balance|permission|invalid|unauthori|subscription|payment/i.test(String(code??""));
        }
        if(!permanent&&attempt<delays.length){
          await result.body?.cancel().catch(()=>{});
          await sleep(delays[attempt],signal);continue;
        }
      }
      return result;
    }catch(error){
      if(signal?.aborted||attempt>=delays.length||!temporaryFailure(error))throw error;
      await sleep(delays[attempt],signal);
    }
  }
}
export function readOnlySql(sql) {
  // No CTEs, PRAGMAs or multi-statement guesses. Ambiguous writes are never replayed.
  return /^\s*SELECT\b/i.test(sql)&&!sql.replace(/;\s*$/,"").includes(";");
}
