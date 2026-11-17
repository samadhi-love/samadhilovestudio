// Internal binding-compatible service wrapper; contains no ambient bindings.
import { retryRead, readOnlySql } from "../../scripts/storage/retry.mjs";
const wrappers = new WeakMap<object, object>();
function statement<T extends object>(value:T,sql:string):T {
  return new Proxy(value,{get(target,key){
    const member=Reflect.get(target,key,target);
    if(typeof member!=="function")return member;
    if(key==="bind")return (...args:unknown[])=>statement(member.apply(target,args),sql);
    if(["all","first","raw"].includes(String(key))&&readOnlySql(sql))
      return (...args:unknown[])=>retryRead(()=>member.apply(target,args));
    return member.bind(target);
  }});
}
function service<T extends object>(value:T,kind:string):T {
  let wrapped=wrappers.get(value);
  if(!wrapped){
    wrapped=new Proxy(value,{get(target,key){
      const member=Reflect.get(target,key,target);
      if(typeof member==="function"&&kind==="DB"&&key==="prepare")
        return (sql:string)=>statement(member.call(target,sql),sql);
      if(typeof member==="function"&&kind==="BUCKET"&&["get","head","list","checkAccess"].includes(String(key)))
        return (...args:unknown[])=>retryRead(()=>member.apply(target,args));
      return typeof member==="function"?member.bind(target):member;
    }});
    wrappers.set(value,wrapped);
  }
  return wrapped as T;
}
export function storageBindings<T extends {DB?:D1Database;BUCKET?:R2Bucket}>(source:T):T {
  return new Proxy(source,{get(target,key){
    const value=Reflect.get(target,key,target);
    return (key==="DB"||key==="BUCKET")&&value?service(value,String(key)):value;
  }});
}
