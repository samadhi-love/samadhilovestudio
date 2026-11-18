import {readFile,writeFile} from "node:fs/promises";
import path from "node:path";

const escapeHtml=value=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

/** The static, deliberately offline vault helper must not fetch branding at runtime. */
export async function syncBrandNotices(root) {
  const brand=JSON.parse(await readFile(path.join(root,"brand.json"),"utf8"));
  for(const field of ["name","slogan","subline"])
    if(typeof brand[field]!=="string"||!brand[field].trim())throw new Error(`brand.json is missing ${field}.`);
  for(const file of ["vault-key-setup.html","audio-licenses.html"]){
    const location=path.join(root,"public",file),original=await readFile(location,"utf8");
    const updated=original
      .replace(/(<title data-brand-title="([^"]+)">)[^<]*(<\/title>)/g,(_match,open,prefix,close)=>open+prefix+" · "+escapeHtml(brand.name)+close)
      .replace(/(<span data-brand-name>)[^<]*(<\/span>)/g,(_match,open,close)=>open+escapeHtml(brand.name)+close);
    if(updated!==original)await writeFile(location,updated);
  }
}
