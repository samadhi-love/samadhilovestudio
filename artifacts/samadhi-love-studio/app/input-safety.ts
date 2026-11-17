// These are early usability checks, not a replacement for server limits,
// decoded-media checks, JSON schema validation or ZIP expansion limits.
const MiB=1024*1024;
export function pickedFileProblem(file:{name:string;type:string;size:number},accept:string) {
  if(!Number.isFinite(file.size)||file.size<1)return "This file is empty. Choose a file with content.";
  const type=file.type.split(";")[0].toLowerCase(),name=file.name.toLowerCase();
  const allowed=accept.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(allowed.length&&!allowed.some(rule=>rule.startsWith(".")?name.endsWith(rule):rule.endsWith("/*")?type.startsWith(rule.slice(0,-1)):type===rule))
    return "This file type is not supported here. Choose one of the formats listed for this field.";
  const limit=type.startsWith("image/")||/\.(png|jpe?g|webp)$/i.test(name)?15*MiB:
    /\.(mid|midi)$/i.test(name)?2*MiB:
    type==="application/json"||name.endsWith(".json")?5*MiB:
    type.startsWith("video/")||/\.(mp4|mov)$/i.test(name)||name.endsWith(".zip")?120*MiB:96*MiB;
  return file.size>limit?`This file is too large. Choose a file up to ${limit/MiB} MB.`:null;
}
export function installInputSafety(doc:Document=document) {
  const constructors=doc.defaultView!;
  const guarded=new WeakSet<object>();
  const change=(event:Event)=>{
    const target=event.target;
    if(!(target instanceof constructors.HTMLInputElement||target instanceof constructors.HTMLTextAreaElement||target instanceof constructors.HTMLSelectElement))return;
    if(guarded.has(target)){target.setCustomValidity("");guarded.delete(target);}
    if(target instanceof constructors.HTMLInputElement&&target.type==="file"){
      const problem=Array.from(target.files??[]).map(file=>pickedFileProblem(file,target.accept)).find(Boolean);
      if(problem){event.preventDefault();event.stopImmediatePropagation();target.setCustomValidity(problem);guarded.add(target);target.reportValidity();}
    }
  };
  const submit=(event:Event)=>{
    const form=event.target;
    if(!(form instanceof constructors.HTMLFormElement))return;
    for(const item of Array.from(form.elements)){
      if(!(item instanceof constructors.HTMLInputElement||item instanceof constructors.HTMLTextAreaElement||item instanceof constructors.HTMLSelectElement)||item.matches(":disabled"))continue;
      // Do not trim passwords or alter submitted content.
      if(item.required&&(item instanceof constructors.HTMLTextAreaElement||item instanceof constructors.HTMLInputElement&&["text","email","url","search","tel"].includes(item.type))&&!item.value.trim()){
        item.setCustomValidity("Please fill in this field before continuing.");
        guarded.add(item);
      }
      if(!item.checkValidity()){event.preventDefault();event.stopImmediatePropagation();item.reportValidity();return;}
    }
  };
  doc.addEventListener("change",change,true);doc.addEventListener("input",change,true);doc.addEventListener("submit",submit,true);
  return()=>{doc.removeEventListener("change",change,true);doc.removeEventListener("input",change,true);doc.removeEventListener("submit",submit,true);};
}
