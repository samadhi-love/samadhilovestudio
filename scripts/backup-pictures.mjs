// Copies every picture in public/candidates into Replit App Storage and checks each copy.
// Run from the site folder:  node scripts/backup-pictures.mjs
import { getStore } from "../lib/store.js";
import { backupPictures } from "../lib/backup.js";

const store = await getStore();
if (!store) { console.error("App Storage is not available. Check STORAGE_BUCKET."); process.exit(1); }
const r = await backupPictures(store);
console.log(`Backed up ${r.count} files (${(r.bytes / 1048576).toFixed(1)} MB) to backups/pictures/latest and backups/pictures/${r.date}.`);
if (r.problems.length) { console.error("These copies did not match and need another try:", r.problems.join(", ")); process.exit(1); }
console.log("Every copy was read back and matched its original.");
