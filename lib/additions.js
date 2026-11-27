// Smaller additions, each placed in an existing tab by adding only:
// Practices: Sacred Sound, Mantra and Frequency; The Power of Silence; Fasting Across the Traditions.
// Beyond the Veil: Dreams. Teachings: The Divine Feminine; Grace, Surrender and Humility.
// Sacred Geometry: Numerology, with a small calculator (public/practice.js, data-px-num).
// Quotations: King James Bible; Pickthall's Qur'an (1930). Checked Nov 2026.

const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;
const sky = `<radialGradient id="ad-sky" cx="50%" cy="45%" r="80%"><stop offset="0" stop-color="#4e4024"/><stop offset="1" stop-color="#0d0b08"/></radialGradient>`;
const dots = [[60, 50], [540, 70], [110, 270], [500, 290], [40, 170], [570, 190], [180, 36], [430, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff" opacity=".7"/>`).join("");

function moon() {
  const petals = Array.from({ length: 8 }, (_, i) => `<ellipse cx="300" cy="236" rx="16" ry="44" transform="rotate(${-70 + i * 20} 300 262)" fill="#f6d6e8" opacity="${i % 2 ? .55 : .8}"/>`).join("");
  return `<figure class="cross-hero ad-figure"><svg viewBox="0 0 600 320" role="img" aria-labelledby="ad-moon-t" xmlns="http://www.w3.org/2000/svg"><title id="ad-moon-t">A silver crescent moon above an opening pink lotus, with soft light falling like dew</title>
<defs>${sky}<radialGradient id="ad-mg"><stop offset="0" stop-color="#e8f2ff" stop-opacity=".5"/><stop offset="1" stop-color="#e8f2ff" stop-opacity="0"/></radialGradient></defs>
<rect width="600" height="320" rx="18" fill="url(#ad-sky)"/>${dots}
<circle class="sj-breathe" cx="300" cy="110" r="110" fill="url(#ad-mg)"/>
<path d="M300 46 A62 62 0 1 0 300 170 A48 48 0 1 1 300 46 Z" fill="#eef4ff"/>
${[0, 1, 2, 3, 4].map((i) => `<circle class="sj-spark" style="--d:${i * 1.6}s" cx="${270 + i * 15}" cy="196" r="2" fill="#eef4ff"/>`).join("")}
<g class="ms-bloom">${petals}<circle cx="300" cy="258" r="9" fill="#ffe39a"/></g>
<text x="300" y="304" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="4" fill="#d9cfee">THE MOON AND THE LOTUS</text></svg>
<figcaption class="fine">The moon and the lotus: receptive light and the soul opening. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}
function wave() {
  const line = (amp, op, d) => { let p = "M40 160"; for (let x = 40; x <= 560; x += 10) p += ` L${x} ${(160 + amp * Math.sin((x - 40) / 32) * Math.sin(((x - 40) / 520) * Math.PI)).toFixed(1)}`; return `<path class="ad-wave" style="--d:${d}s" d="${p}" fill="none" stroke="#ffe39a" stroke-width="2" stroke-opacity="${op}"/>`; };
  return `<figure class="cross-hero ad-figure"><svg viewBox="0 0 600 300" role="img" aria-labelledby="ad-wave-t" xmlns="http://www.w3.org/2000/svg"><title id="ad-wave-t">Golden waves of sound rising from silence and returning to it, around the sacred syllable Om</title>
<defs>${sky}</defs><rect width="600" height="300" rx="18" fill="url(#ad-sky)"/>${dots}
${line(70, .25, 0)}${line(50, .45, 1)}${line(30, .7, 2)}
<circle cx="300" cy="160" r="34" fill="#0d0b08" stroke="#ffe39a" stroke-opacity=".6"/>
<text x="300" y="174" text-anchor="middle" font-family="serif" font-size="38" fill="#fff3c4" lang="sa">ॐ</text>
<text x="300" y="282" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="4" fill="#d9cfee">SOUND AND SILENCE</text></svg>
<figcaption class="fine">Sound rises out of silence and returns to it. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}
const MEANINGS = [
  [1, "Beginnings", "Independence, courage, leadership, new starts. The lesson: to stand in your own light without pride."],
  [2, "Partnership", "Cooperation, sensitivity, peace-making, patience. The lesson: to unite without losing yourself."],
  [3, "Expression", "Creativity, joy, words, art and music. The lesson: to share your gifts with an open heart."],
  [4, "Foundation", "Order, hard work, loyalty, building to last. The lesson: to build with patience and honesty."],
  [5, "Freedom", "Change, travel, curiosity, the senses. The lesson: to use freedom wisely."],
  [6, "Love and care", "Home, family, healing, responsibility, beauty. The lesson: to love without controlling."],
  [7, "Wisdom", "The inner search, study, solitude, spirit. The lesson: to trust the knowing that comes in silence."],
  [8, "Mastery", "Abundance, strength, achievement in the world. The lesson: to use power and money with justice."],
  [9, "Completion", "Compassion, service, letting go, the whole human family. The lesson: to give without counting."],
  [11, "Master number: illumination", "Intuition and inspiration, a messenger of light. A higher octave of 2."],
  [22, "Master number: the master builder", "Great dreams built on earth for the good of many. A higher octave of 4."],
  [33, "Master number: the master teacher", "Compassion and healing through love and service. A higher octave of 6."],
];
function numWheel() {
  const pts = Array.from({ length: 9 }, (_, i) => { const a = ((i * 40 - 90) * Math.PI) / 180; return [300 + 112 * Math.cos(a), 166 + 112 * Math.sin(a)]; });
  const star = [0, 3, 6, 0].map((i) => pts[i].map((v) => v.toFixed(1)).join(" ")).join(" L");
  const hex = [1, 2, 4, 8, 7, 5, 1].map((n) => pts[n % 9]).map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L");
  return `<figure class="cross-hero ad-figure"><svg viewBox="0 0 600 320" role="img" aria-labelledby="ad-num-t" xmlns="http://www.w3.org/2000/svg"><title id="ad-num-t">The numbers one to nine in a circle of light, joined by golden lines, with nine at the top where the circle closes</title>
<defs>${sky}</defs><rect width="600" height="320" rx="18" fill="url(#ad-sky)"/>${dots}
<circle cx="300" cy="166" r="112" fill="none" stroke="#e6dcf7" stroke-opacity=".3"/>
<g fill="none" stroke="#ffe39a" stroke-opacity=".5" stroke-width="1.5"><path d="M${hex}"/><path d="M${star}"/></g>
${pts.map(([x, y], i) => `<g class="sj-light" style="--d:${(i * 0.5).toFixed(1)}s"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="17" fill="#4e4024" stroke="#ffe39a"/><text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="#fff3c4">${i === 0 ? 9 : i}</text></g>`).join("")}
<text x="300" y="306" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="4" fill="#d9cfee">THE NINE NUMBERS</text></svg>
<figcaption class="fine">The numbers one to nine on a circle, with nine where the circle closes. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}
function numCalc() {
  const list = MEANINGS.map(([n, t, m]) => `<div class="nc-mean" data-n="${n}" hidden><p class="nc-big">${n}</p><p><strong>${t}.</strong> ${m}</p></div>`).join("");
  return `<div class="nc" data-px-num>
<div class="nc-row"><label>Your date of birth <input type="date" data-nc-date></label><button type="button" class="px-chip is-on" data-nc-go>Find my life path number</button></div>
<p class="nc-steps" data-nc-steps aria-live="polite"></p>${list}
<div class="nc-row"><label>A name <input type="text" data-nc-name placeholder="Your full name" autocomplete="off"></label><button type="button" class="px-chip" data-nc-name-go>Find the name number</button></div>
<p class="nc-steps" data-nc-name-steps aria-live="polite"></p><div data-nc-name-out></div>
<p class="fine">Nothing you type leaves this page or is saved. A tool for reflection, not for prediction.</p></div>`;
}
// Samadhi's own picture: rings of light spreading across still water, for sound and for silence.
const ripples = () => `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/sound-ripples.jpg" width="1600" height="900" alt="Golden rings of light spreading slowly across still violet water" loading="lazy" decoding="async"></div><figcaption class="fine">Like a sound, like a moment of stillness: rings of light spreading across still water. Picture shared by Samadhi.</figcaption></figure>`;
export function additionsArt(key) {
  return { "add-moon": () => `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/rose-heart.jpg" width="1600" height="900" alt="A soft pink rose opening, with a glowing golden heart of light at its centre" loading="lazy" decoding="async"></div><figcaption class="fine">The flower of the heart, opening to the light. Picture shared by Samadhi.</figcaption></figure>`, "add-wave": ripples, "num-wheel": numWheel, "num-calc": numCalc }[key]?.() || "";
}

// ---- Practices ----
export const practiceAdditions = [
  { slug: "sacred-sound-mantra-and-frequency", tag: "Practices", title: "Sacred Sound, Mantra and Frequency",
    summary: "In the beginning was the Word. How every tradition uses sacred sound: Om, mantra, chant, dhikr and the music of the spheres; what is known and not known about 432 Hz and the Solfeggio frequencies; and how to use sound to pray. Ending with Versual Studio.",
    body: `{{add-wave}}

"**In the beginning was the Word, and the Word was with God, and the Word was God**" (John 1:1). "**And God said, Let there be light: and there was light**" (Genesis 1:3). In the Qur'an, when God wills a thing, He says to it only "*Be!*", and it is (*kun fa-yakun*, Qur'an 36:82). In India, the universe begins with the sound **Om**. Across the world, the traditions agree: **creation began with sound.**

## Sound in every tradition
- **Om (Hinduism, Buddhism, Jainism, Sikhism).** The Mandukya Upanishad teaches that Om is all that was, is and will be. Its three sounds, A-U-M, are waking, dreaming and deep sleep; the silence after it is the fourth state, pure awareness (*turiya*).
- **Mantra.** A mantra is a sacred sound that "protects the mind". *Om Namah Shivaya* ("I bow to Shiva"); *Om Mani Padme Hum*, the mantra of compassion of Avalokiteshvara, known in China as Kuan Yin; the *Gayatri* mantra to the light of the sun.
- **The Jesus Prayer (Christianity).** The Orthodox repeat with the breath: "Lord Jesus Christ, Son of God, have mercy on me." Monks have sung the Psalms in **Gregorian chant** for over a thousand years.
- **Dhikr (Islam).** The Sufis repeat the names of God until the heart itself remembers. See [The Sufi Path](/teachings/the-sufi-path).
- **The Hebrew letters (Judaism).** The *Sefer Yetzirah* teaches that God created the world through the 22 letters of the Hebrew alphabet: sound and number. Hasidic Jews sing the wordless melody called a *niggun*. See [Sefer Yetzirah](/teachings/sefer-yetzirah).
- **Naam and kirtan (Sikhism).** The Sikhs sing the Guru's words in *kirtan* and repeat *Waheguru*, "Wonderful Lord".
- **The music of the spheres.** **Pythagoras** discovered that musical harmony follows simple number ratios, and taught that the planets sing as they move. Johannes Kepler wrote *The Harmony of the World* (1619) on the same idea. See [Pythagoras and the Music of Numbers](/teachings/pythagoras-music-of-numbers).
- **Nada yoga.** The yoga of sound teaches listening to the **inner sound** (*nada*) that is heard in deep meditation.

## Frequencies: what is known and not known
- **432 Hz.** Today's standard tuning sets the note A at 440 Hz. Some musicians prefer A at 432 Hz and find it warmer. Claims that 432 Hz is "the frequency of the universe" or heals the body are **not supported by scientific evidence**, but if it sounds peaceful to you, enjoy it.
- **The Solfeggio frequencies** (such as 396, 528 and 639 Hz) are said to come from ancient chant. The syllables *ut, re, mi* do come from an 11th-century hymn to John the Baptist used by Guido of Arezzo, but the **frequency numbers are modern**, made popular in the 1990s. They are not found in ancient sources.
- **What research does suggest.** Music can lower stress and lift mood, and music therapy is used in hospitals. Humming increases nitric oxide in the nose (Weitzberg and Lundberg, 2002). Chanting together slows and steadies the breath. The deepest power of sacred sound, though, is the love and attention we bring to it.

## A simple practice
1. **Sit comfortably and breathe out fully.**
2. **Chant one long Om** (or *Amen*, *Allah*, *Shalom*, *Waheguru*, or simply hum), letting the sound start in the belly and end in the head.
3. **Listen to the silence afterwards.** That silence is as sacred as the sound.
4. **Repeat** for a few minutes. You can add the singing bowl below.

{{practice-sound}}

## From sound to song
Samadhi's own songs are not written down: they arrive whole, as a gift, and are carried in memory. Music is his prayer. You can listen to them, and you can make your own music with love in **Versual Studio**, where verse meets vision.

**[Listen to the songs](/music) · [Open Versual Studio](/studio)**

## Samadhi's view
*This is Samadhi's own understanding.*

Everything is vibration: our thoughts, our words, our bodies, the stars. When we sing with love, we tune ourselves to the Source like a string tuned to its note. A song sung from the heart can heal more than any frequency chart.${bridge([
      ["Sound for Stillness", "/teachings/sound-for-stillness", "the singing bowl, drone and rain."],
      ["Light Language", "/teachings/light-language", "sounds said to carry light."],
      ["The Power of Silence", "/teachings/the-power-of-silence", "the silence that sound comes from."],
    ])}

## Sources

- Genesis 1:3; John 1:1, King James Bible; Qur'an 36:82.
- *Mandukya Upanishad*; *Sefer Yetzirah*; the Orthodox *Philokalia* on the Jesus Prayer; Johannes Kepler, *Harmonices Mundi* (1619).
- E. Weitzberg and J. O. N. Lundberg, "Humming greatly increases nasal nitric oxide", *American Journal of Respiratory and Critical Care Medicine* 166 (2002); International Organization for Standardization, ISO 16 (concert pitch A = 440 Hz).` },

  { slug: "the-power-of-silence", tag: "Practices", title: "The Power of Silence",
    summary: "Be still, and know. Why every tradition treasures silence: the silence of the prophets, Pythagoras' school, the Tao, Ramana Maharshi, the Quakers and the monks, and simple ways to bring silence into a noisy life.",
    body: `{{add-wave}}

"**Be still, and know that I am God**" (Psalm 46:10). Every great spiritual teacher went into silence before speaking: Moses on the mountain, Elijah in the cave, Jesus in the desert, Muhammad in the cave of Hira, the Buddha under the tree. **Silence is where the voice of God is heard.**

## Silence in the traditions
- **The Bible.** "To every thing there is a season … a time to keep silence, and a time to speak" (Ecclesiastes 3:1, 7). "The LORD is in his holy temple: let all the earth keep silence before him" (Habakkuk 2:20). God spoke to Elijah not in the wind or the fire, but in "a still small voice" (1 Kings 19:12).
- **Judaism.** Rabbi Akiva taught: "**A fence for wisdom is silence**" (*Pirkei Avot* 3:13).
- **Islam.** The Prophet Muhammad said that whoever believes in God and the Last Day should speak good or keep silent (Sahih al-Bukhari 6018; Sahih Muslim 47). The Sufis retreat into *khalwa*, solitude and silence, to be alone with God.
- **Pythagoras.** According to ancient biographers, new students of Pythagoras kept silence for years, listening before they were allowed to speak.
- **The Tao.** The *Tao Te Ching* says that those who know do not speak, and those who speak do not know (chapter 56).
- **Ramana Maharshi** taught most deeply in silence: seekers sat near him and found their questions dissolving. See [Non-Duality and Ramana Maharshi](/teachings/non-duality-and-ramana-maharshi).
- **The monks and the Quakers.** Christian monasteries keep the "great silence" at night; the Quakers worship in silence, waiting for the inner light. Buddhist meditation retreats keep "noble silence".

## Why silence heals
- **It lets the mud settle.** A glass of muddy water becomes clear when left still. So does the mind.
- **It makes room to listen**: to God, to intuition, to others.
- **It protects from harm.** Many wounds are made by words we did not need to say.
- **It restores energy.** Constant noise, talk and screens drain us; silence refills.

## Bringing silence into a noisy life
1. **Five silent minutes** on waking, before the phone.
2. **A silent meal** once a week, tasting and giving thanks.
3. **A walk without headphones**, listening to the world.
4. **A pause before speaking** in difficult moments: one breath, then choose your words.
5. **A "fast" from words**: some keep one silent hour, or one silent morning a week. Mahatma Gandhi kept a weekly day of silence.
6. **Sit with a question** in silence. See [Questions to Sit With](/teachings/questions-to-sit-with).

## Samadhi's view
*This is Samadhi's own understanding.*

God speaks in silence; the ego speaks in noise. In silence we hear our soul and our guides, and we remember who we are. Even a few minutes of true silence each day can change a life.${bridge([
      ["Intuition: The Still Small Voice", "/teachings/intuition-the-still-small-voice", "what we hear in the silence."],
      ["Breath of Peace", "/teachings/breath-of-peace", "breathing into stillness."],
      ["Sacred Sound, Mantra and Frequency", "/teachings/sacred-sound-mantra-and-frequency", "the sound that comes from silence."],
    ])}

## Sources

- Psalm 46:10; Ecclesiastes 3:1–7; 1 Kings 19:12; Habakkuk 2:20, King James Bible.
- *Pirkei Avot* 3:13; Sahih al-Bukhari 6018; Sahih Muslim 47.
- Iamblichus, *Life of Pythagoras*; *Tao Te Ching*, chapter 56.` },

  { slug: "fasting-across-the-traditions", tag: "Practices", title: "Fasting Across the Traditions",
    summary: "Why nearly every faith fasts: the forty days of Moses, Elijah and Jesus, Yom Kippur, Ramadan, Lent, Ekadashi, the Buddhist monks and the Baha'i fast. What fasting is for, who should not fast, and gentler fasts anyone can keep.",
    body: `{{life-lamp}}

Almost every tradition on earth fasts. **Fasting is not a punishment of the body; it is a way of making room for the spirit.** When we set aside, for a time, what we usually take for granted, we remember the Giver, we feel with those who go without, and we discover that we are more than our hungers.

> **A word of care first.** Fasting from food is **not for everyone**. It is not for children, for pregnant or breastfeeding women, for people with diabetes or other medical conditions, for anyone who takes medicines that require food, or for anyone who has struggled with eating. The traditions themselves excuse the sick and the vulnerable. If in any doubt, speak to your doctor first, and choose one of the gentler fasts below instead. See [Principles and Care](/teachings/principles-and-care).

## Fasting in the traditions
- **The forty days.** Moses was on the mountain with God "forty days and forty nights; he did neither eat bread, nor drink water" (Exodus 34:28). Elijah walked forty days to the mountain of God (1 Kings 19:8). Jesus fasted forty days in the wilderness before beginning his work (Matthew 4:2).
- **Judaism.** On **Yom Kippur**, the Day of Atonement, Jews fast and pray for forgiveness: "ye shall afflict your souls" (Leviticus 16:29). Other fast days remember sorrows in the people's history.
- **The true fast (Isaiah).** "Is not this the fast that I have chosen? to loose the bands of wickedness … and to let the oppressed go free … Is it not to deal thy bread to the hungry?" (Isaiah 58:6–7). The prophets insist that fasting without justice and kindness is empty.
- **Islam.** "**O ye who believe! Fasting is prescribed for you, even as it was prescribed for those before you, that ye may ward off (evil)**" (Qur'an 2:183, Pickthall). In the month of **Ramadan**, Muslims fast from dawn to sunset, pray more, read the Qur'an and give to the poor; the sick and travellers are excused (2:184).
- **Christianity.** **Lent**, the forty days before Easter, is a season of fasting, prayer and giving. Orthodox Christians keep several fasting seasons through the year.
- **Hinduism.** The Sanskrit word for a fast, ***upavasa***, is often explained as "dwelling near" God. Many Hindus fast on **Ekadashi**, the eleventh day of each lunar fortnight, and during festivals like Navaratri.
- **Buddhism.** Monks and nuns traditionally do not eat after midday. Lay Buddhists may take extra precepts on observance days (*uposatha*). The Buddha himself, after trying extreme fasting, taught the **Middle Way**: neither indulgence nor harshness to the body.
- **The Baha'i Faith** keeps a nineteen-day fast each March, from sunrise to sunset.
- **Indigenous traditions** of North America have long joined fasting and prayer in the vision quest, under the guidance of elders.

## What fasting is for
- **Remembering God.** Each pang becomes a small prayer.
- **Compassion.** We feel, a little, what the hungry feel, and we give.
- **Self-mastery.** Learning to say "not now" to one desire makes it easier to say no to anger or greed.
- **Purification.** Many traditions see fasting as cleansing the heart, not only the body.

## Gentler fasts anyone can keep
- **A fast from complaining** for a day or a week.
- **A fast from screens** for an evening, or one day a week.
- **A fast from harsh words, gossip or anger.**
- **A fast from one small comfort** you take for granted, giving its cost to someone in need.
- **A fast of silence.** See [The Power of Silence](/teachings/the-power-of-silence).

## Samadhi's view
*This is Samadhi's own understanding.*

The true fast is of the heart: fasting from ego, anger, judgment and greed. A body fasted in pride gains nothing; a heart emptied of ego is filled with God. Fast gently, wisely, and always with love.${bridge([
      ["Charity: Sharing the Blessings We Were Lent", "/teachings/charity-sharing-our-blessings", "giving what the fast saves."],
      ["The Power of Silence", "/teachings/the-power-of-silence", "a fast from words."],
      ["Muhammad", "/teachings/muhammad", "the prophet of the Ramadan fast."],
    ])}

## Sources

- Exodus 34:28; Leviticus 16:29; 1 Kings 19:8; Isaiah 58:6–7; Matthew 4:2, King James Bible.
- Qur'an 2:183–184, Pickthall (1930).
- The Buddhist *Vinaya* on the midday meal; the Baha'i *Kitab-i-Aqdas* on the Fast.` },
];

// ---- Beyond the Veil ----
export const veilAddition = {
  slug: "dreams-the-language-of-the-soul", tag: "Dreams", title: "Dreams: The Language of the Soul",
  summary: "Every night we cross a small veil. Dreams in the Bible and the Qur'an, in Egypt, Greece and Tibet; what Freud, Jung and the research on lucid dreaming found; and how to keep a dream journal and listen to your dreams wisely.",
  body: `{{add-moon}}

Every night, without trying, we cross a small veil. The body sleeps; the soul travels, remembers, heals and sometimes receives messages. **Dreams are the language the soul speaks when the busy mind is quiet.**

## Dreams in the scriptures
- **Jacob's ladder.** Jacob dreamed "a ladder set up on the earth, and the top of it reached to heaven: and behold the angels of God ascending and descending on it" (Genesis 28:12).
- **Joseph.** Joseph the dreamer interpreted Pharaoh's dream of seven fat and seven lean cows as seven years of plenty and seven of famine, and saved Egypt (Genesis 41). The Qur'an tells the same story in the beautiful *Surah Yusuf*, beginning with young Joseph's dream of eleven stars, the sun and the moon bowing before him (Qur'an 12:4).
- **The Gospels.** An angel came to Joseph, husband of Mary, "in a dream" to guide and protect the child (Matthew 1:20, 2:13).
- **The prophet Joel.** "Your old men shall dream dreams, your young men shall see visions" (Joel 2:28).
- **Islam.** The Prophet Muhammad taught that a good dream is from God and a small part of prophecy, and that a frightening dream should not be dwelt on: seek refuge in God, turn over and do not tell it to others (Sahih al-Bukhari, Book of the Interpretation of Dreams).

## Dreams in the ancient world
- **Egypt** kept dream books on papyrus, listing dreams and their meanings, more than three thousand years ago.
- **Greece.** The sick slept in the temples of **Asclepius**, the god of healing, hoping for a healing dream; this was called *incubation*.
- **Tibet.** Tibetan Buddhists practise **dream yoga**: becoming aware within the dream, as training for the moment of death and the bardo. See [Death Is a Doorway](/teachings/death-is-a-doorway).

## What modern study found
- **Sigmund Freud** called dreams "the royal road" to the unconscious (*The Interpretation of Dreams*, 1900).
- **Carl Jung** saw dreams as messages from the deeper Self, speaking in symbols, often to balance what the waking mind ignores, and sometimes in symbols shared by all humanity.
- **Lucid dreaming**, knowing you are dreaming while in the dream, was proven in the sleep laboratory in the late 1970s and 1980s by Keith Hearne and Stephen LaBerge, who had dreamers signal with their eyes from inside the dream.
- Sleep research shows that dreaming sleep helps us process emotions and memories.

## Listening to your dreams
1. **Keep a notebook by the bed.** Write the dream the moment you wake, before moving. Even a few words.
2. **Set an intention.** Before sleep, ask a gentle question, or ask your guides for a helpful dream.
3. **Read your dreams personally.** A dream symbol means most what it means *to you*. Dictionaries of symbols can give ideas, never final answers.
4. **Notice feelings**, not only pictures. How did the dream feel?
5. **Be wise.** Not every dream is a message; many simply digest the day. Never make a big decision from one dream alone.
6. **Bad dreams.** Say a prayer, breathe, turn on a soft light. If nightmares keep coming or you are carrying a heavy past, please speak to a doctor or counsellor: help is available.

## Samadhi's view
*This is Samadhi's own understanding.*

In sleep the soul is freer: it can travel in the astral realm, meet loved ones who have passed, and receive teaching from guides. Some of Samadhi's songs have come this way, in the quiet between sleeping and waking. Treat your dreams as letters from your soul: read them with love, and keep the ones that bring light.${bridge([
    ["Out-of-Body Travel and Astral Projection", "/teachings/out-of-body-travel-and-astral-projection", "the soul's travel beyond the body."],
    ["Intuition: The Still Small Voice", "/teachings/intuition-the-still-small-voice", "the soul's quiet guidance by day."],
    ["Losing Someone We Love", "/teachings/losing-someone-we-love", "dreams of loved ones who have passed."],
  ])}

## Sources

- Genesis 28:12 and 41; Joel 2:28; Matthew 1:20 and 2:13, King James Bible; Qur'an 12:4.
- Sahih al-Bukhari, *Kitab al-Ta'bir* (Book of the Interpretation of Dreams).
- Sigmund Freud, *The Interpretation of Dreams* (1900); C. G. Jung, *Man and His Symbols* (1964); Stephen LaBerge, *Lucid Dreaming* (1985).` };

// ---- Teachings ----
export const teachingAdditions = [
  { slug: "the-divine-feminine", tag: "The Divine Feminine", title: "The Divine Feminine",
    summary: "God beyond male and female, and the feminine face of the Divine in every tradition: Wisdom and the Shekhinah, Mary and Maryam, Shakti and the Goddess, Kuan Yin and Tara, Isis and Ma'at, the mysterious female of the Tao, and Mother Earth.",
    body: `{{add-moon}}

The traditions agree that **God is beyond male and female**. Yet our words for God have often been only male, and something precious was forgotten: the **tender, nurturing, receptive, wise and fierce mother-love** of the Divine. Every tradition, looked at closely, keeps the memory of the Divine Feminine.

## In the Hebrew Bible and Judaism
- **Wisdom (Chokmah).** In the Book of Proverbs, Wisdom speaks as a woman who was with God before creation: "I was set up from everlasting, from the beginning, or ever the earth was … When he prepared the heavens, I was there" (Proverbs 8:23, 27).
- **The Shekhinah.** The rabbis and the Kabbalists speak of the ***Shekhinah***, God's indwelling Presence, as feminine: she goes into exile with her people and dwells wherever people pray and love. Every Friday evening, Jews welcome the Sabbath as a bride and a queen. See [The Zohar](/teachings/the-zohar).
- God comforts "as one whom his mother comforteth" (Isaiah 66:13).

## In Christianity and Islam
- **Mary**, the mother of Jesus, is loved across Christianity. "All generations shall call me blessed" (Luke 1:48). See [A Prayer to Mother Mary](/teachings/prayer-to-mother-mary) and [Other Masters](/teachings/other-masters).
- **Maryam** is the only woman named in the Qur'an, and a whole surah bears her name (Surah 19). The angels tell her that God has chosen her, purified her and preferred her above the women of all the worlds (Qur'an 3:42).
- **Sophia, Holy Wisdom**, was so loved by early Christians that the great church of Constantinople was named for her: *Hagia Sophia*.
- **Mary Magdalene**, the first to see the risen Christ, was honoured by early teachers as the "apostle to the apostles".

## In the East
- **Shakti.** In Hinduism, ***Shakti*** is the Divine Mother, the power of God by which everything lives and moves. She is honoured as Durga the protector, Lakshmi the giver of abundance, Saraswati the goddess of wisdom and music, and Parvati, Shiva's beloved. The *Saundarya Lahari* begins by saying that Shiva can create only when united with Shakti. See [Krishna and Shiva](/library?tab=krishna-shiva).
- **Kuan Yin and Tara.** In Buddhism, the bodhisattva of compassion is honoured in China as **Kuan Yin**, "she who hears the cries of the world", and in Tibet the beloved **Tara** rescues all who call on her. *Prajnaparamita*, the perfection of wisdom, is called "the mother of all the Buddhas". See [Other Masters](/teachings/other-masters), where Kuan Yin is honoured as a Lady Master of mercy.
- **The Tao.** "The valley spirit never dies; it is called the mysterious female" (*Tao Te Ching*, chapter 6). The Tao gives birth to all things and asks nothing in return.

## In the ancient world and Indigenous wisdom
- **Isis** of Egypt, the great mother, healer and magician, and **Ma'at**, the goddess of truth and balance. See [Ma'at, the Wisdom of Egypt](/teachings/maat-wisdom-of-egypt).
- **Mother Earth.** The Andean peoples honour **Pachamama**; many Indigenous nations speak of the Earth as our mother, to be cared for, not owned.

## Balance in every soul
The Chinese image of **yin and yang**, the Kabbalistic pillars of mercy and severity, Shiva and Shakti: all teach that the feminine and masculine qualities live **in every person**, man or woman. Strength and gentleness, action and receiving, reason and intuition: wholeness is their marriage.

## Samadhi's view
*This is Samadhi's own understanding.*

God is Father and Mother, and beyond both. The world has suffered from too much force and too little tenderness; the return of the Divine Feminine is the return of balance, compassion and care for the Earth. Honour the mothers, the women and the gentle heart within yourself, and you honour God.${bridge([
      ["Other Masters", "/teachings/other-masters", "Mother Mary and Kuan Yin among the Masters of compassion."],
      ["A Prayer to Mother Mary", "/teachings/prayer-to-mother-mary", "a prayer to the Mother."],
      ["Grace, Surrender and Humility", "/teachings/grace-surrender-and-humility", "receiving what we cannot earn."],
    ])}

## Sources

- Proverbs 8:22–31; Isaiah 66:13; Luke 1:48, King James Bible; Qur'an 3:42 and Surah 19 (Maryam).
- The *Zohar*; the *Saundarya Lahari*, verse 1; the *Devi Mahatmya*; *Tao Te Ching*, chapter 6.
- Raphael Patai, *The Hebrew Goddess* (1967); John Blofeld, *Bodhisattva of Compassion* (1977).` },

  { slug: "grace-surrender-and-humility", tag: "Grace", title: "Grace, Surrender and Humility",
    summary: "Grace is the gift we cannot earn; surrender is opening our hands to receive it; humility keeps them open. What the Bible, the Qur'an, the Gita, the Tao and the mystics teach about letting God lead.",
    body: `{{heart-emblem}}

There comes a moment on every spiritual path when we discover that **we cannot do it alone**. We try, we practise, we fail, we try again. And then something is given that we did not earn: a peace, a healing, a door that opens. The traditions call it **grace**. To receive it we must **surrender**, and to keep receiving it we need **humility**.

## Grace: the gift we cannot earn
- "**For by grace are ye saved through faith; and that not of yourselves: it is the gift of God**" (Ephesians 2:8).
- "**My grace is sufficient for thee: for my strength is made perfect in weakness**" (2 Corinthians 12:9).
- In Islam, everything good comes from God's bounty and mercy: Muslims begin every chapter of the Qur'an but one, and every good act, "In the name of Allah, the Beneficent, the Merciful".
- In Hinduism, ***kripa***, the grace of God and of the guru, is what finally frees the soul. Many saints said that even the effort to seek God is His grace.

## Surrender: opening our hands
- **"Thy will be done."** In the garden, before the cross, Jesus prayed: "**not my will, but thine, be done**" (Luke 22:42).
- **Islam** means *surrender*: the word comes from the same root as *salam*, peace. Peace through surrender to God. Muslims say: *La hawla wa la quwwata illa billah*, "there is no power and no strength except with God". To trust God after doing your part is ***tawakkul***: the Prophet said to tie your camel, and then trust in God (Sunan al-Tirmidhi 2517).
- **Hinduism** calls it ***sharanagati*** or *prapatti*, taking refuge. At the end of the Bhagavad Gita, Krishna asks Arjuna to take refuge in Him alone, and promises to free him from all sins: "do not grieve" (Gita 18:66).
- **The Tao.** Lao Tzu taught that the highest good is like water: it nourishes everything and does not compete; it seeks the low places that people scorn, and so it is close to the Way (*Tao Te Ching*, chapter 8).

## Humility: keeping the hands open
- "**What doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?**" (Micah 6:8).
- "**Blessed are the poor in spirit: for theirs is the kingdom of heaven**" (Matthew 5:3).
- Moses, the greatest of the prophets, was called "very meek, above all the men which were upon the face of the earth" (Numbers 12:3).
- The Sufis say: *be like the earth*, which everyone walks on and which brings forth flowers.
- Humility is not thinking little of yourself. It is **thinking of yourself less**, and knowing that every gift came from God.

## Surrender is not giving up
Surrender does not mean doing nothing, accepting abuse, or abandoning your responsibilities. It means doing your best, then letting go of the result; acting with all your heart, and trusting the outcome to God. Tie your camel. Then trust.

## Samadhi's view
*This is Samadhi's own understanding.*

The ego wants to control everything; the soul knows how to let go. When we surrender to God, we do not lose ourselves; we find who we really are. Grace flows to the low places, like water. Stay humble, stay grateful, do your part, and let God do the rest.${bridge([
      ["Give Your Soul Only to God", "/teachings/give-your-soul-only-to-god", "devotion that belongs to God alone."],
      ["The Sufi Path", "/teachings/the-sufi-path", "trust and contentment in God."],
      ["The Divine Feminine", "/teachings/the-divine-feminine", "the receiving heart."],
    ])}

## Sources

- Numbers 12:3; Micah 6:8; Matthew 5:3; Luke 22:42; 2 Corinthians 12:9; Ephesians 2:8, King James Bible.
- Sunan al-Tirmidhi 2517; Bhagavad Gita 18:66; *Tao Te Ching*, chapter 8.` },
];

// ---- Sacred Geometry ----
export const numerologyPage = {
  slug: "numerology-the-meaning-of-numbers", tag: "Sacred Number", title: "Numerology: The Meaning of Numbers",
  summary: "All is number, said the Pythagoreans. Sacred numbers in the scriptures, gematria and the abjad, and modern numerology: how to reduce a number, the meanings of one to nine, the master numbers 11, 22 and 33, and a small calculator for reflection.",
  body: `{{num-wheel}}

"**All is number**", the followers of Pythagoras taught: harmony in music, the movement of the stars and the shapes of nature all follow number. Sacred geometry is number made visible; **numerology** is the art of reading numbers as symbols of the soul's qualities.

## Sacred numbers in the scriptures
- **Three**: the Trinity in Christianity; the three worlds and the three qualities (*gunas*) in Hinduism; the Three Jewels in Buddhism.
- **Seven**: the seven days of creation (Genesis 1–2), the seven heavens of the Qur'an, the seven chakras, the seven rays.
- **Twelve**: the twelve tribes of Israel, the twelve apostles, the twelve signs of the zodiac.
- **Forty**: the forty days of the flood, of Moses on the mountain, of Jesus in the desert; the Prophet Muhammad was forty when the revelation began.
- **144**: twelve times twelve. The wall of the heavenly Jerusalem is "an hundred and forty and four cubits" (Revelation 21:17), and it is the number of the soul's cycle in the Rosicrucian teaching (see [The 144-Year Cycle](/teachings/the-144-year-cycle)). Its digits, 1 + 4 + 4, add up to **9**, the number of completion.

## Letters that are numbers
In **Hebrew**, every letter is also a number; reading the hidden links between words of the same value is called ***gematria***. The Greeks had the same art (*isopsephy*), and in **Arabic** the old ***abjad*** order gives each letter a number, used by poets and mystics for dates and hidden meanings. See [Sacred Texts: What History Records](/teachings/sacred-texts-what-history-records).

## Modern numerology
Numerology as most people know it today took shape in the early 20th century, especially through the American teacher **L. Dow Balliett**, and later Juno Jordan. It gives each letter a number (A = 1, B = 2 … I = 9, then J = 1 again), and reads a person's birth date and name.

**How to reduce a number:** add its digits together, and repeat until one digit is left. For example, a birth date of 15 March 1984 gives 1 + 5 + 3 + 1 + 9 + 8 + 4 = **31**, then 3 + 1 = **4**. In modern numerology, **11, 22 and 33** are "master numbers" and are not reduced. (Methods vary a little between teachers.)

## The meanings of the numbers
- **1 · Beginnings:** independence, courage, leadership, new starts.
- **2 · Partnership:** cooperation, sensitivity, peace-making.
- **3 · Expression:** creativity, joy, words, art and music.
- **4 · Foundation:** order, hard work, loyalty, building to last.
- **5 · Freedom:** change, travel, curiosity, the senses.
- **6 · Love and care:** home, family, healing, responsibility.
- **7 · Wisdom:** the inner search, study, solitude, spirit.
- **8 · Mastery:** abundance, strength, achievement in the world.
- **9 · Completion:** compassion, service, letting go, the whole human family.
- **11 · Illumination:** intuition and inspiration; a messenger of light.
- **22 · The master builder:** great dreams built on earth for many.
- **33 · The master teacher:** compassion and healing through love.

## Try it
{{num-calc}}

## Holding it wisely
There is **no scientific evidence** that numbers predict character or the future. Use numerology as you would a poem or a symbol: a mirror for reflection and a doorway to self-knowledge. **Never** let a number make a decision for you about money, health, marriage or anyone's worth. Every number carries both light and shadow, and every soul is free.

## Samadhi's view
*This is Samadhi's own understanding.*

Numbers are the hidden music of creation. They do not bind us; they show us the qualities we came to learn. Look at your numbers with curiosity and love, and remember that the most important number is **one**: one God, one human family, one Love.${bridge([
    ["Pythagoras and the Music of Numbers", "/teachings/pythagoras-music-of-numbers", "the teacher who said all is number."],
    ["The Symbols of Sacred Geometry", "/teachings/the-symbols-of-sacred-geometry", "number made visible."],
    ["Sefer Yetzirah", "/teachings/sefer-yetzirah", "the 22 letters and 10 numbers of creation."],
  ])}

## Sources

- Aristotle, *Metaphysics* A.5 (on the Pythagoreans); Revelation 21:17; Genesis 1–2, King James Bible.
- L. Dow Balliett, *The Philosophy of Numbers* (1908); Juno Jordan, *Numerology: The Romance in Your Name* (1965).
- Underwood Dudley, *Numerology: or What Pythagoras Wrought* (1997), for the historical and critical view.` };
