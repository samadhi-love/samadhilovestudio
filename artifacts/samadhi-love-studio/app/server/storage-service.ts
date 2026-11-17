// Internal binding-compatible service wrapper; contains no ambient bindings.
const wrappers = new WeakMap<object, object>();
function service<T extends object>(value:T):T {
  let wrapped=wrappers.get(value);
  if(!wrapped){
    wrapped=new Proxy(value,{get(target,key){
      const member=Reflect.get(target,key,target);
      return typeof member==="function"?member.bind(target):member;
    }});
    wrappers.set(value,wrapped);
  }
  return wrapped as T;
}
export function storageBindings<T extends {DB?:D1Database;BUCKET?:R2Bucket}>(source:T):T {
  return new Proxy(source,{get(target,key){
    const value=Reflect.get(target,key,target);
    return (key==="DB"||key==="BUCKET")&&value?service(value):value;
  }});
}
