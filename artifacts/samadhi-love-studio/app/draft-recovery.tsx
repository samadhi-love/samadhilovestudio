"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const Scope = createContext("");
export const useRecoveryScope=()=>useContext(Scope);
export function DraftRecoveryProvider({ scope, children }: { scope: string; children: ReactNode }) {
  return <Scope.Provider value={scope}>{children}</Scope.Provider>;
}
export type RecoveryRecord<T> = { version: 1; at: string; value: T };
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
  const [candidate, setCandidate] = useState<RecoveryRecord<T> | null>(null);
  const [readyKey, setReadyKey] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const restoreRef = useRef(restore); restoreRef.current = restore;
  const generation = useRef(0);
  const snapshots = useRef(new Map<string, { value: T; enabled: boolean; ready: boolean }>());
  if (key) snapshots.current.set(key, { value, enabled, ready: readyKey === key && !candidate });
  useEffect(() => {
    if (!key) return;
    const flush = () => {
      const snapshot = snapshots.current.get(key);
      if (snapshot?.enabled && snapshot.ready) void recoveryStore(key, "write", { version: 1, at: new Date().toISOString(), value: snapshot.value }).catch(() => {});
    };
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush); document.addEventListener("visibilitychange", hidden);
    return () => { flush(); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); };
  }, [key]);
  useEffect(() => {
    let alive = true; generation.current++; setReadyKey(""); setCandidate(null); setStatus("");
    if (!key) return;
    void recoveryStore<T>(key, "read").then(record => {
      if (!alive) return;
      if (record?.version === 1 && (containsBinary(record.value) || JSON.stringify(record.value) !== JSON.stringify(snapshots.current.get(key)?.value))) setCandidate(record);
      setReadyKey(key);
    }).catch(error => { if (alive) { setReadyKey(key); setStatus(error.message); } });
    return () => { alive = false; generation.current++; };
  }, [key]);
  useEffect(() => {
    if (!key || readyKey !== key || candidate || !enabled) return;
    const token = generation.current;
    const timer = setTimeout(() => {
      void recoveryStore(key, "write", { version: 1, at: new Date().toISOString(), value }).then(() => {
        if (token === generation.current) setStatus("Device recovery available");
      }).catch(error => { if (token === generation.current) setStatus(error.message); });
    }, 400);
    return () => clearTimeout(timer);
  }, [key, readyKey, candidate, value, enabled]);
  async function clear() {
    if (!key) return;
    generation.current++;
    try { await recoveryStore(key, "delete"); setCandidate(null); setStatus(""); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Recovery could not clear."); }
  }
  async function recover() {
    if (!candidate || busy) return;
    setBusy(true);
    try { await restoreRef.current(candidate.value); setCandidate(null); setStatus("Draft restored. Review it before saving to your account."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "This draft could not restore. The recovery copy is preserved."); }
    finally { setBusy(false); }
  }
  return { candidate, ready: !!key && readyKey === key && !candidate, status, busy, recover, clear };
}

export function RecoveryPanel({ recovery }: { recovery: ReturnType<typeof useDraftRecovery> }) {
  if (!recovery.candidate && !recovery.status) return null;
  return <aside className="notice recovery-status" aria-label="Draft recovery">
    {recovery.candidate && <><p>A draft from {new Date(recovery.candidate.at).toLocaleString()} is available on this device.</p>
      <div className="actions"><button type="button" className="secondary small" disabled={recovery.busy} onClick={() => void recovery.recover()}>Restore draft</button>
      <button type="button" className="text-button" disabled={recovery.busy} onClick={() => { if (confirm("Discard this recovery copy? Your account's saved project is unchanged.")) void recovery.clear(); }}>Keep current version</button></div></>}
    {recovery.status && <p role="status">{recovery.status}</p>}
    <small>Recovery stays on this device. Save your project to sync it to your account.</small>
  </aside>;
}
