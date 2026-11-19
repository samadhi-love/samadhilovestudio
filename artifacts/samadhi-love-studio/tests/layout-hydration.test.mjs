import test from "node:test";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {build} from "esbuild";
import React,{act} from "react";
import {renderToString} from "react-dom/server";
import {JSDOM} from "jsdom";

const directory="generated-artifacts/tests/layout-hydration";
mkdirSync(directory,{recursive:true});
await build({
  entryPoints:["app/layout.tsx"],outfile:`${directory}/layout.mjs`,
  bundle:true,platform:"node",format:"esm",jsx:"automatic",packages:"external",
  plugins:[{name:"isolated-layout",setup(builder){
    builder.onResolve({filter:/\.css$/},()=>({path:"css",namespace:"fixture"}));
    builder.onResolve({filter:/^next\/headers$/},()=>({path:"headers",namespace:"fixture"}));
    builder.onResolve({filter:/\/server\/storage$/},()=>({path:"storage",namespace:"fixture"}));
    builder.onResolve({filter:/\/(?:auth-provider|studio-error-boundary|cosmic-channel)$/},({path})=>({path:path.split("/").at(-1),namespace:"fixture"}));
    builder.onLoad({filter:/.*/,namespace:"fixture"},({path})=>({contents:{
      css:"",
      headers:'export async function headers(){return new Headers({host:"studio.example.test"});}',
      storage:"export const serverStorage={};",
      "auth-provider":"export function StudioAuthProvider({children}){return children;}",
      "studio-error-boundary":"export function StudioErrorBoundary({children}){return children;}",
      "cosmic-channel":"export function CosmicChannel(){return null;}",
    }[path],loader:"js"}));
  }}],
});
const {default:RootLayout}=await import(`../${directory}/layout.mjs`);

for(const page of ["Welcome to Versual Studio","Begin a song"]){
  test(`preview-injected head script does not break hydration: ${page}`,async()=>{
    // Render the actual layout; isolate authentication and decorative effects.
    // No real sessions, provider requests or browser-testing credits are used.
    const tree=await RootLayout({children:React.createElement("main",{id:"route"},page)});
    const dom=new JSDOM("<!doctype html>"+renderToString(tree),{url:"https://studio.example.test/"});
    const font=dom.window.document.querySelector('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
    assert.ok(font,"the existing font stylesheet remains present");
    // Vite RSC promotes server stylesheets to resources. A plain client-side
    // link then skips that resource during hydration and hits the preview script.
    if(!font.hasAttribute("data-precedence"))font.setAttribute("data-precedence","default");
    if(page==="Begin a song"){
      const imported=dom.window.document.createElement("link");
      imported.rel="stylesheet";imported.href="/app/creator-workspace.css";
      imported.setAttribute("data-precedence","vite-rsc/importer-resources");
      dom.window.document.head.prepend(imported);
    }
    const injected=dom.window.document.createElement("script");
    injected.src="/__replco/static/devtools/injected.js";
    font.before(injected);
    const globals={window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,IS_REACT_ACT_ENVIRONMENT:true};
    const previous=Object.fromEntries(Object.keys(globals).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
    Object.assign(globalThis,globals);
    const errors=[];
    let root;
    try{
      const {hydrateRoot}=await import("react-dom/client");
      await act(async()=>{
        root=hydrateRoot(dom.window.document,tree,{onRecoverableError:error=>errors.push(error.message)});
        font.dispatchEvent(new dom.window.Event("load"));
        await new Promise(resolve=>setTimeout(resolve,0));
      });
      assert.deepEqual(errors,[],"external preview scripts must not force a client regeneration");
      assert.equal(dom.window.document.querySelector("#route")?.textContent,page);
      assert.equal(dom.window.document.querySelector('script[src="/__replco/static/devtools/injected.js"]'),injected);
      assert.equal(dom.window.document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]').length,1);
      if(page==="Begin a song")assert.ok(dom.window.document.querySelector('link[href="/app/creator-workspace.css"]'),"framework styles remain untouched");
    }finally{
      if(root)await act(async()=>root.unmount());
      for(const [key,descriptor] of Object.entries(previous)){
        if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
      }
      dom.window.close();
    }
  });
}
