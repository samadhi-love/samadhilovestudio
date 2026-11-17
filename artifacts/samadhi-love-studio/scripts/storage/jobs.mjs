// Durable job records only. No polling, worker, provider calls or media changes.
const types=new Set(["music-generation","lyric-sync","video-render"]);
const identifier=value=>typeof value==="string"&&/^[\w-]{1,100}$/.test(value);
const query=(db,sql,...params)=>db.prepare(sql).bind(...params);
// Heartbeats prevent another healthy server's active work being treated as lost.
// Reconciliation records failure only: it never restarts a provider request.
/** @param {any} db @param {number} [now] @param {number} [leaseMs] @param {string} [owner] */
export async function recoverStaleJobs(db,now=Date.now(),leaseMs=600000,owner){
  return query(db,`UPDATE studio_jobs SET status='failed',finished_at=?,updated_at=?,
    error_message=? WHERE status IN ('waiting','working') AND updated_at<?${owner===undefined?"":" AND owner=?"}`,
    now,now,"This attempt was interrupted. Your draft is safe. Check My Songs and provider history; Studio won't replay an uncertain request.",now-leaseMs,...(owner===undefined?[]:[owner])).run();
}
function ownerRequired(owner){if(typeof owner!=="string"||!owner.trim()||owner.length>512)throw new Error("A verified job owner is required.");}
export async function readJob(db,owner,id) {
  ownerRequired(owner);if(!identifier(id))throw new Error("Invalid job ID.");
  return query(db,"SELECT * FROM studio_jobs WHERE owner=? AND id=?",owner,id).first();
}
export async function createJob(db,owner,{id=crypto.randomUUID(),type,songId},now=Date.now()) {
  ownerRequired(owner);
  if(!identifier(id)||!identifier(songId)||!types.has(type))throw new Error("Choose a supported job type and owned song.");
  const result=await query(db,`INSERT INTO studio_jobs(id,owner,type,status,attempts,created_at,updated_at,song_id)
    SELECT ?,?,?,'waiting',0,?,?,id FROM studio_songs WHERE owner=? AND id=? AND removed=0
    ON CONFLICT(id) DO NOTHING`,id,owner,type,now,now,owner,songId).run();
  const job=await readJob(db,owner,id);
  if(!job||job.song_id!==songId||job.type!==type)throw new Error("The job could not be created for this song. No processing started.");
  return {job,created:!!result.meta?.changes};
}
export async function createExclusiveJob(db,owner,{id,type,songId},now=Date.now()) {
  ownerRequired(owner);
  if(!identifier(id)||!identifier(songId)||!types.has(type))throw new Error("Choose a supported job type and owned song.");
  const result=await query(db,`INSERT INTO studio_jobs(id,owner,type,status,attempts,created_at,updated_at,song_id)
    SELECT ?,?,?,'waiting',0,?,?,id FROM studio_songs WHERE owner=? AND id=? AND removed=0
    AND NOT EXISTS (SELECT 1 FROM studio_jobs WHERE owner=? AND song_id=? AND type=? AND status IN ('waiting','working'))
    ON CONFLICT(id) DO NOTHING`,id,owner,type,now,now,owner,songId,owner,songId,type).run();
  const job=await readJob(db,owner,id);
  if(!job||job.song_id!==songId||job.type!==type)throw new Error("Work is already running or the song is unavailable. No new processing started.");
  return {job,created:!!result.meta?.changes};
}
export async function updateJob(db,owner,id,expectedStatus,status,{errorMessage}={},now=Date.now()) {
  ownerRequired(owner);
  if(!identifier(id)||!((expectedStatus==="waiting"&&status==="working")||
    (expectedStatus==="working"&&["done","failed"].includes(status))))
    throw new Error("Invalid job state change.");
  if(status==="failed"&&(typeof errorMessage!=="string"||!errorMessage.trim()))
    throw new Error("A plain-language error is required for a failed job.");
  const error=status==="failed"?errorMessage.trim().slice(0,1000):null;
  const result=await query(db,`UPDATE studio_jobs SET status=?,attempts=attempts+?,
    error_message=?,updated_at=?,started_at=CASE WHEN ?='working' THEN ? ELSE started_at END,
    finished_at=CASE WHEN ? IN ('done','failed') THEN ? ELSE NULL END
    WHERE owner=? AND id=? AND status=?`,status,status==="working"?1:0,error,now,status,now,status,now,owner,id,expectedStatus).run();
  if(!result.meta?.changes)throw new Error("This job changed or is unavailable. No work was repeated.");
  return readJob(db,owner,id);
}
export async function listJobs(db,owner,{songId,limit=50}={}) {
  ownerRequired(owner);
  if(songId!==undefined&&!identifier(songId))throw new Error("Invalid song ID.");
  if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error("Choose a job list limit from 1 to 100.");
  const statement=songId?
    query(db,"SELECT * FROM studio_jobs WHERE owner=? AND song_id=? ORDER BY created_at DESC,id LIMIT ?",owner,songId,limit):
    query(db,"SELECT * FROM studio_jobs WHERE owner=? ORDER BY created_at DESC,id LIMIT ?",owner,limit);
  return (await statement.all()).results;
}
