export type MusicEngine="ace-step"|"elevenlabs";
export type MusicEngineStatus={
  owner:boolean;preferred:MusicEngine;engine:MusicEngine;configured:boolean;notice:string;
};
export const disconnectedEngine:MusicEngineStatus={owner:false,preferred:"elevenlabs",engine:"elevenlabs",configured:false,notice:""};
