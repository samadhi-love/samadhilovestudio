// Start Here: Where to Begin, the Glossary and Principles & Care.
// Pronunciations are simple English guides (capitals mark the stressed part; "kh" as in Scottish "loch").

const GOLD = "#f2c46d";
const ic = (paths) => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" class="st-icon"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;

// [term, say, language, meaning, link]
export const GLOSSARY = [
  ["Ahura Mazda", "ah-HOO-rah MAZ-dah", "Avestan", "The Wise Lord, the one God worshipped in Zoroastrianism.", "/teachings/zarathushtra"],
  ["Ajna", "AHJ-nyah", "Sanskrit", "The third-eye chakra, between the eyebrows: intuition and inner sight.", "/teachings/chakra-third-eye"],
  ["Anahata", "uh-NAH-huh-tuh", "Sanskrit", "The heart chakra; the word means \"unstruck\", the sound no hand makes.", "/teachings/chakra-heart"],
  ["Asha", "AH-shah", "Avestan", "Truth, order and righteousness, the path Zoroaster called people to choose.", "/teachings/zarathushtra"],
  ["Ataraxia", "at-uh-RAK-see-uh", "Greek", "Calm untroubled peace of mind, the aim of the Epicureans and Stoics.", "/teachings/philosophy-as-medicine-for-the-soul"],
  ["Atman", "AHT-mun", "Sanskrit", "The true, eternal Self within every being.", "/teachings/the-six-branches-of-philosophy"],
  ["Avatar", "AV-uh-tar", "Sanskrit", "\"Descent\": the Divine coming into the world in a form, like Rama and Krishna.", "/teachings/krishna-and-rama"],
  ["Bhakti", "BHUK-tee", "Sanskrit", "Loving devotion to God.", "/teachings/the-bhagavad-gita"],
  ["Bodhi", "BOH-dee", "Pali and Sanskrit", "Awakening; the tree under which the Buddha awakened is the Bodhi tree.", "/teachings/the-buddha"],
  ["Brahman", "BRAH-mun", "Sanskrit", "The Absolute, the one reality behind all things.", "/teachings/the-six-branches-of-philosophy"],
  ["Chakra", "CHUK-ruh", "Sanskrit", "\"Wheel\": one of the seven centres of energy along the spine.", "/teachings/the-seven-chakras"],
  ["Da'at", "DAH-aht", "Hebrew", "\"Knowledge\": the hidden sphere on the Tree of Life where wisdom and understanding meet.", "/teachings/the-ten-sefirot"],
  ["Darshana", "DAR-shuh-nuh", "Sanskrit", "\"Seeing\": a school of philosophy, and also the blessing of seeing a holy person.", "/teachings/what-is-philosophy"],
  ["Dharma", "DAR-muh", "Sanskrit", "The right order of life; one's sacred duty; for Buddhists, the Buddha's teaching.", "/teachings/krishna-and-rama"],
  ["Druj", "drooj", "Avestan", "The lie and disorder, the opposite of asha.", "/teachings/zarathushtra"],
  ["Dukkha", "DOOK-kah", "Pali", "Suffering or unease, the first of the Buddha's Four Noble Truths.", "/teachings/the-buddhas-way"],
  ["Ein Sof", "ayn SOAF", "Hebrew", "\"Without end\": God in His infinite, hidden essence, beyond all names.", "/teachings/the-zohar"],
  ["Etz Chayim", "ets khah-YEEM", "Hebrew", "\"Tree of Life\".", "/teachings/the-tree-of-life"],
  ["Eudaimonia", "yoo-dye-MOH-nee-uh", "Greek", "True happiness or flourishing: a life of virtue, as Aristotle taught.", "/teachings/aristotle"],
  ["Gematria", "geh-MAH-tree-uh", "Hebrew", "Reading the number values of Hebrew letters for hidden meaning, used for contemplation.", "/teachings/sacred-texts-what-history-records"],
  ["Gnosis", "NOH-sis", "Greek", "Direct, inner knowing of the Divine.", "/teachings/who-are-the-mystics"],
  ["Guru", "GOO-roo", "Sanskrit", "A spiritual teacher; literally \"the one who dispels darkness\", by a traditional reading.", "/teachings/guru-nanak"],
  ["Hermetic", "her-MET-ik", "Greek", "Of the wisdom of Hermes Trismegistus: \"as above, so below\".", "/teachings/the-seven-hermetic-principles"],
  ["Humata, Hukhta, Hvarshta", "hoo-MAH-tah, HOOKH-tah, HVARSH-tah", "Avestan", "Good thoughts, good words, good deeds: Zoroaster's threefold path.", "/teachings/zarathushtra"],
  ["Idris", "id-REESS", "Arabic", "The prophet of the Qur'an whom Islamic tradition identifies with Enoch.", "/teachings/enoch"],
  ["Ik Onkar", "ik oang-KAAR", "Punjabi", "\"One Creator\": the opening words of the Sikh scripture.", "/teachings/guru-nanak"],
  ["Jot", "joht", "Punjabi", "The divine light passed through the ten Sikh Gurus.", "/teachings/guru-nanak"],
  ["Kabbalah", "kah-bah-LAH (also kuh-BAH-luh)", "Hebrew", "\"Receiving\": the mystical tradition of Judaism.", "/teachings/the-ten-sefirot"],
  ["Kapalbhati", "kah-pahl-BAH-tee", "Sanskrit", "\"Shining skull\": an energising breath of quick out-breaths.", "/teachings/breath-of-peace"],
  ["Karma", "KAR-muh", "Sanskrit", "Action, and the law that every action returns to the one who does it.", "/teachings/reincarnation-and-karma"],
  ["Keter", "KEH-ter", "Hebrew", "\"Crown\": the highest sphere on the Tree of Life, closest to the Infinite.", "/teachings/the-ten-sefirot"],
  ["Kriya", "KREE-yah", "Sanskrit", "\"Action\": in Kriya Yoga, a science of breath and energy for meeting God.", "/teachings/kriya-yoga"],
  ["Kundalini", "koon-duh-LEE-nee", "Sanskrit", "The sleeping spiritual power at the base of the spine that rises through the chakras.", "/teachings/awakening-the-chakras"],
  ["Langar", "LUNG-gar", "Punjabi", "The free community kitchen of the Sikhs, where all eat together as equals.", "/teachings/guru-nanak"],
  ["Logos", "LOH-goss", "Greek", "Word and reason: the divine order of the universe; \"In the beginning was the Word\".", "/teachings/sound-for-stillness"],
  ["Malkhut", "mahl-KHOOT", "Hebrew", "\"Kingdom\": the lowest sphere on the Tree of Life, this world.", "/teachings/the-ten-sefirot"],
  ["Manipura", "mah-nee-POO-ruh", "Sanskrit", "The solar plexus chakra: will and confidence.", "/teachings/chakra-solar-plexus"],
  ["Mantra", "MAHN-truh", "Sanskrit", "A sacred word or sound repeated in prayer and meditation.", "/teachings/sound-for-stillness"],
  ["Merkabah", "mer-kah-VAH", "Hebrew", "\"Chariot\": God's throne-chariot in Ezekiel, and the mystics' ascent to it.", "/teachings/the-books-of-enoch"],
  ["Metatron", "MET-uh-tron", "Hebrew tradition", "The great angel, scribe of heaven, whom 3 Enoch identifies with Enoch.", "/teachings/archangel-metatron"],
  ["Moksha", "MOKE-shuh", "Sanskrit", "Liberation from the cycle of birth and death.", "/teachings/reincarnation-and-karma"],
  ["Muladhara", "moo-lah-DAH-ruh", "Sanskrit", "The root chakra at the base of the spine: grounding and safety.", "/teachings/chakra-root"],
  ["Nada", "NAH-duh", "Sanskrit", "Sound, and above all the inner sound heard in deep meditation.", "/teachings/sound-for-stillness"],
  ["Nadi", "NAH-dee", "Sanskrit", "A subtle channel through which the life-force flows.", "/teachings/breath-of-peace"],
  ["Nadi Shodhana", "NAH-dee SHOHD-huh-nuh", "Sanskrit", "\"Cleansing the channels\": alternate nostril breathing.", "/teachings/breath-of-peace"],
  ["Nefesh, Ruach, Neshamah", "NEH-fesh, ROO-akh, neh-shah-MAH", "Hebrew", "The three levels of the soul in the Zohar: life, spirit and the higher soul.", "/teachings/the-zohar"],
  ["Nirvana", "neer-VAH-nuh", "Sanskrit", "The blowing out of craving: the peace of liberation in Buddhism.", "/teachings/the-buddhas-way"],
  ["Om", "ohm (also A-U-M)", "Sanskrit", "The sacred sound of creation in the Hindu, Buddhist, Jain and Sikh traditions.", "/teachings/sound-for-stillness"],
  ["PaRDeS", "PAR-dess", "Hebrew", "\"Orchard\": the four levels of reading scripture, from the plain to the secret.", "/teachings/sacred-texts"],
  ["Philosophia", "fee-loh-soh-FEE-ah", "Greek", "\"Love of wisdom\".", "/teachings/what-is-philosophy"],
  ["Prana", "PRAH-nuh", "Sanskrit", "The life-force carried by the breath.", "/teachings/breath-of-peace"],
  ["Pranayama", "prah-nah-YAH-muh", "Sanskrit", "The guiding of the life-force through the breath.", "/teachings/breath-of-peace"],
  ["Qi", "chee", "Chinese", "Life-energy, in Chinese thought and medicine.", "/teachings/the-way-of-water"],
  ["Ren", "run", "Chinese", "Humane goodness, the heart of Confucius' teaching.", "/teachings/confucius-and-mencius"],
  ["Sahasrara", "suh-hus-RAH-ruh", "Sanskrit", "The crown chakra, the thousand-petalled lotus: union with the Divine.", "/teachings/chakra-crown"],
  ["Samadhi", "suh-MAH-dee", "Sanskrit", "Complete absorption in the Divine, the highest state of meditation in Patanjali's yoga.", "/teachings/patanjali"],
  ["Sefer Yetzirah", "SAY-fer yets-EE-rah", "Hebrew", "\"The Book of Formation\": the 32 paths of wisdom.", "/teachings/sefer-yetzirah"],
  ["Sefirot", "sfee-ROTE (one: Sefirah, sfee-RAH)", "Hebrew", "The ten qualities of God on the Tree of Life.", "/teachings/the-ten-sefirot"],
  ["Seva", "SAY-vah", "Sanskrit and Punjabi", "Selfless service.", "/teachings/guru-nanak"],
  ["Shekhinah", "sh'khee-NAH", "Hebrew", "The indwelling Divine Presence of God in the world.", "/teachings/the-zohar"],
  ["Sod", "sode", "Hebrew", "\"Secret\": the mystical level of reading scripture.", "/teachings/sacred-texts"],
  ["Sophia", "soh-FEE-ah", "Greek", "Wisdom.", "/teachings/what-is-philosophy"],
  ["Sufi", "SOO-fee", "Arabic", "A mystic of Islam, on the path of divine love.", "/teachings/rumi"],
  ["Sushumna", "soo-SHOOM-nuh", "Sanskrit", "The central channel of energy along the spine.", "/teachings/the-seven-chakras"],
  ["Svadhisthana", "svahd-HISH-tah-nuh", "Sanskrit", "The sacral chakra: creativity and emotion.", "/teachings/chakra-sacral"],
  ["Tao", "dow", "Chinese", "\"The Way\": the nameless source and flow of all things.", "/teachings/the-way-of-water"],
  ["Tiferet", "tee-FEH-ret", "Hebrew", "\"Beauty\": the heart of the Tree of Life, where love and justice meet.", "/teachings/the-ten-sefirot"],
  ["Tikkun olam", "tee-KOON oh-LAHM", "Hebrew", "\"Mending the world\" through good deeds and prayer.", "/teachings/the-breaking-of-the-vessels"],
  ["Torah", "toh-RAH (also TOR-uh)", "Hebrew", "\"Teaching\": the five books of Moses, and all of God's teaching.", "/teachings/the-torah"],
  ["Trataka", "TRAH-tuh-kuh", "Sanskrit", "Steady gazing meditation on a flame or a point.", "/teachings/trataka"],
  ["Tulku", "TOOL-koo", "Tibetan", "A teacher reborn out of compassion to continue teaching.", "/teachings/the-buddha"],
  ["Ubuntu", "oo-BOON-too", "Nguni languages", "\"I am because we are\": we become human through one another.", "/teachings/what-is-philosophy"],
  ["Upanishad", "oo-PAH-nih-shud", "Sanskrit", "The ancient wisdom texts of India, the summit of the Vedas.", "/teachings/the-six-branches-of-philosophy"],
  ["Vishuddha", "vih-SHOOD-huh", "Sanskrit", "The throat chakra: truth and expression.", "/teachings/chakra-throat"],
  ["Wu wei", "woo way", "Chinese", "Effortless action, flowing with the Way like water.", "/teachings/the-way-of-water"],
  ["Yantra", "YAHN-truh", "Sanskrit", "A sacred geometric diagram for meditation, like the Sri Yantra.", "/teachings/the-symbols-of-sacred-geometry"],
  ["Yoga", "YOH-guh", "Sanskrit", "\"Union\": the path of joining the self with the Divine.", "/teachings/meditation-and-yoga"],
  ["Zakat", "zah-KAHT", "Arabic", "Giving a share of one's wealth to the poor, a pillar of Islam.", "/teachings/muhammad"],
  ["Zohar", "ZOH-har", "Hebrew and Aramaic", "\"Splendour\": the great book of Kabbalah.", "/teachings/the-zohar"],
  ["Abjad", "AB-jad", "Arabic", "The old order of the Arabic alphabet, in which each letter is also a number.", "/teachings/numerology-the-meaning-of-numbers"],
  ["Advaita", "ud-VY-tuh", "Sanskrit", "\"Not two\": the teaching that the Self and God are one.", "/teachings/non-duality-and-ramana-maharshi"],
  ["Akashic Records", "uh-KAH-shik", "Sanskrit and English", "The memory of everything that has ever been, said to be written in the subtle substance of the universe.", "/teachings/the-life-review-and-the-karmic-board"],
  ["Apokatastasis", "ah-po-kah-TAS-tah-sis", "Greek", "The restoration of all things, and all souls, to God.", "/teachings/when-a-soul-quits"],
  ["Atma vichara", "AHT-mah vih-CHAH-ruh", "Sanskrit", "Self-inquiry: asking \"Who am I?\", the practice taught by Ramana Maharshi.", "/teachings/non-duality-and-ramana-maharshi"],
  ["Baqa", "ba-KAH", "Arabic", "Abiding in God: living in the world after the ego has passed away.", "/teachings/the-sufi-path"],
  ["Bardo", "BAR-doh", "Tibetan", "The in-between state after death and before rebirth, said to last 49 days.", "/teachings/death-is-a-doorway"],
  ["Barzakh", "BAR-zakh", "Arabic", "The barrier between this life and the next, where souls wait until the Resurrection.", "/teachings/death-is-a-doorway"],
  ["Devachan", "DAY-vah-chan", "Theosophy", "The happy dream-rest of the soul between lives, in the teaching of H. P. Blavatsky.", "/teachings/the-144-year-cycle"],
  ["Dhikr", "THIK-r", "Arabic", "Remembrance: repeating the names of God, the central practice of the Sufis.", "/teachings/the-sufi-path"],
  ["Fana", "fa-NAH", "Arabic", "The passing away of the ego in God.", "/teachings/the-sufi-path"],
  ["Gilgul", "GIL-gool", "Hebrew", "\"Turning\": the rebirth of souls in Kabbalah.", "/teachings/death-is-a-doorway"],
  ["I AM Presence", "eye am", "English", "In the I AM teachings, God individualised above each soul.", "/teachings/the-i-am-teachings"],
  ["Ihsan", "ih-SAHN", "Arabic", "Excellence: worshipping God as though you see Him.", "/teachings/the-sufi-path"],
  ["Karmic Board", "KAR-mik", "English", "In the Ascended Master teachings, the eight beings who help each soul review its life and plan the next.", "/teachings/the-life-review-and-the-karmic-board"],
  ["Kripa", "KRIH-pah", "Sanskrit", "Grace, the gift of God and of the guru.", "/teachings/grace-surrender-and-humility"],
  ["Ahimsa", "ah-HIM-sah", "Sanskrit", "Non-harm in thought, word and deed: the first restraint of yoga.", "/teachings/on-judgment"],
  ["Shevirat ha-kelim", "sh'vee-RAHT hah-kay-LEEM", "Hebrew", "\"The breaking of the vessels\": the first vessels could not hold the Divine Light and shattered, scattering holy sparks.", "/teachings/the-breaking-of-the-vessels"],
  ["Mashiach", "mah-SHEE-akh", "Hebrew", "\"The anointed one\", the Messiah; in the mystical reading, also the healed consciousness of humanity when the repair is complete.", "/teachings/the-final-revelation"],
  ["Tikkun", "tee-KOON", "Hebrew", "\"Repair\": gathering and lifting the divine sparks; the repair of the world.", "/teachings/on-judgment"],
  ["Lashon hara", "lah-SHOWN hah-RAH", "Hebrew", "\"The evil tongue\": speaking badly about others, even when it is true.", "/teachings/the-power-of-words"],
  ["Ona'at devarim", "oh-nah-AHT d'vah-REEM", "Hebrew", "Wounding another person with words.", "/teachings/the-power-of-words"],
  ["Mahavakya", "mah-hah-VAHK-yuh", "Sanskrit", "A \"great saying\" of the Upanishads, such as \"That thou art\".", "/teachings/non-duality-and-ramana-maharshi"],
  ["Mauna", "MOW-nuh", "Sanskrit", "Sacred silence kept as a spiritual practice.", "/teachings/the-power-of-silence"],
  ["Reintegration", "ree-in-tuh-GRAY-shun", "Martinist tradition", "The return of the soul to the glory it had in God before the fall.", "/teachings/martinism-the-way-of-the-heart"],
  ["Rose Cross", "rohz kross", "Rosicrucian tradition", "The rose of the soul blooming on the cross of earthly life.", "/teachings/the-rosicrucian-path"],
  ["Shakti", "SHUK-tee", "Sanskrit", "The Divine Mother, the power by which all things live and move.", "/teachings/the-divine-feminine"],
  ["Tat tvam asi", "tut TVUM uh-see", "Sanskrit", "\"That thou art\": you are, in truth, the Infinite.", "/teachings/non-duality-and-ramana-maharshi"],
  ["Tawakkul", "ta-WAK-kul", "Arabic", "Trust in God after doing your part.", "/teachings/grace-surrender-and-humility"],
  ["Upavasa", "oo-pah-VAH-suh", "Sanskrit", "Fasting; often explained as \"dwelling near\" God.", "/teachings/fasting-across-the-traditions"],
  ["Violet flame", "VY-uh-lit", "English", "The spiritual fire of mercy and transmutation of Saint Germain.", "/teachings/the-i-am-teachings"],
];
GLOSSARY.sort((a, b) => a[0].localeCompare(b[0], "en"));

const LANG_GROUPS = [["all", "All"], ["Sanskrit", "Sanskrit & Pali"], ["Hebrew", "Hebrew"], ["Greek", "Greek"], ["Arabic", "Arabic"], ["Avestan", "Persian"], ["Punjabi", "Sikh"], ["Chinese", "Chinese"]];
function glossary() {
  const group = (lang) => (/Sanskrit|Pali|Tibetan/.test(lang) ? "Sanskrit" : /Hebrew/.test(lang) ? "Hebrew" : /Punjabi/.test(lang) ? "Punjabi" : /Nguni/.test(lang) ? "other" : lang);
  return `<div class="gl" data-px-glossary>
<label class="gl-search"><span class="sr-only">Search the glossary</span><input type="search" placeholder="Search a word, such as chakra or Ein Sof" data-gl-input autocomplete="off"></label>
<div class="sgx-controls gl-chips" role="group" aria-label="Filter by language">${LANG_GROUPS.map(([g, n], i) => `<button type="button" class="px-chip${i === 0 ? " is-on" : ""}" data-gl-lang="${g}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div>
<p class="gl-none" data-gl-none hidden>No word found. Try another spelling.</p>
<dl class="gl-list">${GLOSSARY.map(([t, say, lang, m, link]) => `<div class="gl-item" data-gl-text="${(t + " " + m + " " + lang).toLowerCase().replace(/"/g, "")}" data-gl-group="${group(lang)}"><dt><a href="${link}">${t}</a> <span class="gl-say">${say}</span> <span class="gl-lang">${lang}</span></dt><dd>${m}</dd></div>`).join("")}</dl></div>`;
}

const DOORS = [
  ["I want to study step by step, in order", "The Path of Study", "/teachings/the-path-of-study", ic(`<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="4" fill="currentColor"/><circle cx="24" cy="8" r="2.5"/><circle cx="40" cy="24" r="2.5"/><circle cx="24" cy="40" r="2.5"/><circle cx="8" cy="24" r="2.5"/>`)],
  ["I want to understand the patterns of creation", "Sacred Geometry", "/library?tab=sacred-geometry", ic(`<circle cx="24" cy="24" r="8"/><circle cx="24" cy="16" r="8"/><circle cx="24" cy="32" r="8"/><circle cx="17" cy="20" r="8"/><circle cx="31" cy="20" r="8"/><circle cx="17" cy="28" r="8"/><circle cx="31" cy="28" r="8"/>`)],
  ["I want to explore the big questions of life", "Philosophy", "/teachings/what-is-philosophy", ic(`<circle cx="18" cy="20" r="6"/><circle cx="30" cy="20" r="6"/><path d="M14 10 L18 14 M34 10 L30 14 M16 32 Q24 40 32 32"/>`)],
  ["I want to feel stillness and inner energy", "Chakras and Practices", "/teachings/practices-and-inner-work", ic(`<path d="M24 8 C28 16 28 22 24 28 C20 22 20 16 24 8 Z M24 28 C30 22 38 22 42 24 C38 30 30 32 24 28 Z M24 28 C18 22 10 22 6 24 C10 30 18 32 24 28 Z"/><path d="M10 38 h28"/>`)],
  ["I want to meet the messengers and their holy books", "Prophets & Teachers and Sacred Texts", "/teachings/prophets-and-teachers", ic(`<path d="M24 14 C18 10 10 10 6 12 V38 C10 36 18 36 24 40 C30 36 38 36 42 38 V12 C38 10 30 10 24 14 Z M24 14 V40"/>`)],
  ["I want to know the angels and the masters", "Masters & Angels", "/masters", ic(`<path d="M24 22 C18 12 8 10 4 14 C8 22 16 26 24 26 C32 26 40 22 44 14 C40 10 30 12 24 22 Z"/><circle cx="24" cy="30" r="5"/><path d="M24 35 V44"/>`)],
  ["I want to understand the soul's journey", "The Human Story and Beyond the Veil", "/teachings/why-we-came", ic(`<path d="M8 40 C14 30 20 34 24 24 C28 14 34 18 40 8"/><circle cx="40" cy="8" r="3" fill="currentColor"/><circle cx="8" cy="40" r="3"/>`)],
  ["I want to know what happens when we die", "The Soul's Journey", "/teachings/death-is-a-doorway", ic(`<path d="M16 40 V20 A8 8 0 0 1 32 20 V40 Z"/><path d="M10 40 H38"/><circle cx="24" cy="10" r="2" fill="currentColor"/>`)],
  ["I want to walk an inner path", "The Mystery Schools", "/teachings/the-mystery-schools", ic(`<circle cx="24" cy="24" r="6"/><path d="M24 8 C30 14 30 18 24 18 C18 18 18 14 24 8 Z M40 24 C34 30 30 30 30 24 C30 18 34 18 40 24 Z M24 40 C18 34 18 30 24 30 C30 30 30 34 24 40 Z M8 24 C14 18 18 18 18 24 C18 30 14 30 8 24 Z"/>`)],
  ["I want spirit in my daily life", "Spirit in Daily Life", "/teachings/intuition-the-still-small-voice", ic(`<path d="M12 34 C14 40 34 40 36 34 Z"/><path d="M36 34 C38 30 40 28 42 26"/><path d="M24 30 C20 24 22 18 24 14 C26 18 28 24 24 30 Z"/>`)],
  ["I want wisdom for the heart, today", "Teachings and Wisdom", "/teachings/twelve-teachings-for-the-heart", ic(`<path d="M24 40 C10 30 6 22 10 15 C14 9 21 10 24 16 C27 10 34 9 38 15 C42 22 38 30 24 40 Z"/>`)],
  ["I want to listen and rest", "Music", "/music", ic(`<path d="M18 36 V12 L38 8 V32"/><circle cx="14" cy="36" r="5"/><circle cx="34" cy="32" r="5"/>`)],
];
function doors() {
  return `<div class="st-doors">${DOORS.map(([want, where, href, icon]) => `<a class="st-door" href="${href}">${icon}<span class="st-want">${want}</span><span class="st-where">${where} →</span></a>`).join("")}</div>`;
}

export function startArt(key) {
  return { "start-glossary": glossary, "start-doors": doors }[key]?.() || "";
}

export const startPages = [
  { slug: "where-to-begin", tag: "Start here", title: "Where to Begin",
    summary: "New here? What SAMADHI LOVE is, how it approaches the great traditions, and a doorway for whatever your heart is looking for today.",
    body: `**Welcome.** SAMADHI LOVE is a quiet place to explore the wisdom of humanity: the teachings of the prophets and sages, the mystics, the philosophers, the sacred texts, the chakras and sacred geometry, and the practices that turn them into experience. You do not need to read it in order. Begin wherever your heart is drawn.

## Choose your doorway

{{start-doors}}

## How this place speaks
- **Every tradition in its own words.** Each faith is described as it describes itself, with respect. No tradition is put above another.
- **Wonder and honesty together.** Where tradition and history tell a story differently, both are given, gently, side by side.
- **Samadhi's view is labelled.** When Samadhi shares his own understanding, it is marked as his, so you can always tell it apart.
- **Into the mystical heart.** Every religion holds a mystical heart. These teachings walk into that heart. Nothing here is for sale, no one claims the final word, and you are free to take what is true for you and leave the rest.
- **Unity, not sides.** This is a place of light, not of politics: one human family, many paths.

## New words?
Sanskrit, Hebrew, Greek and other sacred languages appear on many pages. The **[Glossary](/teachings/glossary)** explains each one in a single sentence, with a simple way to say it.

## A word of care
The practices here are gentle companions for the spirit, not medical treatment. Read **[Principles & Care](/teachings/principles-and-care)** for how this place approaches health, honesty and safety.` },

  { slug: "glossary", tag: "Start here", title: "Glossary: Sacred Words Made Simple",
    summary: "The Sanskrit, Hebrew, Greek, Arabic, Avestan, Punjabi and Chinese words used across this site, each with a simple way to say it and one plain sentence of meaning.",
    body: `Sacred words carry a fragrance that translations lose, so this site keeps many of them. Here each one is explained in a single sentence, with a simple guide to saying it: the part in capitals is said a little stronger, and "kh" is said like the "ch" in the Scottish "loch". Tap any word to read where it is taught.

{{start-glossary}}

These are simple guides, not perfect pronunciations: every language has sounds that English letters cannot quite write. Say them with love, and you will not be far wrong.` },

  { slug: "principles-and-care", tag: "Start here", title: "Principles and Care",
    summary: "How SAMADHI LOVE approaches health, honesty and safety: a place of study and contemplation that supports, and never replaces, medical and mental-health care. Free, open, and without a guru.",
    body: `## What this place is
SAMADHI LOVE is a place of **study, contemplation and inspiration**. It shares what the world's traditions teach, Samadhi's own understanding (always labelled as his), and simple practices for stillness. It is an offering, made with love.

## What it is not
- **Not medical or psychological treatment.** Breathwork, chakra work, meditation and the teachings here can bring peace and strength, but they **support, and never replace**, the care of doctors, therapists and other health professionals. Please do not stop or change any treatment because of something you read here.
- **Not a promise of miracles.** Nothing here is sold as a cure.
- **Not a guru.** No one here claims final authority over your soul. The aim is to strengthen your own inquiry, your own heart and your own connection with the Divine.

## Practise safely
- **Go gently.** Stop any practice that makes you dizzy, anxious or unwell, and breathe normally.
- **Breathwork:** strong practices such as Kapalbhati are not for pregnancy, high blood pressure, heart disease, epilepsy, a hernia or recent surgery. If in doubt, ask your doctor and learn from an experienced teacher.
- **Gazing (trataka):** never strain the eyes; if you have epilepsy or are sensitive to light, use the still shapes rather than the flame.
- **Deep inner work** can sometimes stir up strong feelings. That is human. Be kind to yourself, and reach out to someone you trust.

## If you are struggling
If you are in emotional distress or thinking of harming yourself, please reach out now to someone who can help. In the United States, you can call or text **988** to reach the Suicide and Crisis Lifeline at any time. Elsewhere, contact your local emergency number or a local crisis line. You are not alone.

## Free and open
Everything on this site is free to read and to practise. There is no paywall and nothing to join. If something here helps you, the best thanks is to live it: be kind, be honest, and pass the light on.

## Honest about sources
Quotations come from scriptures and trusted translations, and each page lists its sources. Where tradition and history tell a story differently, both are given gently. If you find a mistake, please [write to us](/contact): accuracy matters, especially on sacred subjects.

## Respect for every path
Every faith is honoured here, and described in its own words. This site stays out of politics, and never supports ideas that divide countries, religions or peoples. See also [My Vision](/about#vision).` },
];
