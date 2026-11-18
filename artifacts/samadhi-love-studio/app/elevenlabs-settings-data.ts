export type MusicAccess = "available" | "unavailable" | "unknown";
export type ConnectionState = "connected" | "disconnected" | "error" | "unchecked";
export type CapabilityResult = { state: MusicAccess; reason: string };
export type CapabilityChecks = { music: CapabilityResult; alignment: CapabilityResult; stems: CapabilityResult };

export type ElevenLabsSettings = {
  owner?: boolean;
  requestId?: string;
  managed?: boolean;
  available: boolean;
  saved: boolean;
  defaultProvider: boolean;
  connection: ConnectionState;
  musicAccess: MusicAccess;
  capabilities?: CapabilityChecks;
  checkedAt?: string;
  accountMessage?: string;
  musicMessage?: string;
  error?: string;
  usage?: { tier?: string; used: number; limit: number };
};
export const pendingKeyMessage="Key saved — not verified yet. ElevenLabs didn't answer in time; press Test connection again in a moment.";
