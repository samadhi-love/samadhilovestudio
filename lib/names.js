// The Names of God: one overview and ten traditions, in alphabetical order (not a ranking).
// Sacred respect rules (Samadhi's brief, Part A):
// - No images of God; no images of any prophet. Light, geometry and calligraphy only.
// - The Holy Name (the four Hebrew letters) is shown with its note and is never given a pronunciation.
// - Holy names sit at the top or centre of their card, with a soft static glow; never at the bottom of a page,
//   in menus, buttons, footers or patterns, never cropped, flipped or playfully animated.
//   So titles, link texts, "Explore" lists and Sources on these pages avoid holy names.
// - Sacred Arabic and Hebrew text is complete, right-to-left and never broken inside a word.
// - Every tradition has the same card, the same hero and the same space, in its own words.

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const EQUAL = "The order of traditions is not a ranking. Each is honored equally.";
const HOLY_NAME_NOTE = "This Name is never spoken aloud. In prayer it is read as Adonai, and in daily speech as HaShem.";

// [script text, lang, dir, transliteration or "" , simple say-guide or "", meaning]
export const TRADITIONS = [
  { id: "bahai", slug: "the-names-of-god-in-the-bahai-faith", label: "The Bahá'í Faith", hero: ["بهاء", "ar", "rtl"], heroLine: "Bahá: Glory, the Greatest Name", lang: "Arabic and Persian",
    names: [["بهاء", "ar", "rtl", "Bahá", "bah-HAH", "Glory. The Bahá'í writings call it the Greatest Name."],
      ["الله أبهى", "ar", "rtl", "Alláh-u-Abhá", "al-LAH-hoo ab-HAH", "God is Most Glorious: the greeting Bahá'ís give one another."],
      ["يا بهاء الأبهى", "ar", "rtl", "Yá Bahá'u'l-Abhá", "yah bah-HAH-ool ab-HAH", "O Thou the Glory of the Most Glorious: a prayer of invocation."],
      ["", "", "", "The Unknowable Essence", "", "God in His own Being, beyond all names and understanding."],
      ["", "", "", "The All-Bountiful, the Ever-Forgiving", "", "Two of the many names that fill the Bahá'í prayers."]] },
  { id: "buddhism", slug: "the-names-of-the-ultimate-in-buddhism", label: "Buddhism", hero: ["धर्मकाय", "sa", "ltr"], heroLine: "Dharmakaya: the Truth-Body", lang: "Sanskrit and Chinese",
    names: [["धर्मकाय", "sa", "ltr", "Dharmakaya", "DHAR-muh-KAH-yuh", "The Truth-Body: ultimate reality, the true nature of every Buddha."],
      ["निर्वाण", "sa", "ltr", "Nirvana", "neer-VAH-nuh", "The unconditioned peace beyond craving and suffering."],
      ["佛性", "zh", "ltr", "Buddha-nature (Fóxìng)", "FWOH-shing", "The awakened nature present in every being."],
      ["阿彌陀佛", "zh", "ltr", "Amitabha (Ēmítuófó)", "uh-mee-TAH-buh", "The Buddha of Infinite Light, called on in the Pure Land tradition."],
      ["तथता", "sa", "ltr", "Tathata", "TUH-tuh-tah", "Suchness: things exactly as they truly are."]] },
  { id: "christianity", slug: "the-names-of-god-in-christianity", label: "Christianity", hero: ["Θεός", "el", "ltr"], heroLine: "Theos: God, Father, Son and Holy Spirit", lang: "Greek, Aramaic and Hebrew",
    names: [["אבא", "arc", "rtl", "Abba", "AH-buh", "Father: the tender Aramaic word Jesus used in prayer (Mark 14:36)."],
      ["Θεός", "el", "ltr", "Theos", "theh-OSS", "God: one God in three Persons, the Father, the Son and the Holy Spirit."],
      ["Κύριος", "el", "ltr", "Kyrios", "KEE-ree-oss", "Lord: prayed in the ancient words Kyrie eleison, \"Lord, have mercy\"."],
      ["Λόγος", "el", "ltr", "Logos", "LOH-goss", "The Word: \"In the beginning was the Word\" (John 1:1)."],
      ["Ἐμμανουήλ", "el", "ltr", "Emmanuel", "ih-MAN-yoo-el", "God with us (Matthew 1:23)."],
      ["Α Ω", "el", "ltr", "Alpha and Omega", "", "The beginning and the end (Revelation 22:13)."],
      ["", "", "", "The Good Shepherd", "", "Who gives his life for the sheep (John 10:11)."],
      ["", "", "", "The Comforter", "", "The Holy Spirit, the Paraclete who comforts and teaches (John 14:26)."]] },
  { id: "hinduism", slug: "the-names-of-god-in-hinduism", label: "Hinduism", hero: ["ॐ", "sa", "ltr"], heroLine: "Om: the sacred sound of the Absolute", lang: "Sanskrit",
    names: [["ॐ", "sa", "ltr", "Om", "ohm (A-U-M)", "The primal sound, the name of Brahman."],
      ["ब्रह्मन्", "sa", "ltr", "Brahman", "BRAH-mun", "The Absolute, the one reality behind all things."],
      ["सच्चिदानन्द", "sa", "ltr", "Sat-Chit-Ananda", "sut-chit-AH-nun-duh", "Being, Consciousness and Bliss."],
      ["ईश्वर", "sa", "ltr", "Ishvara", "EESH-vuh-ruh", "The Lord, God with qualities, who rules and loves the world."],
      ["भगवान्", "sa", "ltr", "Bhagavan", "BHUG-uh-vahn", "The Blessed One, full of every glory."],
      ["परमात्मा", "sa", "ltr", "Paramatma", "PUH-ruh-MAHT-mah", "The Supreme Self, dwelling in every heart."],
      ["विष्णु", "sa", "ltr", "Vishnu", "VISH-noo", "The All-Pervading, preserver of the worlds, who comes as Rama and Krishna."],
      ["शिव", "sa", "ltr", "Shiva", "SHIV-uh", "The Auspicious One, the great yogi, lord of transformation."],
      ["देवी", "sa", "ltr", "Devi", "DAY-vee", "The Divine Mother, the Goddess, Shakti."]] },
  { id: "indigenous", slug: "the-names-of-the-creator-in-indigenous-traditions", label: "Indigenous Traditions", hero: ["", "", ""], heroLine: "The Great Mystery, the Creator, the Great Spirit", lang: "Many nations, each in its own language",
    names: [["", "", "", "Wakan Tanka", "wah-KAHN TAHN-kah", "The Great Mystery, the sacred power in all things (Lakota)."],
      ["", "", "", "Gichi-Manidoo", "GITCH-ee MAN-ih-doo", "The Great Spirit (Anishinaabe)."],
      ["", "", "", "Olódùmarè", "oh-LOH-doo-mah-reh", "The Supreme Being, source of all life (Yoruba)."],
      ["", "", "", "Wiraqucha", "veer-ah-KOO-chah", "The Creator honoured in the Andes, with Pachamama, Mother Earth (Quechua)."],
      ["", "", "", "Akua", "ah-KOO-ah", "God, the divine (Hawaiian)."]] },
  { id: "islam", slug: "the-names-of-god-in-islam", label: "Islam", hero: ["الله", "ar", "rtl"], heroLine: "Allah, Subhanahu wa Ta'ala (Glorified and Exalted is He)", lang: "Arabic",
    names: [["الله", "ar", "rtl", "Allah", "al-LAH", "God, the One, the name that gathers all the names."],
      ["الرحمن", "ar", "rtl", "Ar-Rahman", "ar-rah-MAHN", "The Most Gracious, whose mercy embraces all things."],
      ["الرحيم", "ar", "rtl", "Ar-Rahim", "ar-rah-HEEM", "The Most Merciful, especially to those who turn to Him."],
      ["القدوس", "ar", "rtl", "Al-Quddus", "al-kood-DOOS", "The Most Holy, pure of every flaw."],
      ["السلام", "ar", "rtl", "As-Salam", "as-sa-LAHM", "Peace, the Source of peace."],
      ["النور", "ar", "rtl", "An-Nur", "an-NOOR", "The Light of the heavens and the earth."],
      ["الودود", "ar", "rtl", "Al-Wadud", "al-wa-DOOD", "The Loving One."],
      ["الحق", "ar", "rtl", "Al-Haqq", "al-HAKK", "The Truth, the Real."],
      ["اللطيف", "ar", "rtl", "Al-Latif", "al-la-TEEF", "The Subtle, the Gentle and Kind."],
      ["الغفور", "ar", "rtl", "Al-Ghafur", "al-gha-FOOR", "The All-Forgiving."],
      ["الحي", "ar", "rtl", "Al-Hayy", "al-HAI", "The Ever-Living."],
      ["الخالق", "ar", "rtl", "Al-Khaliq", "al-KHAH-lik", "The Creator."]] },
  { id: "judaism", slug: "the-names-of-god-in-judaism", label: "Judaism", hero: ["יהוה", "he", "rtl"], heroLine: "The Holy Name", lang: "Hebrew",
    names: [["יהוה", "he", "rtl", "The Holy Name (YHVH)", "", HOLY_NAME_NOTE],
      ["אדני", "he", "rtl", "Adonai", "ah-doh-NYE", "My Lord: how the Holy Name is read in prayer and in reading the Torah."],
      ["השם", "he", "rtl", "HaShem", "hah-SHEM", "The Name: how the Holy Name is referred to in everyday speech."],
      ["אלהים", "he", "rtl", "Elohim", "eh-loh-HEEM", "God the Creator, in His justice and power (Genesis 1:1). In casual speech many say Elokim out of reverence."],
      ["אל שדי", "he", "rtl", "El Shaddai", "el shah-DYE", "God Almighty (Genesis 17:1)."],
      ["אהיה אשר אהיה", "he", "rtl", "Ehyeh Asher Ehyeh", "eh-YEH ah-SHER eh-YEH", "\"I Will Be What I Will Be\", the answer at the burning bush (Exodus 3:14)."],
      ["הקדוש ברוך הוא", "he", "rtl", "HaKadosh Baruch Hu", "hah-kah-DOHSH bah-ROOKH hoo", "The Holy One, Blessed be He."],
      ["רבונו של עולם", "he", "rtl", "Ribono shel Olam", "ree-boh-NOH shel oh-LAHM", "Master of the World."],
      ["שכינה", "he", "rtl", "Shekhinah", "sh'khee-NAH", "The indwelling Presence of God."],
      ["אין סוף", "he", "rtl", "Ein Sof", "ayn SOAF", "The Infinite, beyond all names (Kabbalah)."],
      ["שלום", "he", "rtl", "Shalom", "shah-LOHM", "Peace: the Talmud teaches that Peace is a name of God (Shabbat 10b)."]] },
  { id: "sikhism", slug: "the-names-of-god-in-sikhism", label: "Sikhism", hero: ["ੴ", "pa", "ltr"], heroLine: "Ik Onkar: One Creator", lang: "Punjabi (Gurmukhi)",
    names: [["ੴ", "pa", "ltr", "Ik Onkar", "ik oang-KAAR", "One Creator: the first words of the Guru Granth Sahib."],
      ["ਵਾਹਿਗੁਰੂ", "pa", "ltr", "Waheguru", "WAH-hay-GOO-roo", "Wonderful Lord, the Teacher who leads from darkness to light."],
      ["ਸਤਿ ਨਾਮੁ", "pa", "ltr", "Sat Naam", "sut NAHM", "True Name: Truth is His Name."],
      ["ਕਰਤਾ ਪੁਰਖੁ", "pa", "ltr", "Karta Purakh", "KUR-tah POO-rukh", "The Creator Being."],
      ["ਅਕਾਲ ਪੁਰਖ", "pa", "ltr", "Akal Purakh", "uh-KAHL POO-rukh", "The Timeless Being."],
      ["ਨਿਰੰਕਾਰ", "pa", "ltr", "Nirankar", "nir-un-KAAR", "The Formless One."]] },
  { id: "taoism", slug: "the-way-and-its-names-in-taoism", label: "Taoism", hero: ["道", "zh", "ltr"], heroLine: "Tao: the Way", lang: "Chinese",
    names: [["道", "zh", "ltr", "Tao (Dào)", "dow", "The Way: the nameless source and flow of all things."],
      ["無名", "zh", "ltr", "Wúmíng", "woo-MING", "The Nameless: what is before every name."],
      ["太一", "zh", "ltr", "Tàiyī", "tie-YEE", "The Great One."],
      ["太極", "zh", "ltr", "Tàijí", "tie-JEE", "The Supreme Ultimate, from which yin and yang arise."],
      ["天", "zh", "ltr", "Tiān", "tyen", "Heaven: the sacred order above, honoured in Chinese thought."],
      ["三清", "zh", "ltr", "Sānqīng", "sahn-CHING", "The Three Pure Ones, the highest honoured beings of religious Taoism."]] },
  { id: "zoroastrianism", slug: "the-names-of-god-in-zoroastrianism", label: "Zoroastrianism", hero: ["اهورامزدا", "fa", "rtl"], heroLine: "Ahura Mazda: the Wise Lord", lang: "Avestan and Persian",
    names: [["اهورامزدا", "fa", "rtl", "Ahura Mazda", "ah-HOO-rah MAZ-dah", "The Wise Lord, the one uncreated Creator."],
      ["اورمزد", "fa", "rtl", "Ohrmazd", "OHR-mazd", "The same Name in later Persian."],
      ["", "", "", "Spenta Mainyu", "SPEN-tah MINE-yoo", "The Bounteous Spirit, the creative goodness of God."],
      ["", "", "", "Vohu Manah", "VOH-hoo MAH-nah", "Good Mind, the first of the Bounteous Immortals."],
      ["", "", "", "Asha Vahishta", "AH-shah vah-HISH-tah", "Best Truth and Order."],
      ["", "", "", "Spenta Armaiti", "SPEN-tah ar-MY-tee", "Holy Devotion, linked with the Earth."]] },
];

const card = ([script, lang, dir, tr, say, meaning]) => `<div class="nm-card">${script ? `<p class="nm-script" lang="${lang}" dir="${dir}">${esc(script)}</p>` : `<p class="nm-script nm-latin">${esc(tr)}</p>`}
${script ? `<p class="nm-tr">${esc(tr)}</p>` : ""}${say ? `<p class="nm-say">${esc(say)}</p>` : ""}<p class="nm-mean">${esc(meaning)}</p></div>`;

// The same hero for every tradition: the name at the top centre, a soft still glow, light and geometry only.
function hero(t) {
  const [script, lang, dir] = t.hero;
  const name = script ? `<p class="nm-hero-name" lang="${lang}" dir="${dir}">${esc(script)}</p>` : `<p class="nm-hero-name nm-latin">${esc(t.names[0][3])}</p>`;
  // Samadhi's own picture for the Indigenous traditions: light over the open prairie (nature only, no costume images).
  const nature = t.id === "indigenous" ? `<img class="nm-nature nm-nature-photo" src="/images/wakan-tanka.jpg" width="1200" height="675" alt="A great swirl of golden light in the sky above the open prairie: a symbol of Wakan Tanka, the Great Mystery" loading="lazy" decoding="async">` : "";
  return `<figure class="nm-hero" aria-label="${esc(t.heroLine)}">${nature}${name}<p class="nm-hero-line">${esc(t.heroLine)}</p>
${t.id === "judaism" ? `<p class="nm-hero-note">${esc(HOLY_NAME_NOTE)}</p>` : ""}<p class="nm-hero-lang">${esc(t.label)} · ${esc(t.lang)}</p></figure>`;
}
function overview() {
  return `<p class="nm-equal">${esc(EQUAL)}</p><div class="nm-grid">${TRADITIONS.map((t) => {
    const [script, lang, dir] = t.hero;
    return `<a class="nm-door" href="/teachings/${t.slug}">${script ? `<span class="nm-door-name" lang="${lang}" dir="${dir}">${esc(script)}</span>` : `<span class="nm-door-name nm-latin">${esc(t.names[0][3])}</span>`}
<span class="nm-door-trad">${esc(t.label)}</span><span class="nm-door-go">Enter</span></a>`;
  }).join("")}</div>`;
}

export function namesArt(key) {
  if (key === "names-grid") return overview();
  if (key === "names-equal") return `<p class="nm-equal">${esc(EQUAL)}</p>`;
  const m = key.match(/^names-(hero|list)-(\w+)$/);
  const t = m && TRADITIONS.find((x) => x.id === m[2]);
  if (!t) return "";
  return m[1] === "hero" ? hero(t) : `<div class="nm-list">${t.names.map(card).join("")}</div>`;
}

const nav = `*The Names of God: [One Light, Many Names](/teachings/the-names-of-god) · ${TRADITIONS.map((t) => `[${t.label}](/teachings/${t.slug})`).join(" · ")}.*`;
const top = (id) => `{{names-hero-${id}}}\n\n{{names-equal}}\n\n${nav}`;
const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;
const back = ["One Light, Many Names", "/teachings/the-names-of-god", "all the traditions together."];

export const namesOfGod = [
  { slug: "the-names-of-god", tag: "The Names of God", title: "The Names of God: One Light, Many Names",
    summary: "How the world's traditions name the One: ten traditions, each honoured equally and described in its own words, with the sacred names in their own scripts. No images of God: only light, geometry and calligraphy.",
    body: `{{names-grid}}

Every people that has prayed has tried to name the One it prays to. The names are many; the traditions themselves often say that the One is beyond every name. The ancient Rig Veda says: **"Truth is one; the wise call it by many names"** (*ekam sat vipra bahudha vadanti*, Rig Veda 1.164.46).

## How this section honours the names
- **No images of God.** In these pages God is never pictured. In the traditions that forbid images, there is only light, geometry and calligraphy, and no prophet is ever shown.
- **The Holy Name of Judaism** is shown in its four letters, with the note that it is never spoken aloud. No pronunciation is given.
- **Names in places of honour.** Each sacred name stands at the top or centre of its card, with a soft, still glow.
- **Each tradition in its own words.** Every page describes the names as that tradition's own followers understand them, with their own honorifics.
- **Equal honour.** Every tradition has the same card, the same space and the same care. The order is alphabetical, not a ranking.

## Why names matter
In every tradition, a name of God is more than a label. It is a **door**: calling on the name is a way of drawing near. Jews bless the Name; Christians pray "hallowed be thy name"; Muslims remember the Most Beautiful Names; Hindus and Sikhs repeat the divine name in *japa* and *simran*; Buddhists call on the Buddha of Infinite Light. The names describe what the heart has tasted: mercy, truth, light, peace, love.

## Samadhi's view
*This is Samadhi's own understanding.*

There is one God, one Source, and every name spoken with love reaches the same Heart. No tradition owns God, and no name can hold Him completely. When we honour the names of others as we honour our own, we honour the One who is behind them all.${bridge([
      ["One Source, One Message", "/teachings/one-source-one-message", "the messengers of every faith."],
      ["Sacred Sound, Mantra and Frequency", "/teachings/sacred-sound-mantra-and-frequency", "calling on the sacred names in sound."],
      ["The Glossary", "/teachings/glossary", "sacred words made simple."],
    ])}

## Sources

- Rig Veda 1.164.46; the scriptures and prayer books of each tradition, as listed on each page.` },

  { slug: TRADITIONS[0].slug, tag: "The Names of God", title: "The Names of God in the Bahá'í Faith",
    summary: "In the Bahá'í Faith, God's essence is unknowable, yet He is known through His Messengers and His names. The Greatest Name, Bahá, \"Glory\", and the greeting Alláh-u-Abhá, in the faith's own words.",
    body: `${top("bahai")}

The Bahá'í Faith was founded in 19th-century Persia by **Bahá'u'lláh**, whose title means "the Glory of God", after the coming of **the Báb**, "the Gate". Bahá'ís believe in one God, who has sent Messengers to humanity throughout history, among them Abraham, Moses, Krishna, Zoroaster, the Buddha, Jesus and Muhammad.

## The names

{{names-list-bahai}}

## How Bahá'ís understand the names
- **The Essence is unknowable.** The Bahá'í writings teach that God in His own Being is exalted beyond every human understanding. No name can contain Him.
- **Known through the Manifestations.** What we can know of God, His names and attributes, shines in His Messengers, whom Bahá'ís call the *Manifestations of God*, as the sun shines in a perfect mirror.
- **The Greatest Name.** The word ***Bahá***, "Glory", and its forms are called the Greatest Name. Bahá'ís greet each other with *Alláh-u-Abhá*, "God is Most Glorious", and repeat it in daily devotion. The calligraphy of the Greatest Name is hung in Bahá'í homes as a sign of reverence.
- **The names in prayer.** Bahá'í prayers call on God by many names: the All-Bountiful, the Ever-Forgiving, the Most Merciful, the Help in Peril, the Self-Subsisting.

## The heart of the teaching
The Bahá'í writings teach the oneness of God, the oneness of religion and the oneness of humanity: all the great faiths come from the same God, and all people are one family.${bridge([back, ["One Source, One Message", "/teachings/one-source-one-message", "the shared light of the messengers."]])}

## Sources

- The Bahá'í writings, including the *Kitáb-i-Íqán* (The Book of Certitude, 1862) and the *Prayers and Meditations*; [Bahá'í Reference Library](https://www.bahai.org/library/).` },

  { slug: TRADITIONS[1].slug, tag: "The Names of God", title: "The Names of the Ultimate in Buddhism",
    summary: "Buddhism does not teach a creator God, but it has sacred names for the Ultimate: the Truth-Body, Nirvana, Buddha-nature, suchness, and the Buddha of Infinite Light. In Buddhism's own words.",
    body: `${top("buddhism")}

Buddhism is a path of awakening taught by the Buddha, Siddhartha Gautama, about 2,500 years ago. In its own words, **Buddhism does not teach a creator God**: the Buddha set aside questions about a first creator as not leading to freedom from suffering. Yet Buddhists have deep and sacred names for the **Ultimate Reality** that awakening reveals, and for the Buddhas who embody it.

## The names

{{names-list-buddhism}}

## How Buddhists understand the names
- **Nirvana** is the unconditioned: the end of craving, hatred and delusion, a peace that is not born and does not die.
- **The Three Bodies.** Mahayana Buddhism speaks of the three bodies of a Buddha: the *Nirmanakaya*, the body that appears in the world; the *Sambhogakaya*, the body of bliss; and the ***Dharmakaya***, the Truth-Body, reality itself.
- **Buddha-nature.** Many Mahayana schools teach that every being has the nature of a Buddha, like gold hidden in the earth, waiting to be uncovered.
- **Calling the Name.** In the Pure Land tradition of China and Japan, devotees call on **Amitabha**, the Buddha of Infinite Light and Infinite Life, saying *Namo Amituofo* (Chinese) or *Namu Amida Butsu* (Japanese), trusting in his vow to receive all who call.
- **Suchness.** Zen and other schools point to *tathata*, "suchness": reality as it is, before we add our concepts.

## The heart of the teaching
The names point beyond themselves. As a famous Zen image says, the teaching is a finger pointing at the moon: do not mistake the finger for the moon.${bridge([back, ["The Buddha's Way", "/teachings/the-buddhas-way", "the path of awakening."]])}

## Sources

- The Pali *Udana* 8.3 (the unborn, unconditioned); the *Lotus Sutra*; the *Larger Sukhavativyuha Sutra*; the *Ratnagotravibhaga*.` },

  { slug: TRADITIONS[2].slug, tag: "The Names of God", title: "The Names of God in Christianity",
    summary: "One God in three Persons, the Father, the Son and the Holy Spirit. Abba, Lord, the Word, Emmanuel, the Alpha and the Omega, the Good Shepherd and the Comforter, in Christianity's own words.",
    body: `${top("christianity")}

Christians believe in **one God in three Persons: the Father, the Son and the Holy Spirit** (Matthew 28:19). They believe that the eternal Son of God became man in **Jesus Christ**, and that the Holy Spirit lives in the hearts of believers. Christian names for God come from the Hebrew Scriptures, which Christians call the Old Testament, and from the New Testament, written in Greek.

## The names

{{names-list-christianity}}

## How Christians understand the names
- **Father.** Jesus taught his followers to pray "Our Father which art in heaven, Hallowed be thy name" (Matthew 6:9). He himself called God ***Abba***, the tender Aramaic word for father (Mark 14:36).
- **The Son.** The name *Jesus* (*Yeshua*) means "God saves"; *Christ* (*Christos*) means "the Anointed One", the Messiah. Christians call him Lord, the Son of God, the Lamb of God, the Light of the World and the Good Shepherd.
- **The Word.** "In the beginning was the Word, and the Word was with God, and the Word was God" (John 1:1).
- **God with us.** "They shall call his name Emmanuel, which being interpreted is, God with us" (Matthew 1:23).
- **The Holy Spirit** is called the Comforter, the Spirit of Truth and the giver of life (John 14:16–17, 26).
- **God is love.** "God is love; and he that dwelleth in love dwelleth in God, and God in him" (1 John 4:16).

## Praying the names
Christians pray in the name of Jesus (John 14:13), and many repeat the **Jesus Prayer**: "Lord Jesus Christ, Son of God, have mercy on me." In the liturgy they sing *Kyrie eleison*, "Lord, have mercy", and "Holy, holy, holy" (Isaiah 6:3).${bridge([back, ["Prophets and Teachers", "/teachings/prophets-and-teachers", "the messengers of every faith."]])}

## Sources

- Isaiah 6:3; Matthew 1:23, 6:9 and 28:19; Mark 14:36; John 1:1, 14:13–26; 1 John 4:16; Revelation 22:13, King James Bible.
- The *Philokalia* (on the Jesus Prayer); the Nicene Creed (325 and 381).` },

  { slug: TRADITIONS[3].slug, tag: "The Names of God", title: "The Names of God in Hinduism",
    summary: "One Truth called by many names: Om, Brahman, Sat-Chit-Ananda, Ishvara, Bhagavan, the Supreme Self, Vishnu, Shiva and the Divine Mother, and the practice of repeating the divine name, in Hinduism's own words.",
    body: `${top("hinduism")}

Hinduism, which its followers often call *Sanatana Dharma*, "the eternal way", teaches that **one Supreme Reality** shows itself in many forms and is called by many names. "**Truth is one; the wise call it by many names**" (Rig Veda 1.164.46).

## The names

{{names-list-hinduism}}

## How Hindus understand the names
- **Brahman** is the Absolute, beyond all qualities, described by the sages as *Sat-Chit-Ananda*: Being, Consciousness and Bliss.
- **Ishvara and Bhagavan** are God with qualities: the loving Lord who creates, sustains and receives the devotion of His devotees.
- **The great forms.** Many Hindus worship the One especially as **Vishnu**, who comes to earth as Rama and Krishna; as **Shiva**, the auspicious lord of yoga and transformation; or as **Devi**, the Divine Mother, also called Shakti, Durga, Lakshmi and Saraswati. For each devotee, their chosen form (*ishta devata*) is the doorway to the whole.
- **The thousand names.** Hymns called *Sahasranama*, "a thousand names", praise the Lord or the Mother by a thousand names, each one a quality of the Divine.
- **Om.** The Mandukya Upanishad teaches that the sacred syllable **Om** is all that was, is and will be.

## Praying the names
In ***japa***, devotees repeat a divine name or mantra, often on a string of 108 beads. In ***kirtan*** and *bhajan*, they sing the names together. Many saints taught that, in this age, the simplest path to God is to remember His name with love.${bridge([back, ["Meditation and Yoga", "/teachings/meditation-and-yoga", "the practice of union."], ["Sacred Sound, Mantra and Frequency", "/teachings/sacred-sound-mantra-and-frequency", "the sacred sound and the repeated name."]])}

## Sources

- Rig Veda 1.164.46; the *Mandukya Upanishad*; the *Taittiriya Upanishad*; the thousand-names hymn (*Sahasranama*) of the *Mahabharata*, Anushasana Parva; the *Devi Mahatmya*.` },

  { slug: TRADITIONS[4].slug, tag: "The Names of God", title: "The Names of the Creator in Indigenous Traditions",
    summary: "Many Indigenous nations speak of a Great Mystery or Great Spirit who lives in all of creation. A few names, shared with respect and in each people's own language: Lakota, Anishinaabe, Yoruba, Andean and Hawaiian.",
    body: `${top("indigenous")}

There are thousands of Indigenous peoples on Earth, each with its own language, ceremonies and sacred knowledge. **There is no single "Indigenous religion"**, and much sacred knowledge belongs to each nation and is shared only within it. Here we offer, with respect, a few names that these peoples have shared openly, each in its own language and with its own meaning.

## The names

{{names-list-indigenous}}

## How these peoples understand the sacred
- **The Great Mystery (Lakota).** *Wakan Tanka* is often translated as "Great Spirit", but many Lakota teachers say it means the **Great Mystery**: the sacred power that is in all things, the sky, the earth, the four directions and every living being. Prayers end with *Mitákuye Oyás'iŋ*, "all my relatives", remembering that all beings are family.
- **The Great Spirit (Anishinaabe).** *Gichi-Manidoo* is the Great Spirit of the Anishinaabe peoples of the Great Lakes, who made the world and lives in it.
- **The Supreme Being (Yoruba).** In West Africa, the Yoruba honour *Olódùmarè*, the Supreme Being and source of all life, who acts in the world through the *Òrìṣà*.
- **The Creator and Mother Earth (Andes).** The Quechua and other Andean peoples honour the Creator, *Wiraqucha*, and *Pachamama*, Mother Earth, with offerings of thanks.
- **The divine (Hawaii).** In Hawaiian, *akua* means God or the divine, and *aloha*, the breath of life shared in love, is a sacred way of living.

## What these traditions teach all of us
The Earth is sacred; all beings are related; we must take only what we need and give thanks for everything. See [All Our Relations](/library?tab=wisdom).${bridge([back, ["The Divine Feminine", "/teachings/the-divine-feminine", "Mother Earth and the sacred feminine."]])}

## Sources

- Raymond J. DeMallie, *The Sixth Grandfather* (1984); Basil Johnston, *Ojibway Heritage* (1976); E. Bolaji Idowu, *Olodumare: God in Yoruba Belief* (1962); Mary Kawena Pukui and Samuel H. Elbert, *Hawaiian Dictionary* (1986).` },

  { slug: TRADITIONS[5].slug, tag: "The Names of God", title: "The Names of God in Islam",
    summary: "Allah, Subhanahu wa Ta'ala, and the Most Beautiful Names (al-Asma al-Husna): the Most Gracious, the Most Merciful, Peace, the Light, the Loving, in Islam's own words, with calligraphy and light only.",
    body: `${top("islam")}

Islam teaches the absolute oneness of God: **Allah, Subhanahu wa Ta'ala (Glorified and Exalted is He)**. "Say: He is Allah, the One!" (Qur'an 112:1, Pickthall). Nothing in creation is like Him, and He is never pictured. He made Himself known through His revelation to the Prophet Muhammad, peace be upon him, and through His **Most Beautiful Names**, *al-Asma al-Husna*.

## The names

{{names-list-islam}}

## How Muslims understand the names
- **The Most Beautiful Names.** The Qur'an says that to God belong the most beautiful names, and that we should call on Him by them (Qur'an 7:180). The Prophet, peace be upon him, said that God has ninety-nine names, and whoever learns them by heart and lives by them will enter Paradise (Sahih al-Bukhari 2736; Sahih Muslim 2677).
- **Mercy first.** Every chapter of the Qur'an but one begins with *Bismillah ir-Rahman ir-Rahim*, "In the name of Allah, the Beneficent, the Merciful". The two names of mercy, *Ar-Rahman* and *Ar-Rahim*, come from the same root as the word for a mother's womb.
- **The Light.** "Allah is the Light of the heavens and the earth" (Qur'an 24:35, Pickthall).
- **Many names in one passage.** The last verses of Surah 59 gather many names together: the King, the Holy One, Peace, the Keeper of Faith, the Creator, the Shaper (Qur'an 59:22–24).

## Remembering the names
Muslims remember the names in ***dhikr***, often counting on a string of 33 or 99 beads (*misbaha*), saying *Subhan Allah* (Glory be to God), *Alhamdulillah* (Praise be to God) and *Allahu Akbar* (God is Greatest). Sufis repeat the names until the heart itself remembers. Calligraphers have written the names in countless beautiful forms, because in Islam the beauty of the word takes the place of images.${bridge([back, ["The Sufi Path", "/teachings/the-sufi-path", "the way of remembrance."]])}

## Sources

- Qur'an 7:180, 24:35, 59:22–24 and 112:1, Pickthall, *The Meaning of the Glorious Koran* (1930).
- Sahih al-Bukhari 2736; Sahih Muslim 2677; al-Ghazali, *The Ninety-Nine Beautiful Names* (*al-Maqsad al-Asna*).` },

  { slug: TRADITIONS[6].slug, tag: "The Names of God", title: "The Names of God in Judaism",
    summary: "The Holy Name, never spoken aloud, read as Adonai in prayer and HaShem in daily speech; Elohim, El Shaddai, \"I Will Be What I Will Be\", the Holy One, Blessed be He, the Shekhinah and Peace, in Judaism's own words.",
    body: `${top("judaism")}

Judaism teaches that God is **One**: "Hear, O Israel: the LORD our God is one LORD" (Deuteronomy 6:4). The names of God in the Hebrew Bible are treated with the deepest reverence. Each name speaks of a different way God is known: as Creator, as Judge, as merciful Presence, as the One who is.

*In this section, following Jewish practice, the four-letter Name is written as "the Holy Name", "HaShem" or "YHVH", and is never given a pronunciation.*

## The names

{{names-list-judaism}}

## How Jews understand the names
- **The Holy Name.** The four-letter Name is the holiest of all. In the days of the Temple it was spoken only by the High Priest on Yom Kippur. Today **it is never spoken aloud**: in prayer it is read as *Adonai*, "my Lord", and in daily speech it is called *HaShem*, "the Name". English Bibles print it as "the LORD" in capital letters.
- **"I Will Be What I Will Be."** When Moses asked God's name at the burning bush, God answered *Ehyeh Asher Ehyeh*, "I AM THAT I AM" in the King James Bible (Exodus 3:14).
- **Mercy and justice.** The rabbis taught that the Holy Name speaks of God's mercy, and *Elohim* of His justice; the two are joined in the One God.
- **Respect for written names.** Pages that carry God's names are not thrown away but buried with honour (*genizah*), and many Jews write "G-d" in English for the same reason.
- **Peace.** The Talmud teaches that *Shalom*, Peace, is one of the names of God (Shabbat 10b), which is why some do not greet one another with "Shalom" in places that are not clean.
- **The mystics.** Kabbalah speaks of *Ein Sof*, the Infinite beyond all names, and of the *Shekhinah*, God's indwelling Presence. See [The Zohar](/teachings/the-zohar).

## Blessing the Name
Every Jewish blessing begins *Baruch atah Adonai*, "Blessed are You, Lord". After the first line of the Shema, Jews whisper: "Blessed be the name of His glorious kingdom for ever and ever."${bridge([back, ["The Torah", "/teachings/the-torah", "the teaching given at Sinai."], ["Blessing God", "/teachings/blessing-god", "the morning blessing."]])}

## Sources

- Genesis 1:1 and 17:1; Exodus 3:13–15; Deuteronomy 6:4, King James Bible.
- Babylonian Talmud, *Shabbat* 10b and *Yoma* 39b; Mishnah *Yoma* 6:2; Maimonides, *Mishneh Torah*, Laws of the Foundations of the Torah, chapter 6.` },

  { slug: TRADITIONS[7].slug, tag: "The Names of God", title: "The Names of God in Sikhism",
    summary: "Ik Onkar, the One Creator; Waheguru, the Wonderful Lord; Sat Naam, the True Name; the Mul Mantar that opens the Guru Granth Sahib; and the practice of simran, remembering the Name, in Sikhism's own words.",
    body: `${top("sikhism")}

Sikhism was founded in the Punjab by **Guru Nanak Dev Ji** (1469–1539) and the nine Gurus who followed him. Its scripture, the **Guru Granth Sahib**, is honoured as the living Guru. It begins with the **Mul Mantar**, the "root verse", which is itself a description of God's names and nature.

## The names

{{names-list-sikhism}}

## The Mul Mantar
The opening words of the Guru Granth Sahib describe the One: ***Ik Onkar***, there is One Creator; ***Sat Naam***, whose Name is Truth; ***Karta Purakh***, the Creator; ***Nirbhau***, without fear; ***Nirvair***, without hatred; ***Akal Murat***, of timeless form; ***Ajuni***, beyond birth; ***Saibhang***, self-existent; ***Gur Prasad***, known by the Guru's grace.

## How Sikhs understand the names
- **One God for all.** God is One, the same for every people. Guru Nanak said: there is no Hindu, there is no Muslim: all are children of the One.
- **The Name is the path.** The central practice of Sikh life is ***naam simran***, remembering the Name: repeating *Waheguru* with love, in the heart and with the breath.
- **Formless and present.** God is *Nirankar*, without form, and yet lives in every heart and in all creation.
- **Three pillars.** Remember the Name (*naam japna*), earn honestly (*kirat karni*) and share with others (*vand chhakna*).

## Singing the names
In every gurdwara, the words of the Gurus are sung in ***kirtan***, and the community greets one another with *Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh*.${bridge([back, ["Guru Nanak", "/teachings/guru-nanak", "the first Guru and his message."]])}

## Sources

- The Guru Granth Sahib, page 1 (the Mul Mantar) and the *Japji Sahib*; [SikhiWiki](https://www.sikhiwiki.org); W. Owen Cole and Piara Singh Sambhi, *The Sikhs: Their Religious Beliefs and Practices* (1978).` },

  { slug: TRADITIONS[8].slug, tag: "The Names of God", title: "The Way and Its Names in Taoism",
    summary: "The Way that cannot be named: the Tao, the Nameless, the Great One, the Supreme Ultimate, Heaven and the Three Pure Ones, in Taoism's own words.",
    body: `${top("taoism")}

Taoism (Daoism) grew from the teachings of Laozi and Zhuangzi in ancient China. Its first and greatest teaching is that the Ultimate **cannot be truly named**. The opening of Laozi's book says that the Way that can be spoken of is not the eternal Way, and the name that can be named is not the eternal name (chapter 1).

## The names

{{names-list-taoism}}

## How Taoists understand the names
- **A name given reluctantly.** Laozi says of the mystery that existed before heaven and earth: "I do not know its name; I call it the Way" (chapter 25). The Tao is the source and the flow of all things, like water that nourishes everything and does not compete.
- **From One to the ten thousand things.** "The Way gave birth to the One, the One to the Two, the Two to the Three, and the Three to the ten thousand things" (chapter 42). From the Supreme Ultimate, *Taiji*, come yin and yang.
- **Heaven.** In Chinese thought, *Tian*, Heaven, is the sacred order above, whose mandate the wise follow.
- **The Three Pure Ones.** Religious Taoism honours the *Sanqing*, the Three Pure Ones, as the highest manifestations of the Tao, in its temples and rituals.

## Living the Way
Taoists honour the Way not by many words but by living in harmony with it: simplicity, humility, compassion, and *wu wei*, effortless action. See [The Way of Water](/teachings/the-way-of-water).${bridge([back, ["The Way of Water", "/teachings/the-way-of-water", "the teaching of Laozi."]])}

## Sources

- The book of Laozi, chapters 1, 25 and 42; the *Zhuangzi*; Livia Kohn, *Daoism and Chinese Culture* (2001).` },

  { slug: TRADITIONS[9].slug, tag: "The Names of God", title: "The Names of God in Zoroastrianism",
    summary: "The Wise Lord, the uncreated Creator of all that is good; the Bounteous Spirit; and the Bounteous Immortals, Good Mind, Best Truth and Holy Devotion, in Zoroastrianism's own words.",
    body: `${top("zoroastrianism")}

Zoroastrianism, one of the oldest living faiths, was taught by the prophet **Zarathushtra** (Zoroaster) in ancient Iran. His hymns, the **Gathas**, praise **Ahura Mazda**, the Wise Lord, the one uncreated Creator of all that is good. Zoroastrians worship facing a source of light, most often a sacred fire, as a symbol of God's light and purity, never as God Himself.

## The names

{{names-list-zoroastrianism}}

## How Zoroastrians understand the names
- **The Wise Lord.** *Ahura* means "Lord" and *Mazda* "Wise". God is perfect goodness and wisdom, and the source of truth (*Asha*).
- **The Bounteous Spirit.** *Spenta Mainyu* is God's creative and holy Spirit, through which the good world is made.
- **The Bounteous Immortals.** The *Amesha Spentas* are seen as divine qualities, or aspects, of the Wise Lord, which every person can grow within themselves: Good Mind, Best Truth, Good Dominion, Holy Devotion, Wholeness and Immortality.
- **Good thoughts, good words, good deeds.** The whole path of Zarathushtra is to choose the good: *Humata, Hukhta, Hvarshta*. See [Zarathushtra](/teachings/zarathushtra).
- **Many names.** Zoroastrian prayer also praises the Wise Lord by many names, and Parsi tradition keeps a prayer of 101 Names of God.${bridge([back, ["Zarathushtra", "/teachings/zarathushtra", "the prophet of the Wise Lord."]])}

## Sources

- The *Gathas* (*Yasna* 28–34, 43–51 and 53); *Yasht* 1; Mary Boyce, *Zoroastrians: Their Religious Beliefs and Practices* (1979).` },
];
