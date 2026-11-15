"use client";
import { useEffect, useRef, useState } from "react";
import { emptyRights, excerptPositions, recognitionExcerpt, rightsUrl, type RecordingMatch, type RightsReview as Review, type RightsStatus } from "./rights-data";
import { assertAudioBudget } from "./audio-resource";
import { sourceUrl } from "./lyric-pro-data";
import type { Song } from "./studio-data";
import { sessionRequest } from "./vocal/storage";
export function RightsReview({ song, audioId }: { song: Song; audioId: string }) {
  const [review,setReview]=useState<Review>({...emptyRights});const [checks,setChecks]=useState<RecordingMatch[]>([]);
  const [available,setAvailable]=useState(false),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[consent,setConsent]=useState(false);
  const [status,setStatus]=useState(""),[error,setError]=useState("");const task=useRef<AbortController|null>(null);
  useEffect(()=>{const controller=new AbortController();task.current=controller;
    sessionRequest<RightsStatus>(rightsUrl(song.id,audioId),{signal:controller.signal}).then(result=>{setReview(result.review??{...emptyRights});setChecks(result.checks);setAvailable(result.available);setLoaded(true);if(result.truncated)setStatus("The saved check history is truncated. A partial history does not establish clearance.");}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
    return()=>{controller.abort();task.current?.abort();};
  },[song.id,audioId]);
  async function saveReview(){setBusy(true);setError("");try{const result=await sessionRequest<{review:Review}>(rightsUrl(song.id,audioId),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(review)});setReview(result.review);setStatus("Your source and permission notes are saved for this recording version. This is your declaration, not a license verification.");}catch(e){setError(e instanceof Error?e.message:"Review could not save.");}finally{setBusy(false);}}
  async function recognize(){if(!consent||!available||busy)return;const controller=new AbortController();task.current=controller;setBusy(true);setChecking(true);setError("");let context:AudioContext|undefined;
    try{setStatus("Loading the selected recording on this device…");const response=await fetch(sourceUrl(song.id,audioId),{signal:controller.signal});if(!response.ok)throw new Error("The selected recording could not load.");
      const blob=await response.blob();controller.signal.throwIfAborted();context=new AudioContext();const audio=await context.decodeAudioData(await blob.arrayBuffer());
      if (audio.duration > 600.1) throw new Error("Excerpt checks support recordings up to ten minutes. Prepare a shorter review recording for longer material.");
      assertAudioBudget([audio]);
      const positions=excerptPositions(audio.duration);let completed=0;
      for(const start of positions){controller.signal.throwIfAborted();setStatus(`Checking excerpt ${completed+1} of ${positions.length} at ${start.toFixed(1)}s…`);const excerpt=recognitionExcerpt(audio,start);
        const result=await sessionRequest<{check:RecordingMatch}>(rightsUrl(song.id,audioId),{method:"POST",signal:controller.signal,headers:{"Content-Type":"audio/wav","X-Recognition-Consent":"yes","X-Excerpt-Start":String(start)},body:new Blob([excerpt.bytes],{type:"audio/wav"})});
        setChecks(previous=>[...previous.filter(c=>!(c.excerptSha256===result.check.excerptSha256&&c.start===result.check.start)),result.check]);completed++;
      }
      setStatus(`${completed} excerpt check(s) completed. Only those excerpts were checked; no copyright clearance was issued.`);
    }catch(e){if(controller.signal.aborted)setStatus("Check canceled. Completed results remain saved; the provider may have processed an excerpt already sent.");else setError(e instanceof Error?e.message:"Recognition could not finish.");}
    finally{if(context&&context.state!=="closed")await context.close();task.current=null;setBusy(false);setChecking(false);}
  }
  return <section className="panel form-panel rights-review" aria-label="Rights and recording matches"><h2>Rights &amp; recording matches · {song.name}</h2>
    <p className="muted">Review the recording, composition, samples, and voices before sharing or distribution. Notes and matches belong to recording version {audioId}.</p>
    <fieldset disabled={busy||!loaded}><div className="field-grid">
      <label className="field">Recording source<select value={review.recording} onChange={e=>setReview({...review,recording:e.target.value as Review["recording"]})}><option value="unknown">Not reviewed</option><option value="original">My original recording</option><option value="licensed">Licensed recording / backing / samples</option><option value="provider">AI provider output — terms reviewed separately</option><option value="cover">Cover or re-recording</option></select></label>
      <label className="field">Composition &amp; lyrics<select value={review.composition} onChange={e=>setReview({...review,composition:e.target.value as Review["composition"]})}><option value="unknown">Not reviewed</option><option value="original">Original writing</option><option value="licensed">Permission or license obtained</option><option value="public-domain">Public domain — verified separately</option><option value="cover">Cover / adaptation — review required</option></select></label>
      <label className="field">Voice permissions<select value={review.voices} onChange={e=>setReview({...review,voices:e.target.value as Review["voices"]})}><option value="unknown">Not reviewed</option><option value="self">My own voice</option><option value="permission">Permission from other performers</option><option value="none">No human voice used</option></select></label>
    </div><label className="field">Permission / license references<textarea rows={3} maxLength={4000} value={review.notes} onChange={e=>setReview({...review,notes:e.target.value})} placeholder="Record the backing/sample license, collaborators, AI provider plan, and any cover permissions. Do not paste private credentials."/></label>
    <button type="button" className="secondary" onClick={()=>void saveReview()}>Save rights notes</button></fieldset>
    <h3>Optional catalog-match check</h3><p className="muted">AudD identifies recordings in its catalog. It does not reliably detect covers, copied lyrics/melodies, voice imitation, or every sample. A match may be your own authorized release. No match means unknown, not copyright-free.</p>
    {loaded&&!available&&<p className="notice">Automatic matching is not connected. The Studio owner needs an AudD account and a server-side API token. Manual rights notes are available now.</p>}
    <label className="checkline"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/> I authorize sending up to three 10-second audio excerpts to AudD for this check. Provider processing may incur charges.</label>
    <p className="muted"><a href="https://www.audd.io/resources/concepts/what-recognition-matches" target="_blank" rel="noreferrer">What recognition can identify</a> · <a href="https://audd.io/privacy/" target="_blank" rel="noreferrer">AudD privacy</a> · 12 excerpt attempts per account per UTC day.</p>
    <div className="actions"><button type="button" className="secondary" disabled={!loaded||!available||!consent||busy} onClick={()=>void recognize()}>Check selected recording excerpts</button>{checking&&<button type="button" className="secondary" onClick={()=>task.current?.abort()}>Cancel check</button>}</div>
    {!!checks.length&&<ul className="rights-results">{[...checks].sort((a,b)=>b.checkedAt.localeCompare(a.checkedAt)).map(c=><li key={c.start+":"+c.excerptSha256}><strong>{c.status==="match"?"Catalog recording match — review permission":"No catalog match — rights remain unknown"}</strong><span>{c.start.toFixed(1)}–{(c.start+c.duration).toFixed(1)}s · {new Date(c.checkedAt).toLocaleString()}</span>{c.status==="match"&&<p>{c.artist} · {c.title}{c.link&&<> · <a href={c.link} target="_blank" rel="noreferrer">View recording</a></>}</p>}</li>)}</ul>}
    {status&&<p role="status">{status}</p>}{error&&<p className="notice" role="alert">{error}</p>}
  </section>;
}
