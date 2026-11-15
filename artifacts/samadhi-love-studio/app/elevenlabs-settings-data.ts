export type MusicAccess = "available" | "unavailable" | "unknown";
export type ConnectionState = "connected" | "disconnected" | "error" | "unchecked";

export type ElevenLabsSettings = {
  managed?: boolean;
  available: boolean;
  saved: boolean;
  defaultProvider: boolean;
  connection: ConnectionState;
  musicAccess: MusicAccess;
  checkedAt?: string;
  accountMessage?: string;
  musicMessage?: string;
  error?: string;
  usage?: { tier?: string; used: number; limit: number };
};
