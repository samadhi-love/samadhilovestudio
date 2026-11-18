import {hasExplicitWords} from "./clean-content";
/** Compare leaves, not whole songs/arrays. Existing flagged text stays editable. */
export function changedCleanField(value:unknown,old:unknown,path="",depth=0):string|null{
  if(value===old||JSON.stringify(value)===JSON.stringify(old))return null;
  if(typeof value==="string")return hasExplicitWords(value)?path:null;
  if(depth>12||!value||typeof value!=="object")return null;
  if(Array.isArray(value)){
    const before=Array.isArray(old)?old:[];
    for(let i=0;i<value.length;i++){
      const item=value[i];
      const prior=item&&typeof item==="object"&&"id" in item?before.find(x=>x&&typeof x==="object"&&x.id===item.id):
        typeof item==="string"&&before.includes(item)?item:before[i];
      const found=changedCleanField(item,prior,`${path}[${i}]`,depth+1);
      if(found)return found;
    }
    return null;
  }
  const before=old&&typeof old==="object"?old as Record<string,unknown>:{};
  for(const [key,item] of Object.entries(value)){
    const found=changedCleanField(item,before[key],path?`${path}.${key}`:key,depth+1);
    if(found)return found;
  }
  return null;
}
