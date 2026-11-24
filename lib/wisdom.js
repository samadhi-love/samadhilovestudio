// "Wisdom from the traditions": checked sayings shown under each teaching.
// Each entry: [saying, who, where it comes from]. Old public-domain translations only:
// Dhammapada (F. Max Müller, 1881), Yoga Sutras (Swami Vivekananda, Raja Yoga, 1896), Tao Te Ching (James Legge, 1891), Bhagavad Gita (Edwin Arnold,
// The Song Celestial, 1885), Rumi's Masnavi (R. A. Nicholson, 1926), Qur'an (M. Pickthall, 1930),
// Enchiridion (George Long, 1887) and the King James Bible.

const kjv = (ref) => `${ref} (King James Bible)`;
const dh = (n) => `Dhammapada, verse ${n} (Müller, 1881)`;

export const wisdomFor = {
  "spiritual-path": [
    ["You yourself must make an effort. The Tathagatas (Buddhas) are only preachers.", "The Buddha", dh(276)],
    ["Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.", "Jesus", kjv("Matthew 7:7")],
    ["He who overcomes others is strong; he who overcomes himself is mighty.", "Lao Tzu", "Tao Te Ching, chapter 33 (Legge, 1891)"],
    ["If one man conquer in battle a thousand times thousand men, and if another conquer himself, he is the greatest of conquerors.", "The Buddha", dh(103)],
    ["Listen to the reed how it tells a tale, complaining of separations.", "Rumi", "Masnavi, Book I, line 1 (Nicholson, 1926): the soul's longing for its home"],
  ],
  "meditation-and-prayer": [
    ["Be still, and know that I am God.", "The Psalms", kjv("Psalm 46:10")],
    ["But thou, when thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father which is in secret.", "Jesus", kjv("Matthew 6:6")],
    ["And when My servants question thee concerning Me, then surely I am nigh. I answer the prayer of the suppliant when he crieth unto Me.", "The Qur'an", "Surah 2:186 (Pickthall, 1930)"],
    ["If a man speaks or acts with a pure thought, happiness follows him, like a shadow that never leaves him.", "The Buddha", dh(2)],
    ["Pray without ceasing.", "Saint Paul", kjv("1 Thessalonians 5:17")],
  ],
  "meditation-and-yoga": [
    ["Yoga is restraining the mind-stuff (Chitta) from taking various forms (Vrttis).", "Patanjali", "Yoga Sutras 1.2 (Swami Vivekananda, Raja Yoga, 1896)"],
    ["Steadfast a lamp burns sheltered from the wind; Such is the likeness of the Yogi's mind", "Krishna", "Bhagavad Gita 6.19 (Arnold, The Song Celestial, 1885; excerpt)"],
  ],
  unity: [
    ["I and my Father are one.", "Jesus", kjv("John 10:30")],
    ["That they all may be one.", "Jesus, praying for all", kjv("John 17:21")],
    ["Tat tvam asi: \"You are That.\"", "The Upanishads", "Chandogya Upanishad 6.8.7, the teaching given to Svetaketu"],
    ["Wherever you turn, there is the Face of God.", "The Qur'an", "Surah 2:115, in brief"],
    ["As above, so below.", "Hermetic tradition", "A short form of a line in the Emerald Tablet"],
  ],
  "earth-school": [
    ["Self is the lord of self, who else could be the lord? With self well subdued, a man finds a lord such as few can find.", "The Buddha", dh(160)],
    ["Tribulation worketh patience; and patience, experience; and experience, hope.", "Saint Paul", kjv("Romans 5:3–4")],
    ["Men are disturbed not by the things which happen, but by the opinions about the things.", "Epictetus", "Enchiridion, 5 (Long, 1887)"],
    ["Not the perversities of others, not their sins of commission or omission, but his own misdeeds and negligences should a sage take notice of.", "The Buddha", dh(50)],
  ],
  "reincarnation-and-karma": [
    ["Never the spirit was born; the spirit shall cease to be never; Never was time it was not; End and Beginning are dreams!", "Krishna", "Bhagavad Gita, chapter II (Arnold, The Song Celestial, 1885)"],
    ["Whatsoever a man soweth, that shall he also reap.", "Saint Paul", kjv("Galatians 6:7")],
    ["With what measure ye mete, it shall be measured to you again.", "Jesus", kjv("Matthew 7:2")],
    ["All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts.", "The Buddha", dh(1)],
  ],
  "divine-presence": [
    ["The kingdom of God is within you.", "Jesus", kjv("Luke 17:21")],
    ["Know ye not that ye are the temple of God, and that the Spirit of God dwelleth in you?", "Saint Paul", kjv("1 Corinthians 3:16")],
    ["That was the true Light, which lighteth every man that cometh into the world.", "The Gospel of John", kjv("John 1:9")],
    ["I AM THAT I AM.", "God to Moses at the burning bush", kjv("Exodus 3:14")],
    ["And when My servants question thee concerning Me, then surely I am nigh.", "The Qur'an", "Surah 2:186 (Pickthall, 1930)"],
  ],
  "nature-of-the-soul": [
    ["Never the spirit was born; the spirit shall cease to be never; Never was time it was not; End and Beginning are dreams!", "Krishna", "Bhagavad Gita, chapter II (Arnold, The Song Celestial, 1885)"],
    ["And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.", "Genesis", kjv("Genesis 2:7")],
    ["Know ye not that ye are the temple of God, and that the Spirit of God dwelleth in you?", "Saint Paul", kjv("1 Corinthians 3:16")],
    ["Listen to the reed how it tells a tale, complaining of separations.", "Rumi", "Masnavi, Book I, line 1 (Nicholson, 1926)"],
  ],
  "i-am-the-way": [
    ["I AM THAT I AM.", "God to Moses at the burning bush", kjv("Exodus 3:14")],
    ["I am the way, the truth, and the life.", "Jesus", kjv("John 14:6")],
    ["The kingdom of God is within you.", "Jesus", kjv("Luke 17:21")],
    ["Blessed are the pure in heart: for they shall see God.", "Jesus", kjv("Matthew 5:8")],
    ["You yourself must make an effort. The Tathagatas (Buddhas) are only preachers.", "The Buddha", dh(276)],
  ],
  "god-is-pure-love": [
    ["He that loveth not knoweth not God; for God is love.", "Saint John", kjv("1 John 4:8")],
    ["God is love; and he that dwelleth in love dwelleth in God, and God in him.", "Saint John", kjv("1 John 4:16")],
    ["There is no fear in love; but perfect love casteth out fear.", "Saint John", kjv("1 John 4:18")],
    ["Blessed are the pure in heart: for they shall see God.", "Jesus", kjv("Matthew 5:8")],
    ["Hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.", "The Buddha", dh(5)],
    ["And now abideth faith, hope, charity, these three; but the greatest of these is charity.", "Saint Paul (charity means love)", kjv("1 Corinthians 13:13")],
  ],
  "star-family": [
    ["He telleth the number of the stars; he calleth them all by their names.", "The Psalms", kjv("Psalm 147:4")],
    ["In my Father's house are many mansions.", "Jesus", kjv("John 14:2")],
    ["As above, so below.", "Hermetic tradition", "A short form of a line in the Emerald Tablet"],
  ],
  starseeds: [
    ["In my Father's house are many mansions.", "Jesus", kjv("John 14:2")],
    ["Listen to the reed how it tells a tale, complaining of separations.", "Rumi", "Masnavi, Book I, line 1 (Nicholson, 1926): the longing for home"],
  ],
  discernment: [
    ["Ye shall know them by their fruits.", "Jesus", kjv("Matthew 7:16")],
    ["Beloved, believe not every spirit, but try the spirits whether they are of God.", "Saint John", kjv("1 John 4:1")],
    ["There is no fear in love; but perfect love casteth out fear.", "Saint John", kjv("1 John 4:18")],
    ["Let a man overcome anger by love, let him overcome evil by good; let him overcome the greedy by liberality, the liar by truth!", "The Buddha", dh(223)],
  ],
  "ascended-masters": [
    ["Not to commit any sin, to do good, and to purify one's mind, that is the teaching of (all) the Awakened.", "The Buddha", dh(183)],
    ["Blessed are the pure in heart: for they shall see God.", "Jesus", kjv("Matthew 5:8")],
  ],
};
