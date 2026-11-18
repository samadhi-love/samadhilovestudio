// Existing isolated ownership/provider fixtures; never calls the production Site.
await import('./verify-project-workflow-api.mjs');
import assert from 'node:assert/strict';
const api=await import(new URL('../work/project-workflow-api-tests/workspace.mjs',import.meta.url));
const state=globalThis.__pro;delete state.env.DB;
let checks=0;const check=(v,m)=>{assert(v,m);checks++;};
const req=data=>new Request('https://studio.test/api/studio',{method:'PUT',headers:{Origin:'https://studio.test','X-Studio-Deletion-Policy':'14-days-v1','Content-Type':'application/json'},body:JSON.stringify({revision:state.revision,data})});
const target=state.studio.songs.find(s=>!s.deletedAt&&!state.studio.songs.some(other=>other.id!==s.id&&(other.master?.songId===s.id||other.mixes.some(m=>m.audioSongId===s.id)||other.lyricVideo?.pro?.sourceSongId===s.id)));
check(!!target,'fixture has an independent owned song');
const now=Date.now();let data=structuredClone(state.studio);Object.assign(data.songs.find(s=>s.id===target.id),{deletedAt:'2000-01-01T00:00:00Z',deleteAfter:'2000-01-02T00:00:00Z'});
const legacyRequest=req(data);legacyRequest.headers.delete('X-Studio-Deletion-Policy');const beforeLegacy=JSON.stringify(state.studio);let legacyResponse=await api.PUT(legacyRequest);check(legacyResponse.status===409&&JSON.stringify(state.studio)===beforeLegacy,'older Archive clients must reload and review the new policy before starting deletion');
let response=await api.PUT(req(data));check(response.ok,'explicit deletion saves');let saved=state.studio.songs.find(s=>s.id===target.id);check(Date.parse(saved.deletedAt)>=now&&Date.parse(saved.deleteAfter)-Date.parse(saved.deletedAt)===30*86400000,'server supplies both dates and ignores a client-forged early deadline');
const deadline=saved.deleteAfter;data=structuredClone(state.studio);data.songs.find(s=>s.id===target.id).deleteAfter='2099-01-01T00:00:00Z';response=await api.PUT(req(data));check(response.ok&&state.studio.songs.find(s=>s.id===target.id).deleteAfter===deadline,'repeated saves cannot extend the recovery window');
data=structuredClone(state.studio);delete data.songs.find(s=>s.id===target.id).deletedAt;response=await api.PUT(req(data));check(response.ok&&!state.studio.songs.find(s=>s.id===target.id).deleteAfter,'restore before expiry clears retention metadata');
state.studio.songs.find(s=>s.id===target.id).deletedAt='2000-01-01T00:00:00Z';state.studio.songs.find(s=>s.id===target.id).deleteAfter='2000-01-15T00:00:00Z';data=structuredClone(state.studio);delete data.songs.find(s=>s.id===target.id).deletedAt;const before=JSON.stringify(state.studio);response=await api.PUT(req(data));check(response.status===409&&JSON.stringify(state.studio)===before,'expired songs cannot be restored, with no writes on rejection');
// Legacy archives receive a new recovery period rather than being purged immediately.
delete state.studio.songs.find(s=>s.id===target.id).deleteAfter;response=await api.GET();check(response.ok&&Date.parse(state.studio.songs.find(s=>s.id===target.id).deleteAfter)>Date.now(),'legacy archive upgrade grants a future deadline');
data=structuredClone(state.studio);data.songs=data.songs.filter(s=>s.id!==target.id);response=await api.PUT(req(data));check(response.ok&&state.studio.songs.some(s=>s.id===target.id),'omission by an older client cannot permanently remove an existing creation');
console.log(JSON.stringify({checks,status:'passed',scope:'isolated deletion API validation and restore/grace behavior'}));
