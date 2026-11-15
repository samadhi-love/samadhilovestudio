import type {VisualSignal} from './av-signals';
export const stemTargets={light:'Background glow',lyrics:'Lyric pulse',camera:'Gentle camera pulse',color:'Color accent'} as const;
export type ReactiveStem={source:string;role:'vocals'|'drums'|'bass'|'other';feature:'energy'|'attack';target?:keyof typeof stemTargets;amount:number;offset:number;energy:number[];attack:number[]};
export function validReactiveStem(v:unknown):v is ReactiveStem{const s=v as ReactiveStem;return !!s&&typeof s.source==='string'&&/^[\w-]{1,100}$/.test(s.source)&&['vocals','drums','bass','other'].includes(s.role)&&['energy','attack'].includes(s.feature)&&(s.target===undefined||Object.hasOwn(stemTargets,s.target))&&Number.isFinite(s.amount)&&s.amount>=0&&s.amount<=1&&Number.isFinite(s.offset)&&Math.abs(s.offset)<=2&&[s.energy,s.attack].every(a=>Array.isArray(a)&&a.length>0&&a.length<=12001&&a.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1))&&s.energy.length===s.attack.length;}
export function stemLight(s:ReactiveStem|undefined,source:string,time:number){if(!s||s.source!==source)return 0;const t=(time+s.offset)*20,index=Math.floor(t);if(index<0||index>=s.energy.length)return 0;if(s.feature==='energy')return ((s.energy[index]??0)*(1-(t-index))+(s.energy[index+1]??s.energy[index])*(t-index))*s.amount;let peak=0;for(let i=Math.max(0,index-4);i<=index;i++)peak=Math.max(peak,s.attack[i]*Math.exp(-(t-i)/2));return Math.min(1,peak*s.amount);}
export function stemVisualSignal(s:ReactiveStem|undefined,source:string,time:number,still=false):VisualSignal|undefined{
  if(still)return;const value=stemLight(s,source,time);if(!value)return;
  return {camera:0,light:0,lyrics:0,color:0,[s?.target??'light']:value};
}
