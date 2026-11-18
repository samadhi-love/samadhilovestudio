export type MusicEngine="ace-step"|"elevenlabs";
export type MusicEngineStatus={
  owner:boolean;preferred:MusicEngine;engine:MusicEngine;configured:boolean;notice:string;
};
export const disconnectedEngine:MusicEngineStatus={owner:false,preferred:"elevenlabs",engine:"elevenlabs",configured:false,notice:""};
// Only expose controls backed by this exact model's documented input schema.
// ACE-Step 1.5 turbo ignores guidance_scale and has no audio-reference input.
export const engineCapabilities={
  "ace-step":{negativeStyle:true,spark:true,stayTrue:false,melodyReference:false,voiceIdentity:false},
  elevenlabs:{negativeStyle:true,spark:false,stayTrue:false,melodyReference:false,voiceIdentity:false},
} as const;
