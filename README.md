# SAMADHI LOVE website

Wisdom, light and music for the awakening soul. A separate app from Versual Studio.

- Run: `node server.js` (Node 20+, no packages to install)
- Check: `node --test tests/*.test.js`
- Private preview: every page asks for a password until `SITE_PUBLIC=true`.
  Set the password in Replit Secrets as `PREVIEW_PASSWORD`. Never put it in the code.
- `/studio` sends visitors to Versual Studio (`STUDIO_URL`, defaults to the current Replit link).
- Optional: `CONTACT_EMAIL` shows an email address on the Contact page.

Teachings live in `lib/content.js`. Cosmic scenes are drawn by `public/sky.js`.
