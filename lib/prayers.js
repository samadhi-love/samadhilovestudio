// The Prayers tab: short, powerful prayers requested by Samadhi (Nov 2026).
// The prayers themselves are written for SAMADHI LOVE; scripture is quoted from the King James Version
// (public domain) or given in Arabic with our own plain English meaning.

// One prayer, shown line by line in a gold-edged block.
const pray = (...lines) => lines.map((l, i) => `> ${l}${i < lines.length - 1 ? "\\" : ""}`).join("\n");

const care = "*Prayer goes with care, never instead of it. When you or someone you love is unwell, please also see a doctor.*";

export const prayers = [
  {
    slug: "prayer-archangel-raphael-healing", tag: "Prayer", title: "Prayer to Archangel Raphael for Healing",
    image: { small: true, src: "/images/prayer-mountain.jpg", width: 1200, height: 670, caption: "All paths, one Light. Illustration chosen by Samadhi.", alt: "A great gathering of people of every faith kneeling in prayer along a stone path in the high mountains, beneath glowing sacred symbols and a rising sun" },
    summary: "A short prayer to the archangel whose name means \"God heals\", for the body, the mind and the heart.",
    body: `**Raphael** means *God heals* in Hebrew. In the Book of Tobit he walks beside young Tobias as a travelling companion, and heals the eyes of his father, Tobit. Then he reveals who he is: "I am Raphael, one of the seven holy angels, which present the prayers of the saints" (Tobit 12:15, KJV). Many today picture his light as a soft emerald green.

${pray(
  "Archangel Raphael, healer sent by God,",
  "lay your emerald light upon me now.",
  "Where there is pain, bring ease.",
  "Where there is sickness, bring wholeness.",
  "Where my heart is broken, gently mend it.",
  "Heal my body, my mind and my soul,",
  "and heal those I love, near and far.",
  "I open my hands to receive God's healing,",
  "with a grateful heart.",
  "**Amen.**",
)}

${care}`,
  },
  {
    slug: "prayer-archangel-zadkiel-mercy", tag: "Prayer", title: "Prayer to Archangel Zadkiel for Mercy and to Mend What Is Broken",
    image: { small: true, src: "/images/prayer-right.jpg", width: 1200, height: 670, caption: "All paths, one Light. Illustration chosen by Samadhi.", alt: "Families of many faiths praying together on a hillside at sunrise above a winding river, with sacred symbols glowing in the sky" },
    summary: "A prayer to the angel of mercy and forgiveness, to untangle problems and make broken things whole.",
    body: `**Zadkiel** (Tzadkiel) means *righteousness of God*. In Jewish angel lore he is an angel of mercy and loving-kindness, and some later traditions say he was the angel who stayed Abraham's hand. Many teachers today link him with the **violet flame**, the light of mercy that transforms what is heavy, tangled or broken.

${pray(
  "Archangel Zadkiel, angel of mercy,",
  "wrap me in the violet flame of forgiveness.",
  "Take what is tangled in my life and make it straight.",
  "Take what is broken and make it whole.",
  "Help me forgive others as I am forgiven,",
  "and help me forgive myself.",
  "Turn every problem into a lesson,",
  "every mistake into wisdom,",
  "and every fear into faith.",
  "**Amen.**",
)}`,
  },
  {
    slug: "prayer-for-mercy-from-the-quran", tag: "Prayer", title: "A Prayer for Mercy from the Quran",
    image: { small: true, src: "/images/prayer-desert.jpg", width: 1200, height: 670, caption: "All paths, one Light. Illustration chosen by Samadhi.", alt: "A great gathering of people of every faith praying along a river in a desert canyon of carved rock temples and palms, beneath an arch of sacred symbols and a rising sun" },
    summary: "Three prayers for forgiveness and mercy from the Quran, in Arabic, in sound and in meaning, with two of its promises of mercy.",
    body: `Every surah of the Quran but one opens with the same words: *In the name of God, the Most Gracious, the Most Merciful.* Mercy, *rahma*, is the first thing God says to the reader. These are prayers the Quran itself teaches. The English meanings are our own plain renderings.

## The opening
بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ

*Bismillahir-Rahmanir-Rahim*

> In the name of God, the Most Gracious, the Most Merciful.

## The prayer of Adam and Eve (7:23)
رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ

*Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin*

> Our Lord, we have wronged ourselves.\\
> If You do not forgive us and have mercy on us,\\
> we will surely be among the lost.

## The prayer for mercy (23:118)
رَبِّ اغْفِرْ وَارْحَمْ وَأَنتَ خَيْرُ الرَّاحِمِينَ

*Rabbighfir warham wa anta khayrur-rahimin*

> My Lord, forgive and have mercy,\\
> for You are the best of those who show mercy.

## Two promises of mercy
- "My mercy embraces all things" (7:156): وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ
- "Do not despair of the mercy of God" (39:53): لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ

Many Muslims also recite **Surah Ya-Sin** (chapter 36), often called the heart of the Quran, for mercy, for the sick and for those who have passed on.`,
  },
  {
    slug: "prayer-to-jesus", tag: "Prayer", title: "A Prayer to Jesus for Rest and Mercy",
    image: { small: true, src: "/images/prayer-masters.jpg", width: 1200, height: 670, caption: "All paths, one Light. Illustration chosen by Samadhi.", alt: "Jesus, the Buddha and Mother Mary together on a rock by the sea, surrounded by people of every faith in prayer, beneath an arch of sacred symbols, with ships of light and star visitors in the sky" },
    summary: "A prayer to lay down heavy burdens, receive rest, and love as Jesus loved.",
    body: `Jesus said: "Come unto me, all ye that labour and are heavy laden, and I will give you rest" (Matthew 11:28, KJV). For centuries the Christians of the East have prayed a single line, the **Jesus Prayer**, over and over in the heart: *Lord Jesus Christ, Son of God, have mercy on me.*

${pray(
  "Lord Jesus, light of the world,",
  "I come to you tired and carrying too much.",
  "Take my burdens and give me your rest.",
  "Fill my heart with your love,",
  "so I may love as you loved:",
  "the friend and the stranger,",
  "the one who hurt me and the one I have hurt.",
  "Where I have fallen, lift me up.",
  "Where I am lost, find me.",
  "Lord Jesus Christ, have mercy on me.",
  "**Amen.**",
)}`,
  },
  {
    slug: "prayer-to-mother-mary", tag: "Prayer", title: "A Prayer to Mother Mary for Comfort",
    image: { small: true, src: "/images/prayer-forest.jpg", width: 1200, height: 670, caption: "All paths, one Light. Illustration chosen by Samadhi.", alt: "A great gathering of people of every faith praying beside a stream in an ancient forest of standing stones, beneath an arch of sacred symbols and a rising sun" },
    summary: "A prayer to the mother of compassion for comfort, healing and protection of the family, with the traditional Hail Mary.",
    body: `**Mary** is loved across Christianity and honoured in Islam as **Maryam**, the only woman named in the Quran, where a whole surah (chapter 19) bears her name. She is the mother of compassion, who knows sorrow and never turns anyone away.

${pray(
  "Mother Mary, gentle mother of compassion,",
  "hold me as you held your child.",
  "Cover me and my family with your mantle of love.",
  "Comfort everyone who is crying tonight,",
  "heal those who are sick,",
  "and bring home those who are lost.",
  "Teach me your patience, your faith and your quiet strength.",
  "Pray for us, Mother, now and always.",
  "**Amen.**",
)}

## The Hail Mary
The traditional prayer, drawn from the angel Gabriel's greeting and Elizabeth's blessing in Luke 1:

${pray(
  "Hail Mary, full of grace, the Lord is with thee;",
  "blessed art thou among women,",
  "and blessed is the fruit of thy womb, Jesus.",
  "Holy Mary, Mother of God,",
  "pray for us sinners,",
  "now and at the hour of our death.",
  "**Amen.**",
)}`,
  },
  {
    slug: "prayer-of-the-one-light", tag: "Prayer", title: "Prayer of the One Light, for the Whole Human Family",
    image: { small: true, src: "/images/prayer.jpg", width: 1200, height: 670, caption: "All paths, one Light. Illustration chosen by Samadhi.", alt: "People of many faiths and ages praying together beside a river, beneath a circle of sacred symbols gathered around one radiant light" },
    summary: "A prayer of unity to the One Creator known by many names, for healing and peace for every soul on Earth.",
    body: `A prayer for every faith and every heart, in the spirit of SAMADHI LOVE: one Creator, one human family, one light.

${pray(
  "Beloved Creator, known by many names,",
  "the One Light behind every star and every heart:",
  "I come home to You.",
  "Make me an instrument of Your love.",
  "Let my hands heal, my words bless,",
  "and my presence bring peace.",
  "Bless every soul on this Earth,",
  "of every faith and every land,",
  "as one family under one sky.",
  "May all beings be healed, forgiven and free.",
  "**Amen. Amin. Om.**",
)}`,
  },
];
