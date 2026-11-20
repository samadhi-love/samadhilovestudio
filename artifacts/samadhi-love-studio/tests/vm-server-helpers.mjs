// Evaluate the real shared boundaries inside existing isolated VM fixtures.
import {readFileSync,existsSync} from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import {createRequire} from "node:module";
const nodeRequire=createRequire(import.meta.url);
function compile(file,globals){
  // Some DOM suites bundle this fixture under generated-artifacts, changing
  // import.meta.url. Resolve the checked-in source from the test working dir.
  const source=[path.resolve("app/server",file),path.resolve("artifacts/samadhi-love-studio/app/server",file)].find(existsSync);
  if(!source)throw new Error("Shared server test source could not be located.");
  const {outputText}=ts.transpileModule(readFileSync(source,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  const exports={};vm.runInNewContext(outputText,{exports,URL,Request,Response,Headers,AbortSignal,setTimeout,clearTimeout,...globals,require(name){
    if(name==="./provider-check-diagnostics")return compile("provider-check-diagnostics.ts",globals);
    if(name==="./request-context")return compile("request-context.ts",globals);
    if(name.startsWith("node:"))return nodeRequire(name);
    if(name==="./storage-service")return compile("storage-service.ts",globals);
    if(name==="../../scripts/storage/retry.mjs")return compile("../../scripts/storage/retry.mjs",globals);
    if(globals.require)return globals.require(name);
    throw new Error("Unexpected boundary import "+name);
  }});return exports;
}
export function vmStorage(env){
  return compile("storage.ts",{require(name){if(name!=="cloudflare:workers")throw new Error("Unexpected boundary import");return{env};}});
}
export function vmAI(fetch){
  return compile("ai-provider.ts",{fetch});
}
