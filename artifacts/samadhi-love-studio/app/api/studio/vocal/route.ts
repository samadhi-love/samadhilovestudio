import { privateAudioSessions } from "../private-audio-sessions";
import { validSession } from "../../../vocal/session";
export const dynamic = "force-dynamic";
const handlers = privateAudioSessions({ namespace: "vocal-studio", sourceIds: s => s.sources.map(a => a.id), valid: validSession, names: s => [...s.clips.map(c => c.name), ...s.presets.map(p => p.name)] });
export const GET = handlers.GET;
export const PUT = handlers.PUT;
