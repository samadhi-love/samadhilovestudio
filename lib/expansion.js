// The Great Expansion (Nov 2026): new teachings approved by Samadhi, added in phases.
// Each tradition in its own words; history and legend told apart; facts checked before publishing.

const sources = (lines) => `\n\n## Sources\n${lines.map((l) => `- ${l}`).join("\n")}`;
const related = (links) => `\n\n## Related teachings\n${links.map(([t, u, why]) => `- [${t}](${u})${why ? `: ${why}` : ""}`).join("\n")}`;

// ---------- Phase 1 ----------
export const fortyTwo = { slug: "forty-two-the-answer-and-the-question", tag: "Sacred Number", title: "42: The Answer, and the Question",
  summary: "A famous joke says the answer to life, the universe and everything is 42. The joke hides a real teaching about questions, and 42 turns out to be a sacred number in Egypt, the Kabbalah and the Bible.",
  body: `## The famous joke
In Douglas Adams' comic science-fiction story *The Hitchhiker's Guide to the Galaxy* (first a radio play in 1978, then a book in 1979), a vast computer called **Deep Thought** is asked for the answer to the great question of life, the universe and everything. After seven and a half million years of thinking, it gives its answer: **42.**

Everyone is disappointed. The computer explains, calmly, that the answer is correct. The trouble is that **nobody ever really knew what the question was.**

Adams later said he chose 42 simply because it was an ordinary, unremarkable number, and that was the joke. Millions of readers have smiled at it ever since.

## The teaching hidden in the joke
Without meaning to, the joke points to something the mystics have always said: **we rush to find answers before we know our real question.**

We ask, "How do I become rich?" when our real question is, "How do I feel safe?" We ask, "Why did this happen to me?" when our real question is, "Am I still loved?" An answer to the wrong question, however true, will never satisfy the heart.

The spiritual path is often less about finding answers than about **finding the true question**, and living with it patiently. As the poet Rilke advised a young friend, we can learn to love the questions themselves.

*What is the real question underneath the questions you are asking right now?*

## 42 in the sacred traditions
Surprisingly, 42 is not an ordinary number in the old traditions at all.

- **In ancient Egypt**, the *Book of the Dead* describes the soul entering the Hall of the Two Truths, where it stands before **42 divine judges** and speaks **42 declarations of innocence**: "I have not stolen", "I have not lied", "I have not caused anyone to weep". Then its heart is weighed against the feather of **Ma'at**, truth and harmony. See [Ma'at](/teachings/maat-wisdom-of-egypt).
- **In the Kabbalah**, there is a hidden **42-letter Name of God**, mentioned in the Talmud as a Name entrusted only to the humble and the pure-hearted. It is woven into the prayer *Ana BeKoach*, whose 42 words begin with its letters, and some medieval commentators said it is drawn from the first 42 letters of the Torah's story of creation.
- **In the Torah**, the Israelites made **42 journeys** through the desert from Egypt to the Promised Land, each one listed by name (Numbers 33). The Hasidic masters taught that these 42 stations are the stages of every human life, from birth to our final homecoming.
- **In the Gospel of Matthew**, the family line of Jesus is counted as three times fourteen generations from Abraham: **42 generations** (Matthew 1:17).

## And in numerology
In the numerology of this site, 42 becomes 4 + 2 = **6**: the number of **love and care**, home, healing and responsibility. Perhaps that is the answer after all: the ultimate answer to life, the universe and everything is love. See [Numerology](/teachings/numerology-the-meaning-of-numbers).

*The answer was never the hard part. The question is the door.*${related([
    ["Questions to Sit With", "/teachings/questions-to-sit-with", "living with the real questions."],
    ["Questions People Ask", "/teachings/questions-people-ask"],
    ["Ma'at", "/teachings/maat-wisdom-of-egypt", "the 42 declarations and the weighing of the heart."],
  ])}${sources([
    "Douglas Adams, *The Hitchhiker's Guide to the Galaxy* (BBC radio, 1978; book, 1979). Mentioned briefly; no text reproduced.",
    "The *Book of the Dead*, Spell 125 (the declarations of innocence before the 42 judges).",
    "Babylonian Talmud, Kiddushin 71a, on the 42-letter Name; Tosafot on Chagigah 11b; the prayer *Ana BeKoach*.",
    "Numbers 33; Matthew 1:17, King James Bible.",
    "Rainer Maria Rilke, *Letters to a Young Poet*, letter 4 (1903).",
  ])}` };

// ---------- Phase 2: Sacred Sites of the World ----------
const siteBox = (rows) => `| | |\n| --- | --- |\n${rows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}`;

export const sacredSites = [
  { slug: "sacred-sites-of-the-world", tag: "Sacred sites", title: "Sacred Sites of the World: Where Heaven Touches Earth",
    summary: "Why some places feel holy; how to read their history and their legends side by side; and seven of the great sacred sites of the world, from the Pyramids and Baalbek to Stonehenge, Petra, Delphi, Angkor Wat and Machu Picchu.",
    body: `Some places seem to hold a silence that is deeper than ordinary silence. People have walked for weeks to reach them, built with stones too heavy to imagine, and prayed there for thousands of years. **The traditions call such places "thin places": where the veil between heaven and earth grows thin.**

## Why places become sacred
- **The land itself:** a mountain, a spring, a cave, a great rock, a place where the sun rises exactly on the longest day.
- **What happened there:** a vision, a teacher, a burial, a miracle remembered.
- **The prayers of generations:** many feel that centuries of devotion leave something in a place, like warmth in a stone after sunset.

## Reading the stones wisely
Every great site has two stories: **what history and archaeology can show**, and **what legend and tradition remember**. This site tells both, side by side, and tells you which is which, so you can enjoy the mystery without losing the truth. See [How to Read the Legends](/teachings/reading-the-legends).

## The sites
- [The Pyramids of Giza](/teachings/the-pyramids-of-giza): the last of the Seven Wonders of the ancient world.
- [Baalbek](/teachings/baalbek): the temple of the giant stones, in Lebanon.
- [Stonehenge](/teachings/stonehenge): the circle that waits for the sun.
- [Petra](/teachings/petra): the rose-red city carved into the rock.
- [Delphi](/teachings/delphi): the navel of the world, where "Know thyself" was written.
- [Angkor Wat](/teachings/angkor-wat): the mountain of the gods in stone.
- [Machu Picchu](/teachings/machu-picchu): the city in the clouds.

And close to the heart of this site: [The Holy Land and Lebanon](/teachings/the-holy-land-and-lebanon), [Jerusalem](/teachings/jerusalem-city-of-peace) and [Göbekli Tepe](/teachings/gobekli-tepe).

## If you visit
Walk slowly. Touch gently, or not at all. Respect the people who still pray there and the rules that protect the stones. **The best thing to bring to a sacred place is a quiet heart, and the best thing to take away is the same heart, a little larger.**` },

  { slug: "the-pyramids-of-giza", tag: "Egypt", title: "The Pyramids of Giza: The Last Wonder",
    summary: "The Great Pyramid, the Sphinx and their companions on the Giza plateau: what history knows about how and why they were built, their astonishing precision, and the mysteries and legends that still surround them.",
    body: `${siteBox([["Where", "The Giza plateau, at the edge of Cairo, Egypt"], ["Built", "Old Kingdom, 4th Dynasty, about 2600 to 2500 BCE"], ["Who", "The pharaohs Khufu, Khafre and Menkaure"], ["World Heritage", "UNESCO, 1979 (Memphis and its Necropolis)"]])}

## What history knows
The **Great Pyramid** was built for the pharaoh **Khufu** around 2560 BCE. It rose about **146 metres (481 feet)** and was the tallest building made by human hands for nearly four thousand years. It is the **only one of the Seven Wonders of the ancient world still standing**.

It is made of some **2.3 million blocks** of stone, and its sides are aligned to true north, south, east and west with astonishing accuracy. Nearby stand the pyramids of **Khafre** and **Menkaure**, and the **Great Sphinx**, a lion with a human head carved from the living rock, usually dated to Khafre's reign.

Archaeologists have found the villages, bakeries and tombs of the skilled workers who built them: not slaves, as was once thought, but organised crews who took pride in their work and were buried with honour near their king.

## What the Egyptians believed
For the Egyptians, the pyramid was a **ladder to the stars**. The king's soul was to rise from it and join the gods in the sky, among the stars that never set. Its shape may echo the *benben*, the first mound of creation that rose from the waters, and the rays of the sun falling to earth.

## Mysteries and legends
- **How exactly were they built?** Ramps, levers and many hands are the best answers, but the full method is still debated.
- **Stars and alignments:** some writers believe the three pyramids mirror the belt of Orion. Most Egyptologists do not accept this, but the Egyptians did link their kings with Orion, whom they called *Sah*.
- **Hidden chambers:** in 2017, scientists using cosmic-ray imaging found a large empty space inside the Great Pyramid. What it is remains unknown.
- **The Hall of Records:** the psychic Edgar Cayce spoke of a lost library of Atlantis beneath the Sphinx. This is legend, not archaeology, and is told here as such.

*For more than four thousand years, people have stood here and felt small, and wondered. Perhaps that feeling is the true gift of the place.*${related([["Ma'at: The Wisdom of Egypt", "/teachings/maat-wisdom-of-egypt"], ["Hermes Trismegistus", "/teachings/hermes-trismegistus"], ["Atlantis", "/teachings/atlantis", "the legend and the history."]])}${sources(["Encyclopaedia Britannica, \"Pyramids of Giza\" and \"Great Sphinx\".", "UNESCO World Heritage Centre, \"Memphis and its Necropolis: the Pyramid Fields from Giza to Dahshur\".", "Morishima et al., \"Discovery of a big void in Khufu's Pyramid by observation of cosmic-ray muons\", *Nature* 552 (2017)."])}` },

  { slug: "baalbek", tag: "Lebanon", title: "Baalbek: The Temple of the Giant Stones",
    summary: "In Lebanon's Bekaa Valley stand the greatest Roman temples ever built, on foundations of stones so huge that legends say giants placed them: the history, the stones, and the stories.",
    body: `${siteBox([["Where", "The Bekaa Valley, Lebanon"], ["Built", "Roman temples, from the 1st century BCE to the 3rd century CE, on a far older sacred site"], ["Known as", "Heliopolis, \"City of the Sun\""], ["World Heritage", "UNESCO, 1984"]])}

## What history knows
Long before the Romans, Baalbek was a sacred hill where the people of the land worshipped the god **Baal**, which gave the place its name. The Greeks called it **Heliopolis**, the City of the Sun.

The Romans built here the largest temple complex in their whole empire. The **Temple of Jupiter** had columns about **20 metres** tall; **six of them still stand**, golden in the evening light. Beside it, the **Temple of Bacchus** is one of the best-preserved Roman temples in the world, with its carved doorway and ceilings still in place.

## The giant stones
Beneath the Temple of Jupiter lies the **Trilithon**: three limestone blocks, each weighing around **800 tonnes**, lifted and placed with precision. In the ancient quarry nearby lie even larger stones: the famous **Stone of the Pregnant Woman** (about 1,000 tonnes), and a still larger block found in 2014, estimated at about **1,650 tonnes**, among the largest stones ever cut by human hands.

How they were moved is still debated by engineers. Most scholars believe Roman builders used earthen ramps, levers and great teams of people and animals.

## Legends
Local legends say that **giants** built Baalbek in the days before the Flood, or that **Cain** built a refuge here, or King Solomon. These are stories, not history, but they show how deeply the stones have always amazed people.

## For the heart
Baalbek is part of the soul of **Lebanon**, a land of cedars and temples, crossroads of many peoples and faiths. Its columns have watched empires come and go, and they are still standing.

*Some things are built to last. Let the love we build be one of them.*${related([["The Holy Land and Lebanon", "/teachings/the-holy-land-and-lebanon"], ["Lebanon in Scripture: The Cedars of God", "/teachings/lebanon-in-scripture"], ["Sacred Sites of the World", "/teachings/sacred-sites-of-the-world"]])}${sources(["UNESCO World Heritage Centre, \"Baalbek\".", "Encyclopaedia Britannica, \"Baalbek\".", "German Archaeological Institute (DAI), report on the 2014 discovery of the largest stone block in the Baalbek quarry."])}` },

  { slug: "stonehenge", tag: "Britain", title: "Stonehenge: The Circle That Waits for the Sun",
    summary: "The great stone circle on Salisbury Plain, built over a thousand years and aligned with the sun of midsummer and midwinter: what we know of its builders, its stones, and the Druids who gather there today.",
    body: `${siteBox([["Where", "Salisbury Plain, Wiltshire, England"], ["Built", "In stages, from about 3000 to 1500 BCE"], ["Stones", "Great sarsens from nearby; smaller bluestones from the Preseli Hills of Wales"], ["World Heritage", "UNESCO, 1986 (with Avebury)"]])}

## What history knows
Stonehenge was not built at once. It began around **3000 BCE** as a circular bank and ditch. Around **2500 BCE**, the great **sarsen stones** were raised, some weighing over 25 tonnes, with stone lintels joined by woodworking joints, as if the builders were carpenters in stone.

The smaller **bluestones** came from the **Preseli Hills in Wales**, about 240 kilometres (150 miles) away. How they were carried that far, more than four thousand years ago, is one of the wonders of the ancient world.

## The sun
Stonehenge is aligned with the sun. On the **summer solstice**, the longest day, the sun rises over the Heel Stone into the heart of the circle. On the **winter solstice**, the sun sets in line with it. Many archaeologists think midwinter, when the light begins to return, may have been the more important moment.

## Who built it
Not the Druids, as was once believed: the Druids lived some two thousand years later. Stonehenge was built by the farming people of Neolithic Britain, who left no writing. It was a place of ceremony and burial, and perhaps of healing.

## Today
Every midsummer and midwinter, thousands gather at dawn, among them **modern Druids and pagans** who honour the earth and the turning of the year. Whatever one believes, it is moving to stand among the stones as the sun rises where its builders knew it would.

*The ancestors watched the sky and built with patience. The light still keeps its appointment.*${related([["Göbekli Tepe", "/teachings/gobekli-tepe", "an even older circle of stones."], ["The Astrological Ages", "/teachings/the-astrological-ages"], ["Sacred Sites of the World", "/teachings/sacred-sites-of-the-world"]])}${sources(["English Heritage, \"History of Stonehenge\".", "UNESCO World Heritage Centre, \"Stonehenge, Avebury and Associated Sites\".", "Parker Pearson et al., research on the Preseli bluestone quarries, *Antiquity* (2019)."])}` },

  { slug: "petra", tag: "Jordan", title: "Petra: The Rose-Red City",
    summary: "The city the Nabataeans carved into the pink sandstone cliffs of Jordan, reached through a narrow canyon: its history, its great carved facades, and its links to Aaron and Moses in the traditions.",
    body: `${siteBox([["Where", "Southern Jordan, near the town of Wadi Musa"], ["Built", "Capital of the Nabataeans, flourishing from about the 1st century BCE"], ["World Heritage", "UNESCO, 1985; named one of the New Seven Wonders of the World in 2007"]])}

## What history knows
The **Nabataeans** were Arab traders who grew rich on the caravan routes carrying incense and spices. In the 1st century BCE they made **Petra** their capital, carving tombs, temples and halls straight into the rose-coloured sandstone. They were also masters of water: channels and cisterns caught every drop of the desert rain.

You enter Petra through the **Siq**, a narrow winding canyon more than a kilometre long. At its end, the rock opens and the **Treasury** (*al-Khazneh*) appears, its great facade glowing pink and gold. It was most likely a royal tomb. High above the city stands the even larger **Monastery** (*ad-Deir*).

After the Romans took over in 106 CE and trade routes changed, Petra slowly faded. It was known to local Bedouin all along, and was made famous in Europe by the traveller Johann Ludwig Burckhardt in 1812.

## In the traditions
- The town at Petra's gate is **Wadi Musa**, "the Valley of Moses". Local tradition holds that its spring, **Ain Musa**, is where Moses struck the rock and water flowed.
- On a mountain above Petra, **Jabal Harun**, a small white shrine marks the traditional tomb of **Aaron**, brother of Moses, honoured by Jews, Christians and Muslims.

*A people carved a city into stone and made the desert bloom with water. Patience and care can turn rock into a home.*${related([["Moses (Musa)", "/teachings/moses"], ["Sacred Sites of the World", "/teachings/sacred-sites-of-the-world"]])}${sources(["UNESCO World Heritage Centre, \"Petra\".", "Encyclopaedia Britannica, \"Petra\" and \"Nabataeans\"."])}` },

  { slug: "delphi", tag: "Greece", title: "Delphi: The Navel of the World",
    summary: "The sanctuary of Apollo on the slopes of Mount Parnassus, home of the Oracle, where the words \"Know thyself\" were carved: what history knows, the Pythia, and the wisdom that came from this mountain.",
    body: `${siteBox([["Where", "Mount Parnassus, central Greece"], ["Flourished", "About the 8th century BCE to the 4th century CE"], ["Known for", "The Oracle of Apollo and the words \"Know thyself\""], ["World Heritage", "UNESCO, 1987"]])}

## The centre of the world
The Greeks told that Zeus released two eagles from the ends of the earth, and they met above Delphi. So Delphi was the **navel of the world**, marked by a sacred stone, the *omphalos*.

## The Oracle
In the Temple of Apollo sat the **Pythia**, a priestess who spoke the god's answers to those who came with questions: kings, cities and ordinary people. Her words were often mysterious and could be read two ways, so that the seeker had to think, and look inward.

## "Know thyself"
Carved at the entrance of the temple were short sayings of the sages, among them **"Know thyself"** (*gnōthi seauton*) and **"Nothing in excess"** (*mēden agan*). They became the heart of Greek wisdom. Before asking the god anything, the seeker was reminded to look at his own soul.

## Socrates and the Oracle
Plato tells that a friend of Socrates asked the Oracle whether anyone was wiser than Socrates. The answer was: **no one.** Socrates was puzzled, for he knew he knew nothing. He came to understand that this was his wisdom: **he knew that he did not know**, while others thought they knew what they did not (Plato, *Apology* 21a–d).

*Every true journey to wisdom begins at the same door: know thyself.*${related([["Socrates", "/teachings/socrates"], ["Solon and King Croesus", "/teachings/solon-and-croesus", "a story of the Oracle's warning."], ["Sacred Sites of the World", "/teachings/sacred-sites-of-the-world"]])}${sources(["UNESCO World Heritage Centre, \"Archaeological Site of Delphi\".", "Plato, *Apology* 21a–d.", "Pausanias, *Description of Greece*, Book 10.", "Encyclopaedia Britannica, \"Delphi\" and \"Oracle of Delphi\"."])}` },

  { slug: "angkor-wat", tag: "Cambodia", title: "Angkor Wat: The Mountain of the Gods in Stone",
    summary: "The largest religious monument in the world, built in Cambodia in the 12th century as a temple-mountain for Vishnu and later a Buddhist sanctuary: its meaning, its carvings, and its sunrise.",
    body: `${siteBox([["Where", "Near Siem Reap, Cambodia"], ["Built", "Early 12th century, under King Suryavarman II"], ["Dedicated to", "Vishnu; later a Buddhist sanctuary, as it is today"], ["World Heritage", "UNESCO, 1992 (Angkor)"]])}

## What history knows
**Angkor Wat** was built by the Khmer king **Suryavarman II** in the early 12th century, as a temple to the Hindu god **Vishnu** and perhaps as his own resting place. It is the **largest religious monument in the world**, surrounded by a wide moat, and its image is on the flag of Cambodia.

Over the centuries it became a **Buddhist** sanctuary, and Buddhist monks still pray there today. It has never been fully abandoned.

## A mountain in stone
The temple is a map of the universe. Its five towers rise like the five peaks of **Mount Meru**, the sacred mountain at the centre of the world in Hindu and Buddhist teaching. The moat is the cosmic ocean. To walk from the outer gate to the central tower is to make a pilgrimage from the world to the heart of the heavens.

Unusually, Angkor Wat faces **west**, toward the setting sun, which some scholars link with Vishnu and with death and return.

## The churning of the ocean
Along its galleries runs one of the longest stone carvings in the world. Its most famous scene is the **Churning of the Ocean of Milk**: gods and demons pull on a great serpent wound around a mountain, to churn from the ocean the nectar of immortality. Good and its opposite, working together, bring forth the treasure.

*Even the struggle between light and shadow can churn up something precious, when it turns around a still centre.*${related([["Krishna and Rama", "/teachings/krishna-and-rama", "Vishnu's avatars."], ["Siddhartha Gautama, the Buddha", "/teachings/the-buddha"], ["Sacred Geometry in Temples, Mosques and Cathedrals", "/teachings/sacred-geometry-in-architecture"]])}${sources(["UNESCO World Heritage Centre, \"Angkor\".", "Encyclopaedia Britannica, \"Angkor Wat\"."])}` },

  { slug: "machu-picchu", tag: "Peru", title: "Machu Picchu: The City in the Clouds",
    summary: "The Inca sanctuary high in the Andes of Peru, built in the 15th century and aligned with the sun and the sacred mountains: what history knows, the Intihuatana stone, and the Andean reverence for Mother Earth.",
    body: `${siteBox([["Where", "The Andes mountains of Peru, above the Urubamba River"], ["Built", "Mid-15th century, probably for the Inca emperor Pachacuti"], ["World Heritage", "UNESCO, 1983; one of the New Seven Wonders of the World (2007)"]])}

## What history knows
**Machu Picchu**, "Old Mountain" in the Quechua language, was built around **1450** on a ridge between two peaks, most likely as a royal estate and sacred retreat for the great Inca ruler **Pachacuti**. Its stone walls fit together so perfectly, without mortar, that a knife blade cannot pass between the stones, and they have survived centuries of earthquakes.

When the Spanish conquered Peru, they never found it. Local farmers always knew it was there, and in 1911 the explorer Hiram Bingham made it known to the world.

## The sun and the mountains
- The **Temple of the Sun** has a window through which the sunrise of the June solstice shines onto a carved stone.
- The **Intihuatana**, "the hitching post of the sun", is a carved stone that many believe was used to follow the sun through the year.
- The Inca honoured the great mountains as living spirits, the **Apus**, and the earth as **Pachamama**, Mother Earth, to whom offerings of thanks are still made today.

## For the heart
Machu Picchu teaches **harmony with the land**: buildings shaped to the mountain rather than against it, terraces that feed people without destroying the slopes, and a people who thanked the earth before they took from it.

*Build with the mountain, not against it. Give thanks before you take.*${related([["The Names of the Creator in Indigenous Traditions", "/teachings/the-names-of-the-creator-in-indigenous-traditions"], ["All My Relations", "/teachings/all-my-relations"], ["Sacred Sites of the World", "/teachings/sacred-sites-of-the-world"]])}${sources(["UNESCO World Heritage Centre, \"Historic Sanctuary of Machu Picchu\".", "Encyclopaedia Britannica, \"Machu Picchu\"."])}` },
];

// ---------- Phase 3: the hidden streams ----------
export const gibran = { slug: "kahlil-gibran", tag: "Lebanon", title: "Kahlil Gibran: The Prophet of the Cedars",
  summary: "The Lebanese poet, painter and mystic whose book The Prophet has been read by millions in over a hundred languages: his life from Bsharri to New York, his love of all faiths, and his words on love, work, children, joy and death.",
  body: `## From the cedars to the world
**Gibran Khalil Gibran** was born in **1883 in Bsharri**, a mountain village in northern Lebanon, below the ancient **Cedars of God**. His family was Maronite Christian. When he was twelve, his mother took her children to **Boston**, where they lived in poverty. A teacher noticed his gift for drawing, and he grew into both a painter and a writer, in Arabic and in English.

He died in New York in **1931**, at only 48. As he wished, he was brought home and laid to rest in the old **Mar Sarkis monastery in Bsharri**, which is now the Gibran Museum, facing the valley he loved.

## The Prophet
In **1923** he published *The Prophet*: twenty-six short poetic teachings given by a wise man, **Almustafa**, to the people of a city as he leaves to sail home. It has never gone out of print, has been translated into more than a hundred languages, and is one of the best-selling books of poetry in history.

A few of its words (*The Prophet*, 1923, now in the public domain):

> "Work is love made visible."

> "Your children are not your children. They are the sons and daughters of Life's longing for itself."

> "Your pain is the breaking of the shell that encloses your understanding."

> "The deeper that sorrow carves into your being, the more joy you can contain."

> "For what is it to die but to stand naked in the wind and to melt into the sun?"

## A heart for every faith
Gibran was raised a Christian and wrote with deep love of Jesus, in *Jesus, the Son of Man* (1928). He also loved the **Sufi poets** of Islam, and he drew a portrait of **'Abdu'l-Bahá** of the Bahá'í Faith when they met in New York in 1912. He believed that all religions are rivers flowing to one sea. He wrote often against fanaticism and injustice, and for the dignity of every person.

## For the heart
Gibran teaches that **the spiritual life is lived in ordinary things**: in love, in work, in raising children, in eating and drinking, in joy and sorrow. Nothing is outside the sacred.

*Love gives naught but itself and takes naught but from itself.* (*The Prophet*)${related([["Lebanon in Scripture: The Cedars of God", "/teachings/lebanon-in-scripture"], ["Rumi", "/teachings/rumi", "the Sufi poet Gibran loved."], ["Ordinary Life", "/teachings/the-teaching-in-ordinary-life"]])}${sources(["Kahlil Gibran, *The Prophet* (Alfred A. Knopf, 1923), in the public domain; *Jesus, the Son of Man* (1928).", "Encyclopaedia Britannica, \"Khalil Gibran\".", "Gibran National Committee and Gibran Museum, Bsharri, Lebanon."])}` };

export const gnostics = { slug: "the-gnostics-and-the-lost-gospels", tag: "Hidden texts", title: "The Gnostics and the Lost Gospels: The Divine Spark Within",
  summary: "In 1945 a farmer in Egypt found a jar of ancient books: the Nag Hammadi library, with the Gospel of Thomas and other lost gospels. Who the Gnostics were, what they taught about the divine spark, and why their books were hidden.",
  body: `## The jar in the desert
In **December 1945**, near the town of **Nag Hammadi** in Upper Egypt, a farmer named Muhammad Ali al-Samman was digging for fertile soil when he found a sealed clay jar. Inside were **thirteen leather-bound books** containing more than **fifty ancient texts**, written in Coptic, the language of Egypt's early Christians, and copied in the 4th century.

Many had been lost for over 1,500 years. Scholars call them the **Nag Hammadi library**.

## Who were the Gnostics?
"Gnostic" comes from the Greek *gnosis*, **knowing**: not knowledge from books, but **inner knowing of God**, like knowing a friend. The Gnostics were many different groups of the first centuries after Jesus who taught that salvation comes through this inner awakening.

Their central teaching: **a divine spark of light lives inside every human being.** We have forgotten where we came from, asleep in the world. A messenger of light comes to wake us, so that the spark can remember its home.

Some Gnostic teachers also told mythic stories that the world was shaped by a lesser, ignorant creator rather than by the highest God. This was one of the reasons the early church rejected their teachings, and in time their books were no longer copied. Someone, perhaps monks of a nearby monastery, hid the jar to keep them safe.

## The Gospel of Thomas
The most famous book from the jar is the **Gospel of Thomas**: not a story, but **114 sayings** attributed to Jesus. Some are close to sayings in the Bible; others are new and mysterious. In one, Jesus says that the kingdom is **inside you and outside you**, and that when you come to know yourselves, you will know that you are children of the living Father (saying 3).

This echoes the Gospel of Luke: "behold, the kingdom of God is within you" (Luke 17:21).

Other texts in the library include the **Gospel of Philip**, the **Gospel of Truth**, and, found elsewhere, the **Gospel of Mary**, in which Mary Magdalene comforts and teaches the disciples.

## How to read them
Most churches do not accept these texts as scripture, and scholars still debate their dates and meaning. On this site they are offered as **a window into the spiritual searching of the early centuries**, not as a replacement for any faith's own scriptures.

*Know yourself, and you will find the light you were looking for, already shining.*${related([["Jesus of Nazareth (Isa)", "/teachings/jesus-of-nazareth"], ["The Mystery Schools", "/teachings/the-mystery-schools"], ["The Nature of the Soul", "/teachings/nature-of-the-soul"]])}${sources(["James M. Robinson (ed.), *The Nag Hammadi Library in English* (HarperCollins, 1977; revised 1988).", "Elaine Pagels, *The Gnostic Gospels* (1979).", "Gospel of Thomas, saying 3 (paraphrased); Luke 17:21, King James Bible.", "Encyclopaedia Britannica, \"Nag Hammadi library\" and \"Gnosticism\"."])}` };

export const essenes = { slug: "the-essenes-and-the-dead-sea-scrolls", tag: "Hidden texts", title: "The Essenes and the Dead Sea Scrolls: The Treasure in the Caves",
  summary: "In 1947 a young shepherd threw a stone into a cave by the Dead Sea and heard pottery break. Inside were the oldest copies of the Bible ever found. Who the Essenes were, what the scrolls contain, and what they really tell us.",
  body: `## The stone in the cave
In **1947**, a young Bedouin shepherd looking for a lost goat near **Qumran**, on the northwest shore of the Dead Sea, threw a stone into a cave and heard something break. Inside he found tall clay jars holding ancient scrolls.

Over the next ten years, searchers explored **eleven caves** and found the remains of more than **900 manuscripts**, written mostly in Hebrew, and also in Aramaic and Greek, between about the 3rd century BCE and the 1st century CE. They are the **Dead Sea Scrolls**.

## What the scrolls contain
- **The oldest known copies of the Hebrew Bible**: every book except Esther is represented. The **Great Isaiah Scroll**, almost complete and over 2,000 years old, is remarkably close to the text read today.
- **The rules of a community**: how its members lived, prayed, shared meals and judged themselves.
- **Hymns and prayers**, commentaries on the prophets, calendars, and visions of the end of days, including a great battle between **"the sons of light" and "the sons of darkness"**.
- The mysterious **Copper Scroll**, listing hidden treasures that have never been found.

Many of the scrolls can be seen today in the **Shrine of the Book** at the Israel Museum in Jerusalem, and online.

## Who were the Essenes?
The ancient writers **Josephus**, **Philo** and **Pliny the Elder** describe the **Essenes**, a Jewish community of the last two centuries BCE and the 1st century CE. They lived simply, **shared all their property**, wore white, bathed in water for purity, ate together in silence, and devoted themselves to prayer and study. Josephus says they prayed toward the rising sun before dawn.

Pliny places an Essene community by the Dead Sea, and most scholars believe the people of **Qumran** who kept the scrolls were Essenes or closely related to them, though this is still debated.

## Legends and honest notes
- Some writers have suggested that **John the Baptist**, or even Jesus, had links with the Essenes. It is possible, but there is no clear evidence.
- A book called *The Essene Gospel of Peace*, published in the 20th century, is sometimes presented as an ancient Essene text. Scholars have found no ancient manuscript of it, and it is **not part of the Dead Sea Scrolls**.

## For the heart
The scrolls were hidden in the dark for two thousand years, and waited. **Truth is patient.** And the Essenes remind us of a simple, shared, prayerful life, where we rise before dawn to greet the light.${related([["The Torah", "/teachings/the-torah"], ["John the Baptist (Yahya)", "/teachings/john-the-baptist"], ["The Gnostics and the Lost Gospels", "/teachings/the-gnostics-and-the-lost-gospels"]])}${sources(["The Leon Levy Dead Sea Scrolls Digital Library, Israel Antiquities Authority.", "Josephus, *The Jewish War* 2.119–161; Philo, *Every Good Man Is Free* 75–91; Pliny the Elder, *Natural History* 5.73.", "Encyclopaedia Britannica, \"Dead Sea Scrolls\" and \"Essene\"."])}` };

export const egyptianMysteries = { slug: "the-egyptian-mysteries", tag: "Egypt", title: "The Egyptian Mysteries: Thoth, Isis and the Weighing of the Heart",
  summary: "The great teachings of ancient Egypt: Thoth, lord of wisdom and writing; the story of Isis and Osiris, love stronger than death; and the weighing of the heart against the feather of truth.",
  body: `Ancient Egypt lasted for three thousand years, and its wisdom shaped the Greeks, the Hermetic teachings and the mystery schools of the West. Three of its great teachings still speak to the heart.

## Thoth, lord of wisdom
**Thoth** (*Djehuty*), often shown with the head of an **ibis**, was the god of wisdom, writing, mathematics, the moon and magic. The Egyptians said he gave humanity writing and the knowledge of the stars. At the judgment of the dead, Thoth stands as the **scribe**, writing down the result.

The Greeks identified Thoth with their god Hermes, and from this meeting came the figure of **Hermes Trismegistus**, "Thrice-Great Hermes", the legendary teacher of the Hermetic wisdom. See [Hermes Trismegistus](/teachings/hermes-trismegistus).

## Isis and Osiris: love stronger than death
The best-loved Egyptian story tells of **Osiris**, a good king, who was killed by his jealous brother **Set**, and his body scattered across Egypt. His wife **Isis**, in deep grief, searched the whole land, gathered every piece, and with her love and her magic brought him back to life long enough to conceive their son, **Horus**. Osiris became the lord of the world beyond, and Horus grew up to restore justice.

The story teaches that **love is stronger than death**, and that what is broken can be gathered and made whole. In later centuries, the **Mysteries of Isis** spread across the Roman world, where initiates told of passing through death and seeing "the sun shining at midnight" (Apuleius, *The Golden Ass*, Book 11).

## The weighing of the heart
The Egyptian *Book of the Dead* describes what happens after death. The soul is led into the **Hall of the Two Truths**. There it speaks before **42 judges**, declaring that it has lived rightly: "I have not lied. I have not stolen. I have not made anyone weep."

Then **Anubis** places the person's **heart** on one side of a great scale, and on the other side, the **feather of Ma'at**, truth and harmony. If the heart is light, free of the weight of wrongdoing, the soul passes on to the beautiful fields of eternal life. Thoth records the result.

*Live so that your heart is as light as a feather.*

## For the heart
The Egyptian mysteries teach three things that every path shares: **seek wisdom**, **love beyond loss**, and **keep the heart light with truth**.${related([["Ma'at: The Wisdom of Egypt", "/teachings/maat-wisdom-of-egypt"], ["42: The Answer, and the Question", "/teachings/forty-two-the-answer-and-the-question", "the 42 declarations."], ["The Pyramids of Giza", "/teachings/the-pyramids-of-giza"], ["The Seven Hermetic Principles", "/teachings/the-seven-hermetic-principles"]])}${sources(["The *Book of the Dead*, Spell 125; the Papyrus of Ani (British Museum, EA 10470).", "Plutarch, *On Isis and Osiris*.", "Apuleius, *The Golden Ass* (Metamorphoses), Book 11.", "Encyclopaedia Britannica, \"Thoth\", \"Isis\" and \"Osiris\"."])}` };

export const alchemy = { slug: "spiritual-alchemy", tag: "Hermetic", title: "Spiritual Alchemy: Turning the Lead of the Soul into Gold",
  summary: "The alchemists sought to turn lead into gold, but the greatest of them knew the real work was inside: the transformation of the soul. The Emerald Tablet, the four stages of the Great Work, and what Carl Jung saw in it.",
  body: `## The art of transformation
For two thousand years, in Egypt, the Islamic world and Europe, **alchemists** worked with fire, metals and glass vessels, seeking to turn ordinary metals into gold and to find the **Philosopher's Stone**. Some were early chemists; the great Islamic scholar **Jabir ibn Hayyan** and, much later, even **Isaac Newton** spent years on alchemy.

But many alchemists wrote that the true work was **inside the alchemist**. The lead to be turned into gold was **the heavy, unawakened soul**, and the fire was the fire of the spirit.

## The Emerald Tablet
The most famous alchemical text is the short **Emerald Tablet**, attributed to Hermes Trismegistus and known in Arabic from around the 8th or 9th century, then in Latin. Its best-known teaching is usually summed up as **"as above, so below"**: the small world of the human being mirrors the great world of the cosmos.

## The four stages of the Great Work
The alchemists described the *Magnum Opus*, the Great Work, in colours:
1. **Nigredo, the blackening.** Everything old breaks down: the dark night, when what we thought we were falls apart.
2. **Albedo, the whitening.** Washing and purifying: the soul becomes clear, quiet and humble.
3. **Citrinitas, the yellowing.** The dawn: the light of wisdom begins to shine within.
4. **Rubedo, the reddening.** The union of spirit and matter, heaven and earth: the gold, the awakened heart, living fully in the world.

The alchemists' motto was *solve et coagula*: **dissolve, and bind together again**. First the old self is dissolved; then a new, whole self is formed.

## What Carl Jung saw
The psychologist **Carl Jung** spent years studying old alchemical books and concluded, in *Psychology and Alchemy* (1944), that their images describe **the journey of the psyche toward wholeness**: what he called individuation. See [Carl Jung](/teachings/carl-jung).

## For the heart
When life breaks something in you, it may be the **nigredo**, the first stage of the Work. Nothing is wasted in the alchemist's vessel. **What feels like an ending may be the beginning of gold.**${related([["Hermes Trismegistus", "/teachings/hermes-trismegistus"], ["The Seven Hermetic Principles", "/teachings/the-seven-hermetic-principles"], ["What Awakening Feels Like", "/teachings/what-awakening-feels-like"]])}${sources(["The Emerald Tablet (*Tabula Smaragdina*), Latin version, 12th century.", "C. G. Jung, *Psychology and Alchemy* (1944).", "Encyclopaedia Britannica, \"Alchemy\" and \"Jabir ibn Hayyan\"."])}` };

export const bardo = { slug: "the-tibetan-book-of-the-dead", tag: "Buddhism", title: "The Tibetan Book of the Dead: Liberation Through Hearing",
  summary: "The Bardo Thödol, read aloud to the dying and the dead in Tibet for forty-nine days: the clear light at the moment of death, the visions of the in-between, and its gentle message that what we meet is our own mind.",
  body: `{{soul-stairs}}

## The book
In Tibet, when someone is dying, a lama or a friend may sit beside them and read aloud from a book called the **Bardo Thödol**, "**Liberation Through Hearing in the In-Between**". In the West it became known as **The Tibetan Book of the Dead**, from the first English translation by W. Y. Evans-Wentz in 1927.

Tradition says it was taught by the great master **Padmasambhava** in the 8th century and hidden, then rediscovered as a "treasure text" by **Karma Lingpa** in the 14th century. It is read to the dying, and to the dead, for **forty-nine days**.

## The bardos
*Bardo* means "in-between". The book describes the journey after death in three stages:
1. **The bardo of dying.** At the moment of death, a brilliant **clear light** dawns: the pure, luminous nature of the mind itself. The reader gently says: recognise it, rest in it; **this light is your own true nature.** One who recognises it is free.
2. **The bardo of luminous visions.** If the light is not recognised, visions arise: peaceful and then wrathful deities, sounds, colours and lights. The book repeats again and again: **do not be afraid; these are the projections of your own mind.**
3. **The bardo of becoming.** Finally, drawn by its habits and karma, the consciousness moves toward a new birth. Even here, the reader guides it toward a good and peaceful rebirth.

## Its gentle message
The book is not meant to frighten. It is full of tenderness: a friend's voice speaking softly to someone on the greatest journey. Its great teaching is that **what we meet, in death and in life, is coloured by our own mind**, and that **the light is not outside us**.

Many Tibetan teachers add that the bardos are not only after death: every moment of change, every night of sleep, every ending is a small bardo, a chance to recognise the light.

*Do not be afraid of what you see. It is your own mind. Recognise the light, and rest.*${related([["Death Is a Doorway", "/teachings/death-is-a-doorway"], ["Death and Continuity", "/teachings/death-and-continuity"], ["Near-Death Experiences", "/teachings/near-death-experiences"], ["Siddhartha Gautama, the Buddha", "/teachings/the-buddha"]])}${sources(["W. Y. Evans-Wentz (ed.), *The Tibetan Book of the Dead* (1927).", "Gyurme Dorje (trans.), *The Tibetan Book of the Dead: First Complete Translation* (Penguin, 2005).", "Robert Thurman (trans.), *The Tibetan Book of the Dead* (Bantam, 1994).", "Encyclopaedia Britannica, \"Bardo Thödol\"."])}` };

// ---------- Phase 4: philosophers and mystics ----------
const who = (rows) => `| | |\n| --- | --- |\n${rows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}`;

export const philosophers = {
  pythagoras: { slug: "pythagoras", tag: "Greece", title: "Pythagoras: Harmony, Number and the Soul",
    summary: "The sage of Samos who called himself a lover of wisdom, founded a community devoted to purity and study, heard music in the stars, and taught that the soul passes through many lives.",
    body: `${who([["Lived", "About 570 to 495 BCE"], ["From", "The island of Samos; later Croton, in southern Italy"], ["Known for", "Harmony, number, the music of the spheres, the immortal soul"]])}

## The first "philosopher"
The Roman writer Cicero tells that when a prince asked Pythagoras what he was, he answered that he was a **philosophos**, a **lover of wisdom**, not a wise man. Life, he said, is like a great festival: some come to compete, some to trade, and the best come simply **to see**.

## The community at Croton
In Croton, Pythagoras founded a community of men and women who lived simply, shared their goods, kept periods of silence, studied mathematics, music and the stars, and examined their conscience each evening. Many of them, tradition says, did not eat meat, out of respect for all living beings.

## All is number
Pythagoras taught that the world is ordered by **number and harmony**. He discovered, the story goes, that musical harmonies follow simple ratios (an octave is 2 to 1), and he heard in the movements of the planets a silent **music of the spheres**. The famous theorem about right triangles bears his name, though it was known in Babylon long before.

## The soul's journey
Pythagoras taught that **the soul is immortal** and passes through many lives, and that a pure, harmonious life helps it return to the divine. His ideas deeply shaped Plato, and through him the whole mystical tradition of the West.

He wrote nothing himself, and much of his life was told by later admirers, so legend and history mix around him.

*Keep your soul in tune, as a musician keeps his strings.*${related([["Pythagoras and the Music of Numbers", "/teachings/pythagoras-music-of-numbers"], ["Plato", "/teachings/plato"], ["Numerology", "/teachings/numerology-the-meaning-of-numbers"]])}${sources(["Cicero, *Tusculan Disputations* 5.3.8–9.", "Iamblichus, *On the Pythagorean Life*.", "Stanford Encyclopedia of Philosophy, \"Pythagoras\"."])}` },

  heraclitus: { slug: "heraclitus", tag: "Greece", title: "Heraclitus: Everything Flows",
    summary: "The riddling sage of Ephesus who taught that all things change like a river, that opposites are secretly one, and that a hidden Logos, a living order, runs through everything.",
    body: `${who([["Lived", "About 535 to 475 BCE"], ["From", "Ephesus, on the coast of today's Turkey"], ["Called", "\"The Obscure\" and \"The Weeping Philosopher\""]])}

## The river
Heraclitus is remembered for one image above all: **you cannot step into the same river twice**, for new waters are always flowing (as Plato reports him, *Cratylus* 402a). Later writers summed up his teaching in two words: *panta rhei*, **everything flows**.

Nothing in the world stands still. Seasons turn, bodies change, thoughts come and go. To cling to anything as if it would stay forever is to suffer.

## The hidden harmony
Heraclitus taught that **opposites belong together**: day and night, war and peace, hunger and fullness. "The way up and the way down are one and the same." Like the tension in a bow or a lyre, the pull between opposites creates harmony.

## The Logos
Beneath all change, he said, runs the **Logos**: the word, the reason, the living order of the universe, common to all, though most people live as if they had a private world of their own. This word, *Logos*, later opened the Gospel of John: "In the beginning was the Word."

## Character is destiny
One of his shortest sayings is also one of the deepest: **"Character is destiny."** Who we are inside shapes the path our life will take.

*Let the river move. Become the riverbed: steady, and at peace with the flow.*${related([["Socrates", "/teachings/socrates"], ["The Stoics", "/teachings/the-stoics", "who took up his Logos."], ["Death and Continuity", "/teachings/death-and-continuity"]])}${sources(["Heraclitus, fragments DK 22 B12, B60, B119; Plato, *Cratylus* 402a.", "John 1:1, King James Bible.", "Stanford Encyclopedia of Philosophy, \"Heraclitus\"."])}` },

  hypatia: { slug: "hypatia-of-alexandria", tag: "Alexandria", title: "Hypatia of Alexandria: Philosopher of the Stars",
    summary: "The great woman philosopher, mathematician and astronomer of Alexandria, who taught students of every faith the path from mathematics to the contemplation of the One.",
    body: `${who([["Lived", "About 355 to 415 CE"], ["Where", "Alexandria, Egypt"], ["Known for", "Mathematics, astronomy, and Neoplatonic philosophy"]])}

## A teacher of light
Hypatia was the daughter of the mathematician **Theon of Alexandria**, and became even greater than her father. She worked on the mathematics of Ptolemy, Diophantus and Apollonius, and taught astronomy and the making of astrolabes.

But above all she was a **philosopher** in the line of Plato and Plotinus. She taught that mathematics trains the mind to rise from changing things to the eternal, and from there to the contemplation of **the One**, the Source of all.

## Students of every faith
Her students came from far away, pagans and Christians alike. One of them, **Synesius of Cyrene**, later became a Christian bishop and wrote to her with deep love and respect, calling her "mother, sister, teacher and benefactress".

## Her death
In **415 CE**, during a bitter political struggle in Alexandria between the Roman governor and the city's bishop, Hypatia was murdered by a mob. Historians of the time, Christian and pagan alike, mourned her. Her death is remembered as a warning of what fanaticism can destroy, in any age and any faith.

## For the heart
Hypatia shows that **the love of wisdom has no gender and no borders**, and that study, done with a pure heart, can become a prayer.

*Truth belongs to no one, and is open to everyone.*${related([["Plotinus", "/teachings/plotinus"], ["Pythagoras", "/teachings/pythagoras"], ["The Divine Feminine", "/teachings/the-divine-feminine"]])}${sources(["Socrates Scholasticus, *Ecclesiastical History* 7.15.", "The letters of Synesius of Cyrene.", "Encyclopaedia Britannica, \"Hypatia\"."])}` },

  avicenna: { slug: "avicenna-ibn-sina", tag: "Islamic philosophy", title: "Avicenna (Ibn Sina): The Physician of the Soul",
    summary: "The Persian genius whose Canon of Medicine was studied for six hundred years, and whose philosophy of the soul and the Necessary Being shaped thinkers of Islam, Judaism and Christianity.",
    body: `${who([["Lived", "980 to 1037 CE"], ["From", "Near Bukhara, Central Asia; died in Hamadan, Persia"], ["Known for", "*The Canon of Medicine*, *The Book of Healing*, the \"floating man\""]])}

## A prodigy
Ibn Sina, known in Europe as **Avicenna**, knew the Qur'an by heart as a child, studied medicine as a teenager, and was treating a prince by eighteen. His ***Canon of Medicine*** was used in universities from Persia to Europe for some six hundred years.

## The floating man
To show that the soul is real and distinct from the body, Avicenna imagined a man created suddenly in empty air, floating, with his eyes covered and his limbs not touching anything. He could feel nothing of his body, yet **he would still know that he exists**. The self, said Avicenna, is aware of itself before it knows anything else.

## The Necessary Being
Everything in the world, he taught, could have not existed. So all of it depends on something that **must** exist: the **Necessary Being**, God, the pure Source from which all existence flows like light from the sun.

## The journey of the soul
In his later writings and allegories, Avicenna spoke of the soul as a bird caught in a net, longing to return home, and of a path of wisdom that leads it back to the light.

*Know yourself first, and you will find that you are more than the body you live in.*${related([["Al-Ghazali", "/teachings/al-ghazali"], ["Averroes (Ibn Rushd)", "/teachings/averroes-ibn-rushd"], ["The Nature of the Soul", "/teachings/nature-of-the-soul"]])}${sources(["Avicenna, *The Book of Healing* (*al-Shifa*), On the Soul, 1.1 (the floating man).", "Stanford Encyclopedia of Philosophy, \"Ibn Sina [Avicenna]\".", "Encyclopaedia Britannica, \"Avicenna\"."])}` },

  ghazali: { slug: "al-ghazali", tag: "Islamic philosophy", title: "Al-Ghazali: The Scholar Who Became a Seeker",
    summary: "The most famous scholar of his age, who left his great position in Baghdad in a crisis of the heart, wandered as a Sufi, and wrote The Revival of the Religious Sciences, uniting law, faith and inner experience.",
    body: `${who([["Lived", "1058 to 1111 CE"], ["From", "Tus, in Persia"], ["Known for", "*The Revival of the Religious Sciences*, *Deliverance from Error*, *The Niche of Lights*"]])}

## The crisis
Abu Hamid al-Ghazali was the most respected scholar of his time, teaching hundreds of students at the great Nizamiyya college of **Baghdad**. Yet in **1095**, at the height of his fame, he fell into a crisis: he realised that his learning had not purified his heart. He could not speak; he could not eat.

He gave away his position and wealth and left Baghdad as a wanderer, travelling to Damascus, Jerusalem, Hebron and Mecca, living as a **Sufi** in prayer and solitude for years.

## What he found
In his autobiography, ***Deliverance from Error***, he wrote that he had studied every path to truth, and found that **the Sufis** were the ones who truly walked it: knowledge is not enough; **one must taste**. Reading about health is not the same as being healthy.

## The Revival
His great work, ***The Revival of the Religious Sciences***, brought together Islamic law, theology and the inner life of the heart, teaching sincerity, patience, gratitude, love of God and the purifying of the self. It is still loved across the Muslim world.

In ***The Niche of Lights***, he meditated on the Qur'an's Verse of Light (24:35), teaching that God is the true Light, and all other lights borrow from His.

*It is not enough to read about the path. One must walk it, and taste.*${related([["The Sufi Path", "/teachings/the-sufi-path"], ["Avicenna (Ibn Sina)", "/teachings/avicenna-ibn-sina"], ["Averroes (Ibn Rushd)", "/teachings/averroes-ibn-rushd", "who answered him."]])}${sources(["Al-Ghazali, *Deliverance from Error* (*al-Munqidh min al-Dalal*).", "Stanford Encyclopedia of Philosophy, \"al-Ghazali\".", "Encyclopaedia Britannica, \"al-Ghazali\"."])}` },

  averroes: { slug: "averroes-ibn-rushd", tag: "Islamic philosophy", title: "Averroes (Ibn Rushd): Truth Does Not Contradict Truth",
    summary: "The judge, physician and philosopher of Córdoba who taught that faith and reason are friends, whose commentaries on Aristotle made him known in Europe simply as \"the Commentator\".",
    body: `${who([["Lived", "1126 to 1198 CE"], ["From", "Córdoba, in Muslim Spain (al-Andalus); died in Marrakesh"], ["Known for", "Commentaries on Aristotle; *The Decisive Treatise*; *The Incoherence of the Incoherence*"]])}

## A life of service
Ibn Rushd, known in Europe as **Averroes**, came from a family of judges. He served as chief judge of Córdoba and Seville, and as physician to the caliph, while writing on law, medicine, astronomy and philosophy.

## Faith and reason
In ***The Decisive Treatise*** he argued that the Qur'an itself invites people to reflect on creation, so philosophy is not against faith. **"Truth does not contradict truth"**: if a careful reading of scripture and sound reasoning seem to disagree, we have misunderstood one of them.

## Answering al-Ghazali
Al-Ghazali had written *The Incoherence of the Philosophers*, criticising philosophy. Ibn Rushd answered with ***The Incoherence of the Incoherence***, defending reason with respect. Two great minds, one faith, two paths: their friendly argument enriched the whole tradition.

## His gift to the world
His commentaries on **Aristotle** were translated into Hebrew and Latin and studied in Jewish and Christian Europe for centuries. Dante placed him among the noble souls, and Raphael painted him in *The School of Athens*.

*Faith and reason are two lamps lighting the same road.*${related([["Aristotle", "/teachings/aristotle"], ["Al-Ghazali", "/teachings/al-ghazali"], ["Maimonides", "/teachings/maimonides", "his fellow son of Córdoba."]])}${sources(["Ibn Rushd, *The Decisive Treatise* (*Fasl al-Maqal*); *The Incoherence of the Incoherence* (*Tahafut al-Tahafut*).", "Stanford Encyclopedia of Philosophy, \"Ibn Rushd [Averroes]\".", "Encyclopaedia Britannica, \"Averroës\"."])}` },

  maimonides: { slug: "maimonides", tag: "Jewish philosophy", title: "Maimonides (the Rambam): A Guide for the Perplexed",
    summary: "The great Jewish sage, physician and philosopher born in Córdoba, who wrote the Mishneh Torah and the Guide for the Perplexed, taught that God is beyond all description, and gave the world the eight levels of giving.",
    body: `${who([["Lived", "1138 to 1204 CE"], ["From", "Córdoba, Spain; later Fez and Fustat (Old Cairo), Egypt"], ["Known for", "*Mishneh Torah*, *The Guide for the Perplexed*, the eight levels of charity"]])}

## A life of exile and service
**Moses ben Maimon**, called the **Rambam**, was born in Córdoba. When persecution came, his family fled, finally settling in **Egypt**, where he became the leader of the Jewish community and a physician at the court of Saladin's vizier. He worked long days caring for the sick, and wrote at night.

## The great works
His ***Mishneh Torah*** gathered all of Jewish law into one clear work. His ***Guide for the Perplexed*** (1190) was written for those torn between faith and philosophy, showing how they can live together.

## God beyond words
Maimonides taught that God is so far beyond us that **we can only say what God is not**: not limited, not changing, not a body. Every word we use falls short. The highest praise of God, he said, is often **silence**.

## The eight levels of giving
He taught that there are eight levels of charity. The lowest is to give unwillingly. Higher is to give generously, then to give before being asked, then to give without knowing who receives. The **highest** is to help a person **stand on their own feet**, with a gift, a loan, a partnership or a job, so that they will never need to ask again.

*The greatest gift is the one that sets another person free.*${related([["Averroes (Ibn Rushd)", "/teachings/averroes-ibn-rushd"], ["Charity: Sharing the Blessings We Were Lent", "/teachings/charity-sharing-our-blessings"], ["The Names of God in Judaism", "/teachings/the-names-of-god-in-judaism"]])}${sources(["Maimonides, *Mishneh Torah*, Laws of Gifts to the Poor 10:7–14; *The Guide for the Perplexed* 1.58–59.", "Stanford Encyclopedia of Philosophy, \"Maimonides\".", "Encyclopaedia Britannica, \"Moses Maimonides\"."])}` },

  emerson: { slug: "ralph-waldo-emerson", tag: "America", title: "Ralph Waldo Emerson and the Over-Soul",
    summary: "The American sage of Concord who taught that one universal Soul lives in every person and in nature, that we must trust the voice within, and who brought the Bhagavad Gita and the Persian poets to the hearts of the West.",
    body: `${who([["Lived", "1803 to 1882"], ["From", "Boston and Concord, Massachusetts"], ["Known for", "*Nature* (1836), \"Self-Reliance\" and \"The Over-Soul\" (1841), Transcendentalism"]])}

## Leaving the pulpit
Emerson began as a minister, but felt that religion had grown cold and secondhand. He left the pulpit to seek **direct experience of the Divine**, in nature and in the soul.

## The Over-Soul
In his essay "The Over-Soul" (1841), he wrote that every person is connected to one great universal Soul:

> "Within man is the soul of the whole; the wise silence; the universal beauty, to which every part and particle is equally related; the eternal ONE."

In nature, he felt this unity most of all: alone in the woods, he wrote, he became "a transparent eye-ball", and the currents of the Universal Being flowed through him (*Nature*, 1836).

## Trust thyself
In "Self-Reliance" he urged each person to trust the inner voice: **"Trust thyself: every heart vibrates to that iron string."** Not the selfish ego, but the deep inner light that is our share of the Over-Soul.

## East and West
Emerson and his friend **Henry David Thoreau** read the **Bhagavad Gita** and the Upanishads, and Emerson loved the Persian poets **Hafiz** and **Saadi**. Through them, the wisdom of the East first touched the heart of America. Their movement, **Transcendentalism**, inspired generations of seekers.

*There is one light, and it is shining in you.*${related([["The Bhagavad Gita", "/teachings/the-bhagavad-gita"], ["Hafiz of Shiraz", "/teachings/hafiz"], ["Intuition: The Still, Small Voice", "/teachings/intuition-the-still-small-voice"]])}${sources(["Ralph Waldo Emerson, *Nature* (1836); \"Self-Reliance\" and \"The Over-Soul\", *Essays: First Series* (1841), public domain.", "Stanford Encyclopedia of Philosophy, \"Ralph Waldo Emerson\"."])}` },
};

export const mystics = {
  baalShemTov: { slug: "the-baal-shem-tov", tag: "Hasidism", title: "The Baal Shem Tov: The Joy of Hasidism",
    summary: "The 18th-century healer and mystic of Ukraine who founded Hasidism, teaching that God is present in everything, that joy is a form of prayer, and that a simple heart reaches heaven faster than great learning.",
    body: `${who([["Lived", "About 1698 to 1760"], ["Where", "Podolia, in today's Ukraine; he lived his last years in Medzhybizh"], ["Name", "Israel ben Eliezer, called the Baal Shem Tov, \"Master of the Good Name\", or the Besht"]])}

## A teacher of simple people
In a time when Jewish learning belonged mostly to scholars, and the poor felt far from God, **Israel ben Eliezer** brought a new warmth. He worked as a helper in a school, a ritual slaughterer and a healer, and spent long hours alone in the forests and hills in prayer.

He became known as the **Baal Shem Tov**, and his followers, the **Hasidim**, "the devoted ones", grew into one of the great movements of Jewish life.

## What he taught
- **God is everywhere.** There is no place empty of the Divine: in every person, every leaf, every moment, sparks of holiness are waiting.
- **Joy is a form of prayer.** Sadness and despair close the heart; joy opens it. Prayer should be full of life, even of song and dance.
- ***Devekut***, **clinging to God**: keeping the heart connected to the Divine all day long, in work, in eating, in conversation.
- **The heart matters more than learning.** A sincere simple person may be closer to God than a proud scholar.

## The shepherd boy's whistle
A beloved Hasidic tale says that on Yom Kippur, the holiest day, the prayers of the whole congregation could not rise to heaven. Then a poor shepherd boy, who could not read the prayers, took out his little whistle and blew it with all his heart. **That sound opened the gates of heaven**, and all the prayers rose with it.

*God wants the heart.*${related([["The Breaking of the Vessels", "/teachings/the-breaking-of-the-vessels", "the sparks he taught us to lift."], ["Rabbi Zusya's Question", "/teachings/story-rabbi-zusyas-question", "a story of his disciples."], ["The Names of God in Judaism", "/teachings/the-names-of-god-in-judaism"]])}${sources(["Martin Buber, *Tales of the Hasidim* (1947).", "Moshe Rosman, *Founder of Hasidism: A Quest for the Historical Ba'al Shem Tov* (1996).", "Encyclopaedia Britannica, \"Baal Shem Tov\"."])}` },

  ramakrishna: { slug: "sri-ramakrishna", tag: "India", title: "Sri Ramakrishna: As Many Faiths, So Many Paths",
    summary: "The temple priest of Dakshineswar near Kolkata whose love for God as the Divine Mother overflowed into every path: he walked the ways of Hindu, Muslim and Christian devotion, and taught that all sincere paths lead to the same God.",
    body: `${who([["Lived", "1836 to 1886"], ["Where", "The Kali temple at Dakshineswar, near Kolkata, India"], ["Known for", "Ecstatic love of God; the harmony of all religions"]])}

## The child of the Mother
**Gadadhar Chattopadhyay**, later called **Sri Ramakrishna**, was a village boy who became a priest at the temple of the goddess **Kali** at Dakshineswar. His longing for the Divine Mother was so intense that he wept for her at night, grieving each day that passed without seeing her. When the vision came, it filled his whole life with joy.

## Walking every path
Ramakrishna then practised many spiritual paths, each with full devotion: the Hindu paths of devotion and of non-duality, and for a time the **Muslim** way of prayer and the remembrance of God, and devotion to **Jesus**. He said that each path brought him to the same God.

So he taught: ***"As many faiths, so many paths."*** Like people drawing water from one lake at different shores, calling it *jal*, *pani* or *water*, all are seeking the same water.

## His teaching
- **God can be known**, directly, and is the true goal of life.
- **Love and longing** are the fastest way: cry for God as a child cries for its mother.
- **Serve people as God**, for God dwells in everyone.

His wife, **Sarada Devi**, is revered as the Holy Mother, and his great disciple **Swami Vivekananda** carried his message to the world.

*As many faiths, so many paths. The lake is one.*${related([["Swami Vivekananda", "/teachings/swami-vivekananda"], ["One Source, One Message", "/teachings/one-source-one-message"], ["The Divine Feminine", "/teachings/the-divine-feminine"]])}${sources(["Mahendranath Gupta (\"M\"), *The Gospel of Sri Ramakrishna*, trans. Swami Nikhilananda (1942).", "Encyclopaedia Britannica, \"Ramakrishna\"."])}` },

  vivekananda: { slug: "swami-vivekananda", tag: "India", title: "Swami Vivekananda: Sisters and Brothers of the World",
    summary: "Ramakrishna's great disciple, whose opening words at the 1893 Parliament of Religions in Chicago brought a standing ovation, and who taught that serving people is serving God.",
    body: `${who([["Lived", "1863 to 1902"], ["From", "Kolkata, India"], ["Known for", "The 1893 Parliament of the World's Religions; the Ramakrishna Mission; service as worship"]])}

## From doubter to disciple
**Narendranath Datta** was a brilliant, questioning student who asked teacher after teacher: "Have you seen God?" Only Ramakrishna answered simply that **yes, he had seen God, as clearly as he saw Narendra standing before him, only more intensely.** Narendra became his disciple, and after his master's death took the name **Swami Vivekananda**.

## Chicago, 1893
On **11 September 1893**, at the World's Parliament of Religions in Chicago, the young monk rose and began: **"Sisters and Brothers of America."** The hall rose to its feet in applause. He spoke of a faith that accepts all religions as true paths, and against sectarianism, bigotry and fanaticism, hoping that the bell of that morning would toll their end.

## Service is worship
Returning to India, he founded the **Ramakrishna Mission** (1897) for education, medicine and relief of the poor. He taught that **serving people is serving God**: "the poor, the weak, the suffering" are God in human form.

## His call
His most famous call, drawn from the Katha Upanishad, still rings: **"Arise, awake, and stop not till the goal is reached."**

He died at only 39, having given his whole life away.

*See God in every face, and serve.*${related([["Sri Ramakrishna", "/teachings/sri-ramakrishna"], ["Service: Love in Action", "/teachings/service-love-in-action"], ["Nachiketa and Death", "/teachings/story-nachiketa-and-death", "the Upanishad behind his call."]])}${sources(["Swami Vivekananda, address at the World's Parliament of Religions, Chicago, 11 September 1893, in *The Complete Works of Swami Vivekananda*.", "Encyclopaedia Britannica, \"Vivekananda\"."])}` },

  anandamayi: { slug: "anandamayi-ma", tag: "India", title: "Anandamayi Ma: The Bliss-Filled Mother",
    summary: "One of the most beloved saints of 20th-century India, a village woman of Bengal who lived in constant joy, received seekers of every faith, and taught that every path leads to the One.",
    body: `${who([["Lived", "1896 to 1982"], ["From", "Kheora, Bengal (now in Bangladesh)"], ["Name", "Born Nirmala Sundari; called Anandamayi Ma, \"the Mother permeated with bliss\""]])}

## A life of bliss
Born to a poor and devout family, **Nirmala Sundari** had little schooling and no formal guru. As a young married woman she entered deep states of meditation and divine joy, and those around her began to sense something extraordinary. Her own husband became her first disciple.

For the rest of her long life she travelled across India, and **ashrams** grew up wherever she went. Seekers, saints, scholars and leaders came to her, and she received each one with the same tenderness.

## What she taught
- **Every path leads to the One.** She honoured all religions, and guided each person according to their own nature and faith.
- **God is the one goal of life.** She taught that seeking the Divine is every person's true calling, and everything else is secondary.
- **Keep God in mind through the day**, through the repetition of a holy name, prayer and service.
- She often spoke of herself simply as "this body", never as a teacher, showing a perfect humility.

## For the heart
Anandamayi Ma shows that **holiness does not need learning, titles or a famous teacher**. A heart turned completely toward God can become a home of joy for everyone who comes near.

*Joy is not something we earn. It is what we are, when nothing stands in its way.*${related([["The Divine Feminine", "/teachings/the-divine-feminine"], ["Sri Ramakrishna", "/teachings/sri-ramakrishna"], ["Lalla and Mirabai", "/teachings/lalla-and-mirabai", "two earlier women saints of India."]])}${sources(["Alexander Lipski, *Life and Teaching of Sri Anandamayi Ma* (1977).", "Encyclopaedia Britannica, \"Anandamayi Ma\"."])}` },

  aurobindo: { slug: "sri-aurobindo", tag: "India", title: "Sri Aurobindo: The Life Divine",
    summary: "The Cambridge-educated revolutionary who became a great yogi in Pondicherry, taught Integral Yoga, and saw human evolution moving toward a divine life here on earth.",
    body: `${who([["Lived", "1872 to 1950"], ["From", "Kolkata, India; educated in England; lived in Pondicherry from 1910"], ["Known for", "Integral Yoga; *The Life Divine*; *Savitri*"]])}

## From revolutionary to yogi
**Aurobindo Ghose** was educated in England, at Cambridge, and returned to India to work for its freedom. In **1908** he was arrested and held in Alipore jail for a year. There, he later wrote, he had powerful spiritual experiences: he saw the Divine in the prisoners, the trees and the walls around him.

Released, he withdrew in **1910** to **Pondicherry**, in the south, to devote his life to yoga.

## Integral Yoga
Aurobindo taught that the goal is not only to escape the world into the Spirit, but to **bring the Spirit down into the world**: into the mind, the heart, the body and life itself. He called this **Integral Yoga**. Humanity, he said, is not the end of evolution: consciousness is still rising, toward a **divine life on earth**.

## The Mother and Auroville
His spiritual companion, **Mirra Alfassa**, known as **the Mother**, built the ashram and later founded **Auroville** (1968), a township meant for people of every nation to live in human unity.

## His words
His great works are ***The Life Divine*** and the long mystical poem ***Savitri***, the story of a woman whose love conquers death.

*All life is yoga.*${related([["Yoga and Meditation", "/teachings/meditation-and-yoga"], ["The Golden Age to Come", "/teachings/the-golden-age-to-come"], ["Kriya Yoga", "/teachings/kriya-yoga"]])}${sources(["Sri Aurobindo, *The Life Divine* (1939–40); *The Synthesis of Yoga*; *Savitri* (1950–51).", "Encyclopaedia Britannica, \"Sri Aurobindo\"."])}` },

  desert: { slug: "the-desert-fathers-and-mothers", tag: "Early Christianity", title: "The Desert Fathers and Mothers: Wisdom from the Silence",
    summary: "The first Christian monks and nuns, who went into the deserts of Egypt and Syria in the 3rd and 4th centuries to seek God in silence and humility, and whose short sayings are still treasured today.",
    body: `${who([["Lived", "Mainly the 3rd to 5th centuries CE"], ["Where", "The deserts of Egypt, Syria and Palestine"], ["Known for", "The *Sayings of the Desert Fathers*; the beginning of Christian monasticism"]])}

## Into the desert
When Christianity became the religion of the Roman Empire, some men and women felt that faith was becoming too comfortable. They went out into the **deserts of Egypt and Syria** to live simply, pray, work with their hands and fight the battles of the heart. They were called **Abba** (father) and **Amma** (mother).

The most famous was **Saint Antony the Great** (about 251 to 356), whose life was written by Athanasius of Alexandria. Among the desert mothers, **Amma Syncletica** was loved for her wisdom.

## Their sayings
Their teachings were remembered as short stories and sayings, collected in the ***Sayings of the Desert Fathers***:
- A brother asked **Abba Moses** for a word of advice. He said: **"Go, sit in your cell, and your cell will teach you everything."**
- Asked to judge a brother who had sinned, Abba Moses came carrying a **leaking basket of sand**. "My own sins run out behind me, and I do not see them," he said, "and today I come to judge the sins of another?" The brothers forgave the man.
- Amma Syncletica taught that it is possible to be alone in a crowd of thoughts, and among many people in the solitude of the heart.

## What they teach us
Silence, humility, not judging others, patient work, and **guarding the heart**. Their way of prayer shaped all of Christian monasticism, East and West, and the prayer of the heart of the Orthodox tradition.

*Sit quietly, and let the silence teach you.*${related([["The Power of Silence", "/teachings/the-power-of-silence"], ["On Judgment: Every Face Is the Face of the One", "/teachings/on-judgment"], ["Francis of Assisi", "/teachings/francis-of-assisi"]])}${sources(["*The Sayings of the Desert Fathers* (*Apophthegmata Patrum*), trans. Benedicta Ward (1975).", "Athanasius of Alexandria, *The Life of Antony*.", "Encyclopaedia Britannica, \"Desert Fathers\"."])}` },
};
