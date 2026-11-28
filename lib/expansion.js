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
