// Soul contracts and soul families (Teachings), and The Grandfather's Letter (Start Here).
// Each tradition in its own words; modern teachers named as such; Samadhi's view labelled.
// Quotations: King James Bible; Pickthall's Qur'an (1930); Jowett's Plato. Checked Nov 2026.

const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;

export const soulPages = [
  { slug: "soul-contracts-and-soul-families", tag: "The Soul", title: "Soul Contracts and Soul Families: Do We Travel Together?",
    summary: "Do souls agree before birth to meet, help and challenge one another, and travel together through many lifetimes? What the ancient traditions teach, what modern teachers report, why nothing may be a coincidence, and how to hold these ideas wisely.",
    body: `Have you ever met someone and felt you had always known them? Or faced a person who tested you so deeply that it felt arranged? Many seekers believe that **souls make agreements before birth**: to meet, to love, to teach and even to challenge one another, and that they **travel together in families of souls** through many lifetimes to learn and grow.

## What the ancient traditions teach
- **The first covenant (Islam).** The Qur'an tells that before we came into the world, God brought forth the souls of all the children of Adam and asked them: *"Am I not your Lord?"* They answered: *"Yea, verily. We testify"* (Qur'an 7:172, Pickthall). Muslims call it the covenant of *Alast*: the first and deepest agreement of every soul, made with God Himself.
- **Souls that recognise each other (Islam).** The Prophet Muhammad said: "Souls are like conscripted soldiers; those whom they recognise, they come together, and those whom they do not recognise, they stay away" (Sahih al-Bukhari 3336; Sahih Muslim 2638). The commentators explained that souls which knew one another before this world feel at home with each other here.
- **Known before birth (the Bible).** "Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee" (Jeremiah 1:5).
- **Souls that return together (Kabbalah).** Jewish mysticism teaches *gilgul*, the turning of souls through lives. In the 16th century, Rabbi Isaac Luria taught, as recorded by his disciple Hayyim Vital in *The Gate of Reincarnations*, that souls spring from shared spiritual **roots**, and that souls of the same root return and help one another toward their repair (*tikkun*).
- **Choosing a life (Plato).** In the Myth of Er, souls between lives come before the Fates and **choose their next life** from many patterns spread before them. "The responsibility is with the chooser", says the herald; "God is justified" (Plato, *Republic* 10.617e, Jowett).
- **Karmic bonds (India).** Hindu teaching speaks of *prarabdha karma*, the part of our past actions that shapes this life, and of *rinanubandhana*, the bonds of karmic debt that bring souls together as parents, children, friends and rivals until the account is settled with love.
- **Companions across lives (Buddhism).** The Jataka tales tell of the Buddha's past lives, in which the same companions appear again and again: his faithful disciple Ananda, and his rival Devadatta, who tested him life after life.

## What modern teachers report
In recent decades several authors have written about soul contracts and soul groups. **Dr. Michael Newton**, a hypnotherapist, described in *Journey of Souls* (1994) the "soul groups" that his clients reported under hypnosis. **Robert Schwartz**, in *Your Soul's Plan* (2007), gathered accounts, through mediums and hypnosis, of souls planning their life challenges before birth. **Caroline Myss** wrote of *Sacred Contracts* (2001), and **Dr. Brian Weiss** of past lives and soulmates in *Many Lives, Many Masters* (1988). Their books have comforted many readers. They rest on personal experiences under hypnosis and through mediums, which inspire but cannot be checked like history.

## Is anything a coincidence?
- "Are not two sparrows sold for a farthing? and one of them shall not fall on the ground without your Father. But the very hairs of your head are all numbered" (Matthew 10:29–30).
- "Not a leaf falleth but He knoweth it" (Qur'an 6:59, Pickthall).
- "The lot is cast into the lap; but the whole disposing thereof is of the LORD" (Proverbs 16:33). "To every thing there is a season, and a time to every purpose under the heaven" (Ecclesiastes 3:1).
- The psychologist **Carl Jung** gave the name ***synchronicity*** to "meaningful coincidences": inner and outer events that meet with a meaning no chain of cause explains. And **Einstein** wrote to Max Born in 1926 that he was convinced God "does not throw dice".

## Holding these ideas wisely
- **Free will still matters.** Even if a soul plans the stage, we still choose how we act on it. "Allah changeth not the condition of a folk until they (first) change that which is in their hearts" (Qur'an 13:11); "choose life" (Deuteronomy 30:19).
- **Never use it to blame or to excuse.** No one should be told that they "chose" abuse, illness or injustice, and no one may excuse harming another as "part of the contract". The purpose of these ideas is meaning and compassion, never blame.
- **Hold it with humility.** These are teachings and experiences, not proofs. Take what helps you love and grow, and leave the rest. See [The Grandfather's Letter: How to Trust What We Read](/teachings/the-grandfathers-letter).

## Samadhi's view
*This is Samadhi's own understanding.*

Souls travel together in families of light, agreeing before birth to meet again: as parents and children, friends, partners, and even as the ones who challenge us most. Each one is a teacher for the other. Nothing in the universe and in life is a coincidence; every meeting carries a lesson, and every lesson is a step home to the Source. When you meet someone who hurts you or helps you, ask: *what did we come to learn together?*${bridge([
      ["Reincarnation and Karma", "/teachings/reincarnation-and-karma", "the soul's many lives."],
      ["Why We Came: Source Knowing Itself", "/teachings/why-we-came", "why the soul came into this world."],
      ["The Mirror: Seeing God in Every Face", "/teachings/the-mirror-seeing-god-in-every-face", "what we hate, we come to experience."],
    ])}

## Sources

- Qur'an 6:59, 7:172 and 13:11, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=7&verse=172); Sahih al-Bukhari 3336; [Sahih Muslim 2638](https://sunnah.com/muslim:2638).
- Deuteronomy 30:19; Proverbs 16:33; Ecclesiastes 3:1; Jeremiah 1:5; Matthew 10:29–30, King James Bible.
- Hayyim Vital, *Sha'ar HaGilgulim* (The Gate of Reincarnations), from the teachings of Isaac Luria; Plato, *Republic* 10.614b–621d (the Myth of Er), Jowett translation.
- The *Jataka* tales; C. G. Jung, *Synchronicity: An Acausal Connecting Principle* (1952); Albert Einstein, letter to Max Born, 4 December 1926.
- Michael Newton, *Journey of Souls* (1994); Robert Schwartz, *Your Soul's Plan* (2007); Caroline Myss, *Sacred Contracts* (2001); Brian Weiss, *Many Lives, Many Masters* (1988).` },
];

export const trustPage = {
  slug: "the-grandfathers-letter", tag: "Start here", title: "The Grandfather's Letter: How to Trust What We Read",
  summary: "Imagine a letter kept for you for generations, said to be from your grandfather, but you cannot be sure he wrote it. How do we trust sacred books and beliefs we cannot fully verify? Six gentle tests from the traditions themselves.",
  body: `Imagine that your family has kept a letter for you, passed from hand to hand for generations. They tell you it was written by your great-grandfather. It is full of advice about how to live. But you never met him, the paper has been copied more than once, and you cannot be completely sure that he wrote it. **How much should you trust it?**

This is exactly our situation with many sacred books, ancient teachings and beliefs. We received them from others. Most of us cannot check every word. Some books carry the name of a great prophet or sage, though historians believe they were written much later. So how do we read wisely, without throwing away the treasure, and without believing everything we are told?

The traditions themselves give the answer. Here are six gentle tests.

## 1. Who carried the letter?
Ask how it reached you, and through whose hands. Islam built a whole science on this question: the scholars of hadith examined the **chain of narrators** (*isnad*) of every saying of the Prophet, and graded each one as sound, good or weak. The Qur'an itself teaches: "If an evil-liver bring you tidings, verify it" (Qur'an 49:6, Pickthall). Ancient manuscripts, like the Dead Sea Scrolls, help us see how faithfully a text was carried.

## 2. Does it sound like him?
If you knew your grandfather as a gentle, honest man, a letter full of cruelty would make you doubt it was his. In the same way, ask whether a teaching sounds like **God as the prophets knew Him**: loving, just, merciful and true. A teaching that calls for hatred, pride or cruelty in God's name does not sound like its Author.

## 3. What are its fruits?
"Ye shall know them by their fruits" (Matthew 7:16). Does the teaching make you more loving, more honest, more humble and more free? Or more fearful, proud and divided? The fruits tell you much about the root.

## 4. Test it with your heart and your mind together
"Prove all things; hold fast that which is good" (1 Thessalonians 5:21). "Believe not every spirit, but try the spirits whether they are of God" (1 John 4:1). "Follow not that whereof thou hast no knowledge" (Qur'an 17:36). The Buddha told the Kalamas not to accept a teaching only because of tradition or a teacher's authority, but to see for themselves what leads to good and what leads to harm (Kalama Sutta).

## 5. Do other witnesses agree?
"At the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). When the same truth appears in many traditions that never met, such as the Golden Rule, love of God, compassion for the poor, it is like several letters from different relatives saying the same thing. That agreement is a strong sign.

## 6. Hold lightly what you cannot know
Some things we will never be able to prove in this life: who exactly wrote an ancient book, or what happens between lives. It is honest to say "I do not know", and wise to keep an open, humble heart. A message can be true even when we are not sure of the messenger, and a famous name does not make a message true. That is why this site places **tradition and history side by side**, and always marks **Samadhi's view** as his own.

## The letter written in the heart
The prophets promised a letter no one can forge: "I will put my law in their inward parts, and write it in their hearts" (Jeremiah 31:33). The Qur'an speaks of the covenant every soul made with God before birth (7:172). When a teaching, from any book, awakens that inner letter, and you recognise it as true, deep within, you are reading in the original handwriting.

## Samadhi's view
*This is Samadhi's own understanding.*

Be careful of what you believe and what you read. Not everything that carries a holy name was written by a holy hand, and not everything written long ago is true because it is old. Read with an open heart and a clear mind; keep what brings you closer to love, truth and God, and let the rest rest. The truest letter from our Father is the one He wrote in our hearts.${bridge([
    ["Sacred Texts: What History Records", "/teachings/sacred-texts-what-history-records", "tradition and history, side by side."],
    ["Give Your Soul Only to God", "/teachings/give-your-soul-only-to-god", "faith known by its fruits."],
    ["Principles and Care", "/teachings/principles-and-care", "how this site handles sources and honesty."],
  ])}

## Sources

- Qur'an 7:172, 17:36 and 49:6, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=49&verse=6).
- Deuteronomy 19:15; Jeremiah 31:33; Matthew 7:16; 1 Thessalonians 5:21; 1 John 4:1, King James Bible.
- *Kalama Sutta*, Anguttara Nikaya 3.65; Jonathan A. C. Brown, *Hadith: Muhammad's Legacy in the Medieval and Modern World* (2009), on the science of hadith.` };
