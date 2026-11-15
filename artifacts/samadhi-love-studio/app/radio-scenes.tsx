"use client";
import{useEffect,useState}from"react";
export const radioScenes=["cosmic","ocean","sunrise","forest"]as const;
export type RadioScene=typeof radioScenes[number];
export const radioSceneLooks: Record<RadioScene,{name:string;image:string;position:string}> = {
 cosmic:{name:"Deep-space nebula",image:"/studio-scenes/nebula.webp",position:"68% 50%"},
 ocean:{name:"Golden-hour coast",image:"/radio-scenes/golden-coast.webp",position:"65% 55%"},
 sunrise:{name:"Mountain sunrise",image:"/radio-scenes/mountain-sunrise.webp",position:"65% 40%"},
 forest:{name:"Sunlit cedar forest",image:"/radio-scenes/cedar-forest.webp",position:"65% 50%"},
};
export function dailyRadioScene(time:number):RadioScene{return radioScenes[((Math.floor(time/86400000)%radioScenes.length)+radioScenes.length)%radioScenes.length];}
export function useRadioScene(scope="private"){
 const[mode,setMode]=useState<"daily"|RadioScene>("daily"),[motion,setMotion]=useState(true),[now,setNow]=useState(0);const key="samadhi-radio-scene-"+scope;
 useEffect(()=>{setNow(Date.now());try{const saved=JSON.parse(localStorage.getItem(key)??"null");if(saved&&(saved.mode==="daily"||radioScenes.includes(saved.mode)))setMode(saved.mode);if(saved?.motion===false)setMotion(false);}catch{}const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[key]);
 function update(nextMode:typeof mode,nextMotion:boolean){setMode(nextMode);setMotion(nextMotion);try{localStorage.setItem(key,JSON.stringify({mode:nextMode,motion:nextMotion}));}catch{}}
 return{mode,motion,scene:mode==="daily"?dailyRadioScene(now):mode,choose:(value:typeof mode)=>update(value,motion),animate:(value:boolean)=>update(mode,value)};
}
export function RadioAtmosphere({scene,motion,active}:{scene:RadioScene;motion:boolean;active:boolean}){
 const look=radioSceneLooks[scene];
 return <div className={`radio-scene scene-${scene}`} data-animate={motion&&active} aria-hidden="true">
   <img key={scene} className="radio-scene-image" src={look.image} alt="" decoding="async" style={{objectPosition:look.position}} onError={event=>{event.currentTarget.hidden=true;}}/>
   <i className="scene-atmosphere"/><i className="scene-shade"/>
 </div>;
}
export function RadioSceneControls({settings}:{settings:ReturnType<typeof useRadioScene>}){
 return <div className="radio-scene-settings">
   <div className="radio-scene-controls"><label>Scene<select aria-label="Radio scene" value={settings.mode} onChange={e=>settings.choose(e.target.value as typeof settings.mode)}><option value="daily">Daily rotation · UTC</option>{radioScenes.map(scene=><option key={scene} value={scene}>{radioSceneLooks[scene].name}</option>)}</select></label><label><input type="checkbox" checked={settings.motion} onChange={e=>settings.animate(e.target.checked)}/> Animate scene</label><small>Cinematic stills · gentle camera motion · reduced-motion support</small></div>
   <div className="radio-scene-gallery" role="group" aria-label="Choose a radio scene">{radioScenes.map(scene=>{
     const look=radioSceneLooks[scene];
     return <button type="button" key={scene} className="radio-scene-card" aria-pressed={settings.mode===scene} onClick={()=>settings.choose(scene)}>
       <img src={look.image} alt="" loading="lazy" decoding="async" style={{objectPosition:look.position}} onError={event=>{event.currentTarget.hidden=true;}}/><span>{look.name}</span>{settings.mode===scene&&<b aria-hidden="true">✓</b>}
     </button>;
   })}</div>
 </div>;
}
