import type {Template} from './studio-data';
export const sectionKinds=['Intro','Verse','Pre-Chorus','Chorus','Drop','Bridge','Outro'] as const;
export type SongMap={bpm:number;sections:{name:string;seconds:number}[]};
export type StyleDNA=SongMap&{genres:string[];instruments:string;vocals:string};
export const defaultSongMap:SongMap={bpm:120,sections:[{name:'Intro',seconds:8},{name:'Verse',seconds:32},{name:'Chorus',seconds:32},{name:'Verse',seconds:32},{name:'Chorus',seconds:32},{name:'Bridge',seconds:20},{name:'Chorus',seconds:32},{name:'Outro',seconds:8}]};
export function validSongMap(v:unknown):v is SongMap{const m=v as SongMap;return !!m&&Number.isInteger(m.bpm)&&m.bpm>=40&&m.bpm<=240&&Array.isArray(m.sections)&&m.sections.length>0&&m.sections.length<=16&&m.sections.every(s=>s&&sectionKinds.includes(s.name as typeof sectionKinds[number])&&Number.isInteger(s.seconds)&&s.seconds>=3&&s.seconds<=120)&&mapSeconds(m)<=360;}
export const mapSeconds=(m:SongMap)=>m.sections.reduce((sum,s)=>sum+s.seconds,0);
export function mapArrangement(m:SongMap){if(!validSongMap(m))throw new Error('Choose 40–240 BPM and sections totaling up to six minutes.');return m.sections.map(s=>`[${s.name}]\n{Target approximately ${s.seconds} seconds at ${m.bpm} BPM; musical transition.}`).join('\n\n');}
export function readStyleDNA(t:Template):StyleDNA|undefined{try{const d=JSON.parse(t.notes.promotion);return d.kind==='samadhi-style-dna/v1'&&validSongMap({...d})&&Array.isArray(d.genres)&&d.genres.length<=40&&d.genres.every((g:unknown)=>typeof g==='string'&&g.length<=100)&&typeof d.instruments==='string'&&d.instruments.length<=500&&typeof d.vocals==='string'&&d.vocals.length<=1000?d:undefined;}catch{return;}}
