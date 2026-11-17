export type MusicAccess = "available" | "unavailable" | "unknown";
export type ConnectionState = "connected" | "disconnected" | "error" | "unchecked";
export type CapabilityResult = { state: MusicAccess; reason: string };
export type CapabilityChecks = { music: CapabilityResult; alignment: CapabilityResult; stems: CapabilityResult };

export type ElevenLabsSettings = {
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
