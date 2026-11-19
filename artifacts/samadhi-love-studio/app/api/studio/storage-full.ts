// Legacy saving keeps a whole library in one D1 row. D1 rejects any row or
// string over 2,000,000 bytes, so refuse clearly below that with headroom.
export const maxLegacyRowBytes = 1_900_000;
export class StorageFullError extends Error {
  status = 413;
  constructor() { super("Your song library has reached its current storage limit, so this change was not saved. Your existing songs are safe."); }
}
