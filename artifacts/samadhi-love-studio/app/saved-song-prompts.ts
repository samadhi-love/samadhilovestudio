import {isMusicalAd,type MusicalAd} from "./musical-ad";
import {emptyNotes,fields,type Song,type Template} from "./studio-data";
import {genreTags} from "./music-genres";
export type PromptDraft={name:string;tags:string[];lyrics:string;idea:string;instruments:string;vocals:string;musicalAd?:MusicalAd;styleDNA?:import("./style-dna").StyleDNA};
export function makeSavedSongPrompt(input:PromptDraft,id:string):Template{return{id,name:(input.name.trim()||"My saved prompt").slice(0,100),description:input.styleDNA?"Private reusable Style DNA: genres, instruments, vocals, tempo and song map. No lyrics copied.":"Private reusable lyrics, musical styles, instruments and vocal directions.",tags:[...input.tags],notes:{...emptyNotes,lyrics:input.lyrics,prompt:input.idea,instruments:input.instruments,vocals:input.vocals,promotion:input.styleDNA?JSON.stringify({kind:"samadhi-style-dna/v1",...input.styleDNA}):input.musicalAd?JSON.stringify({kind:"musical-ad/v1",...input.musicalAd}):""}};}
export function savedPromptFromSong(song:Song):PromptDraft{return{name:song.name,tags:[...song.tags],lyrics:song.notes.lyrics,idea:song.notes.prompt,instruments:song.notes.instruments||/Instruments:\s*([^\n]+)/i.exec(song.notes.prompt)?.[1]?.trim()||"",vocals:song.notes.vocals,...(song.musicalAd?{musicalAd:song.musicalAd}:{})};}
export function sameSavedPrompt(a:Template,b:Template){return JSON.stringify([...a.tags].sort())===JSON.stringify([...b.tags].sort())&&Object.keys(fields).every(key=>a.notes[key as keyof typeof fields]===b.notes[key as keyof typeof fields]);}
export function promptDraftGenres(genre:string){return genreTags(genre);}

export function readSavedAd(text:string):MusicalAd|undefined{try{const value=JSON.parse(text);return value.kind==="musical-ad/v1"&&isMusicalAd(value)?value:undefined;}catch{return undefined;}}
