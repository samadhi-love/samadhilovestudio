// Beyond the Veil: its own tab in the Library of Light, beside The Human Story.
// Out-of-body travel, near-death experiences, remote viewing, channeling and light language.
// Facts and websites checked Nov 2026. Quotations: King James Bible, MacKenna's Plotinus, published research.
// Teachings are given as the traditions and teachers hold them; Samadhi's own views are marked as his.
// All pictures here are drawn for SAMADHI LOVE in code: light, gentle colours, nothing dark.

function stars(n, w, h, seed) {
  let s = seed, out = "";
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) out += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(r() * 1.3 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * 0.6 + 0.25).toFixed(2)}"/>`;
  return out;
}

const sky = (id, top = "#2b1f55", bottom = "#07060f") =>
  `<radialGradient id="${id}" cx="50%" cy="35%" r="85%"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></radialGradient>`;

const glow = (id, c = "#fff6d6") =>
  `<radialGradient id="${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset=".45" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;

// A gentle figure of light: a head and a softly widening body, no features.
const lightBody = (x, y, s, fill, op = 1) =>
  `<g opacity="${op}"><circle cx="${x}" cy="${y}" r="${11 * s}" fill="${fill}"/><path d="M${x - 19 * s} ${y + 62 * s} Q${x - 17 * s} ${y + 18 * s} ${x} ${y + 15 * s} Q${x + 17 * s} ${y + 18 * s} ${x + 19 * s} ${y + 62 * s} Z" fill="${fill}"/></g>`;

const frame = (id, title, caption, inner, h = 420) =>
  `<figure class="cross-hero veil-figure"><svg viewBox="0 0 720 ${h}" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${title}</title>${inner}</svg><figcaption class="fine">${caption} Drawn for SAMADHI LOVE.</figcaption></figure>`;

function cordArt() {
  return frame("vc", "A body of light rising above a sleeping form, joined to it by a silver cord, under a starry sky",
    "The body of light rises while the physical body rests, joined by the silver cord.",
    `<defs>${sky("vc-sky")}${glow("vc-glow")}<linearGradient id="vc-cord" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#cfd8ff" stop-opacity=".4"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
<linearGradient id="vc-earth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4a"/><stop offset="1" stop-color="#0b1022"/></linearGradient></defs>
<rect width="720" height="420" rx="18" fill="url(#vc-sky)"/>${stars(90, 720, 300, 4242)}
<path d="M0 340 Q180 312 360 326 T720 318 V420 H0 Z" fill="url(#vc-earth)"/>
<g opacity=".55"><ellipse cx="300" cy="338" rx="70" ry="9" fill="#6f7fb8"/><circle cx="236" cy="333" r="10" fill="#6f7fb8"/></g>
<path d="M300 332 C 330 290, 380 250, 420 170" fill="none" stroke="url(#vc-cord)" stroke-width="2.4"/>
<circle cx="430" cy="150" r="120" fill="url(#vc-glow)"/>
${lightBody(430, 118, 1.15, "#fffaf0")}
<g stroke="#fff3c4" stroke-opacity=".5" stroke-width="1.4">${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => { const r1 = 70, r2 = 98, rad = (a * Math.PI) / 180; return `<line x1="${(430 + r1 * Math.cos(rad)).toFixed(1)}" y1="${(150 + r1 * Math.sin(rad)).toFixed(1)}" x2="${(430 + r2 * Math.cos(rad)).toFixed(1)}" y2="${(150 + r2 * Math.sin(rad)).toFixed(1)}"/>`; }).join("")}</g>`);
}

function tunnelArt() {
  const rings = Array.from({ length: 9 }, (_, i) => {
    const k = i / 8, rx = 330 - k * 280, ry = 190 - k * 160;
    return `<ellipse cx="360" cy="210" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="${i % 2 ? "#c9b8ff" : "#ffe9a8"}" stroke-opacity="${(0.15 + k * 0.5).toFixed(2)}" stroke-width="${(1 + k * 2).toFixed(1)}"/>`;
  }).join("");
  return frame("vt", "A tunnel of soft rings opening into a great light, with a small figure of light travelling toward it",
    "The tunnel and the light, as many near-death experiencers describe them.",
    `<defs>${sky("vt-sky", "#31245e")}${glow("vt-glow", "#fffbe8")}</defs>
<rect width="720" height="420" rx="18" fill="url(#vt-sky)"/>${stars(70, 720, 420, 9191)}
${rings}<circle cx="360" cy="210" r="120" fill="url(#vt-glow)"/><circle cx="360" cy="210" r="30" fill="#fffdf4"/>
${lightBody(250, 268, 0.75, "#f6eeff", 0.9)}`);
}

function eyeArt() {
  return frame("ve", "An eye of light above distant mountains and sea, with faint lines reaching out across the land",
    "Seeing at a distance: the inner eye reaching beyond time and place.",
    `<defs>${sky("ve-sky", "#1f2c5c")}${glow("ve-glow", "#fff1c2")}<linearGradient id="ve-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3d6e"/><stop offset="1" stop-color="#0a1428"/></linearGradient></defs>
<rect width="720" height="420" rx="18" fill="url(#ve-sky)"/>${stars(80, 720, 260, 3131)}
<path d="M0 320 L90 250 L160 300 L250 220 L340 300 L420 260 L520 310 L600 240 L720 300 V420 H0 Z" fill="#20305a" opacity=".85"/>
<rect x="0" y="330" width="720" height="90" fill="url(#ve-sea)"/>
<g stroke="#fff3c4" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="4 6"><line x1="360" y1="130" x2="120" y2="300"/><line x1="360" y1="130" x2="250" y2="250"/><line x1="360" y1="130" x2="600" y2="270"/><line x1="360" y1="130" x2="470" y2="360"/></g>
<circle cx="360" cy="130" r="110" fill="url(#ve-glow)"/>
<path d="M270 130 Q360 70 450 130 Q360 190 270 130 Z" fill="#120d24" stroke="#f2c46d" stroke-width="3"/>
<circle cx="360" cy="130" r="26" fill="#f2c46d"/><circle cx="360" cy="130" r="11" fill="#fffaf0"/>`);
}

function voiceArt() {
  return frame("vv", "A column of light coming down from the stars into the heart of a seated figure of light",
    "Channeling: light from beyond received in a quiet, open heart.",
    `<defs>${sky("vv-sky", "#2f2160")}${glow("vv-glow", "#fff4d0")}<linearGradient id="vv-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8" stop-opacity=".9"/><stop offset="1" stop-color="#f2c46d" stop-opacity=".15"/></linearGradient></defs>
<rect width="720" height="420" rx="18" fill="url(#vv-sky)"/>${stars(90, 720, 420, 5151)}
<path d="M330 0 L390 0 L378 250 L342 250 Z" fill="url(#vv-beam)"/>
<circle cx="360" cy="40" r="60" fill="url(#vv-glow)"/>
<circle cx="360" cy="270" r="130" fill="url(#vv-glow)" opacity=".6"/>
${lightBody(360, 205, 1.3, "#fff8ec")}
<g fill="#f6c6dc" opacity=".9"><path d="M360 300 C340 300 318 312 300 326 C330 330 350 322 360 300 Z"/><path d="M360 300 C380 300 402 312 420 326 C390 330 370 322 360 300 Z"/><path d="M360 296 C348 310 348 324 360 334 C372 324 372 310 360 296 Z"/></g>
<path d="M360 262 c-8 -10 -22 -4 -18 8 c3 9 18 16 18 16 s15 -7 18 -16 c4 -12 -10 -18 -18 -8 z" fill="#f28fb0"/>`);
}

function languageArt() {
  const glyphs = [
    [110, 150, `<circle r="16" fill="none"/><circle r="5"/>`],
    [210, 110, `<path d="M-16 12 L0 -16 L16 12 Z" fill="none"/>`],
    [300, 160, `<path d="M-14 0 A14 14 0 1 1 0 14" fill="none"/><path d="M0 14 L0 -2" />`],
    [400, 100, `<path d="M0 -17 L4 -4 L17 0 L4 4 L0 17 L-4 4 L-17 0 L-4 -4 Z" fill="none"/>`],
    [500, 150, `<path d="M-16 0 Q-8 -16 0 0 T16 0" fill="none"/>`],
    [600, 110, `<path d="M0 -16 L14 -6 L9 12 L-9 12 L-14 -6 Z" fill="none"/>`],
    [160, 250, `<path d="M0 0 A3 3 0 0 1 6 0 A6 6 0 0 1 -6 0 A9 9 0 0 1 12 0 A12 12 0 0 1 -12 0" fill="none"/>`],
    [560, 245, `<circle r="15" fill="none"/><path d="M-15 0 L15 0"/>`],
  ].map(([x, y, g]) => `<g transform="translate(${x} ${y})" stroke="#fff3c4" stroke-width="2.4" fill="#fff3c4" opacity=".9">${g}</g>`).join("");
  const waves = [0, 1, 2, 3].map((i) => `<path d="M0 ${300 + i * 18} Q90 ${270 + i * 18} 180 ${300 + i * 18} T360 ${300 + i * 18} T540 ${300 + i * 18} T720 ${300 + i * 18}" fill="none" stroke="${["#ffe9a8", "#c9b8ff", "#9fe7dc", "#f6b8d0"][i]}" stroke-opacity=".7" stroke-width="2"/>`).join("");
  return frame("vl", "Glowing symbols of light floating above flowing waves of sound in many colours",
    "Light language: sound, symbol and feeling carrying light from soul to soul.",
    `<defs>${sky("vl-sky", "#2a2158")}${glow("vl-glow", "#fff4d0")}</defs>
<rect width="720" height="420" rx="18" fill="url(#vl-sky)"/>${stars(70, 720, 420, 7373)}
<circle cx="360" cy="180" r="170" fill="url(#vl-glow)" opacity=".5"/>${glyphs}${waves}`);
}

// Samadhi's own picture: the body of light rising above the sleeping body, joined by the silver cord.
function cordPhoto() {
  return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/silver-cord.jpg" width="1600" height="900" alt="A man asleep in bed in a quiet room while a glowing body of light rises above him, joined to his chest by a shining silver cord" loading="lazy" decoding="async"></div><figcaption class="fine">The body of light rises while the physical body rests, joined by the silver cord. Picture shared by Samadhi.</figcaption></figure>`;
}

const veilPhoto = (src, alt, caption) => () => `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/${src}" width="1600" height="900" alt="${alt}" loading="lazy" decoding="async"></div><figcaption class="fine">${caption} Picture shared by Samadhi.</figcaption></figure>`;
const tunnelPhoto = veilPhoto("veil-tunnel.jpg", "A dark tunnel opening onto a brilliant light, with a white stairway rising into it and angels of light on either side", "The tunnel and the light, as many near-death experiencers describe them.");
const eyePhoto = veilPhoto("veil-eye.jpg", "A great golden eye of light in the sky above mountains and lakes, a beam reaching out across the stars", "Seeing at a distance: the inner eye reaching beyond time and place.");
const languagePhoto = veilPhoto("veil-language.jpg", "Two figures made of light facing each other, golden symbols and waves of light flowing between their hearts", "Light language: sound, symbol and feeling carrying light from soul to soul.");

const channelPhoto = veilPhoto("veil-channeling.jpg", "A robed man with eyes closed and face lifted toward a great beam of light, a glowing heart of light in his chest, golden clouds all around", "Channeling divine light: the heart opened, the light received.");

export function veilArt(key) {
  return { "veil-cord": cordPhoto, "veil-tunnel": tunnelPhoto, "veil-eye": eyePhoto, "veil-voice": channelPhoto, "veil-language": languagePhoto }[key]?.() || "";
}

const care = `*Shared as spiritual teaching. If you are going through deep emotional struggles, or have ever lost touch with what is real, please stay grounded and talk with someone you trust or a professional before trying these practices.*`;

export const beyondTheVeil = [
  { slug: "beyond-the-veil", tag: "Overview", title: "Beyond the Veil: You Are More Than Your Body",
    summary: "Out-of-body travel, near-death experiences, seeing at a distance, voices from the other side and the language of light: five doors that all open onto one truth.",
    body: `{{veil-cord}}

Across every age and every land, people have told the same quiet story: **the self can step beyond the body.** Mystics and saints have done it in prayer. Ordinary people have done it in sleep, in meditation, and at the edge of death. The traditions say this is not strange at all. It is a glimpse of what we really are.

## Five doors, one truth

| Door | What happens | Where it is found |
| --- | --- | --- |
| [Out-of-body travel](/teachings/out-of-body-travel-and-astral-projection) | Awareness leaves the body and travels, then returns | Egypt, the Bible, Kabbalah, yoga, Tibet, the shamans, Robert Monroe |
| [Near-death experiences](/teachings/near-death-experiences) | At the edge of death, the soul glimpses the other side and comes back | Plato's Myth of Er, millions of modern accounts, hospital studies |
| [Remote viewing](/teachings/remote-viewing) | The inner eye sees places and events far away | Seers and prophets of old; the U.S. government's Stargate program |
| [Channeling](/teachings/channeling) | Wisdom from beyond speaks through a person | The oracles, the Kabbalists' heavenly teachers, Edgar Cayce, *A Course in Miracles* |
| [Light language](/teachings/light-language) | The soul speaks and sings in sounds of light beyond words | Speaking in tongues, Hildegard's unknown language, today's light-language healers |

## What they share
- **Consciousness is not bound to the body.** The body is the garment; the soul is the one who wears it.
- **Love is the light on the other side.** Almost everyone who returns speaks of love beyond words.
- **The veil is thin.** What feels like a wall is more like a curtain, and in prayer, meditation and love it grows thinner.
- **Discernment is needed.** Not every voice or vision is from the light, so every tradition teaches us to test what we receive. See [Walking Safely Beyond the Veil](/teachings/walking-safely-beyond-the-veil).

## Samadhi's view
*This is Samadhi's own understanding.*

We are eternal beings having a human experience. These experiences are reminders that the soul was never trapped. It came here by choice, and it already knows the way home. See also [Why We Came: Source Knowing Itself](/teachings/why-we-came).

## Sources

- Ecclesiastes 12:6 and 2 Corinthians 12:2–4, King James Bible.
- The sources for each door are given on its own page.` },

  { slug: "out-of-body-travel-and-astral-projection", tag: "Leaving the body", title: "Out-of-Body Travel and Astral Projection",
    summary: "The soul's body of light, the silver cord, what the traditions teach about travelling beyond the body, and a gentle way to begin.",
    body: `{{veil-cord}}

An **out-of-body experience** (OBE) is the experience of being awake and aware outside your physical body: seeing the room from the ceiling, or travelling to other places and other worlds. **Astral projection** is the older spiritual name for the same thing, done on purpose.

## The body of light
Most traditions teach that we have a finer body within the physical one:
- **Theosophy** calls it the *astral body*.
- **Yoga** speaks of the *sukshma sharira*, the subtle body.
- **Ancient Egypt** pictured the *ba*, the soul as a bird with a human head, flying out from the body and returning to it.

## The silver cord
Many teachers say that during projection a shining cord joins the body of light to the physical body, and that it is only loosed at death. They take its name from Scripture: "Or ever the silver cord be loosed, or the golden bowl be broken" (Ecclesiastes 12:6, KJV).

## What the traditions teach
- **The Bible:** "I knew a man in Christ above fourteen years ago, (whether in the body, I cannot tell; or whether out of the body, I cannot tell: God knoweth;) such an one caught up to the third heaven" (2 Corinthians 12:2, KJV).
- **Islam:** the Prophet's Night Journey and Ascension, the *Isra and Mi'raj* (Qur'an 17:1). Most Muslims hold that it happened in body and spirit; some early voices said it was in spirit.
- **Kabbalah:** the Zohar teaches that every night in sleep the soul rises to the upper worlds and returns in the morning. This is why Jews say at bedtime, "Into thine hand I commit my spirit" (Psalm 31:5). The early Merkavah mystics practised the ascent of the soul through the heavenly palaces.
- **Tibetan Buddhism:** dream yoga and *phowa*, the "transfer of consciousness", are among the Six Yogas of Naropa.
- **Taoism:** the immortals were said to form a "spirit body" that could travel beyond the physical one.
- **The shamans** of every continent: soul-flight to the upper and lower worlds, for healing and guidance.
- **Plotinus:** "Many times it has happened: lifted out of the body into myself" (*Enneads* 4.8.1, MacKenna translation).
- **Kriya Yoga:** in *Autobiography of a Yogi*, chapter 43, the risen Sri Yukteswar describes the astral worlds and the astral body to Yogananda.

## The modern teachers
- **Sylvan Muldoon and Hereward Carrington,** *The Projection of the Astral Body* (1929), the classic early guide.
- **Robert Monroe** (1915–1995), a radio executive whose spontaneous journeys began in 1958. His book *Journeys Out of the Body* (1971) made the term "out-of-body experience" known around the world, and he founded the Monroe Institute in Virginia, whose Gateway program teaches people to explore beyond the body. In 1983 a U.S. Army officer wrote a detailed report on the Gateway Process, released to the public in 2003.
- **Robert Bruce,** *Astral Dynamics*, and **William Buhlman,** *Adventures Beyond the Body*: practical modern guides.

## A gentle way to begin
1. **Pray first.** Ask for protection and guidance, and surround yourself with light.
2. **Relax deeply.** Lie down and let the body fall asleep while the mind stays gently awake. Monroe called this "mind awake, body asleep".
3. **Notice the signs.** Many feel a humming, buzzing or rushing sound, or waves of vibration. Stay calm: this is the subtle body loosening.
4. **Lift out gently.** Imagine floating upward, rolling out to the side, or climbing a rope of light hand over hand.
5. **Stay in love.** Fear pulls you back into the body at once; love and curiosity carry you further.
6. **Return and give thanks.** Move your fingers and toes, feel your body, and write down what you saw.

Many also find their way through **lucid dreams**: becoming aware inside a dream, then choosing to travel.

${care}

## Sources

- Ecclesiastes 12:6, Psalm 31:5 and 2 Corinthians 12:2–4, King James Bible; Qur'an 17:1.
- Plotinus, *Enneads* 4.8.1, translated by Stephen MacKenna, [MIT Internet Classics Archive](https://classics.mit.edu/Plotinus/enneads.html).
- Paramahansa Yogananda, [*Autobiography of a Yogi*](https://www.gutenberg.org/ebooks/7452) (1946), chapter 43.
- Sylvan Muldoon and Hereward Carrington, *The Projection of the Astral Body* (1929).
- Robert Monroe, *Journeys Out of the Body* (1971), *Far Journeys* (1985) and *Ultimate Journey* (1994); [The Monroe Institute](https://www.monroeinstitute.org/).
- Lt. Col. Wayne McDonnell, *Analysis and Assessment of Gateway Process* (US Army, 1983), [CIA Reading Room](https://www.cia.gov/readingroom/print/271687).
- Robert Bruce, *Astral Dynamics* (1999); William Buhlman, *Adventures Beyond the Body* (1996).` },

  { slug: "near-death-experiences", tag: "The other side", title: "Near-Death Experiences: Visits to the Other Side",
    summary: "People who were close to death, or declared dead, tell of leaving the body, a tunnel, a great Light of love, a life review and loved ones waiting. What they saw, and what it taught them.",
    body: `{{veil-tunnel}}

A **near-death experience** (NDE) is a deep, clear experience that some people have when they are close to death, or have even been declared dead, and then come back. Millions of people around the world have had one. They come from every culture, every faith and none, and yet they tell remarkably similar stories.

## What people see
The doctor and philosopher **Raymond Moody** gathered the first large collection of accounts in *Life After Life* (1975), and gave the experience its name. Not everyone has every part, but these are the ones most often told:
- **Leaving the body:** looking down at their own body, often watching the doctors work.
- **Deep peace:** all pain gone, and a feeling of being completely safe.
- **The tunnel:** moving through darkness or a tunnel toward a light.
- **The Light:** a Light brighter than the sun that does not hurt the eyes, felt as pure love. Many call it God.
- **Meeting loved ones:** family who have passed on, or beings of light, come to greet them.
- **The life review:** seeing their whole life at once, and feeling what others felt because of their actions, the kindness and the hurt.
- **The border:** a line they cannot cross, and the knowing that it is not yet their time.
- **The return:** coming back to the body, often unwillingly, with a mission to love.

## How it changes people
Those who return are often changed for life. They lose their fear of death, care less about money and status, and care much more about love, kindness and learning. Many say the one question asked of them was: *how well did you love?*

## What the research has found
Doctors have now studied NDEs carefully in hospitals, and their results support what experiencers say:
- **The Netherlands, 2001.** The cardiologist **Pim van Lommel** followed 344 patients who were brought back after cardiac arrest in ten Dutch hospitals. Sixty-two of them (18%) reported a near-death experience. Two and eight years later, those who had one showed lasting changes in how they lived (*The Lancet*, 2001).
- **The AWARE study, 2014.** Led by **Sam Parnia**, it followed 2,060 cardiac arrests in 15 hospitals in the UK, the US and Austria. One patient's awareness during his cardiac arrest was confirmed and timed by sounds in the room, at a time when his brain was not expected to be working (*Resuscitation*, 2014).
- **The University of Virginia.** The psychiatrist **Bruce Greyson** has researched NDEs there since the mid-1970s, and created the NDE Scale that researchers use around the world.
- **NDERF.** The physician **Jeffrey Long** founded the Near Death Experience Research Foundation in 1998, and has studied thousands of accounts from people of every culture.

## Well-known accounts
- **Plato's Myth of Er:** the oldest written near-death story, about a soldier who comes back to life on his funeral pyre and tells what he saw (*Republic*, Book 10).
- **George Ritchie,** *Return from Tomorrow* (1978): his experience as a young soldier in 1943 inspired Raymond Moody's research.
- **Eben Alexander,** *Proof of Heaven* (2012): a neurosurgeon who journeyed to the other side during a week in a coma in 2008.
- **Anita Moorjani,** *Dying to Be Me* (2012): her experience on the edge of death from cancer, and her teaching that we are love.

## A loving word
Near-death experiences happen by grace. They are never something to seek. Each one reports that this life is precious, that we came here with a purpose, and that the Light waits for us in its own time. If you are struggling and life feels too heavy, please reach out to someone today.

## Samadhi's view
*This is Samadhi's own understanding.*

These accounts are a window home. They show what the masters always taught: there is no death, only a change of garment, and the other side is made of love. See [God Is Pure Love](/teachings/god-is-pure-love).

## Sources

- Raymond Moody, *Life After Life* (1975); George Ritchie, *Return from Tomorrow* (1978); Eben Alexander, *Proof of Heaven* (2012); Anita Moorjani, *Dying to Be Me* (2012).
- Pim van Lommel and others, "Near-death experience in survivors of cardiac arrest: a prospective study in the Netherlands", *The Lancet* 358 (2001).
- Sam Parnia and others, "AWARE: AWAreness during REsuscitation", *Resuscitation* 85 (2014); [University of Southampton news release](https://www.southampton.ac.uk/news/2014/10/07-worlds-largest-near-death-experiences-study.page).
- [University of Virginia, Division of Perceptual Studies: Near-Death Experiences](https://med.virginia.edu/perceptual-studies/our-research/near-death-experiences-ndes/).
- [Near Death Experience Research Foundation (NDERF)](https://www.nderf.org/); Jeffrey Long, ["Near-Death Experiences: Evidence for Their Reality"](https://pmc.ncbi.nlm.nih.gov/articles/PMC6172100), *Missouri Medicine* (2014).
- [International Association for Near-Death Studies (IANDS)](https://www.iands.org/).
- Plato, [*Republic*](https://classics.mit.edu/Plato/republic.html), Book 10.` },

  { slug: "remote-viewing", tag: "The inner eye", title: "Remote Viewing: Seeing at a Distance",
    summary: "The seers of old saw far-off places with the inner eye. In the 1970s the U.S. government trained people to do the same, in a secret program later called Stargate.",
    body: `{{veil-eye}}

**Remote viewing** is the ability to see places, people or events that are far away, hidden, or even in the future, using the mind alone. The old name is *clairvoyance*, "clear seeing".

## The seers of old
- **The prophets:** when the servant of the prophet Elisha secretly took gifts, Elisha said, "Went not mine heart with thee?" (2 Kings 5:26, KJV). Later he told the king of Israel the words the enemy king spoke in his bedchamber (2 Kings 6:12).
- **The yogis:** Patanjali's *Yoga Sutras* (3.25) teach that through deep concentration the yogi can know what is subtle, hidden and far away.
- **The third eye:** many traditions place this sight in the *ajna* chakra between the eyebrows. See [Third eye Chakra: Ajna](/teachings/chakra-third-eye).

## Stargate: the government's psychic spies
In 1972, the physicists **Harold Puthoff** and **Russell Targ** began studying psychic perception at the Stanford Research Institute (SRI) in California. Their first great subject was the New York artist **Ingo Swann**. Puthoff called the technique "remote viewing", to avoid the old words of the séance room. At first Swann worked from nothing but a site's map coordinates.

Another gifted viewer, the former police commissioner **Pat Price**, drew sites he had never seen. U.S. intelligence agencies became interested, and over more than twenty years the work continued under a series of code names: Gondola Wish, Grill Flame, Center Lane, Sun Streak, and finally **Stargate**. Soldiers such as **Joseph McMoneagle**, "Remote Viewer No. 1", were trained to view targets for the Army. The program ended and was made public in 1995, and many of its papers can now be read in the CIA's online Reading Room.

## How remote viewing is practised
1. **A target** is chosen by someone else and hidden from the viewer, often as a number.
2. **The viewer becomes still,** and lets the first impressions come: shapes, colours, textures, sounds, feelings.
3. **They draw and write** what comes, without trying to name it too soon, because the thinking mind likes to guess.
4. **Then they check** against the real target, and learn from every session.

## Samadhi's view
*This is Samadhi's own understanding.*

The soul is not limited to the place where the body stands. When the mind is still and the heart is clear, we can see with the inner eye. This gift is meant for healing and for good, never to spy on or control another soul.

${care}

## Sources

- 2 Kings 5:26 and 6:12, King James Bible; Patanjali, *Yoga Sutras* 3.25.
- ["US Use of 'Psychic Spies' Reported"](https://www.cia.gov/readingroom/document/cia-rdp96-00791r000100030073-5), in the CIA Reading Room's Stargate collection.
- Harold Puthoff and Russell Targ, "A Perceptual Channel for Information Transfer over Kilometer Distances", *Proceedings of the IEEE* 64 (1976).
- Russell Targ and Harold Puthoff, *Mind-Reach* (1977); Joseph McMoneagle, *Remote Viewing Secrets* (2000); Ingo Swann, *Penetration* (1998).` },

  { slug: "channeling", tag: "Voices from beyond", title: "Channeling: Voices from the Other Side",
    summary: "From the oracle of Delphi to Edgar Cayce, Seth, Abraham, Bashar and A Course in Miracles: wisdom that speaks through a person from beyond, and how to tell the light from the rest.",
    body: `{{veil-voice}}

*The messages described here, including any Samadhi shares, are offered as personal experience. No one is asked to believe them. Take what resonates with your heart; leave the rest.*

**Channeling** is when a person opens themselves so that wisdom from beyond speaks through them: a guide, an angel, a master, a star being, a loved one who has passed, or the person's own higher self. Some channels go into a trance and remember nothing. Others stay fully awake and hear, see or feel the words.

## In the old traditions
- **The oracle of Delphi:** for more than a thousand years the Pythia, the priestess of Apollo, spoke the god's words to kings and common people.
- **Kabbalah:** the great sage **Joseph Karo** (1488–1575), author of the code of Jewish law, wrote down the words of a heavenly teacher, a *maggid*, who spoke through his mouth for many years (*Maggid Mesharim*).
- **The prophets:** the Bible and the Qur'an speak of prophets who received the word of God. These faiths call this *revelation*, and hold it apart from channeling; it is honoured here in its own place.

## The modern channels
- **Edgar Cayce** (1877–1945), "the Sleeping Prophet", gave more than 14,000 readings in trance, on health, past lives, Atlantis and the soul's purpose. They are kept by the A.R.E. in Virginia Beach.
- **Jane Roberts** began channeling **Seth** in 1963. *Seth Speaks* (1972) teaches that "you create your own reality".
- **Helen Schucman,** a Columbia University psychologist, heard an inner voice on 21 October 1965 say: "This is a course in miracles. Please take notes." She wrote down *A Course in Miracles* by inner dictation from 1965 to 1972, and it was published in 1976. She identified the voice as Jesus.
- **The Law of One** (1981–1984): 106 sessions with a group calling itself **Ra**, teaching that all is one, and that each soul chooses between service to others and service to self.
- **Esther Hicks** channels **Abraham**, a group of teachers, on the law of attraction.
- **Darryl Anka** channels **Bashar**: "follow your excitement". See [The Essassani](/teachings/essassani).

## How to tell the light from the rest
The Bible says: "Beloved, believe not every spirit, but try the spirits whether they are of God" (1 John 4:1, KJV). The teachers agree on these signs:
- **True light brings love,** peace, humility and freedom. It never flatters the ego, frightens you, demands obedience or asks for money.
- **It respects your free will,** and always points you back to your own heart and to God.
- **By their fruits ye shall know them** (Matthew 7:20). Look at what a teaching makes of the people who follow it.
- **Never give away your power,** even to a beautiful voice. You are a soul too.

## Samadhi's view
*This is Samadhi's own understanding.*

The veil between the worlds is thin, and the beings of light are always ready to help. But the greatest channel is a pure heart. Pray first, ask only for the highest light, and let love be the test of everything you receive. See [Free Will and Discernment](/teachings/discernment).

${care}

## Sources

- Joseph Karo, *Maggid Mesharim*; R. J. Zwi Werblowsky, *Joseph Karo, Lawyer and Mystic* (1962).
- 1 John 4:1 and Matthew 7:20, King James Bible.
- [Edgar Cayce's A.R.E.](https://www.edgarcayce.org/); Jane Roberts, *Seth Speaks* (1972).
- [Foundation for Inner Peace: The Scribing of *A Course in Miracles*](https://acim.org/about-acim/acim-scribing/).
- *The Law of One*, [L/L Research](https://www.llresearch.org/); Esther and Jerry Hicks, *Ask and It Is Given* (2004); [Bashar](https://www.bashar.org/).` },

  { slug: "light-language", tag: "The soul's language", title: "Light Language: The Soul's First Tongue",
    summary: "Sounds, songs, signs and symbols that flow from the soul beyond words, carrying healing and remembering. What it is, how it comes, its healing power, and how to awaken it.",
    body: `{{veil-language}}

**Light language** is a language of the soul. It comes through as sounds, songs, tones and words that no one has learned, and sometimes as hand movements, symbols or drawings. It is not meant to be translated word by word. It is felt. Those who speak it say it carries frequencies of light that go straight past the thinking mind to the heart, the body and the soul.

## What it is like
- **Spoken or sung:** flowing syllables, clicks, tones and melodies, often different for each person.
- **Signed:** the hands move by themselves in graceful shapes.
- **Written or drawn:** symbols and "light codes" that appear in the mind and are drawn on paper.
- **Felt:** listeners often feel warmth, tingling, tears, deep peace or a sense of remembering.

## An ancient gift
The idea that the soul knows a language older than any human tongue is very old:
- **One language before Babel:** "And the whole earth was of one language, and of one speech" (Genesis 11:1, KJV). The Kabbalists teach that Hebrew letters are the language God used to create the world. See [How God Built the Universe: The 22 Letters and the 32 Paths](/teachings/the-32-paths-of-wisdom).
- **Speaking in tongues:** at Pentecost the disciples "were all filled with the Holy Ghost, and began to speak with other tongues, as the Spirit gave them utterance" (Acts 2:4). Saint Paul wrote, "he that speaketh in an unknown tongue speaketh not unto men, but unto God" (1 Corinthians 14:2). Millions of Christians still pray this way.
- **Hildegard of Bingen** (12th century) received an *Unknown Language* and *Unknown Letters* of her own, as part of her visionary life. See [Hildegard of Bingen](/teachings/hildegard-of-bingen).
- **The language of angels:** in the 1580s John Dee and Edward Kelley recorded a language they said was given by angels, later called Enochian.
- **The star families:** today's teachers say light language carries the memory of the star nations, and that many starseeds remember it. See [The Star Nations of Light](/teachings/star-nations-of-light).

## Its healing power, as taught
Those who practise it teach that light language:
- **heals** by moving stuck energy and bringing the body and emotions back into balance;
- **activates** gifts and memories that have been sleeping in the soul;
- **clears** fear and heaviness, and fills the space with peace;
- **blesses** people, homes, water, food and the Earth;
- **connects** you with your guides, your higher self and the Source.

It works with sound, as the Hathors teach. See [The Hathors](/teachings/hathors).

## What research has found
In 2006, researchers led by **Andrew Newberg** at the University of Pennsylvania scanned the brains of women while they spoke in tongues. The frontal lobes, the part of the brain that keeps us in deliberate control, became quieter, and so did the language centres. As Newberg said, this matched how the speakers describe it: the words are not coming from their ordinary thinking self.

## How to awaken it
Everyone carries it, the teachers say. It only needs permission and practice:
1. **Become still.** Sit comfortably, breathe slowly and place a hand on your heart.
2. **Set a loving intention.** Say inwardly: *"I allow the language of my soul to flow, only in love and light, for the highest good."*
3. **Begin with a hum.** Hum softly and let the sound find its own shape.
4. **Let the sounds come.** Allow syllables to form without choosing them. It may feel silly or strange at first; smile and keep going.
5. **Do not judge or translate.** Feel the energy instead of searching for meaning.
6. **Practise a few minutes every day,** and bless with it: your water, your food, your family, the Earth.
7. **Give thanks,** and drink some water afterwards.

## Samadhi's view
*This is Samadhi's own understanding.*

We all carry light language from long ago, from before we came to this Earth. It is the soul's first tongue. It sleeps in us, and it can be awakened through practice, love and trust. When it flows, it heals the one who speaks it and the one who hears it.

${care}

## Sources

- Genesis 11:1, Acts 2:4 and 1 Corinthians 14:2, King James Bible.
- Andrew Newberg and others, "The measurement of regional cerebral blood flow during glossolalia", *Psychiatry Research: Neuroimaging* 148 (2006); [ScienceDaily report of the study](https://www.sciencedaily.com/releases/2006/10/061030183100.htm).
- Sarah Higley, *Hildegard of Bingen's Unknown Language* (2007); [World History Encyclopedia: Hildegard's Unknown Language and Unknown Letters](https://www.worldhistory.org/article/2738/hildegard-of-bingens-unknown-language-and-unknown/).
- Deborah Harkness, *John Dee's Conversations with Angels* (1999).
- The healing effects listed are as practitioners of light language teach them.` },

  { slug: "walking-safely-beyond-the-veil", tag: "Protection", title: "Walking Safely Beyond the Veil",
    summary: "Protection, grounding and discernment for every journey beyond the body: what the traditions advise, and a simple prayer of light.",
    body: `Every tradition that opens the door beyond the veil also teaches how to walk through it safely. The rule is simple: **go in love, go humbly, and come back grounded.**

## Before you begin
- **Pray.** Ask God, your guides and the angels of light to protect you, and to allow only what is for your highest good.
- **Surround yourself with light.** Picture a sphere of white or golden light around you, or the violet flame. See [Saint Germain and the Violet Flame](/teachings/saint-germain-and-the-violet-flame).
- **Check your heart.** Go with love and curiosity, never to control, spy on or harm anyone.

## While you journey
- **Fear is the only real danger.** If you feel fear, say the name of God, call on the light, and return to your body. You can always come back.
- **Test what you meet.** "Believe not every spirit, but try the spirits whether they are of God" (1 John 4:1, KJV). Beings of light bring peace and never demand anything.
- **Do not chase powers.** The aim is love and union with God, not experiences to boast of.

## When you return
- **Ground yourself.** Feel your feet, drink water, eat something simple, walk on the earth.
- **Write it down.** Keep a journal of what you experienced.
- **Live it.** The best proof of a true experience is a kinder, calmer life.

## Who should wait
Teachers advise that anyone going through deep emotional struggles, or who has ever lost touch with what is real, should stay grounded and work with a trusted guide or professional first. These practices are never to be mixed with drugs or alcohol, and a near-death experience is never something to seek.

## A prayer of light
> Beloved Creator, I place myself in Your light.\\
> Surround me with Your love and protection.\\
> Let only what is of the light come near me,\\
> and guide every step of my journey.\\
> Bring me home safely, wiser and more loving.\\
> **Amen.**

## Samadhi's view
*This is Samadhi's own understanding.*

The beyond is our true home, and there is nothing to fear in the light. But we are here on Earth for a reason. Every journey beyond the veil should bring us back more present, more loving and more useful to the people around us.

## Sources

- 1 John 4:1, King James Bible.
- See the sources on each page of this tab.
- The prayer is new, written for SAMADHI LOVE.` },
];
