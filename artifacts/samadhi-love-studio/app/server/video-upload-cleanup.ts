/** Unfinished uploads are kept this long so a save can still resume. */
export const staleVideoUploadMs=7*24*60*60*1000;

type ListingBucket={list(options:{prefix:string;limit:number}):Promise<{objects:{key:string;uploaded:Date}[]}>;delete(keys:string|string[]):Promise<void>};

/**
 * Removes this owner's temporary parts from uploads abandoned for over 7 days.
 * Only the private upload area is touched: finished videos live elsewhere
 * (lyric-assets/) and are never listed here. Best effort — a cleanup problem
 * never stops a new upload.
 */
export async function clearStaleVideoUploads(bucket:unknown,root:string,keep:string|null,now=Date.now()){
  const store=bucket as Partial<ListingBucket>;
  if(typeof store.list!=="function"||typeof store.delete!=="function")return 0;
  try{
    const {objects}=await store.list({prefix:root,limit:500});
    const newest=new Map<string,number>();
    for(const object of objects){
      const id=object.key.slice(root.length).split("/")[0];
      if(!/^[a-f\d-]{36}$/i.test(id))continue;
      newest.set(id,Math.max(newest.get(id)??0,new Date(object.uploaded).getTime()));
    }
    const stale=new Set([...newest].filter(([id,time])=>id!==keep&&now-time>staleVideoUploadMs).map(([id])=>id));
    const keys=objects.map(object=>object.key).filter(key=>stale.has(key.slice(root.length).split("/")[0]));
    for(let index=0;index<keys.length;index+=100)await store.delete(keys.slice(index,index+100));
    return keys.length;
  }catch(error){
    console.warn("Old private upload parts were not cleaned this time",{errorType:error instanceof Error?error.name:"unknown"});
    return 0;
  }
}
