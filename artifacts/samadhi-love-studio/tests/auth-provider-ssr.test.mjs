import test from "node:test";
import assert from "node:assert/strict";
import {mkdirSync,readFileSync} from "node:fs";
import {build} from "esbuild";
import React from "react";
import {renderToStaticMarkup,renderToPipeableStream} from "react-dom/server";
import {PassThrough} from "node:stream";
import {publishableKeyFromHost} from "@clerk/react/internal";

const directory="generated-artifacts/tests/auth-ssr";
mkdirSync(directory,{recursive:true});
const keys={
  test:"pk_test_"+Buffer.from("synthetic.clerk.accounts.dev$").toString("base64"),
  live:"pk_live_"+Buffer.from("clerk.synthetic.example$").toString("base64"),
};
const proxy="https://studio.example.test/api/__clerk";
globalThis.__authSsr={origin:"https://studio.example.test",headers:new Headers({host:"studio.example.test"})};
const variants={};
const branding=JSON.parse(readFileSync(new URL("../brand.json",import.meta.url),"utf8"));
for(const [kind,key] of Object.entries(keys)){
  await build({
    stdin:{contents:`
      export {StudioAuthProvider} from "./app/auth-provider";
      export {default as RootLayout} from "./app/layout";
      export {metadata} from "./app/layout";
      export {default as HomePage} from "./app/page";
      export {default as SignInPage} from "./app/sign-in/[[...sign-in]]/page";
      export {authRequestHostname} from "./app/server/auth-hostname";
    `,resolveDir:process.cwd(),loader:"tsx"},
    outfile:`${directory}/${kind}.mjs`,bundle:true,platform:"node",format:"esm",jsx:"automatic",packages:"external",
    define:{"import.meta.env.VITE_CLERK_PUBLISHABLE_KEY":JSON.stringify(key),"import.meta.env.VITE_CLERK_PROXY_URL":JSON.stringify(proxy)},
    plugins:[{name:"offline-auth-render",setup(b){
      b.onResolve({filter:/\.css$/},()=>({path:"css",namespace:"offline"}));
      b.onResolve({filter:/^next\/headers$/},()=>({path:"headers",namespace:"offline"}));
      b.onResolve({filter:/^next\/navigation$/},()=>({path:"navigation",namespace:"offline"}));
      b.onResolve({filter:/\/server\/storage$/},()=>({path:"storage",namespace:"offline"}));
      b.onLoad({filter:/.*/,namespace:"offline"},({path})=>({contents:{
        css:"",
        headers:"export async function headers(){return globalThis.__authSsr.headers;}",
        navigation:`export const useSearchParams=()=>new URLSearchParams();export const usePathname=()=>"/";
          export const useRouter=()=>({push(){},replace(){},refresh(){}});
          export const redirect=()=>{throw new Error("Unexpected redirect during public-page render");};`,
        storage:"export const serverStorage=new Proxy({},{get(_target,key){if(key==='STUDIO_PUBLIC_ORIGIN')return globalThis.__authSsr.origin;throw new Error('Offline auth test cannot access '+String(key));}});",
      }[path],loader:"js"}));
    }}],
  });
  variants[kind]=await import(`../${directory}/${kind}.mjs`);
}
async function offline(run){
  const fetch=globalThis.fetch;
  globalThis.fetch=async()=>{throw new Error("Network is disabled in this server-render regression test.");};
  try{return await run();}finally{globalThis.fetch=fetch;}
}
function pageHtml(element){
  return new Promise((resolve,reject)=>{
    const output=new PassThrough(),chunks=[];
    const timer=setTimeout(()=>{render.abort();reject(new Error("Offline page rendering did not settle."));},10000);
    const fail=error=>{clearTimeout(timer);reject(error);};
    output.on("data",chunk=>chunks.push(chunk));
    output.on("end",()=>{clearTimeout(timer);resolve(Buffer.concat(chunks).toString("utf8"));});
    output.on("error",fail);
    const render=renderToPipeableStream(element,{onAllReady(){render.pipe(output);},onError:fail,onShellError:fail});
  });
}

test("the regression requires live-key coverage: test keys hide the empty-host error",()=>{
  assert.equal(publishableKeyFromHost("",keys.test),keys.test);
  assert.throws(()=>publishableKeyFromHost("",keys.live),/Host must not be empty/);
});
test("configured public origin wins over forged forwarded or loopback hosts",()=>{
  const incoming=new Headers({host:"localhost:19551","x-forwarded-host":"visitor-chosen.example"});
  assert.equal(variants.live.authRequestHostname(incoming,"https://studio.example.test"),"studio.example.test");
  for(const origin of ["https://user:password@studio.example.test","http://studio.example.test","https://studio.example.test/path"])
    assert.throws(()=>variants.live.authRequestHostname(incoming,origin),/STUDIO_PUBLIC_ORIGIN/);
});
test("preview derives a real hostname without a port; missing/unsafe hosts fail clearly",()=>{
  const resolve=variants.test.authRequestHostname;
  assert.equal(resolve(new Headers({host:"localhost:19551"})),"localhost");
  assert.equal(resolve(new Headers({host:"localhost:19551","x-forwarded-host":"preview.example.test, proxy.internal"})),"preview.example.test");
  for(const host of ["","user@host.test","host.test/path","host.test\\path"])
    assert.throws(()=>resolve(new Headers({host})),/hostname is unavailable/);
});
for(const kind of ["test","live"]){
  test(`${kind} key: provider renders without window and preserves proxy and routes`,()=>offline(()=>{
    const element=variants[kind].StudioAuthProvider({serverHostname:"studio.example.test",children:React.createElement("p",null,"Public content")});
    assert.equal(element.props.publishableKey,publishableKeyFromHost("studio.example.test",keys[kind]));
    assert.equal(element.props.proxyUrl,proxy);
    assert.equal(element.props.signInUrl,"/sign-in");assert.equal(element.props.signUpUrl,"/sign-up");
    assert.equal(variants[kind].metadata.title,branding.name);
    assert.ok(variants[kind].metadata.description.includes(branding.slogan));
    assert.match(renderToStaticMarkup(element),/Public content/);
  }));
  test(`${kind} key: actual homepage and sign-in page server-render inside the actual layout`,()=>offline(async()=>{
    for(const [Page,pattern] of [[variants[kind].HomePage,/Your soul/],[variants[kind].SignInPage,/studio-auth-note/]]){
      const layout=await variants[kind].RootLayout({children:React.createElement(Page)});
      const html=await pageHtml(layout);
      assert.match(html,/<html lang="en">/);assert.match(html,pattern);
    }
  }));
}
test("browser resolves its own hostname instead of a stale server hint",()=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,"window");
  Object.defineProperty(globalThis,"window",{configurable:true,value:{location:{hostname:"browser.example.test"}}});
  try{
    const element=variants.live.StudioAuthProvider({serverHostname:"server.example.test",children:null});
    assert.equal(element.props.publishableKey,publishableKeyFromHost("browser.example.test",keys.live));
    assert.equal(element.props.proxyUrl,proxy);
  }finally{if(previous)Object.defineProperty(globalThis,"window",previous);else delete globalThis.window;}
});
