// Eight teachers Samadhi asked for (Nov 2026): Hermes Trismegistus, Zoroaster, Orpheus, Epictetus, Carl Jung
// (Philosophers tab) and Adi Shankara, Patanjali, Hafiz (The Mystics tab).
// Facts checked against Britannica, Encyclopaedia Iranica, the Stanford Encyclopedia and the primary texts.
// Quotations only from public-domain translations; Jung's words are paraphrased (his books are still in copyright).
// Pictures are public-domain artworks; Jung's page uses Samadhi's picture of a mandala, not a photograph of him.

const pic = (src, width, height, caption, alt) => ({ small: true, src, width, height, caption, alt });

// Samadhi's own picture of a mandala, the circle of wholeness.
export function jungMandala() {
  return `<figure class="cross-hero sl-photo sl-photo-square"><div class="sl-photo-frame"><img src="/images/jung-mandala.jpg" width="1200" height="1200" alt="A round mandala in blue, green and gold: rings of leaves and petals around a square divided into four, at the centre of the circle" loading="lazy" decoding="async"></div><figcaption class="fine">A mandala, the circle of wholeness. Jung drew one almost every morning for a time and came to see it as a picture of the Self. Picture shared by Samadhi.</figcaption></figure>`;
}

export const newPhilosophers = [
  { slug: "hermes-trismegistus", tag: "Ancient Wisdom", title: "Hermes Trismegistus: The Thrice-Great Sage",
    image: pic("/images/hermes.jpg", 746, 736, "Hermes Mercurius Trismegistus, inlaid in the marble floor of Siena Cathedral (1480s), where he is called a contemporary of Moses. Public domain.", "Marble floor inlay of a bearded sage in a robe and tall hat, handing a book to two figures"),
    summary: "The legendary sage behind the Hermetic writings and the Emerald Tablet: who he was said to be, what the texts really are and when they were written, and the wisdom of \"as above, so below\".",
    body: `**Hermes Trismegistus**, "thrice-great Hermes", is one of the most mysterious figures in the history of wisdom. Alchemists, Renaissance philosophers, Rosicrucians and Freemasons all honoured him as the first great teacher of hidden knowledge.

## Who was he said to be?
- In Hellenistic Egypt, the Greeks linked their messenger god **Hermes** with the Egyptian god of wisdom and writing, **Thoth**. From this joining came Hermes Trismegistus.
- Later writers made him a human sage of the deepest antiquity. In the 1480s he was set into the marble floor of Siena Cathedral and called a contemporary of Moses.
- He was called "thrice-great" for being the greatest philosopher, the greatest priest and the greatest king, or, in the alchemists' words, for holding the three parts of the wisdom of the whole world.

## The writings in his name
- **The Corpus Hermeticum.** A collection of Greek dialogues written in Roman Egypt, most likely in the 2nd and 3rd centuries CE. The first, the *Poimandres*, tells of a vision in which the divine Mind reveals how the world came from the light, and how the soul can return to it.
- **The Emerald Tablet.** A short, mysterious text of the alchemists. Its oldest known versions are in Arabic, from the late 8th or early 9th century. It contains the famous teaching that what is below is like what is above, and what is above is like what is below. Isaac Newton made his own English translation of it, which ends: "Hence I am called Hermes Trismegist, having the three parts of the philosophy of the whole world."
- **The Kybalion (1908).** A modern book by "Three Initiates", usually credited to William Walker Atkinson. It presents seven principles as ancient Hermetic teaching. See [The Seven Hermetic Principles](/teachings/the-seven-hermetic-principles).

## How the Renaissance found him
Around 1460, Cosimo de' Medici of Florence obtained a Greek manuscript of the Hermetic writings. He asked the scholar **Marsilio Ficino** to put aside his translation of Plato and translate Hermes first; Ficino finished in 1463, and it was printed in 1471. Europe believed it had found the oldest wisdom on earth. In 1614 the scholar **Isaac Casaubon** showed from the Greek style that the texts were written in the early Christian centuries, not in the time of Moses. Even so, their spiritual vision lived on.

## The heart of the teaching
- **All is Mind.** The world comes forth from the divine Mind, as light from the sun.
- **As above, so below.** The small world of the human being mirrors the great world of the cosmos. To know yourself is to know the universe.
- **The soul's return.** The soul came down from the light and can rise again by purifying itself, through knowledge, devotion and a good life.
- **Wisdom is holy.** Knowing God and loving God are one path.

## Sources
- Brian Copenhaver, *Hermetica* (1992); Garth Fowden, *The Egyptian Hermes* (1986).
- Isaac Newton's translation of the Emerald Tablet; the Siena Cathedral pavement (1488).
- Frances Yates, *Giordano Bruno and the Hermetic Tradition* (1964).` },

  { slug: "zoroaster", tag: "Ancient Wisdom", title: "Zoroaster: The Prophet of Light and Free Choice",
    image: pic("/images/zoroaster.jpg", 960, 565, "Raphael, The School of Athens (1509 to 1511), detail. The bearded figure holding the starry globe is traditionally identified as Zoroaster. Public domain.", "Fresco detail of Renaissance figures; a bearded man in a crown holds a globe with stars"),
    summary: "The ancient Iranian prophet who taught one wise God, the battle between truth and the lie, and that every soul is free to choose the light. Good thoughts, good words, good deeds.",
    body: `**Zoroaster**, as the Greeks called him, or **Zarathustra** in his own language, was the prophet of ancient Iran. His religion, Zoroastrianism, became the faith of the great Persian empires, and it is still practised today, above all by the **Parsis** of India and by communities in Iran and around the world.

## When did he live?
No one knows for certain. As the scholar Herman Lommel wrote in 1930, "when and where Zarathustra lived, one does not know", and Encyclopaedia Iranica says those words are still true. Most scholars, judging by the language of his hymns, place him somewhere in the second millennium BCE, between about 1500 and 1000 BCE. Others place him in the 7th or 6th century BCE, following a later tradition. He lived somewhere in the eastern lands of the Iranian peoples.

## His own words: the Gathas
Zoroaster's teaching survives in seventeen hymns, the **Gathas**, in the very old Avestan language. They are among the oldest religious songs in the world, and they are honoured as his own words. In them he speaks to God as a friend and asks him questions about the order of the world.

## What he taught
- **One wise God.** *Ahura Mazda*, the "Wise Lord", is the source of all good, light and life.
- **Truth and the lie.** The world is a battlefield between *asha*, truth and right order, and *druj*, the lie and disorder.
- **Two spirits.** At the beginning stood two spirits: the Holy Spirit (*Spenta Mainyu*), who chose good, and the Destructive Spirit (*Angra Mainyu*), who chose evil.
- **Free will.** Every person must choose between them. No one is forced; each soul is responsible for its choice, and will meet its result.
- **Good thoughts, good words, good deeds.** *Humata, hukhta, hvarshta*: the simplest and most famous summary of the faith.
- **The bridge.** After death, the soul crosses the Chinvat Bridge. For the good it is wide; for the wicked it narrows to a blade.
- **The renewal.** At the end of time, good will triumph and the world will be made new.

## Fire, the symbol of truth
Zoroastrians pray facing a pure light, often a sacred fire kept burning in their temples. They do not worship fire; it is a symbol of the light and truth of Ahura Mazda.

## His influence
Many scholars believe that Zoroastrian ideas, such as one God of goodness, angels, a final judgement and the renewal of the world, influenced Judaism, Christianity and Islam. The Wise Men who came to the infant Jesus in the Gospel of Matthew were *Magi*, the name of the Zoroastrian priests. See [The Golden Rule](/teachings/the-golden-rule), which also appears in the Zoroastrian scriptures.

## Sources
- Encyclopaedia Iranica, "Zoroaster" (general survey, and the Gathas).
- Encyclopaedia Britannica, "Zarathustra".
- Mary Boyce, *Zoroastrians: Their Religious Beliefs and Practices* (1979).` },

  { slug: "orpheus", tag: "Ancient Wisdom", title: "Orpheus and the Orphic Mysteries",
    image: pic("/images/orpheus.jpg", 960, 442, "Roelant Savery, Orpheus Charming the Animals with his Music (1627), Mauritshuis, The Hague. Public domain.", "Painting of a wide landscape where Orpheus plays music and wild and tame animals gather peacefully"),
    summary: "The singer whose music tamed wild beasts and moved the stones, who went down to the dead for love, and in whose name the Orphic Mysteries taught that the soul is divine and can be freed.",
    body: `In Greek legend, **Orpheus** of Thrace was the greatest singer who ever lived. When he played his lyre, wild animals lay down in peace, trees leaned close to listen, and even the stones were moved.

## The legend
- **The Argonauts.** He sailed with Jason on the ship Argo, and his song drowned out the deadly voices of the Sirens.
- **Eurydice.** When his beloved wife Eurydice died, Orpheus went down into the underworld. His song so moved the rulers of the dead that they let her follow him back, on one condition: he must not look back until they reached the light. At the very edge, he turned to see her, and lost her forever.
- **His death.** Grieving, he is said to have turned from the world, and was torn apart by the frenzied followers of Dionysus. His head floated down the river, still singing.

## The Orphic Mysteries
In the ancient Greek world, religious teachers spread poems and rites in Orpheus's name. The "Orphics" taught:
- **The soul is divine.** The soul comes from the gods and is only staying in the body for a time. An Orphic saying, recorded by Plato in the *Cratylus*, plays on the Greek words *soma* (body) and *sema* (tomb): the body is the soul's tomb, or its place of keeping.
- **Rebirth.** The soul passes through many lives, in a cycle of births, until it is purified.
- **A pure life.** The "Orphic life" was known for its purity, and Plato's *Laws* records that its followers did not eat the flesh of animals.
- **Freedom.** Through initiation and right living, the soul can escape the cycle and return to the gods.

## The gold tablets
Small sheets of gold, rolled up and buried with the dead, have been found in graves in southern Italy, Greece and Crete. They tell the soul what to say in the underworld. The Petelia tablet, now in the British Museum, tells the soul to say to the guardians of the spring of Memory:

> "I am a child of Earth and of Starry Heaven;\\
> But my race is of Heaven (alone)." (translated by Jane Harrison, 1903)

Scholars still debate how "Orphic" these tablets really are, but their message is unforgettable: we are born of earth, but our true home is heaven.

## The teaching for us
Orpheus is music as a sacred power: harmony that tames the wild beast without and within. His story warns us too: on the way back to the light, we must trust and not look back.

See also [Pythagoras](/teachings/pythagoras-music-of-numbers), who shared many of the same teachings.

## Sources
- Plato, *Cratylus* 400c and *Laws* 782c; Ovid, *Metamorphoses* 10 and 11; Virgil, *Georgics* 4.
- Jane Ellen Harrison, *Prolegomena to the Study of Greek Religion* (1903); the Petelia Gold Tablet, British Museum.
- Radcliffe Edmonds, *The "Orphic" Gold Tablets and Greek Religion* (2011).` },

  { slug: "epictetus", tag: "Stoic", title: "Epictetus: The Slave Who Taught Freedom",
    image: pic("/images/epictetus.jpg", 720, 1057, "Imaginary portrait of Epictetus with his crutch, from the frontispiece of an Oxford edition of his Enchiridion (1715). Public domain.", "Engraving of a bearded philosopher in a robe leaning on a crutch, surrounded by symbols"),
    summary: "Born a slave and lame in one leg, he became one of the greatest teachers of inner freedom: what is in our power, what is not, and why peace comes from caring only for what is truly ours.",
    body: `**Epictetus** (about 50 to 135 CE) was born a slave in Hierapolis, in what is now Turkey. He was owned by Epaphroditus, a secretary of the emperor Nero, and an old story says he was lame, perhaps from cruel treatment. Yet he became one of the freest souls in history.

## His life
- As a slave in Rome, he was allowed to study with the Stoic teacher Musonius Rufus.
- After he gained his freedom, he taught philosophy in Rome.
- Around 93 CE the emperor Domitian banished the philosophers from Rome. Epictetus moved to **Nicopolis** in Greece and opened a school, where students came from all over the empire.
- He lived simply all his life, with very few possessions.
- He wrote nothing himself. His student **Arrian** wrote down his talks in the *Discourses* and made a short handbook of his teaching, the *Enchiridion*.

## The heart of his teaching
The *Enchiridion* opens with the sentence on which everything rests:

> "Of things some are in our power, and others are not." (Enchiridion 1, George Long translation, 1877)

- **In our power:** our opinions, our choices, our desires and aversions, our own acts.
- **Not in our power:** our body, our property, our reputation, other people's actions.

When we try to control what is not ours, we suffer. When we care for what is truly ours, our own mind and heart, no one can harm us.

> "Men are disturbed not by the things which happen, but by the opinions about the things." (Enchiridion 5, Long)

## How the soul grows
Epictetus described three stages of growth:

> "It is the act of an ill-instructed man to blame others for his own bad condition; it is the act of one who has begun to be instructed, to lay the blame on himself; and of one whose instruction is completed, neither to blame another, nor himself." (Enchiridion 5, Long)

## God within
Epictetus was a deeply religious man. He taught that every person carries a part of God within, a divine spark, and that we should live as children of God, with gratitude in all things. Whatever happens, he taught, we can ask: what does God want me to learn from this?

## The teaching for us
- Each morning, remember what is in your power and what is not.
- When upset, look at your opinion, not at the event.
- Be grateful. Everything we have is lent, not owned.

See also [The Stoics](/teachings/the-stoics) and [Marcus Aurelius](/teachings/marcus-aurelius), the emperor who learned from his words.

## Sources
- Epictetus, *Enchiridion* and *Discourses*, translated by George Long (1877).
- Stanford Encyclopedia of Philosophy, "Epictetus".
- A. A. Long, *Epictetus: A Stoic and Socratic Guide to Life* (2002).` },

  { slug: "carl-jung", tag: "Modern Bridge", title: "Carl Jung: The Soul in Modern Psychology",
    summary: "The Swiss psychiatrist who built a bridge between psychology and spirit: the collective unconscious, the archetypes, the shadow, the Self, and the lifelong journey to wholeness.",
    body: `**Carl Gustav Jung** (1875 to 1961) was a Swiss psychiatrist who took the soul seriously at a time when much of science did not. He studied dreams, myths, religions, alchemy and the mystics of East and West, and he believed that the human psyche longs for meaning and for God.

{{jung-mandala}}

## His life
- Born in Switzerland, the son of a pastor, he trained as a doctor and worked at the famous Burghölzli psychiatric hospital in Zurich.
- From 1907 he worked closely with **Sigmund Freud**, who saw him as his heir. They parted in 1913, largely because Jung could not accept that the spiritual side of human beings was only a disguise for other drives.
- After the break, Jung went through years of inner turmoil and visions, which he recorded in a great illustrated book, the *Red Book*. It stayed private until it was published in 2009.
- Over his door in Küsnacht, and on his grave, are carved the Latin words *Vocatus atque non vocatus deus aderit*: "Called or not called, God will be present."

## His great ideas
- **The collective unconscious.** Beneath each person's own memories lies a deeper layer that all human beings share, the inheritance of the whole human family.
- **Archetypes.** Within it live universal patterns: the Mother, the Wise Old Man, the Hero, the Child, the Trickster. They appear in the myths, dreams and religions of every culture.
- **The shadow.** Everything in ourselves we refuse to see. What we deny in ourselves, we often attack in others. Facing our shadow with honesty and compassion is the beginning of healing.
- **The Self and individuation.** The Self is the centre and the whole of the psyche, the image of God within. *Individuation* is the lifelong journey of becoming whole, uniting the conscious and the unconscious.
- **Synchronicity.** Meaningful coincidences, where an inner event and an outer event mirror each other with no ordinary cause.
- **Mandalas.** For a time after the First World War, Jung drew a mandala almost every morning. He came to see the circle as a picture of the Self and of wholeness, the same form found in Tibetan art, rose windows and sacred dances.

## Jung and spirit
Late in life, in a famous television interview with the BBC in 1959, Jung was asked whether he believed in God. He answered that he did not need to believe: he knew. He taught that many of the troubles of modern people came from losing touch with the spiritual life, and that the religions hold real wisdom about the soul.

## The teaching for us
- Write down your dreams: they are letters from the soul.
- Look kindly at your shadow: what irritates you in others may be a part of you asking to be seen.
- Draw your own mandala when you feel scattered, and let the circle gather you to your centre.

*Jung's books are still under copyright, so his ideas are explained here in our own words.*

## Sources
- C. G. Jung, *Memories, Dreams, Reflections* (1962); *The Red Book* (2009).
- Encyclopaedia Britannica, "Carl Jung"; BBC, *Face to Face* interview with John Freeman (1959).` },
];

export const newMystics = [
  { slug: "adi-shankara", tag: "Hinduism", title: "Adi Shankara: There Is Only One",
    image: pic("/images/shankara.jpg", 720, 1016, "Adi Shankara with his disciples, by Raja Ravi Varma (about 1904). Public domain.", "Painting of a young monk in saffron robes seated under a tree beside a river, teaching four disciples"),
    summary: "The young monk who walked across India and taught Advaita, non-duality: the true Self in us is the one infinite Brahman, and the separate self is a dream from which we can wake.",
    body: `**Adi Shankara**, also called **Shankaracharya**, was one of the greatest philosophers and saints of India. He gave its clearest form to **Advaita Vedanta**, the teaching of non-duality, "not two".

## His life
- Tradition gives his dates as 788 to 820 CE; many scholars place him earlier, in the early 8th century. He was born in **Kalady** in Kerala, in the far south of India.
- As a boy he longed to become a monk. A famous story says that a crocodile seized his leg in the river, and his mother finally gave her permission; at once the crocodile let him go.
- He found his teacher, **Govinda Bhagavatpada**, on the banks of the Narmada river.
- He walked the length and breadth of India, debating the scholars of every school and renewing the teaching of the Upanishads.
- Tradition says he founded four great monasteries (*mathas*), at Sringeri in the south, Dwarka in the west, Puri in the east and Jyotirmath in the north, and that he left the world at only 32, in the Himalayas near Kedarnath.

## What he taught
His great commentaries on the Upanishads, the Bhagavad Gita and the Brahma Sutras teach:
- **Brahman alone is real.** The one infinite reality is pure being, pure consciousness and pure bliss: *sat-chit-ananda*.
- **Atman is Brahman.** Your deepest Self is not the body or the mind. It is that same infinite reality. "Tat tvam asi": you are That.
- **Maya.** The world of separate things is an appearance, like a rope seen as a snake in the dusk. When the light of knowledge comes, the snake disappears and only the rope remains.
- **Knowledge frees.** Liberation (*moksha*) is not something gained, but the waking up to what we always were.
- **Devotion too.** Shankara also wrote beautiful hymns of devotion, and taught that a pure heart, service and love of God prepare the mind for knowledge.

A famous summary is attributed to him: *Brahma satyam jagan mithya, jivo brahmaiva naparah*, "Brahman is real, the world is appearance, and the soul is not other than Brahman."

## The Nirvana Shatakam
A hymn attributed to Shankara, the *Nirvana Shatakam* ("Six Verses on Liberation"), is sung all over the world. In each verse he says what he is not: not the mind, not the senses, not the body, not the elements. And each verse ends: *Chidananda rupah Shivoham Shivoham*, "I am the form of consciousness and bliss; I am Shiva, I am Shiva."

## The teaching for us
When you suffer, ask: who is suffering? Look for the one who is aware of the body, the thoughts and the feelings. That silent awareness was never born and will never die. See [Lord Shiva](/teachings/lord-shiva) and [The Ten Sefirot](/teachings/the-ten-sefirot) for the same longing for the One in other traditions.

## Sources
- Encyclopaedia Britannica, "Shankara"; Stanford Encyclopedia of Philosophy, "Shankara".
- Shankara's commentaries on the Brahma Sutras and the Upanishads; the *Nirvana Shatakam* (attributed).` },

  { slug: "patanjali", tag: "Yoga", title: "Patanjali and the Yoga Sutras",
    image: pic("/images/patanjali.jpg", 720, 1236, "A sage with the body of a serpent, hands joined in reverence: probably Patanjali, whom tradition calls an incarnation of the divine serpent Adishesha. Indian painting, 19th century, Wellcome Collection. Public domain.", "Indian painting of a sage whose lower body is a serpent's coil, with hands pressed together in prayer"),
    summary: "The sage who gathered the whole science of yoga into short threads of wisdom: what yoga really is, the eight limbs, and the path from a restless mind to inner freedom.",
    body: `The **Yoga Sutras of Patanjali** is the classic text of yoga, the foundation of the path of meditation known as Raja Yoga, the "royal yoga". In fewer than two hundred short sayings, or *sutras* ("threads"), it maps the whole journey from a restless mind to freedom.

## Who was Patanjali?
- Almost nothing is known of his life.
- Indian tradition honours him as an incarnation of **Adishesha**, the divine serpent on whose coils Lord Vishnu rests. That is why he is often shown with the body of a serpent and a hood of serpent heads.
- Tradition also identifies him with the great grammarian Patanjali.

## What is yoga?
The second sutra gives the definition of yoga:

> "Yoga is restraining the mind-stuff (Chitta) from taking various forms (Vrittis)." (Yoga Sutras 1.2, Swami Vivekananda, 1896)

Vivekananda explained it with a picture: we cannot see the bottom of a lake while its surface is covered with ripples. When the waves of thought are still, the true Self shines through.

## The eight limbs
Patanjali's path has eight steps (*ashtanga*):
1. **Yama**: right conduct toward others: non-violence, truthfulness, not stealing, self-control and not grasping.
2. **Niyama**: right conduct toward oneself: purity, contentment, discipline, self-study and surrender to God.
3. **Asana**: a steady, comfortable seat for meditation.
4. **Pranayama**: mastery of the breath, the life force.
5. **Pratyahara**: drawing the senses inward.
6. **Dharana**: concentration on one point.
7. **Dhyana**: meditation, an unbroken flow of awareness.
8. **Samadhi**: union, where the meditator, the meditation and its object become one.

## Kriya Yoga in the Sutras
The second book opens by defining *kriya yoga* as discipline, self-study and surrender to God. This is the root of the name of the Kriya Yoga later taught by Babaji, Lahiri Mahasaya and Yogananda. See [Kriya Yoga](/teachings/kriya-yoga).

## The teaching for us
- Begin with the first two limbs: kindness and truth in daily life make meditation possible.
- Sit each day in stillness, even for a short time, and watch the waves of the mind slowly settle.
- Offer the fruits of your practice to God. Patanjali teaches that surrender to God (*Ishvara pranidhana*) can itself bring samadhi.

## Sources
- *Patanjali's Yoga Aphorisms*, translated with commentary by Swami Vivekananda, in *Raja Yoga* (1896).
- Stanford Encyclopedia of Philosophy, "Yoga"; Edwin Bryant, *The Yoga Sutras of Patañjali* (2009).` },

  { slug: "hafiz", tag: "Sufism", title: "Hafiz of Shiraz: The Tongue of the Invisible",
    image: pic("/images/hafiz.jpg", 524, 1110, "A reception with a poet, from a 16th-century Persian manuscript of the Divan of Hafiz, Walters Art Museum, Baltimore. Public domain.", "Persian miniature painting of a garden gathering with a poet, musicians and guests, framed by text"),
    summary: "The great Persian poet of divine love, whose Divan sits beside the Qur'an in many Iranian homes: his life in Shiraz, the wine and the Beloved in his poems, and the truth about the popular 'Hafiz' poems in English.",
    body: `**Hafiz** (also spelled Hafez), whose full name was Khwaja Shams al-Din Muhammad, was born in **Shiraz** in Persia in the early 14th century and died there around 1390. He is the most beloved poet of Iran. His *Divan*, his collected poems, is found in almost every Iranian home, often beside the Qur'an.

## His life
- His pen name *Hafiz* means "one who keeps", a title for someone who knows the whole Qur'an by heart. He said he had learned it in fourteen different ways of recitation.
- He spent almost all his life in Shiraz, a city of gardens and roses, through wars and changes of rulers, at times in favour at court and at times out of it.
- Persians call him *Lisan al-Ghaib*, "the Tongue of the Invisible", because his poems seem to speak from beyond.

## His poems
Hafiz wrote mainly *ghazals*, short love poems of a few couplets, famous for their music and for having many layers of meaning at once.
- **The Beloved** may be a human love, the king, or God. Often it is all three, and the reader must find their own way in.
- **Wine and the tavern** are pictures of the intoxication of divine love, which frees the soul from dry rules and pride.
- **The hypocrites** are a constant target: the preacher who is pious in the pulpit and does the opposite at home.
- **Joy and grace.** Through all the longing, his poems return to hope, love and the grace of God.

## A living tradition
- On *Shab-e Yalda*, the longest night of the year, and at the New Year, Iranian families open the Divan at random and read the poem as a message of guidance: the *fal-e Hafez*.
- His tomb in a garden in Shiraz, the *Hafezieh*, is visited by people reciting his poems and laying their hands on the stone.
- In Germany, the poet Goethe loved him so much that he wrote a whole book of poems in answer to him, the *West-Eastern Divan* (1819).

## A word of truth about "Hafiz" in English
Many of the most popular "Hafiz" poems on the internet and in bestselling books, especially those by Daniel Ladinsky, are not translations of Hafiz. Ladinsky does not read Persian, and scholars have shown that his poems are his own, inspired by Hafiz. They are often beautiful, but they are not what Hafiz wrote. To meet the real Hafiz, look for translations by scholars who work from the Persian.

## The teaching for us
Love is the way, and the heart that loves is wiser than the mind that only judges. Do not be a hypocrite: let your inner life and your outer life be one. And in every sorrow, keep hope: the Beloved's grace is near.

See also [Rumi](/teachings/rumi), the other great Persian voice of divine love.

## Sources
- Encyclopaedia Iranica, "Hafez"; Encyclopaedia Britannica, "Hafez".
- Gertrude Bell, *Poems from the Divan of Hafiz* (1897); Goethe, *West-östlicher Divan* (1819).
- Omid Safi, "Fake Hafez: How a supreme Persian poet of love was erased" (2020).` },
];
