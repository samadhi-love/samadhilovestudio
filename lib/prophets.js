// Prophets & Teachers: messengers, reformers and awakened teachers of the world's traditions.
// Each tradition is described in its own terms. No faces are drawn: every figure has an emblem only,
// out of respect (above all for Islam, which does not picture the Prophet).
// Quotations from public-domain translations: King James Bible, Pickthall's Qur'an (1930),
// Max Müller's Dhammapada (1881), Mills' Gathas (1887); Sikh scripture as given on SearchGurbani.
// Facts checked Nov 2026. The filters use CSS radio buttons only (no inline scripts).

const GOLD = "#f2c46d";
const ic = (paths) => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" class="pf-icon"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
const EMBLEM = {
  enoch: ic(`${[4.5, 7.5, 10.5, 13.5, 16.5, 19.5, 22].map((r, k) => `<circle cx="24" cy="24" r="${r}" opacity="${(0.45 + k * 0.08).toFixed(2)}" stroke-width="${k === 6 ? 2.2 : 1.4}"/>`).join("")}<path d="M24 19.5 l1.3 3.3 h3.5 l-2.8 2.1 1 3.4 -3 -2 -3 2 1 -3.4 -2.8 -2.1 h3.5 z" fill="currentColor"/>`),
  abraham: ic(`<path d="M24 6 l2.2 6.6 h6.9 l-5.6 4.1 2.1 6.6 -5.6 -4.1 -5.6 4.1 2.1 -6.6 -5.6 -4.1 h6.9 z"/><circle cx="9" cy="30" r="1.6" fill="currentColor"/><circle cx="17" cy="38" r="1.6" fill="currentColor"/><circle cx="31" cy="38" r="1.6" fill="currentColor"/><circle cx="39" cy="30" r="1.6" fill="currentColor"/><circle cx="24" cy="42" r="1.6" fill="currentColor"/><circle cx="12" cy="20" r="1.2" fill="currentColor"/><circle cx="36" cy="20" r="1.2" fill="currentColor"/>`),
  moses: ic(`<path d="M8 40 V14 a7 7 0 0 1 14 0 V40 Z M26 40 V14 a7 7 0 0 1 14 0 V40 Z"/><path d="M12 20 h6 M12 26 h6 M12 32 h6 M30 20 h6 M30 26 h6 M30 32 h6"/>`),
  zoroaster: ic(`<path d="M24 6 C30 14 34 18 34 26 a10 10 0 0 1 -20 0 C14 20 18 18 20 12 C22 18 26 18 24 6 Z"/><path d="M14 42 h20 M18 38 h12"/>`),
  buddha: ic(`<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="4"/>${Array.from({ length: 8 }, (_, i) => { const a = (i * 45 * Math.PI) / 180; return `<path d="M${(24 + 4 * Math.cos(a)).toFixed(1)} ${(24 + 4 * Math.sin(a)).toFixed(1)} L${(24 + 17 * Math.cos(a)).toFixed(1)} ${(24 + 17 * Math.sin(a)).toFixed(1)}"/>`; }).join("")}`),
  prophets: ic(`<path d="M10 10 h24 a4 4 0 0 1 4 4 v24 a4 4 0 0 1 -4 4 H14 a4 4 0 0 1 -4 -4 Z"/><path d="M10 10 a4 4 0 0 0 0 8 h4 M16 22 h16 M16 28 h16 M16 34 h10"/>`),
  jesus: ic(`<path d="M24 6 V42 M14 16 H34"/><circle cx="24" cy="16" r="13" opacity=".5"/>`),
  muhammad: ic(`<path d="M24 14 C18 10 10 10 6 12 V38 C10 36 18 36 24 40 C30 36 38 36 42 38 V12 C38 10 30 10 24 14 Z M24 14 V40"/><path d="M24 4 v5 M17 6 l2 4 M31 6 l-2 4"/>`),
  krishna: ic(`<path d="M6 34 L40 12"/><circle cx="16" cy="27.6" r="1.4" fill="currentColor"/><circle cx="22" cy="23.8" r="1.4" fill="currentColor"/><circle cx="28" cy="20" r="1.4" fill="currentColor"/><path d="M36 30 Q46 40 30 44" /><path d="M10 10 Q4 22 14 30" opacity=".7"/>`),
  nanak: ic(`<circle cx="24" cy="24" r="7" fill="currentColor"/><circle cx="24" cy="24" r="14"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180; return `<path d="M${(24 + 17 * Math.cos(a)).toFixed(1)} ${(24 + 17 * Math.sin(a)).toFixed(1)} L${(24 + 21 * Math.cos(a)).toFixed(1)} ${(24 + 21 * Math.sin(a)).toFixed(1)}"/>`; }).join("")}`),
};

// [slug, emblem, name, era, traditions, filter group, role, nature]
const PEOPLE = [
  ["enoch", "enoch", "Enoch (Idris)", "Before the Flood, by tradition", "Judaism · Christianity · Islam", "abr", "The one who walked with God", "A righteous man taken up by God; a prophet (Idris) in Islam; in Jewish mysticism, the angel Metatron"],
  ["abraham", "abraham", "Abraham (Ibrahim)", "c. 2nd millennium BCE, by tradition", "Judaism · Christianity · Islam", "abr", "Father of faith in the One God", "A human prophet and spiritual ancestor; the Friend of God"],
  ["moses", "moses", "Moses (Musa)", "Traditionally c. 13th century BCE", "Judaism · Christianity · Islam", "abr", "Lawgiver and liberator", "The greatest prophet in Judaism; a great messenger in Christianity and Islam; fully human"],
  ["zarathushtra", "zoroaster", "Zoroaster (Zarathushtra)", "Debated: c. 1500–1000 BCE, or later", "Zoroastrianism", "per", "Prophet of the choice between truth and the lie", "A human prophet who received revelation from Ahura Mazda"],
  ["the-buddha", "buddha", "Siddhartha Gautama, the Buddha", "c. 5th century BCE", "Buddhism", "dha", "The Awakened One, teacher of the Middle Way", "A human being who awakened; later schools speak of his three bodies"],
  ["isaiah-jeremiah-ezekiel", "prophets", "Isaiah, Jeremiah and Ezekiel", "8th to 6th centuries BCE", "Judaism · Christianity · Islamic tradition", "abr", "Prophets of justice and the new heart", "Human messengers, speaking truth to power"],
  ["jesus-of-nazareth", "jesus", "Jesus of Nazareth (Isa)", "c. 4 BCE to c. 30–33 CE", "Christianity · Islam · Bahá'í", "abr", "Teacher of love, forgiveness and the kingdom within", "God incarnate for Christians; the Messiah and a great prophet in Islam"],
  ["muhammad", "muhammad", "Muhammad", "c. 570–632 CE", "Islam", "abr", "The Messenger through whom the Qur'an came", "A human prophet and messenger, the Seal of the Prophets; never divine"],
  ["krishna-and-rama", "krishna", "Krishna and Rama", "The epic and Puranic ages", "Hinduism", "dha", "Teachers of dharma and devotion", "Avatars: the Divine descending into the world"],
  ["guru-nanak", "nanak", "Guru Nanak", "1469–1539 CE", "Sikhism", "sik", "Founder of Sikhism, teacher of the One", "An enlightened Guru carrying the divine light, not an avatar"],
];
const FILTERS = [["all", "All"], ["abr", "Abrahamic"], ["dha", "Dharmic"], ["per", "Persian"], ["sik", "Sikh"]];

function explorer() {
  const inputs = FILTERS.map(([id], i) => `<input type="radio" name="pf-filter" id="pf-${id}" class="pf-in"${i === 0 ? " checked" : ""}>`).join("");
  const labels = FILTERS.map(([id, name]) => `<label for="pf-${id}">${name}</label>`).join("");
  const cards = PEOPLE.map(([slug, em, name, era, trad, g, role, nature]) => `<a class="pf-card pf-${g}" href="/teachings/${slug}">${EMBLEM[em]}<h3>${name}</h3><p class="pf-era">${era}</p><p class="pf-trad">${trad}</p><p><strong>${role}.</strong> ${nature}.</p></a>`).join("");
  return `<div class="pf-explorer">${inputs}<div class="sgx-controls pf-controls" role="group" aria-label="Filter by tradition">${labels}</div><div class="pf-grid">${cards}</div></div>`;
}

const GOLDEN = [
  ["Torah", "Thou shalt love thy neighbour as thyself.", "Leviticus 19:18"],
  ["Hillel", "What is hateful to you, do not do to your neighbour.", "Talmud, Shabbat 31a"],
  ["Zoroaster", "That nature alone is good which does not do to another what is not good for itself.", "Dadistan-i-Dinik 94.5"],
  ["The Buddha", "Hurt not others in ways that you yourself would find hurtful.", "Udanavarga 5.18"],
  ["Jesus", "All things whatsoever ye would that men should do to you, do ye even so to them.", "Matthew 7:12"],
  ["Muhammad", "None of you truly believes until he loves for his brother what he loves for himself.", "Forty Hadith of an-Nawawi, 13"],
  ["Mahabharata", "One should never do to another what one would find hurtful to oneself.", "Anushasana Parva 113.8"],
  ["Guru Granth Sahib", "No one is my enemy, and no one is a stranger. I get along with everyone.", "Ang 1299"],
];
const goldenStrip = () => `<div class="pf-golden">${GOLDEN.map(([who, says, ref]) => `<div class="pf-gold-card"><p>"${says}"</p><footer><strong>${who}</strong> · ${ref}</footer></div>`).join("")}</div>`;

// Samadhi's own pictures for the prophets' pages: symbols only, never faces.
const RESPECT = "Out of respect, this site does not picture the prophets' faces.";
const PHOTOS = {
  abraham: ["abraham-tent.jpg", 900, "A tent lit by a small fire in a wide desert under a sky full of stars and the Milky Way", "\u201cLook now toward heaven, and tell the stars, if thou be able to number them\u201d (Genesis 15:5, KJV). Abraham's tent under the stars."],
  moses: ["burning-bush.jpg", 900, "A bush glowing with golden fire on a rocky mountainside under a night full of stars", "\u201cThe bush burned with fire, and the bush was not consumed\u201d (Exodus 3:2, KJV)."],
  zoroaster: ["sacred-fire.jpg", 1067, "A tall flame burning in a golden bowl on a carved stone altar inside a quiet temple", "The sacred fire of Zarathushtra, kept burning in Zoroastrian fire temples as a sign of the light of truth."],
  buddha: ["bodhi-tree.jpg", 1067, "A great Bodhi tree at night under a full moon, a glowing lotus at its roots and a golden wheel of the Dharma among its leaves", "The Bodhi tree under a full moon, with the lotus and the wheel of the Dharma. Buddhists remember the awakening under this tree on the full moon of Vesak."],
  prophets: ["new-heart.jpg", 900, "A heart of stone cracking open to show a heart of golden light inside, beside a branch of white blossom", "\u201cA new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh\u201d (Ezekiel 36:26, KJV)."],
  jesus: ["dove-lamb.jpg", 900, "A white dove descending in rays of light over a calm river at dawn, and a small white lamb resting on the grassy bank", "The dove over the river and the lamb: \u201cthe Spirit of God descending like a dove\u201d at his baptism (Matthew 3:16, KJV), and \u201cBehold the Lamb of God\u201d (John 1:29, KJV)."],
  krishna: ["flute-bow-lotus.jpg", 1067, "A golden flute with a peacock feather, and a golden bow and arrow, resting on a pink lotus in warm light", "Krishna's flute and peacock feather, and Rama's bow and arrow, on a lotus. The flute is the divine music that draws the soul."],
  nanak: ["lotus-sunrise.jpg", 900, "A white lotus floating on still water in morning mist as the sun rises over the hills", "A lotus on the water at sunrise. Guru Nanak taught that we can live in the world like the lotus on the water, untouched by it (Guru Granth Sahib, Ang 938)."],
  muhammad: ["lamp-niche.jpg", 1067, "A glass lamp shining like a star in a carved stone niche, looking out over desert dunes under the stars", "\u201cThe similitude of His light is as a niche wherein is a lamp. The lamp is in a glass. The glass is as it were a shining star\u201d (Qur'an 24:35, Pickthall)."],
};
const photoHero = (em) => { const [src, h, alt, cap] = PHOTOS[em]; return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/${src}" width="1600" height="${h}" alt="${alt}" loading="lazy" decoding="async"></div><figcaption class="fine">${cap} Picture shared by Samadhi. ${RESPECT}</figcaption></figure>`; };

const hero = (em, title) => `<figure class="cross-hero pf-hero"><div class="pf-hero-art" role="img" aria-label="${title}">${EMBLEM[em]}</div><figcaption class="fine">An emblem, drawn for SAMADHI LOVE. Out of respect, this site does not picture the prophets' faces.</figcaption></figure>`;
function banner() {
  return `<figure class="cross-hero pf-banner"><div class="pf-banner-row" role="img" aria-label="Ten golden emblems in a row: seven rings of heaven, stars, tablets, a flame, a wheel, a scroll, a cross of light, an open book, a flute and a radiant circle">${PEOPLE.map(([, em]) => EMBLEM[em]).join("")}</div><figcaption class="fine">Emblems of ten messengers and teachers, drawn for SAMADHI LOVE. Out of respect, no faces are shown.</figcaption></figure>`;
}

export function prophetArt(key) {
  if (key === "prophet-banner") return banner();
  if (key === "prophet-explorer") return explorer();
  if (key === "prophet-golden") return goldenStrip();
  const m = key.match(/^prophet-hero-(\w+)$/);
  if (m && PHOTOS[m[1]]) return photoHero(m[1]);
  return m && EMBLEM[m[1]] ? hero(m[1], `Emblem of ${PEOPLE.find((p) => p[1] === m[1])?.[2] || "a prophet"}`) : "";
}

const glance = (slug) => {
  const [, , name, era, trad, , role, nature] = PEOPLE.find((p) => p[0] === slug);
  return `| | |\n| --- | --- |\n| Era | ${era} |\n| Tradition | ${trad} |\n| Role | ${role} |\n| How the traditions see him | ${nature} |`;
};
const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;
const back = "\n\nSee all the messengers in [Prophets and Teachers](/teachings/prophets-and-teachers).";

export const prophets = [
  { slug: "prophets-and-teachers", tag: "Overview", title: "Prophets and Teachers: Messengers of the One Light",
    summary: "Across history and across the world, prophets, sages and awakened teachers called humanity back to truth, compassion and justice. Who they were, how each tradition sees them, and the one rule they all share.",
    body: `{{prophet-banner}}

In every age and every land, when people forgot what matters, someone rose to remind them. They came as **prophets** speaking the word of God, as **sages** teaching the way of wisdom, and as **awakened teachers** showing the path to freedom. They confronted kings, defended the poor, broke the idols of their time, and called the human heart back to truth, compassion, justice and the Divine.

## Prophet, awakened teacher, avatar
The traditions do not all see their founders in the same way, and it is important to say so clearly:
- **A prophet** is a human being chosen by God to carry His message. This is how Judaism, Christianity and Islam see Abraham, Moses and the prophets, and how Islam sees Jesus and Muhammad.
- **An awakened teacher** is a human being who reached the truth through his own practice and then taught others the way. This is how Buddhism sees the Buddha.
- **An avatar** is the Divine itself descending into the world in a form, to restore what is right. This is how Hinduism sees Krishna and Rama.
- **The Incarnation** is the Christian teaching that God became human in Jesus, fully God and fully man.
- **A Guru** in Sikhism is an enlightened teacher who carries the divine light, passed from Guru Nanak through ten Gurus to the holy scripture, the Guru Granth Sahib.

## Explore the messengers
Choose a tradition, or open any card to read more.

{{prophet-explorer}}

## The thread that runs through them all
Prophets of different lands, in different centuries, speaking different languages, all came back to the same rule: **treat others as you want to be treated.**

{{prophet-golden}}

## Keeping it honest: what each tradition teaches
- **The Abrahamic prophets are human.** Judaism, Christianity and Islam teach that Abraham, Moses, Isaiah and Muhammad were human beings chosen by God, never gods in human form.
- **The Christian Incarnation is unique to Christianity.** Christians believe God entered human history in Jesus; Muslims honour Jesus as the Messiah and a great prophet, but not as God.
- **Avatars and awakening are different ideas.** Krishna and Rama are taught in Hinduism as divine descents; the Buddha's awakening is taught in Buddhism as a human being realising the truth. Tibetan Buddhism also honours *tulkus*, teachers reborn out of compassion to keep teaching.
- **One soul in many messengers?** Some modern spiritual teachings speak of one great soul returning as many messengers through the ages. That is their teaching. Mainstream Christianity and Islam do not teach reincarnation; in Judaism it is taught only in the mystical tradition of Kabbalah, as *gilgul*, the turning of souls, and never as one soul passing through the prophets of different faiths. Each faith sees its prophet as his own. On this site, each tradition is described as it describes itself.

## Samadhi's view
*This is Samadhi's own understanding.*

The messengers came from one Source, the way many rays come from one sun. Each spoke in the language of his people and his time, and each was given a different task, but the light was the same: love God, love one another, and live in truth. When we honour all of them, we honour the One who sent them.${bridge([
      ["One Source, One Message", "/teachings/one-source-one-message", "the shared message of all the prophets."],
      ["Sacred Texts and the Search for Deeper Meaning", "/teachings/sacred-texts", "the Torah, the Sefer Yetzirah and the Zohar."],
      ["The Golden Rule: One Law in Every Faith", "/teachings/the-golden-rule", "the shared rule in more traditions."],
      ["The Six Branches of Philosophy", "/teachings/the-six-branches-of-philosophy", "ethics and the wisdom of East and West."],
      ["The Seven Chakras", "/teachings/the-seven-chakras", "the inner path of the Dharmic traditions."],
    ])}

## Sources

- The scriptures of each tradition, cited on each prophet's own page.
- Matthew 7:12 and Leviticus 19:18, King James Bible; Talmud, *Shabbat* 31a; an-Nawawi, *Forty Hadith* 13; *Udanavarga* 5.18; Mahabharata, *Anushasana Parva* 113.8; *Dadistan-i-Dinik* 94.5.
- Guru Granth Sahib, [Ang 1299](https://searchgurbani.com/guru-granth-sahib/ang/1299).` },

  { slug: "one-source-one-message", tag: "Overview", title: "One Source, One Message",
    summary: "All the prophets came from one Source with one message: love God, love one another, do justice and show mercy. How the traditions themselves say so, how believers read the hard stories of war in their scriptures, and Samadhi's view.",
    body: `{{prophet-banner}}

Different lands, different centuries, different languages, and yet the prophets and sages say the same things, again and again: **love God with all your heart, love your neighbour as yourself, do justice, show mercy, and walk humbly.** Many believe this is because they all drew from one Source.

## The traditions say it themselves
- **The Qur'an:** "We believe in Allah and that which is revealed unto us and that which was revealed unto Abraham, and Ishmael, and Isaac, and Jacob, and the tribes, and that which Moses and Jesus received, and that which the Prophets received from their Lord. We make no distinction between any of them" (Qur'an 2:136, Pickthall). "And for every nation there is a messenger" (10:47).
- **The Rig Veda:** "Truth is one; the wise call it by many names" (Rig Veda 1.164.46).
- **The Bhagavad Gita:** in whatever way people come to Me, so I receive them; every path they take is Mine (Gita 4:11).
- **The Bahá'í Faith** teaches that the great messengers of God, Abraham, Moses, the Buddha, Jesus, Muhammad and others, are like one light shining from different lamps.

## One message, in their own words
- **The Torah and the prophets:** "what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?" (Micah 6:8). The sage Hillel summed up the whole Torah: "What is hateful to you, do not do to your fellow; that is the whole Torah, the rest is commentary" (Talmud, Shabbat 31a).
- **Jesus:** love God, and love your neighbour as yourself: "On these two commandments hang all the law and the prophets" (Matthew 22:40). And to Peter in Gethsemane: "Put up again thy sword into his place: for all they that take the sword shall perish with the sword" (Matthew 26:52).
- **The Qur'an:** "There is no compulsion in religion" (2:256). "We sent thee not save as a mercy for the peoples" (21:107). Whoever saves one life, it is as if he saved all humanity (5:32).
- **The Buddha:** "hatred ceases by love, this is an old rule" (Dhammapada 5).
- **Guru Nanak:** "No one is my enemy, and no one is a stranger" (Guru Granth Sahib, Ang 1299).

## The hard stories
It must be said honestly: the scriptures also tell of wars. The Torah and the books of Joshua and Kings tell of conquest and battle; the life of the Prophet Muhammad includes the battles of Badr and Uhud. Believers read these passages in different ways:
- **As the history of a particular time**, when peoples lived and died by the sword, not as a command for all times.
- **As God's justice** in particular circumstances, as many traditional teachers explain them.
- **As symbols of the inner war.** The early Christian teacher Origen read the battles of Joshua as the soul's struggle against its own vices (*Homilies on Joshua*). Many Sufis speak of the "greater struggle" (*al-jihad al-akbar*), the war against one's own ego, in a well-known saying attributed to the Prophet, though the scholars of hadith consider its chain weak.

This site does not tell any believer how to read their own holy book. It only notices that the message all the traditions share, love, justice and mercy, is the one that unites humanity.

## And at the end?
Most of Judaism, Christianity and Islam teach a judgment after death, and many teach an eternal hell. Yet each tradition also holds gentler voices. The rabbis taught that the judgment of Gehinnom lasts no more than twelve months (Mishnah, Eduyot 2:10). The early Christian teachers Origen and Gregory of Nyssa hoped that in the end all souls would be restored to God. A few classical Muslim scholars discussed whether the Fire would one day come to an end. In Hinduism and Buddhism, the hells are not eternal, but passing states on the soul's long road.

## Samadhi's view
*This is Samadhi's own understanding.*

All the prophets come from one Source, with one message and the same wisdom. A true prophet carries only a message of love and unity. Stories of prophets as conquerors and killers, calling for aggression and victory over others, do not carry the message of God: with all respect, they come from human hands and human times, not from God's heart. God does not send His messengers to win wars over His own children. At the end we all go back to God. There is no hell, only the lives we create for ourselves, here and in the lives to come, until every soul learns to love and returns home.${bridge([
      ["Prophets and Teachers", "/teachings/prophets-and-teachers", "each messenger, as his own tradition sees him."],
      ["Peace in the Land of God", "/teachings/peace-in-the-land-of-god", "why no one wins through fighting and killing."],
      ["Give Your Soul Only to God", "/teachings/give-your-soul-only-to-god", "faith known by its fruits."],
      ["The Grandfather's Letter: How to Trust What We Read", "/teachings/the-grandfathers-letter", "how to read sacred books wisely."],
    ])}

## Sources

- Qur'an 2:136, 2:256, 5:32, 10:47 and 21:107, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=2&verse=136).
- Micah 6:8; Matthew 22:37–40 and 26:52, King James Bible; Talmud, *Shabbat* 31a; Mishnah, *Eduyot* 2:10.
- *Rig Veda* 1.164.46; *Bhagavad Gita* 4:11; *The Dhammapada*, verse 5, translated by F. Max Müller (1881); Guru Granth Sahib, [Ang 1299](https://searchgurbani.com/guru-granth-sahib/ang/1299).
- Origen, *Homilies on Joshua*; Gregory of Nyssa, *On the Soul and the Resurrection*; al-Bayhaqi, *al-Zuhd al-Kabir*, on the "greater jihad".` },

  { slug: "enoch", tag: "Abrahamic", title: "Enoch (Idris): The One Who Walked with God",
    summary: "The seventh from Adam, who walked with God and was taken up without dying: honoured in the Bible, as the prophet Idris in Islam, and in Jewish mysticism as the scribe of heaven, Metatron.",
    body: `{{prophet-hero-enoch}}

${glance("enoch")}

## Seven words in Genesis
In the long list of the generations from Adam to Noah, every name ends the same way: "and he died". Every name but one. Of **Enoch**, the seventh from Adam, son of Jared and father of Methuselah, the Bible says: "And Enoch walked with God: and he was not; for God took him" (Genesis 5:24, King James Bible). He lived 365 years, as many as the days of the year (Genesis 5:23). Jewish and Christian tradition have read these few words to mean that **he was taken up to God without passing through death**.

## In the New Testament
- **Hebrews:** "By faith Enoch was translated that he should not see death; and was not found, because God had translated him: for before his translation he had this testimony, that he pleased God" (Hebrews 11:5).
- **Jude:** "And Enoch also, the seventh from Adam, prophesied of these, saying, Behold, the Lord cometh with ten thousands of his saints" (Jude 14). These words are a quotation from the Book of Enoch (1 Enoch 1:9).

## Idris in Islam
The Qur'an speaks of the prophet **Idris**: "And make mention in the Scripture of Idris. Lo! he was a saint, a prophet; And We raised him to high station" (Qur'an 19:56–57, Pickthall). It also names him among the steadfast and patient (Qur'an 21:85). Islamic tradition identifies Idris with Enoch, and places him between Adam and Noah. The commentators tell that he was among the first to write with the pen, to study the movements of the stars, and to set out weights and measures, and that he was a tailor who sewed garments. In a hadith of the Prophet's Night Journey, Muhammad met Idris in the **fourth heaven** (Sahih Muslim). Many Muslim scholars of the Middle Ages also held that Idris was the same as **Hermes Trismegistus**, the father of Hermetic wisdom.

## Enoch becomes Metatron
In the Jewish mystical writings of the Hekhalot ("palaces"), Enoch's story goes further. The book known as **3 Enoch** tells that God took Enoch up in a chariot of fire, transformed his body into flame, and made him **Metatron**, the great angel, Prince of the Divine Presence and scribe of heaven, who keeps the records of the world. See [The Books of Enoch](/teachings/the-books-of-enoch) and [Archangel Metatron](/teachings/archangel-metatron).

## What Enoch stands for
- **Walking with God.** A whole life lived in God's presence, day by day, until the line between earth and heaven disappears.
- **Sacred knowledge.** In every tradition Enoch is the scribe and the sage: writing, the stars, the order of the heavens.
- **Conscience.** In the Book of Enoch he warns against violence, corruption and knowledge used without wisdom.
- **Ascent.** He is the model of the soul that rises through the heavens and is transformed by the light.

## How the traditions see him
- **In Judaism** he is a righteous man taken by God; in the mystical tradition, the human being who became the angel Metatron.
- **In Christianity** he is a model of faith, taken up without death; the Ethiopian and Eritrean Orthodox Churches read the Book of Enoch as scripture.
- **In Islam** he is the prophet **Idris**, raised to a high station.
- All three honour him as a **human being** whom God loved and raised up.${back}${bridge([["The Books of Enoch", "/teachings/the-books-of-enoch", "1, 2 and 3 Enoch, the Watchers and the seven heavens, in Sacred Texts."], ["Hermes Trismegistus", "/teachings/hermes-trismegistus", "the sage Islamic tradition linked with Idris."], ["The Symbols of Sacred Geometry", "/teachings/the-symbols-of-sacred-geometry", "Metatron's Cube, and where its name comes from."]])}

## Sources

- Genesis 5:21–24; Hebrews 11:5; Jude 14–15, King James Bible.
- Qur'an 19:56–57 and 21:85, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=19&verse=56); Sahih Muslim, the hadith of the Night Journey.
- *Encyclopaedia Britannica*, entry on Idris; *3 Enoch*, chapters 4–16, translated by P. S. Alexander in *The Old Testament Pseudepigrapha*, vol. 1 (1983).` },

  { slug: "abraham", tag: "Abrahamic", title: "Abraham (Ibrahim): Father of Faith in the One God",
    summary: "The patriarch honoured by Judaism, Christianity and Islam: he left his homeland at God's call, broke with the idols, opened his tent to strangers, and is called the Friend of God.",
    body: `{{prophet-hero-abraham}}

${glance("abraham")}

## The call
Abraham lived, according to tradition, in Mesopotamia, in the city of Ur. God called him to leave everything he knew: "Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will shew thee... and thou shalt be a blessing" (Genesis 12:1–2, King James Bible). He went, not knowing where, trusting only in the One God.

## What he taught by his life
- **One Creator.** Abraham turned away from the many idols of his people to the one God who made heaven and earth. The Qur'an tells how he broke his people's idols to show that they could neither help nor harm (Qur'an 21:51–67).
- **Trust.** God showed him the night sky and promised that his descendants would be as many as the stars (Genesis 15:5).
- **Hospitality.** He ran to welcome three strangers at his tent in the heat of the day and fed them with his best, not knowing they were messengers of God (Genesis 18).
- **Mercy and courage.** He pleaded with God to spare the city of Sodom for the sake of the righteous in it (Genesis 18:23–32).

## How the traditions see him
- **In Judaism** he is *Avraham Avinu*, "Abraham our father", the first to make the covenant with God.
- **In Christianity** he is the father of all who believe, and is called "the Friend of God" (James 2:23).
- **In Islam** he is *Ibrahim*, a great prophet, *Khalil Allah*, the Friend of God: "Allah (Himself) chose Abraham for friend" (Qur'an 4:125, Pickthall). With his son Ishmael he raised the foundations of the Kaaba in Mecca (Qur'an 2:127).
- All three faiths see him as a **human prophet and spiritual ancestor**, never as divine. That is why they are called the **Abrahamic faiths**: three branches from one root.${back}${bridge([["The Torah: The Foundation", "/teachings/the-torah", "where Abraham's story is told."]])}

## Sources

- Genesis 12:1–2, 15:5, 18 and 18:23–32; James 2:23, King James Bible.
- Qur'an 2:127, 4:125 and 21:51–67, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=4&verse=125).` },

  { slug: "moses", tag: "Abrahamic", title: "Moses (Musa): Lawgiver and Liberator",
    summary: "The prophet who spoke with God at the burning bush, led his people out of slavery, and brought the Ten Commandments down from Sinai: the greatest prophet of Judaism, honoured in Christianity and Islam.",
    body: `{{prophet-hero-moses}}

${glance("moses")}

## The burning bush
Moses was born a Hebrew in Egypt, raised in Pharaoh's palace, and fled into the desert after defending a slave. There, at a bush that burned and was not consumed, God called to him. When Moses asked His name, God answered: "I AM THAT I AM" (Exodus 3:14, King James Bible).

## Liberation
Moses returned to Egypt and stood before Pharaoh with one demand from God: "Let my people go" (Exodus 5:1). He led the Israelites out of slavery, through the sea and into the desert. The Exodus has inspired the oppressed of every age, from slaves in America singing *Go Down, Moses* to every people longing to be free.

## The Law
At Mount Sinai, Moses received the **Ten Commandments** and the Torah (Exodus 20). They teach worship of the One God alone, rest on the Sabbath, honour for parents, and the foundations of a just life: do not kill, do not steal, do not bear false witness, do not covet. He also taught justice for the stranger, the widow and the orphan, and the choice at the heart of human life: "I have set before you life and death... therefore choose life" (Deuteronomy 30:19).

## His humility
For all his greatness, the Torah says that "the man Moses was very meek, above all the men which were upon the face of the earth" (Numbers 12:3).

## How the traditions see him
- **In Judaism** he is *Moshe Rabbenu*, "Moses our teacher", the greatest of the prophets: "there arose not a prophet since in Israel like unto Moses, whom the LORD knew face to face" (Deuteronomy 34:10).
- **In Christianity** he is the great lawgiver, who appears with Elijah beside Jesus at the Transfiguration (Matthew 17:3).
- **In Islam** he is *Musa*, named in the Qur'an more often than any other prophet, and called *Kalim Allah*, the one to whom God spoke: "Allah spake directly unto Moses" (Qur'an 4:164, Pickthall).
- In all three he is **fully human**, chosen to carry God's law.${back}${bridge([["The Torah: The Foundation", "/teachings/the-torah", "the five books of Moses."], ["The Six Branches of Philosophy", "/teachings/the-six-branches-of-philosophy", "ethics and justice."]])}

## Sources

- Exodus 3:14, 5:1 and 20; Numbers 12:3; Deuteronomy 30:19 and 34:10; Matthew 17:3, King James Bible.
- Qur'an 4:164, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=4&verse=164).` },

  { slug: "zarathushtra", tag: "Persian", title: "Zoroaster (Zarathushtra): The Choice Between Truth and the Lie",
    summary: "The prophet of ancient Persia who taught that every soul must choose between truth and falsehood, and that the good life is good thoughts, good words and good deeds.",
    body: `{{prophet-hero-zoroaster}}

${glance("zarathushtra")}

## The prophet of ancient Iran
Zarathushtra, known to the Greeks as Zoroaster, was a priest and poet of ancient Iran. His dates are debated: many scholars place him around 1500 to 1000 BCE, because the language of his hymns is very close to the oldest Sanskrit of the Rig Veda; others place him later. His own words survive in seventeen hymns, the **Gathas**, the heart of the Zoroastrian scripture, the Avesta.

## What he taught
- **One wise Lord.** He worshipped **Ahura Mazda**, the Wise Lord, creator of all that is good.
- **Truth and the lie.** The world is a field of struggle between ***asha***, truth, order and righteousness, and ***druj***, the lie and disorder.
- **Free choice.** Every person must choose, with a clear mind, which side to stand on. In the Gathas he asks his hearers to listen to the best teachings and to decide, each one for himself (Yasna 30.2).
- **The threefold path.** ***Humata, Hukhta, Hvarshta***: good thoughts, good words, good deeds. This is still the whole of Zoroastrian ethics in three words.
- **Fire as a sign of truth.** Zoroastrians pray before a pure flame, not as a god, but as a sign of the light and purity of Ahura Mazda.

## How the tradition sees him
Zoroastrians honour him as a **human prophet**, the one who received the revelation of Ahura Mazda and taught it to the world. Today the Parsis of India and the Zoroastrians of Iran keep his faith, among the oldest living religions on earth.${back}${bridge([["Zoroaster, in Philosophy", "/teachings/zoroaster", "his place among the great thinkers."]])}

## Sources

- *The Gathas*, Yasna 30.2, translated by L. H. Mills, in *Sacred Books of the East*, vol. 31 (1887).
- Mary Boyce, *Zoroastrians: Their Religious Beliefs and Practices* (1979).` },

  { slug: "the-buddha", tag: "Dharmic", title: "Siddhartha Gautama: The Buddha, the Awakened One",
    summary: "A prince who left his palace to understand suffering, awakened under the Bodhi tree, and spent forty-five years teaching the Middle Way, compassion and the path to freedom.",
    body: `{{prophet-hero-buddha}}

${glance("the-buddha")}

## The prince who left home
Siddhartha Gautama was born a prince of the Shakya people, at Lumbini, in what is now Nepal. Tradition places his life around 563 to 483 BCE; many historians today place it about a century later. Protected from all sorrow, he one day saw an old man, a sick man, a dead man and a wandering monk, and understood that no palace can keep out suffering. He left everything to find the way beyond it.

## Awakening
After years of hard austerities that almost killed him, he saw that neither luxury nor self-torture leads to freedom, and chose the **Middle Way**. Sitting under a fig tree at **Bodh Gaya**, the Bodhi tree, he awakened. From then on he was called the **Buddha**, the Awakened One. He gave his first teaching at the Deer Park in Sarnath and taught for forty-five years, until his passing at Kushinagar at the age of eighty.

## What he taught
- **The Four Noble Truths:** there is suffering; it has a cause, craving; it can end; and there is a path to its end.
- **The Eightfold Path:** right view, intention, speech, action, livelihood, effort, mindfulness and concentration.
- **Compassion and loving-kindness** for all beings.
- **Love conquers hatred:** "For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule" (Dhammapada 5, Max Müller translation).

See [The Buddha's Way](/teachings/the-buddhas-way) for the full path.

## How the traditions see him
- **Theravada Buddhism** honours him as a **human being** who awakened by his own effort and showed the way.
- **Mahayana Buddhism** speaks of the Buddha's **three bodies** (*trikaya*): the earthly body, the body of bliss, and the truth-body, one with ultimate reality.
- **Tibetan Buddhism** honours *tulkus*, teachers reborn by compassion to continue their work.
- **Some Hindu traditions** count the Buddha among the avatars of Vishnu.${back}${bridge([["The Buddha's Way", "/teachings/the-buddhas-way", "the Four Noble Truths and the Eightfold Path."], ["Philosophy as Medicine for the Soul", "/teachings/philosophy-as-medicine-for-the-soul", "the Buddha as a healer of the mind."], ["The Seven Chakras", "/teachings/the-seven-chakras", "the inner path of the Dharmic traditions."]])}

## Sources

- *The Dhammapada*, verse 5, translated by F. Max Müller (1881).
- Richard Gombrich, *Theravada Buddhism* (2nd ed., 2006), on the Buddha's dates.
- Paul Williams, *Mahayana Buddhism* (2nd ed., 2009), on the three bodies.` },

  { slug: "isaiah-jeremiah-ezekiel", tag: "Abrahamic", title: "Isaiah, Jeremiah and Ezekiel: Prophets of Justice and the New Heart",
    summary: "The great prophets of ancient Israel who confronted corrupt rulers, defended the poor, and taught that God wants a pure heart and justice more than empty ritual.",
    body: `{{prophet-hero-prophets}}

${glance("isaiah-jeremiah-ezekiel")}

## Voices of conscience
In the 8th to 6th centuries BCE, as kingdoms rose and fell, the prophets of Israel stood up to kings and priests and spoke for those who had no voice. They taught that worship without justice is empty.

## Isaiah (8th century BCE)
- **Justice before ritual:** "Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow" (Isaiah 1:17, King James Bible).
- **The vision of peace:** "they shall beat their swords into plowshares, and their spears into pruninghooks: nation shall not lift up sword against nation, neither shall they learn war any more" (Isaiah 2:4).

## Jeremiah (late 7th and early 6th centuries BCE)
- He warned his people for forty years, was mocked, beaten and imprisoned, and wept for them when Jerusalem fell. He is called the weeping prophet.
- **The law written in the heart:** "I will put my law in their inward parts, and write it in their hearts" (Jeremiah 31:33).

## Ezekiel (6th century BCE)
- A priest taken into exile in Babylon, who saw great visions of the glory of God on His throne.
- **A new heart:** "A new heart also will I give you, and a new spirit will I put within you" (Ezekiel 36:26).
- **The valley of dry bones:** a vision of a people brought back to life by the breath of God (Ezekiel 37).

## How the traditions see them
- **In Judaism** they are among the greatest of the prophets, and their books are read in the synagogue.
- **In Christianity** they are honoured as prophets, and Isaiah's words are read as foretelling the Messiah.
- **In Islamic tradition** they are honoured among the prophets sent to the Children of Israel, in the stories of the prophets, though the Qur'an does not name them.
- All see them as **human messengers**, speaking by divine inspiration.${back}${bridge([["Sages and Kings: When Wisdom Met Power", "/teachings/wisdom-and-power", "prophets and sages who stood before rulers."], ["The Six Branches of Philosophy", "/teachings/the-six-branches-of-philosophy", "ethics and social philosophy."]])}

## Sources

- Isaiah 1:17 and 2:4; Jeremiah 31:33; Ezekiel 1, 36:26 and 37, King James Bible.
- Abraham Joshua Heschel, *The Prophets* (1962).` },

  { slug: "jesus-of-nazareth", tag: "Abrahamic", title: "Jesus of Nazareth (Isa): Love, Forgiveness and the Kingdom Within",
    summary: "The teacher of Galilee whose message of love for God and neighbour, forgiveness, mercy and the kingdom within changed the world, and how Christianity, Islam and the mystics each see him.",
    body: `{{prophet-hero-jesus}}

${glance("jesus-of-nazareth")}

## The teacher of Galilee
Jesus was born in the land of Judea, around 4 BCE, and grew up in Nazareth in Galilee. For about three years he walked the villages by the Sea of Galilee, healing the sick, eating with outcasts, and teaching in parables. He was crucified in Jerusalem under the Roman governor Pontius Pilate, around 30 to 33 CE.

## What he taught
- **The two great commandments:** love God with all your heart, and love your neighbour as yourself (Matthew 22:37–39).
- **Love even your enemies:** "Love your enemies, bless them that curse you, do good to them that hate you" (Matthew 5:44, King James Bible).
- **Forgiveness without limit:** not seven times, but seventy times seven (Matthew 18:22).
- **Mercy before judgement:** "He that is without sin among you, let him first cast a stone" (John 8:7).
- **The kingdom within:** "the kingdom of God is within you" (Luke 17:21).
- **The Golden Rule** (Matthew 7:12), and the Beatitudes: blessed are the merciful, the peacemakers and the pure in heart (Matthew 5:3–10).

## How the traditions see him
- **Mainstream Christianity** teaches the **Incarnation**: that Jesus is God become human, fully divine and fully human. "And the Word was made flesh, and dwelt among us" (John 1:14).
- **Islam** honours him as *Isa al-Masih*, the **Messiah**, born of the Virgin Mary, a mighty prophet and worker of miracles, but **not divine**. In the Qur'an he says: "I am the slave of Allah. He hath given me the Scripture and hath appointed me a Prophet" (Qur'an 19:30, Pickthall).
- **The Bahá'í Faith** sees him as a Manifestation of God, one of a line of divine messengers.
- **Many mystics and modern spiritual teachers**, among them Paramahansa Yogananda, speak of the **Christ Consciousness**: the presence of God that shone fully in Jesus and is waiting to awaken in every soul.${back}${bridge([["I Am the Way", "/teachings/i-am-the-way", "his words read from within."], ["The Golden Rule: One Law in Every Faith", "/teachings/the-golden-rule", "his rule, in every tradition."], ["The Six Branches of Philosophy", "/teachings/the-six-branches-of-philosophy", "ethics: how should we live?"]])}

## Sources

- Matthew 5:3–10, 5:44, 7:12, 18:22 and 22:37–39; Luke 17:21; John 1:14 and 8:7, King James Bible.
- Qur'an 19:30, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=19&verse=30); Qur'an 4:171.
- Paramahansa Yogananda, *The Second Coming of Christ* (2004).` },

  { slug: "muhammad", tag: "Abrahamic", title: "Muhammad: The Messenger of the Qur'an",
    summary: "The Prophet of Islam, through whom the Qur'an was revealed: he called people to the One God, to charity, justice, care for orphans and the poor, and accountability before God. Muslims honour him as the Seal of the Prophets.",
    body: `{{prophet-hero-muhammad}}

${glance("muhammad")}

Muslims say "peace be upon him" after the Prophet's name, and, out of respect, they do not picture him. This page follows that custom: only an emblem is shown.

## His life
Muhammad was born in **Mecca** around 570 CE and orphaned young. He worked as a trader and was known as *al-Amin*, the trustworthy. At about forty, while praying in the cave of Hira, he received the first revelation of the **Qur'an** through the angel Gabriel (Jibril), around 610 CE. For twenty-three years the revelation continued. In 622 he and his followers moved to **Medina**, the *Hijra*, where the first Muslim community was formed. He passed away in Medina in 632.

## What he taught
- **One God.** There is no god but God, *Allah*, the Merciful, the Compassionate, without partner or likeness.
- **Charity.** *Zakat*, giving a share of one's wealth to the poor, is one of the five pillars of Islam.
- **Care for the orphan and the poor.** The Qur'an reminds him: "Did He not find thee an orphan and protect (thee)?... Therefor the orphan oppress not" (Qur'an 93:6–9, Pickthall).
- **Justice and equality** before God, whatever a person's tribe or wealth.
- **Accountability.** Every soul will answer for its deeds.
- **Mercy.** "We sent thee not save as a mercy for the peoples" (Qur'an 21:107, Pickthall).

## How the tradition sees him
- Islam teaches that Muhammad was **a human being, a prophet and messenger**, and nothing more: "Say: I am only a mortal like you. My Lord inspireth in me that your Allah is only One Allah" (Qur'an 18:110, Pickthall).
- He is the **Seal of the Prophets** (Qur'an 33:40), the last in the line that includes Abraham, Moses and Jesus.
- Islam firmly rejects any idea that he was divine. He is loved and honoured as the perfect example of a human life lived for God.${back}${bridge([["The Golden Rule: One Law in Every Faith", "/teachings/the-golden-rule", "his teaching on loving for your brother what you love for yourself."], ["Rumi", "/teachings/rumi", "the mystical heart of Islam."]])}

## Sources

- Qur'an 18:110, 21:107, 33:40 and 93:6–9, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=18&verse=110).
- Martin Lings, *Muhammad: His Life Based on the Earliest Sources* (1983).` },

  { slug: "krishna-and-rama", tag: "Dharmic", title: "Krishna and Rama: Avatars of Dharma and Devotion",
    summary: "Two beloved avatars of Vishnu in Hinduism: Rama, the ideal of righteousness, and Krishna, the teacher of the Bhagavad Gita, who taught selfless action, devotion and duty.",
    body: `{{prophet-hero-krishna}}

${glance("krishna-and-rama")}

## What an avatar is
In Hinduism, an **avatar** (*avatāra*, "descent") is the Divine coming down into the world in a form, to protect the good and restore **dharma**, the right order of life. In the Bhagavad Gita, Krishna explains that whenever righteousness declines and wickedness rises, he comes forth from age to age to protect the good and set dharma on its seat again (Gita 4:7–8). The best-known list counts ten avatars of Vishnu; Rama and Krishna are the most loved.

## Rama, the righteous king
Rama is the hero of the **Ramayana**, the epic of the sage Valmiki. He gave up his throne to keep his father's word, went into exile in the forest for fourteen years with his wife Sita and his brother Lakshmana, rescued Sita from the demon-king Ravana, and returned to rule with justice. He is called *Maryada Purushottama*, the perfect man who never crossed the bounds of righteousness. The festival of **Diwali** celebrates his return home, with lamps lit in every window.

## Krishna, the teacher of the Gita
Krishna is the playful child of Vrindavan, the divine flute-player beloved of the cowherd maidens, and the wise friend and charioteer of the warrior Arjuna. On the battlefield of Kurukshetra he spoke the **Bhagavad Gita**, one of the greatest spiritual books of humanity. He taught:
- **Karma yoga:** do your duty with all your heart, but without attachment to the results (Gita 2:47).
- **Bhakti:** loving devotion to God is the surest path.
- **Jnana:** the true Self, the Atman, is eternal and cannot be killed.
- **Dharma:** live by what is right, for the good of all.

## How the tradition sees them
In Hinduism, Rama and Krishna are **avatars, divine descents**, not merely prophets or teachers. For many devotees, Krishna is the Supreme Lord himself. This is very different from the Abrahamic idea of a human prophet.${back}${bridge([["Lord Krishna", "/teachings/lord-krishna", "his life and teachings in Krishna & Shiva."], ["The Bhagavad Gita", "/teachings/the-bhagavad-gita", "the song of God."], ["The Seven Chakras", "/teachings/the-seven-chakras", "the inner path of yoga."]])}

## Sources

- *The Bhagavad Gita* 2:47 and 4:7–8, translated by Edwin Arnold, *The Song Celestial* (1885).
- Valmiki, *Ramayana*; the *Bhagavata Purana*.
- Gavin Flood, *An Introduction to Hinduism* (1996), on the avatars.` },

  { slug: "guru-nanak", tag: "Sikh", title: "Guru Nanak: One God, One Human Family",
    summary: "The founder of Sikhism, who taught that God is One, that all people are equal whatever their caste or religion, and that the spiritual life is remembering God, honest work and sharing with others.",
    body: `{{prophet-hero-nanak}}

${glance("guru-nanak")}

## His life
Guru Nanak was born in 1469 at Talwandi, now Nankana Sahib in Pakistan, into a Hindu family. As a young man he worked as an accountant at Sultanpur. Tradition tells that one morning he went into the river to bathe and disappeared for three days. When he came back, his first words were: *"There is no Hindu, there is no Muslim."* He spent the next decades travelling far and wide, singing his hymns with his Muslim companion, the musician Mardana, and finally settled at Kartarpur, where he farmed and taught until his passing in 1539.

## What he taught
- **One God.** The Sikh scripture opens with ***Ik Onkar***, "One Creator", the true Name, without fear and without hate.
- **Equality.** All human beings are equal before God, whatever their caste, religion or sex.
- **The three pillars:** *Naam Japna*, remembering God's Name; *Kirat Karni*, earning an honest living; *Vand Chakna*, sharing with others.
- **Seva and langar.** Selfless service, and the free community kitchen where everyone sits together on the floor and eats the same food, rich and poor, of every faith.

## How the tradition sees him
Sikhs honour Guru Nanak as the **first Guru**, an enlightened teacher who carried the **divine light** (*jot*). That light passed through ten human Gurus. The tenth, Guru Gobind Singh, declared that after him the holy scripture, the **Guru Granth Sahib**, would be the eternal Guru. Sikhism does not see Guru Nanak as an avatar or as God in human form.

## In the scripture's words
"No one is my enemy, and no one is a stranger. I get along with everyone." (Guru Granth Sahib, Ang 1299)${back}${bridge([["Kabir", "/teachings/kabir", "the weaver-poet whose hymns are in the Guru Granth Sahib."], ["The Golden Rule: One Law in Every Faith", "/teachings/the-golden-rule", "one human family."]])}

## Sources

- Guru Granth Sahib, Ang 1 (the *Mul Mantar*) and [Ang 1299](https://searchgurbani.com/guru-granth-sahib/ang/1299).
- W. H. McLeod, *Guru Nanak and the Sikh Religion* (1968).
- Pashaura Singh and Louis E. Fenech (eds.), *The Oxford Handbook of Sikh Studies* (2014).` },
];
