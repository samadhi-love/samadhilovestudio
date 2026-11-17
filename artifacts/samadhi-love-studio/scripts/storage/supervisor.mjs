import {spawn} from "node:child_process";
export async function probeHealth(url,transport=fetch) {
  try{const response=await transport(url,{redirect:"error",signal:AbortSignal.timeout(5000)});return response.status===200&&(await response.json()).status==="ok";}
  catch{return false;}
}
export function restartRequired(failures,elapsedMs){return elapsedMs>=90000&&failures>=3;}
// The supervisor is separate from the server event loop so it can detect a
// frozen child. Never replays requests. The platform restarts the supervisor
// if the bounded local restart budget is exhausted.
export function supervise(script,{port=process.env.PORT,spawnChild=spawn,probe=probeHealth,
  intervalMs=30000,graceMs=90000,restartPauseMs=1000,killAfterMs=10000}={}) {
  if(!/^\d+$/.test(String(port))||Number(port)<1||Number(port)>65535)throw new Error("PORT must be a valid allocated port.");
  return new Promise(resolve=>{
    let child,interval,stopping=false,restarts=0,failures=0,checking=false,killTimer,restartTimer;
    const stopChild=()=>{if(child&&!child.killed){const target=child;target.kill("SIGTERM");killTimer=setTimeout(()=>target.kill("SIGKILL"),killAfterMs);killTimer.unref();}};
    const stop=()=>{stopping=true;clearInterval(interval);clearTimeout(restartTimer);stopChild();if(!child)finish();};
    process.once("SIGTERM",stop);process.once("SIGINT",stop);
    const finish=()=>{process.removeListener("SIGTERM",stop);process.removeListener("SIGINT",stop);resolve();};
    const start=()=>{
      const began=Date.now();failures=0;
      child=spawnChild(process.execPath,[script,"--studio-server-child"],{stdio:"inherit",env:process.env});
      interval=setInterval(async()=>{
        if(checking||stopping)return;checking=true;
        const ok=await probe(`http://127.0.0.1:${port}/health`);checking=false;
        failures=ok?0:failures+1;
        if(Date.now()-began>=graceMs&&failures>=3){console.error("Studio recovery",{event:"health-unavailable",action:"restart-server"});clearInterval(interval);stopChild();}
      },intervalMs);
      const exited=()=>{clearInterval(interval);clearTimeout(killTimer);child=undefined;
        if(stopping)return finish();
        if(++restarts>3){console.error("Studio recovery",{event:"restart-budget-exhausted"});process.exitCode=1;return finish();}
        console.error("Studio recovery",{event:"server-stopped",attempt:restarts});
        restartTimer=setTimeout(start,restarts*restartPauseMs);
      };
      child.once("exit",exited);child.once("error",()=>{console.error("Studio recovery",{event:"server-start-failed"});});
    };
    start();
  });
}
