import type {LyricProject} from './lyric-video-data';
import {newProSettings,type ProSettings} from './lyric-pro-data';
import type {Song} from './studio-data';
export type VideoExportRecord=NonNullable<ProSettings['exports']>[number];
/** One immutable export history for both editors. Never mutate the open project's array. */
export function registerVideoExport(song:Song,project:LyricProject,record:VideoExportRecord,duration:number):LyricProject{
 const pro=project.pro??newProSettings(song,duration);
 const exports=[...(pro.exports??[]).filter(e=>e.id!==record.id&&(!record.asset||e.asset!==record.asset)),record].slice(-30);
 return{...project,pro:{...pro,exports}};
}
