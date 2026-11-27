# SAMADHI LOVE website

Wisdom, light and music for the awakening soul. A separate app from Versual Studio.

## Writing
Read [WRITING-GUIDE.md](WRITING-GUIDE.md) before writing or changing any page.

## Run and check
- Run: `npm install` once (one package: `@replit/object-storage`), then `node server.js` (Node 20+).
- Check: `npm test` (all tests must pass before publishing).

## Settings (Replit Secrets and environment variables; never put them in the code)
| Name | What it does |
| --- | --- |
| `PREVIEW_PASSWORD` | Secret. Locks every page behind a password while the site is a private preview. |
| `SITE_PUBLIC` | Set to `true` only when the site should open to everyone. |
| `OWNER_PASSWORD` | Secret, at least 10 characters. Switches on the owner page at `/owner`. |
| `STORAGE_BUCKET` | The Replit App Storage bucket ID, where posts, uploads and the picture backup are kept. |
| `STUDIO_URL` | Where `/studio` sends visitors (defaults to the Versual Studio Replit link). |
| `CONTACT_EMAIL` | Optional. Shows this email on the Contact page. |
| `STORE_DIR` | Tests only: keeps storage in a local folder instead of App Storage. |

## Where things live
- Teachings and encyclopedia text: `lib/content.js`, `lib/encyclopedia.js`, `lib/kriya.js`, `lib/starnations.js`, sayings in `lib/wisdom.js`.
- Pages and layout: `lib/pages.js`; styles `public/site.css`; cosmic scenes `public/sky.js`.
- Owner page (sign-in, posting, uploads, export): `lib/owner.js`, `lib/posts.js`, `lib/forms.js`, `public/owner.js`.
- YouTube, podcasts and social links set in code: `lib/media.js` (the owner page can also set them).

## Pictures and their backup
Pictures live in `public/candidates/<folder>/`, with their credits in `public/candidates/candidates.json`. They are **not** in GitHub, so they are backed up in Replit App Storage:
- Back up: `npm run backup:pictures` copies every picture to `backups/pictures/latest/` and a dated folder, reads each copy back, and checks it.
- Restore: `npm run restore:pictures` puts back any missing or changed picture (`-- --all` to rewrite every file).
- Download a zip to your own computer: sign in at `/owner` and tap **Download pictures (zip)**.

## Star family portraits and star maps
- `lib/starmaps.js` draws the star map for each of the six star homes from real star positions; it sits beside the telescope photo under "Their home in the sky".
- `scripts/paint-star-families.mjs` paints 3 portraits per star family (18) with FLUX 1.1 Pro Ultra on fal.ai. Needs `FAL_KEY` in Replit Secrets. Run `node scripts/paint-star-families.mjs`; it skips pictures already painted and never deletes anything. The portraits appear first in Choose your pictures (/owner/choose).
- To show a chosen portrait on a page, add it to `portraitPicks` in `lib/pictures.js`. Until then the page keeps its drawn figure.
