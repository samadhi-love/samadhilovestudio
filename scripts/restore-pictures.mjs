// Puts pictures back into public/candidates from the App Storage backup.
// Only missing or changed files are written. Run from the site folder:  node scripts/restore-pictures.mjs
import { getStore } from "../lib/store.js";
import { restorePictures } from "../lib/backup.js";

const store = await getStore();
if (!store) { console.error("App Storage is not available. Check STORAGE_BUCKET."); process.exit(1); }
const r = await restorePictures(store, { onlyMissing: !process.argv.includes("--all") });
console.log(`Restored ${r.restored} files, ${r.kept} were already fine, out of ${r.total}.`);
if (r.problems.length) { console.error("Could not restore:", r.problems.join(", ")); process.exit(1); }
