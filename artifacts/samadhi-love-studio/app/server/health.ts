type Bindings={DB?:{prepare(sql:string):{first():Promise<unknown>}};BUCKET?:{head(key:string):Promise<unknown>}};
export async function checkHealth(env:Bindings,timeoutMs=2000) {
  const checks={server:"ok",database:"unavailable",storage:"unavailable"};
  let timer:ReturnType<typeof setTimeout>|undefined;
  const reads=Promise.allSettled([
    Promise.resolve().then(async()=>{if(!env.DB)throw new Error();await env.DB.prepare("SELECT 1 AS healthy").first();checks.database="ok";}),
    Promise.resolve().then(async()=>{if(!env.BUCKET)throw new Error();await env.BUCKET.head("__studio_read_only_health_probe__");checks.storage="ok";}),
  ]);
  try{await Promise.race([reads,new Promise(resolve=>{timer=setTimeout(resolve,timeoutMs);})]);}
  finally{if(timer)clearTimeout(timer);}
  return {status:checks.database==="ok"&&checks.storage==="ok"?"ok":"unavailable",checks:{...checks}};
}
// Collapse probe bursts; an unavailable dependency must not flood storage.
let pending:Promise<Awaited<ReturnType<typeof checkHealth>>>|undefined;
let cached:{at:number;result:Awaited<ReturnType<typeof checkHealth>>}|undefined;
export async function storageHealth(env:Bindings) {
  if(cached&&Date.now()-cached.at<5000)return cached.result;
  if(!pending)pending=checkHealth(env).then(result=>{cached={at:Date.now(),result};return result;}).finally(()=>{pending=undefined;});
  return pending;
}
