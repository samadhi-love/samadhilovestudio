import { privateAudioSessions } from "../private-audio-sessions";
import { validMixerSession } from "../../../mixer-session";
export const dynamic = "force-dynamic";
const handlers = privateAudioSessions({ namespace: "multitrack-mixer", maxMetadataChars: 300_000, sourceIds: s => s.tracks.map(a => a.id), valid: validMixerSession,
  linkedSongIds:s=>[s.audiovisual?.mediaSong,s.audiovisual?.lyricSource?.song].filter((s):s is string=>!!s),
  names: s => [...s.tracks.map(t => t.name), ...(s.audiovisual ? [s.audiovisual.key,s.audiovisual.artist??"",s.audiovisual.credits??"", ...s.audiovisual.look.cues.flatMap(c => [c.text,c.translation??"",c.transliteration??""]), ...s.audiovisual.markers.map(m => m.name), ...s.audiovisual.feedback.map(f => f.text), ...s.audiovisual.splits.map(p => p.name)] : [])] });
export const GET = handlers.GET;
export const PUT = handlers.PUT;
