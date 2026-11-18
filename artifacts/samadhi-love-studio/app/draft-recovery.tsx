"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const Scope = createContext("");
export const useRecoveryScope=()=>useContext(Scope);
export function DraftRecoveryProvider({ scope, children }: { scope: string; children: ReactNode }) {
  return <Scope.Provider value={scope}>{children}</Scope.Provider>;
}
export type RecoveryRecord<T> = { version: 1; at: string; value: T; inactive?:boolean };
function containsBinary(value: unknown): boolean {
  if (value instanceof Blob || value instanceof ArrayBuffer) return true;
  return !!value && typeof value === "object" && Object.values(value).some(containsBinary);
}
let database: Promise<IDBDatabase> | undefined;
function db() {
  if (!database) database = new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error("Device recovery storage is unavailable.")); return; }
    const request = indexedDB.open("samadhi-love-recovery-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => reject(new Error("Device recovery storage could not open."));
  }).catch(error => { database = undefined; throw error; });
  return database;
}
export async function recoveryStore<T>(key: string, mode: "read" | "write" | "delete", value?: RecoveryRecord<T>) {
  const database = await db();
  return new Promise<RecoveryRecord<T> | undefined>((resolve, reject) => {
    const transaction = database.transaction("drafts", mode === "read" ? "readonly" : "readwrite");
    const store = transaction.objectStore("drafts");
    const request = mode === "read" ? store.get(key) : mode === "write" ? store.put(value, key) : store.delete(key);
    transaction.oncomplete = () => resolve(mode === "read" ? request.result : undefined);
    transaction.onerror = () => reject(new Error("Device recovery could not save. Storage may be full."));
    transaction.onabort = () => reject(new Error("Device recovery was interrupted. Keep this tab open and save your project."));
  });
}

export function useDraftRecovery<T>(name: string, value: T, restore: (value: T) => void | Promise<void>, enabled = true) {
  const scope = useContext(Scope);
  const key = scope ? `${encodeURIComponent(scope)}:${name}` : "";
  const [readyKey, setReadyKey] = useState("");
  const [localKey,setLocalKey]=useState("");
  const [status, setStatus] = useState("");
  const restoreRef = useRef(restore); restoreRef.current = restore;
  const generation = useRef(0);
  const writes=useRef(Promise.resolve());
  const snapshots = useRef(new Map<string, { value: T; enabled: boolean; ready: boolean }>());
  if (key) snapshots.current.set(key, { value, enabled, ready: readyKey === key });
  function write(target:string,record:RecoveryRecord<T>){
    const task=writes.current.catch(()=>{}).then(()=>recoveryStore(target,"write",record)).then(()=>{});
    writes.current=task;
    return task;
  }
  useEffect(() => {
    if (!key) return;
    const initial=JSON.stringify(value);
    const flush = () => {
      const snapshot = snapshots.current.get(key);
      if (snapshot?.enabled && (snapshot.ready||JSON.stringify(snapshot.value)!==initial)) void write(key, { version: 1, at: new Date().toISOString(), value: snapshot.value }).catch(() => {});
    };
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush); document.addEventListener("visibilitychange", hidden);
    return () => { flush(); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); };
  }, [key]);
  useEffect(() => {
    let alive = true; const token=++generation.current; setReadyKey("");setLocalKey("");setStatus("");
    if (!key) return;
    const initial=JSON.stringify(snapshots.current.get(key)?.value);
    void recoveryStore<T>(key, "read").then(async record => {
      if (!alive||token!==generation.current) return;
      if(record?.version===1&&!record.inactive){
        setLocalKey(key);
        // Late storage reads must never replace text entered since opening.
        if(JSON.stringify(snapshots.current.get(key)?.value)===initial){
          try{await restoreRef.current(record.value);}
          catch(error){
            // Preserve an unusable old copy privately; it cannot block a form.
            await write(`${key}:preserved:${record.at}`,record);
            setStatus(error instanceof Error?error.message:"The previous device copy could not open.");
          }
        }
      }
      if(!alive||token!==generation.current)return;
      setReadyKey(key);
    }).catch(error => { if (alive) { setReadyKey(key); setStatus(error.message); } });
    return () => { alive = false; generation.current++; };
  }, [key]);
  useEffect(() => {
    if (!key || readyKey !== key || !enabled) return;
    const token = generation.current;
    const timer = setTimeout(() => {
      if(token!==generation.current)return;
      void write(key, { version: 1, at: new Date().toISOString(), value }).then(() => {
        if (token === generation.current) {setLocalKey(key);setStatus("");}
      }).catch(error => { if (token === generation.current) setStatus(error.message); });
    }, 400);
    return () => clearTimeout(timer);
  }, [key, readyKey, value, enabled]);
  async function clear() {
    if (!key) return;
    generation.current++;
    try { await write(key,{version:1,at:new Date().toISOString(),value:snapshots.current.get(key)?.value??value,inactive:true});setStatus(""); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Recovery could not clear."); }
  }
  function reset(next:T){
    void restoreRef.current(next);
    if(!key)return Promise.resolve();
    generation.current++;
    const prior=snapshots.current.get(key)?.value;
    snapshots.current.set(key,{value:next,enabled:true,ready:true});
    setReadyKey(key);setLocalKey(key);setStatus("");
    // New song changes the current form, not the old private recording/text.
    if(prior!==undefined)void write(`${key}:preserved:${new Date().toISOString()}:${crypto.randomUUID()}`,{version:1,at:new Date().toISOString(),value:prior}).catch(()=>{});
    return write(key,{version:1,at:new Date().toISOString(),value:next}).catch(error=>{setStatus(error instanceof Error?error.message:"Writing could not save on this device.");});
  }
  return { value,scope,candidate:null, ready: !key || readyKey === key, hasLocal:!!key&&localKey===key,status,busy:false,recover:async()=>{},clear,reset };
}

/** Compatibility component: writing is resumed automatically, never prompted. */
export function RecoveryPanel<T>(_props: { recovery: ReturnType<typeof useDraftRecovery<T>> }) {return null;}
