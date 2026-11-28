// Those Who Carried the Word (Nov 2026): the overview of who a prophet is, eight more pages for
// Prophets & Teachers (Noah, Isaac, Jacob, Joseph, Solomon, Elijah, Mary, John the Baptist) and
// The Temple in Jerusalem for Sacred Lands. Each tradition in its own terms; no faces are pictured.
// Quotations: King James Bible; Pickthall's Qur'an (1930). Facts checked Nov 2026.

const ic = (paths) => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" class="pf-icon"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;

// Small gold emblems for the explorer cards (symbols only, never faces).
export const EMBLEM_MORE = {
  noah: ic(`<path d="M6 30 h36 l-5 8 H11 Z"/><path d="M14 30 v-7 h20 v7 M20 23 v-5 h8 v5"/><path d="M8 20 a16 16 0 0 1 32 0" opacity=".6"/>`),
  isaac: ic(`<ellipse cx="24" cy="14" rx="12" ry="4"/><path d="M12 14 v20 a12 4 0 0 0 24 0 V14"/><path d="M18 26 q6 4 12 0" opacity=".6"/><path d="M24 4 v4"/>`),
  jacob: ic(`<path d="M16 44 L20 4 M32 44 L28 4"/><path d="M16.8 36 h14.4 M17.6 28 h12.8 M18.4 20 h11.2 M19.2 12 h9.6"/><circle cx="24" cy="4" r="1.5" fill="currentColor"/>`),
  joseph: ic(`<circle cx="24" cy="10" r="5"/><path d="M33 8 a6 6 0 1 1 -5 9 a4.5 4.5 0 0 0 5 -9 Z" opacity=".8"/>${Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (0.15 + (0.7 * i) / 10); return `<circle cx="${(24 - 17 * Math.cos(a)).toFixed(1)}" cy="${(26 + 15 * Math.sin(a)).toFixed(1)}" r="1.3" fill="currentColor"/>`; }).join("")}`),
  solomon: ic(`<path d="M10 42 V18 M38 42 V18 M8 18 h32 M24 6 L8 18 h32 Z"/><path d="M17 42 V24 M31 42 V24 M6 42 h36"/>`),
  elijah: ic(`<circle cx="18" cy="32" r="9"/><circle cx="18" cy="32" r="2"/><path d="M18 23 v18 M9 32 h18 M11.6 25.6 l12.8 12.8 M24.4 25.6 l-12.8 12.8"/><path d="M30 28 C34 22 30 18 34 10 C38 18 42 20 40 28 a5 5 0 0 1 -10 0 Z"/>`),
  mary: ic(`<path d="M24 44 V20"/><path d="M24 20 C18 16 16 8 24 4 C32 8 30 16 24 20 Z"/><path d="M24 30 C18 30 14 26 14 22 M24 34 C30 34 34 30 34 26"/><path d="M14 22 l-2 -3 M34 26 l2 -3"/>`),
  john: ic(`<path d="M8 30 q8 -6 16 0 t16 0 M8 38 q8 -6 16 0 t16 0"/><path d="M24 4 C20 12 18 15 18 18 a6 6 0 0 0 12 0 C30 15 28 12 24 4 Z"/>`),
};

// [slug, emblem, name, era, traditions, filter group, role, nature] — the same shape as PEOPLE in prophets.js.
export const PEOPLE_MORE = {
  noah: ["noah", "noah", "Noah (Nuh)", "Before recorded history, by tradition", "Judaism · Christianity · Islam", "abr", "The righteous one who built the ark", "A just man who walked with God; a great prophet and messenger in Islam"],
  isaac: ["isaac", "isaac", "Isaac (Ishaq)", "c. 2nd millennium BCE, by tradition", "Judaism · Christianity · Islam", "abr", "Son of the promise, the quiet patriarch", "A patriarch and, in the Jewish sages' list and in Islam, a prophet"],
  jacob: ["jacob", "jacob", "Jacob (Yaqub), called Israel", "c. 2nd millennium BCE, by tradition", "Judaism · Christianity · Islam", "abr", "The one who wrestled and was renamed", "A patriarch, father of the twelve tribes; a prophet for the Jewish sages and in Islam"],
  joseph: ["joseph", "joseph", "Joseph (Yusuf)", "c. 2nd millennium BCE, by tradition", "Judaism · Christianity · Islam", "abr", "The dreamer through whom providence worked", "Joseph the Righteous in Judaism; a prophet in Islam"],
  solomon: ["solomon", "solomon", "Solomon (Sulayman)", "c. 10th century BCE", "Judaism · Christianity · Islam", "abr", "The wise king who built the Temple", "A king and sage; counted among the prophets by the Jewish sages and in Islam"],
  elijah: ["elijah", "elijah", "Elijah (Ilyas)", "9th century BCE", "Judaism · Christianity · Islam", "abr", "The prophet of fire and the still small voice", "A prophet taken up in a whirlwind, awaited at every Passover table"],
  mary: ["mary", "mary", "Mary (Maryam)", "1st century BCE to 1st century CE", "Christianity · Islam", "abr", "Mother of Jesus, chosen and purified", "The Mother of God for many Christians; in Islam, chosen above the women of creation"],
  john: ["john-the-baptist", "john", "John the Baptist (Yahya)", "1st century CE", "Christianity · Islam · Mandaeism", "abr", "The voice crying in the wilderness", "The forerunner who baptised Jesus; a prophet in Islam"],
};

const glance = (slug) => {
  const [, , , era, trad, , role, nature] = PEOPLE_MORE[slug];
  return `| | |\n| --- | --- |\n| Era | ${era} |\n| Tradition | ${trad} |\n| Role | ${role} |\n| How the traditions see ${slug === "mary" ? "her" : "him"} | ${nature} |`;
};
const explore = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u})${why ? `: ${why}` : ""}`).join("\n")}`;
const back = "\n\nSee all the messengers in [Prophets and Teachers](/teachings/prophets-and-teachers).";
const sources = (lines) => `\n\n## Sources\n${lines.map((l) => `- ${l}`).join("\n")}`;

export const carriedTheWord = { slug: "those-who-carried-the-word", tag: "Overview", title: "Those Who Carried the Word: Who Is a Prophet?",
  summary: "Who the traditions call a prophet, and why; the names each lineage has kept; the different roles of patriarchs, dreamers, sages and kings; and how the mystics see the prophet's work.",
  body: `In every age, some men and women have felt a word come to them that was not their own, and have carried it to the people around them. **The traditions call them prophets.**

## What is a prophet?
The Hebrew word is *navi*, often understood as "one who speaks for" or "one who is called". The Greek *prophētēs* means "one who speaks forth". The Arabic *nabi* comes from the same root as the Hebrew.

A prophet is not mainly a fortune-teller. In the scriptures, a prophet is **one who receives a direct word from God and delivers it to the people**: a call back to the One God, to justice, to mercy and to an honest heart. Often that word was uncomfortable. Prophets spoke to kings, to crowds and to their own families, and many suffered for it.

## The names the traditions have kept
Each tradition keeps its own list, and each list is honoured here as that tradition keeps it.

**In the Hebrew Bible and Jewish tradition**
- Abraham, Moses, Samuel, Elijah and Elisha, Isaiah, Jeremiah and Ezekiel.
- **The Twelve**, whose shorter books close the prophets: Hosea, Joel, Amos, Obadiah, Jonah, Micah, Nahum, Habakkuk, Zephaniah, Haggai, Zechariah and Malachi.
- The Talmud says that **48 prophets and 7 prophetesses** prophesied to Israel, and the great commentator Rashi names them, beginning with Abraham, Isaac and Jacob, and including Aaron, Joshua, Samuel, Nathan, David and Solomon. The prophetesses include Sarah, Miriam, Deborah, Hannah and Esther.
- **Daniel** is honoured as a righteous visionary, but the Hebrew Bible places his book among the Writings rather than the Prophets.

**In Christianity**
- All the prophets above, including **Daniel**, whose book Christian Bibles place among the prophets.
- **John the Baptist**, the forerunner, of whom Jesus said that among those born of women "there hath not risen a greater" (Matthew 11:11).
- **Jesus**, whom the Gospels call "a prophet mighty in deed and word" (Luke 24:19). For most Christians he is more than a prophet: the Son of God.

**In Islam**
- The Qur'an names **twenty-five prophets**: Adam, Idris (Enoch), Nuh (Noah), Hud, Salih, Ibrahim (Abraham), Lut (Lot), Ismail (Ishmael), Ishaq (Isaac), Yaqub (Jacob), Yusuf (Joseph), Ayyub (Job), Shuayb, Musa (Moses), Harun (Aaron), Dhul-Kifl, Dawud (David), Sulayman (Solomon), Ilyas (Elijah), al-Yasa (Elisha), Yunus (Jonah), Zakariya (Zechariah), Yahya (John), Isa (Jesus) and **Muhammad**, the Seal of the Prophets.
- Islamic tradition teaches that there were **many more**, sent to every people: "And for every nation there is a messenger" (Qur'an 10:47, Pickthall).

**Other honoured messengers**
- **Zoroaster** (Zarathushtra), prophet of Ahura Mazda, the Wise Lord.
- **Krishna**, whose teaching to Arjuna is the **Bhagavad Gita**: for Hindus, not a prophet but the Divine itself descending.
- **The Buddha**, the Awakened One, who taught a path rather than a revelation from a God.
- **Lao Tzu**, the sage of the **Tao Te Ching**, who pointed to the Way that cannot be named.

They are not all "prophets" in the same sense, and their traditions would describe them differently. What they share is this: **each carried a light that helped people find their way home.**

## Patriarchs, dreamers, sages and prophets
Some of the most beloved figures of scripture are remembered first for a **special role**:

- **The patriarchs**, Abraham, Isaac and Jacob, are the founders of the covenant line. Isaac carries the covenant forward; Jacob becomes Israel, the father of the twelve tribes.
- **Joseph** is the righteous dreamer and interpreter of dreams, through whom providence works to save a whole people.
- **Solomon** is the sage and king, who asked for wisdom and built the Temple.
- **The prophets**, in the strictest sense, are those who received a direct word and **delivered it publicly** to the people.

These roles often overlap. **Islam names Isaac, Jacob, Joseph and Solomon as prophets**, and the Jewish sages count Isaac, Jacob and Solomon among the 48 prophets of Israel. Joseph is honoured in Judaism as *Yosef ha-Tzaddik*, "Joseph the Righteous". Each tradition keeps its own way of counting, and each is respected here.

## How the mystics see the prophet
The mystical streams look beneath the lists. In the **Kabbalah**, the prophet is one whose soul has become a clear vessel, through which the Divine Light flows without distortion. The **Sufis** speak of the "light of Muhammad" shining through every prophet before him. The **yogic lineages** speak of masters who open a channel so that others can awaken.

In each, the prophet's deepest work is the same: **to open a door, so that the same Light can be recognised again, in every heart.**

## The prophets on this site
- [Enoch (Idris)](/teachings/enoch) · [Noah (Nuh)](/teachings/noah) · [Abraham (Ibrahim)](/teachings/abraham)
- [Isaac (Ishaq)](/teachings/isaac) · [Jacob (Yaqub)](/teachings/jacob) · [Joseph (Yusuf)](/teachings/joseph)
- [Moses (Musa)](/teachings/moses) · [Solomon (Sulayman)](/teachings/solomon) · [Elijah (Ilyas)](/teachings/elijah)
- [Isaiah, Jeremiah and Ezekiel](/teachings/isaiah-jeremiah-ezekiel) · [Mary (Maryam)](/teachings/mary) · [John the Baptist (Yahya)](/teachings/john-the-baptist)
- [Jesus of Nazareth (Isa)](/teachings/jesus-of-nazareth) · [Muhammad](/teachings/muhammad)
- [Zoroaster](/teachings/zarathushtra) · [The Buddha](/teachings/the-buddha) · [Krishna and Rama](/teachings/krishna-and-rama) · [Guru Nanak](/teachings/guru-nanak)${explore([
    ["One Source, One Message", "/teachings/one-source-one-message", "the one message all the prophets share."],
    ["The Temple in Jerusalem", "/teachings/the-temple-in-jerusalem", "the house of prayer Solomon built."],
  ])}${sources([
    "Babylonian Talmud, Megillah 14a, with Rashi's commentary, on the 48 prophets and 7 prophetesses.",
    "Matthew 11:11; Luke 24:19, King James Bible.",
    "Qur'an 10:47 and 33:40, Pickthall translation (1930).",
  ])}` };

export const noahPage = { slug: "noah", tag: "Abrahamic", title: "Noah (Nuh): The Ark and the Rainbow",
  summary: "The righteous man who walked with God in a violent age, built the ark, and saw the rainbow of God's promise: honoured in Judaism, Christianity and Islam, where he is one of the great messengers.",
  body: `{{prophet-hero-noah}}

${glance("noah")}

## A just man in a hard time
The Bible describes a world "filled with violence", and in it one man who stayed true: "Noah was a just man and perfect in his generations, and Noah walked with God" (Genesis 6:9). **"Noah found grace in the eyes of the LORD"** (Genesis 6:8).

## The ark
God told Noah to build an ark and to bring his family and the animals, two by two, so that life could begin again after the great flood. Noah obeyed, though it must have seemed strange to everyone around him. **Faith sometimes means building before the rain.**

## The rainbow
When the waters went down, God made a covenant with Noah and with every living creature: "I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth" (Genesis 9:13). **The rainbow became the sign of mercy after the storm.**

## How the traditions see him
- **In Judaism** Noah is the ancestor of all humanity after the flood. The sages taught the **seven laws of the children of Noah**, a simple moral code for every nation: do not murder, steal or worship idols, and set up courts of justice, among others.
- **In Christianity** he is "a preacher of righteousness" (2 Peter 2:5), and the ark became an image of salvation.
- **In Islam** he is *Nuh*, one of the greatest messengers, who called his people to God with patience for many centuries. A whole chapter of the Qur'an, Surah Nuh (71), carries his name.

## For the heart
Noah reminds us that **one faithful life can carry the future**, and that after every flood there is a rainbow.${back}${explore([
    ["The Great Flood", "/teachings/the-great-flood", "the flood remembered across the world."],
    ["Flood Stories of the World", "/teachings/flood-stories-of-the-world"],
  ])}${sources([
    "Genesis 6:8–9 and 9:13; 2 Peter 2:5, King James Bible.",
    "Babylonian Talmud, Sanhedrin 56a, on the seven laws of the children of Noah.",
    "Qur'an, Surah 71 (Nuh), Pickthall translation (1930).",
  ])}` };

export const isaacPage = { slug: "isaac", tag: "Abrahamic", title: "Isaac (Ishaq): The Son of the Promise",
  summary: "The long-awaited son of Abraham and Sarah, the quiet patriarch who carried the covenant forward, who went out into the field to pray at evening: a patriarch in Judaism and Christianity and a prophet in Islam.",
  body: `{{prophet-hero-isaac}}

${glance("isaac")}

## A child of laughter
Abraham and Sarah waited many years for a son. When God promised one in their old age, Sarah laughed. When he was born, she named him **Isaac**, *Yitzchak*, "he will laugh": "God hath made me to laugh, so that all that hear will laugh with me" (Genesis 21:6).

## The binding on the mountain
The Bible tells how God tested Abraham by asking him to offer his son on Mount Moriah, and how an angel stopped his hand, and a ram was offered instead (Genesis 22). Jews call this the *Akedah*, "the binding", and read it as the story of perfect trust on both sides: of the father, and of the son who went with him. (Islamic tradition tells this story too, and most Muslim scholars hold that the son was **Ishmael**; both readings are honoured here.)

## The quiet one
Isaac's life is told more simply than his father's or his son's. But one line has touched readers for thousands of years: **"Isaac went out to meditate in the field at the eventide"** (Genesis 24:63). The Jewish sages taught that Isaac first set the **afternoon prayer**, *Minchah*, as Abraham set the morning prayer and Jacob the evening one.

He also re-dug the wells his father had dug, which others had filled in (Genesis 26:18). **Sometimes faithfulness means opening again the springs our elders found.**

## How the traditions see him
- **In Judaism** he is the second of the three patriarchs, and the Jewish sages count him among the prophets.
- **In Christianity** he is the child of promise, honoured in the "faith" chapter of the Letter to the Hebrews (Hebrews 11:17–20).
- **In Islam** he is *Ishaq*: "And We gave him tidings of the birth of Isaac, a prophet of the righteous" (Qur'an 37:112, Pickthall).

## For the heart
Isaac teaches **the strength of the quiet life**: prayer at evening, faithfulness without fame, and wells kept open for the next generation.${back}${explore([
    ["Abraham (Ibrahim)", "/teachings/abraham", "his father, the friend of God."],
    ["Jacob (Yaqub)", "/teachings/jacob", "his son, who became Israel."],
    ["The Power of Silence", "/teachings/the-power-of-silence"],
  ])}${sources([
    "Genesis 21:6, 22, 24:63 and 26:18; Hebrews 11:17–20, King James Bible.",
    "Babylonian Talmud, Berakhot 26b, on the patriarchs and the three daily prayers; Megillah 14a with Rashi.",
    "Qur'an 37:112, Pickthall translation (1930).",
  ])}` };

export const jacobPage = { slug: "jacob", tag: "Abrahamic", title: "Jacob (Yaqub): The Ladder and the New Name",
  summary: "The patriarch who dreamed of a ladder between heaven and earth, wrestled until dawn and was renamed Israel, and whose twelve sons became the twelve tribes: honoured in Judaism, Christianity and Islam.",
  body: `{{prophet-hero-jacob}}

${glance("jacob")}

## A restless beginning
Jacob was the younger twin of Esau, and his early life was full of struggle: the birthright, the blessing, and a long flight from his brother's anger. **His story is the story of a soul being shaped by its mistakes.**

## The ladder
Alone in the desert, with a stone for his pillow, Jacob dreamed: "behold a ladder set up on the earth, and the top of it reached to heaven: and behold the angels of God ascending and descending on it" (Genesis 28:12). When he woke he said: **"Surely the LORD is in this place; and I knew it not"** (Genesis 28:16).

*How many places in our own lives are holy, and we know it not?*

## Wrestling until dawn
Years later, on the night before he met Esau again, Jacob wrestled with a mysterious stranger until the breaking of the day, and would not let go until he was blessed. He was given a new name: **Israel**, "one who struggles with God". He called the place Peniel: "for I have seen God face to face, and my life is preserved" (Genesis 32:30). He limped afterwards, and he was changed. Then he and Esau embraced and wept.

## How the traditions see him
- **In Judaism** he is the third patriarch. His name, Israel, became the name of the whole people, and his twelve sons the twelve tribes. In the Kabbalah he is linked with *Tiferet*, beauty and harmony, the balance at the heart of the Tree of Life.
- **In Christianity** Jesus recalls his ladder: "Hereafter ye shall see heaven open, and the angels of God ascending and descending" (John 1:51).
- **In Islam** he is *Yaqub*, a prophet, remembered above all for his **"comely patience"** in his grief for Joseph (Qur'an 12:18 and 12:83).

## For the heart
Jacob teaches that **struggle is not the opposite of faith**. We may wrestle all night, and still come away blessed, and renamed.${back}${explore([
    ["Isaac (Ishaq)", "/teachings/isaac", "his father."],
    ["Joseph (Yusuf)", "/teachings/joseph", "his beloved son."],
    ["The Ten Sefirot", "/teachings/the-ten-sefirot", "Tiferet, the heart of the Tree."],
  ])}${sources([
    "Genesis 28:12–16 and 32:24–30; John 1:51, King James Bible.",
    "Qur'an 12:18 and 12:83, Pickthall translation (1930).",
  ])}` };

export const josephPage = { slug: "joseph", tag: "Abrahamic", title: "Joseph (Yusuf): The Dreamer Who Forgave",
  summary: "The beloved son with the coat of many colours, sold by his brothers, raised from prison to save Egypt, who forgave everything: Joseph the Righteous in Judaism, and in Islam a prophet whose story the Qur'an calls the best of narratives.",
  body: `{{prophet-hero-joseph}}

${glance("joseph")}

## The coat and the dreams
Joseph was Jacob's beloved son, and his father gave him a coat of many colours. Joseph dreamed that the sun, the moon and eleven stars bowed down to him. His brothers grew jealous, threw him into a pit, and sold him as a slave into Egypt.

## From the pit to the palace
In Egypt Joseph served faithfully, was falsely accused, and was thrown into prison. Even there he stayed kind, and he interpreted the dreams of his fellow prisoners. At last Pharaoh himself had dreams no one could explain: seven fat cows and seven lean ones. Joseph understood: **seven years of plenty, then seven of famine.** Pharaoh made him ruler over Egypt, and Joseph stored grain that saved many nations.

## The great forgiveness
When the famine came, Joseph's brothers came to Egypt to buy bread, and did not recognise him. When at last he told them who he was, he wept, and said: **"ye thought evil against me; but God meant it unto good"** (Genesis 50:20).

In the Qur'an his words are: "Have no fear this day! May Allah forgive you" (Qur'an 12:92, Pickthall).

## How the traditions see him
- **In Judaism** he is *Yosef ha-Tzaddik*, "Joseph the Righteous". In the Kabbalah he is linked with *Yesod*, the foundation, the channel through which blessing flows down into the world.
- **In Christianity** his life, from betrayal to rescue, has long been read as a foreshadowing of Christ.
- **In Islam** he is *Yusuf*, a prophet, and a whole chapter of the Qur'an tells his story, which it calls **"the best of narratives"** (Qur'an 12:3, Pickthall).

## For the heart
Joseph teaches that **no pit is the end of the story**, that dreams may take many years to unfold, and that the greatest power is the power to forgive.${back}${explore([
    ["The Power of Forgiveness", "/teachings/the-power-of-forgiveness"],
    ["Dreams: The Language of the Soul", "/teachings/dreams-the-language-of-the-soul"],
    ["Jacob (Yaqub)", "/teachings/jacob", "his father."],
  ])}${sources([
    "Genesis 37, 39–45 and 50:20, King James Bible.",
    "Qur'an 12:3 and 12:92, Pickthall translation (1930).",
  ])}` };

export const solomonPage = { slug: "solomon", tag: "Abrahamic", title: "Solomon (Sulayman): The Wise King Who Built the Temple",
  summary: "The king who asked God for an understanding heart, built the First Temple in Jerusalem, and became a byword for wisdom: a king and sage in the Bible, and a prophet in Islam who understood the speech of birds.",
  body: `{{prophet-hero-solomon}}

${glance("solomon")}

## The prayer for wisdom
When Solomon became king, God appeared to him in a dream and said, "Ask what I shall give thee." Solomon did not ask for riches or long life. He asked: **"Give therefore thy servant an understanding heart"** (1 Kings 3:9). Because he asked for wisdom, the Bible says, he was given wisdom, and much more besides.

## The wise judgment
Two women came before him, each claiming the same baby. Solomon called for a sword to divide the child. One woman cried out, "give her the living child, and in no wise slay it." **Solomon knew at once that she was the true mother**, because she loved the child more than her claim (1 Kings 3:16–28).

## The Temple
Solomon built the **First Temple** in Jerusalem, the house where the Ark of the Covenant was kept in the Holy of Holies. At its dedication he prayed with great humility: **"behold, the heaven and heaven of heavens cannot contain thee; how much less this house that I have builded?"** (1 Kings 8:27). See [The Temple in Jerusalem](/teachings/the-temple-in-jerusalem).

## His words
Tradition gives Solomon three books of the Bible: **Proverbs**, practical wisdom for daily life; **Ecclesiastes**, which reflects that "to every thing there is a season" (Ecclesiastes 3:1); and the **Song of Songs**, a love poem that the mystics read as the love between the soul and God.

## How the traditions see him
- **In Judaism** he is King Solomon, *Shlomo ha-Melech*, the wisest of men, and the sages count him among the prophets. The Bible also honestly tells that in his old age his heart was turned aside (1 Kings 11), a reminder that even the wise must stay watchful.
- **In Christianity** Jesus spoke of "the wisdom of Solomon" (Matthew 12:42).
- **In Islam** he is *Sulayman*, a prophet and king, to whom God taught **"the language of birds"** (Qur'an 27:16, Pickthall) and made the wind serve. The Qur'an tells of the hoopoe bird and of the Queen of Sheba, who came to believe in the One God. In Islam he remained righteous all his life.

## For the heart
Solomon teaches us **what to ask for**. Not more, but wiser: an understanding heart.${back}${explore([
    ["The Temple in Jerusalem", "/teachings/the-temple-in-jerusalem"],
    ["Nathan and King David", "/teachings/nathan-and-david", "his father, David."],
    ["Wisdom and Power", "/teachings/wisdom-and-power", "the sages and the kings."],
  ])}${sources([
    "1 Kings 3:5–28, 8:27 and 11; Ecclesiastes 3:1; Matthew 12:42, King James Bible.",
    "Babylonian Talmud, Megillah 14a, with Rashi's commentary.",
    "Qur'an 21:81 and 27:15–44, Pickthall translation (1930).",
  ])}` };

export const elijahPage = { slug: "elijah", tag: "Abrahamic", title: "Elijah (Ilyas): The Fire and the Still Small Voice",
  summary: "The fiery prophet of Mount Carmel who found God not in the wind, the earthquake or the fire, but in a still small voice, and was taken up to heaven in a whirlwind: awaited at every Passover table, and a prophet in Islam.",
  body: `{{prophet-hero-elijah}}

${glance("elijah")}

## Fed by ravens
Elijah lived in a time when the king and queen of Israel had turned the people to the worship of Baal. Elijah spoke against them, and had to hide by a brook, where **ravens brought him bread and meat** each morning and evening (1 Kings 17:6). Later a poor widow shared her last flour with him, and her jar never ran empty.

## The fire on Mount Carmel
Elijah challenged the prophets of Baal to a test on Mount Carmel: whichever god answered by fire was the true God. Their altar stayed cold. Elijah prayed simply, and **fire fell from heaven**. The people cried, "The LORD, he is the God" (1 Kings 18:39).

## The still small voice
After this great victory, Elijah was afraid and exhausted, and fled into the desert, wishing to die. An angel gave him bread and water and let him sleep. On the mountain of God, there was a great wind, an earthquake and a fire, **"but the LORD was not in the fire: and after the fire a still small voice"** (1 Kings 19:12).

*God is not always in the great and dramatic things. Often, God is in the quiet.*

## The chariot of fire
Elijah did not die. "There appeared a chariot of fire, and horses of fire ... and Elijah went up by a whirlwind into heaven" (2 Kings 2:11), and his mantle passed to his disciple Elisha.

## How the traditions see him
- **In Judaism** the prophet Malachi promised that Elijah would return before "the great and dreadful day of the LORD" (Malachi 4:5). At every Passover meal a cup is poured for Elijah and the door is opened for him, and he is invoked at every circumcision.
- **In Christianity** John the Baptist came "in the spirit and power of Elias" (Luke 1:17), and Elijah appears with Moses beside Jesus at the Transfiguration (Matthew 17:3).
- **In Islam** he is *Ilyas*, a messenger who called his people away from Baal: "Will ye cry unto Baal and forsake the Best of creators?" (Qur'an 37:125, Pickthall).

## For the heart
Elijah teaches that even the bravest people grow tired and afraid, that **rest and bread are holy**, and that God's voice is most often still and small.${back}${explore([
    ["Intuition: The Still, Small Voice", "/teachings/intuition-the-still-small-voice"],
    ["John the Baptist (Yahya)", "/teachings/john-the-baptist", "who came in the spirit of Elijah."],
    ["Moses (Musa)", "/teachings/moses"],
  ])}${sources([
    "1 Kings 17–19; 2 Kings 2:11; Malachi 4:5; Luke 1:17; Matthew 17:3, King James Bible.",
    "Qur'an 6:85 and 37:123–132, Pickthall translation (1930).",
  ])}` };

export const maryPage = { slug: "mary", tag: "Abrahamic", title: "Mary (Maryam): The Mother of Jesus",
  summary: "The young woman of Nazareth who said yes to God, the mother of Jesus, honoured by Christians as the Mother of God and by Muslims as chosen and purified above the women of creation, the only woman named in the Qur'an.",
  body: `{{prophet-hero-mary}}

${glance("mary")}

## The annunciation
The Gospel of Luke tells how the angel Gabriel came to a young woman in Nazareth and said: **"Hail, thou that art highly favoured, the Lord is with thee: blessed art thou among women"** (Luke 1:28). She was troubled, and asked how this could be. Then she answered with perfect trust: "Behold the handmaid of the Lord; be it unto me according to thy word" (Luke 1:38).

## Her song
Mary's song of praise, the *Magnificat*, has been sung for two thousand years: **"My soul doth magnify the Lord, and my spirit hath rejoiced in God my Saviour"** (Luke 1:46–47). It praises a God who lifts up the humble and fills the hungry with good things.

## At the cross
Mary stood by her son at the cross when many had fled (John 19:25), and Christians remember her as **the mother who stays**, in every sorrow.

## How the traditions see her
- **In Christianity** she is the Virgin Mary, the Mother of Jesus. Catholic and Orthodox Christians honour her as the **Mother of God** and ask for her prayers; Protestant Christians honour her as a model of faith.
- **In Islam** she is *Maryam*, the only woman named in the Qur'an, and a whole chapter, **Surah Maryam** (19), bears her name. "O Mary! Lo! Allah hath chosen thee and made thee pure, and hath preferred thee above (all) the women of creation" (Qur'an 3:42, Pickthall). Most Muslim scholars do not count her among the prophets, but she is loved and honoured above almost all who lived.
- She is not usually called a prophet, but she is one of the **most beloved souls** in all of scripture.

## For the heart
Mary teaches **the holiness of saying yes**: to trust when we do not fully understand, and to carry the light quietly, with love.${back}${explore([
    ["A Prayer to Mother Mary for Comfort", "/teachings/prayer-to-mother-mary"],
    ["Jesus of Nazareth (Isa)", "/teachings/jesus-of-nazareth", "her son."],
    ["The Divine Feminine", "/teachings/the-divine-feminine"],
  ])}${sources([
    "Luke 1:28, 1:38 and 1:46–55; John 19:25, King James Bible.",
    "Qur'an 3:42 and Surah 19 (Maryam), Pickthall translation (1930).",
  ])}` };

export const johnPage = { slug: "john-the-baptist", tag: "Abrahamic", title: "John the Baptist (Yahya): The Voice in the Wilderness",
  summary: "The prophet of the desert who called people to turn their hearts back to God, baptised them in the Jordan, and baptised Jesus: the forerunner in Christianity, a prophet in Islam, and the great teacher of the Mandaeans.",
  body: `{{prophet-hero-john}}

${glance("john")}

## A child of promise
John was born to the priest Zechariah and his wife Elizabeth in their old age, a gift after long waiting, like Isaac before him (Luke 1). The angel said he would go before the Lord "in the spirit and power of Elias" (Luke 1:17).

## The voice in the wilderness
John lived simply in the desert, dressed in camel's hair, and called the people to the river Jordan: **"Repent ye: for the kingdom of heaven is at hand"** (Matthew 3:2). He was "the voice of one crying in the wilderness, Prepare ye the way of the Lord" (Matthew 3:3). People came from everywhere to be washed in the river as a sign of a new beginning.

## The humility of the forerunner
When Jesus came to be baptised, John hesitated, feeling unworthy. Later, when his followers worried that people were turning to Jesus, he answered with some of the humblest words in scripture: **"He must increase, but I must decrease"** (John 3:30).

## How the traditions see him
- **In Christianity** he is Saint John the Baptist, the forerunner, of whom Jesus said that among those born of women "there hath not risen a greater" (Matthew 11:11).
- **In Islam** he is *Yahya*, son of Zakariya, a prophet given wisdom as a child: "Peace on him the day he was born, and the day he dieth and the day he shall be raised alive!" (Qur'an 19:15, Pickthall).
- **The Mandaeans**, an ancient people of Iraq and Iran, honour him as their great teacher, and baptism in flowing water is at the heart of their faith.

## For the heart
John teaches **the beauty of preparing the way** for something greater than ourselves, and the freedom of being small so that the Light can be large.${back}${explore([
    ["Jesus of Nazareth (Isa)", "/teachings/jesus-of-nazareth"],
    ["Elijah (Ilyas)", "/teachings/elijah", "in whose spirit he came."],
    ["Grace, Surrender and Humility", "/teachings/grace-surrender-and-humility"],
  ])}${sources([
    "Luke 1:13–17; Matthew 3:2–3 and 11:11; John 3:30, King James Bible.",
    "Qur'an 19:7–15, Pickthall translation (1930).",
  ])}` };

export const templePage = { slug: "the-temple-in-jerusalem", tag: "The holy house", title: "The Temple in Jerusalem: The House of Prayer",
  summary: "Solomon's First Temple and the Second Temple, the Holy of Holies, what the Temple Mount means to Jews, Christians and Muslims, and the mystical teaching that the truest temple is built within the heart.",
  body: `For three thousand years, one small hill in Jerusalem has been called **the house of God**. To understand why it is so loved, we have to look at what was built there, and at what it means to each faith.

## The First Temple
King David brought the **Ark of the Covenant** to Jerusalem, and his son **Solomon** built the First Temple to house it, around the 10th century BCE (1 Kings 6–8). At its heart was the **Holy of Holies**, a small dark room where the Ark rested, entered only by the High Priest, once a year, on the Day of Atonement.

At its dedication, Solomon prayed that the house would be a place of prayer for **everyone**, even "a stranger, that is not of thy people Israel" who comes from a far country (1 Kings 8:41–43). The prophet Isaiah later called it "an house of prayer for all people" (Isaiah 56:7).

The First Temple was destroyed by the Babylonians in 587 or 586 BCE.

## The Second Temple
When the exiles returned from Babylon, the Temple was rebuilt and dedicated around 516 BCE. Centuries later King Herod greatly enlarged it. This is the Temple Jesus knew. It was destroyed by the Romans in 70 CE. Part of the great retaining wall around the hill still stands: the **Western Wall**, where people of every nation come to pray and to leave notes folded into the stones.

## What it means in Judaism
The Temple was the place where the **Shekhinah**, the Divine Presence, dwelt among the people. Since its destruction, Jews have prayed facing Jerusalem, and many prayers ask for its rebuilding in peace. Every synagogue is called a "small sanctuary", and every home table an altar of kindness.

## What it means in Christianity
Jesus was presented in the Temple as a baby (Luke 2:22) and, at twelve, was found there "sitting in the midst of the doctors, both hearing them, and asking them questions" (Luke 2:46). He spoke of "the temple of his body" (John 2:21), and Paul wrote: **"know ye not that your body is the temple of the Holy Ghost which is in you?"** (1 Corinthians 6:19).

## What it means in Islam
Muslims call the hill **al-Haram al-Sharif**, the Noble Sanctuary. It was the first direction of prayer for the early Muslims, and the Qur'an tells of the **Night Journey** of the Prophet Muhammad "from the Inviolable Place of Worship to the Far distant place of worship" (Qur'an 17:1, Pickthall), *al-Masjid al-Aqsa*. The **Dome of the Rock**, completed around 691 CE, and the al-Aqsa Mosque stand there today, honoured as the third holiest place in Islam.

## The temple within
All three traditions also teach that **God cannot be contained in any building**. Solomon himself said so at the dedication: "the heaven and heaven of heavens cannot contain thee; how much less this house that I have builded?" (1 Kings 8:27).

The Torah says, "let them make me a sanctuary; that I may dwell among them" (Exodus 25:8). The mystics noticed that it does not say "in it", but **"among them"**, and read it as "within them": **each heart is meant to become a dwelling place for God.**

## A house of prayer for all peoples
This place is holy to Jews, Christians and Muslims alike. This site takes no side in any dispute about it, and prays only for one thing: that it may truly become what Isaiah saw, **"an house of prayer for all people"**, and that peace may dwell there.

*Where is the temple in your own life, the quiet place where the Presence can dwell?*${explore([
    ["Jerusalem: City of Peace", "/teachings/jerusalem-city-of-peace"],
    ["Peace in the Land of God", "/teachings/peace-in-the-land-of-god"],
    ["Solomon (Sulayman)", "/teachings/solomon", "the king who built the First Temple."],
    ["Sacred Geometry in Temples, Mosques and Cathedrals", "/teachings/sacred-geometry-in-architecture"],
  ])}${sources([
    "1 Kings 6–8; Isaiah 56:7; Exodus 25:8; Luke 2:22 and 2:46; John 2:19–21; 1 Corinthians 6:19, King James Bible.",
    "Qur'an 17:1, Pickthall translation (1930).",
    "Encyclopaedia Britannica, \"Temple of Jerusalem\" and \"Dome of the Rock\".",
  ])}` };

