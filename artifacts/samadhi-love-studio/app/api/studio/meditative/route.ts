import { privateAudioSessions } from "../private-audio-sessions";
import { validMeditationBlend } from "../../../meditative-data";
import { traced } from "../../../server/request-context";
export const dynamic = "force-dynamic";
const handlers = privateAudioSessions({ namespace: "meditative-vibes", maxMetadataChars: 12_000, valid: validMeditationBlend, sourceIds: () => [], names: s => [s.vocalNotes] });
export const GET=traced(handlers.GET);
export const PUT=traced(handlers.PUT);
