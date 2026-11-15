import type {LyricProject} from "./lyric-video-data";
export function soundtrackIdentity(project:LyricProject){const p=project.pro;return p?`${p.sourceSongId}:${p.sourceAudioId}:${p.useEnhancedSoundtrack?p.soundtrackAsset??"":"original"}`:"";}
