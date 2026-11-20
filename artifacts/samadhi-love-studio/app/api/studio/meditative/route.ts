import { privateAudioSessions } from "../private-audio-sessions";
import { validMeditationBlend } from "../../../meditative-data";
export const dynamic = "force-dynamic";
const handlers = privateAudioSessions({ namespace: "meditative-vibes", maxMetadataChars: 12_000, valid: validMeditationBlend, sourceIds: () => [], names: s => [s.vocalNotes] });
export const GET = handlers.GET;
export const PUT = handlers.PUT;
