// Blessing & Gratitude: blessing God (Kabbalah and Jewish tradition), gratitude in all traditions,
// the power of affirmations, and a daily practice. Written as spiritual teaching (Samadhi's wish, Nov 2026).
// Quotations from public-domain translations: King James Bible, Pickthall's Qur'an (1930),
// Max Müller's Dhammapada (1881), George Long's Marcus Aurelius (1862). Hebrew prayers translated for the site.

// A sunrise drawn for SAMADHI LOVE: the first light of the morning blessing. No outside image.
export function dawnArt() {
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a = -170 + i * 10;
    return `<line x1="300" y1="250" x2="${(300 + 330 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" y2="${(250 + 330 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" stroke="#ffe9a8" stroke-opacity="${i % 2 ? 0.18 : 0.32}" stroke-width="${i % 2 ? 3 : 6}"/>`;
  }).join("");
  return `<figure class="cross-hero tol-figure dawn-figure"><svg viewBox="0 0 600 330" role="img" aria-labelledby="dawn-t" xmlns="http://www.w3.org/2000/svg"><title id="dawn-t">The sun rising over the hills and the sea: the first light of the morning blessing</title>
<defs><linearGradient id="dawn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1640"/><stop offset=".45" stop-color="#6b4c8f"/><stop offset=".75" stop-color="#e79a6b"/><stop offset="1" stop-color="#ffd58a"/></linearGradient>
<radialGradient id="dawn-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".55" stop-color="#ffe08a"/><stop offset="1" stop-color="#f2a64d"/></radialGradient>
<linearGradient id="dawn-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c27a"/><stop offset="1" stop-color="#3a2a5c"/></linearGradient></defs>
<rect width="600" height="330" rx="18" fill="url(#dawn-sky)"/>${rays}
<circle cx="300" cy="250" r="64" fill="url(#dawn-sun)"/>
<path d="M0 246 Q90 198 180 232 T360 226 T600 238 V330 H0 Z" fill="#2c2152" fill-opacity=".85"/>
<rect x="0" y="262" width="600" height="68" fill="url(#dawn-sea)" opacity=".9"/>
<g stroke="#fff3c4" stroke-opacity=".55" stroke-width="2"><line x1="250" y1="276" x2="350" y2="276"/><line x1="268" y1="290" x2="332" y2="290"/><line x1="284" y1="304" x2="316" y2="304"/></g>
<g fill="#fff" opacity=".8"><circle cx="70" cy="40" r="1.6"/><circle cx="140" cy="72" r="1.2"/><circle cx="520" cy="46" r="1.5"/><circle cx="455" cy="88" r="1.1"/><circle cx="40" cy="110" r="1"/></g></svg>
<figcaption class="fine">"From the rising of the sun unto the going down of the same the LORD's name is to be praised." (Psalm 113:3). Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

export const blessingTeachings = [
  { slug: "blessing-god", tag: "Kabbalah", title: "Blessing God: The Morning Blessing and the Flow of Abundance",
    summary: "Why the Jewish mystics bless God from the moment they wake, the hundred blessings of each day, and the Kabbalistic secret that a blessing opens the channel through which divine abundance flows down to the world.",
    body: `{{dawn-art}}

In Jewish tradition, and above all in Kabbalah, a person does not only ask God for blessings. A person **blesses God**. Almost every Jewish blessing begins with the same words: *Baruch atah Adonai*, "Blessed are You, Lord."

## The first words of the day: Modeh Ani
Before getting out of bed, before washing or speaking any other word, a Jew says a short prayer of thanks:

> *Modeh ani lefanecha, melech chai vekayam,*\\
> *shehechezarta bi nishmati bechemlah, rabah emunatecha.*

"I give thanks before You, living and eternal King, for You have returned my soul to me with compassion. Great is Your faithfulness."

The tradition teaches that in sleep the soul rises to God, and in the morning God returns it to us, renewed. The first thought of the day is gratitude. This prayer was written in Safed, the city of the Kabbalists, in the 16th century, and is now said all over the world.

## A hundred blessings every day
The Talmud (Menachot 43b) records the teaching of Rabbi Meir: a person must say one hundred blessings every day. He read the verse "And now, Israel, **what** (*mah*) does the Lord your God ask of you?" (Deuteronomy 10:12) as "**a hundred** (*me'ah*) the Lord your God asks of you."

Another tradition tells that in the time of King David a plague struck the people, and the sages taught the hundred daily blessings to turn it away.

There are blessings for waking, for washing, for the body working as it should, for bread, for fruit, for rain, for thunder, for the rainbow, for good news, for seeing the ocean, for meeting a wise person, for every gift of life. A life full of blessings is a life that notices God everywhere.

## Why bless God, who needs nothing?
The sages asked this question too. God needs nothing from us. So what does it mean to bless Him?

- **The blessing changes us.** The medieval teacher of the *Sefer HaChinukh* explains that blessings do not add anything to God. They are for our good: they remind us that every good thing comes from Him, so our hearts turn toward the source.
- **The blessing opens the flow.** The Kabbalists teach something deeper. The Hebrew word *baruch* is linked to *berechah*, a pool or spring of water. To bless God is to call His light to flow, like water from a spring, from the hidden heights down into the world. The great 13th-century sage Rabbi Shlomo ibn Aderet (the Rashba) and later Rabbi Chaim of Volozhin, in *Nefesh HaChaim* (1824), taught that "blessed are You" means: may Your goodness increase and pour forth into all the worlds.
- **You and He.** Every blessing begins "Blessed are **You**", speaking to God face to face, and continues "**who** has sanctified us", speaking of Him as hidden. The Kabbalists see in this that God is both near and beyond: we meet the hidden God through His revealed presence.

## The blessing over food
The Talmud teaches (Berakhot 35a) that "the earth is the Lord's" (Psalm 24:1) before we bless, and it becomes a gift to us after we bless. To eat without a blessing, the sages said, is like taking from God without asking. A blessing turns every meal into a meeting with the Giver.

## The teaching for us
- Let your first words each morning be thanks.
- Bless God for small things, many times a day: the water, the bread, the breath, the sunrise.
- Every time you bless, imagine light flowing down from heaven through you into the world.

See [Gratitude: The Power of a Thankful Heart](/teachings/the-power-of-gratitude) and [The Ten Sefirot](/teachings/the-ten-sefirot).

## Sources
- Babylonian Talmud, Menachot 43b and Berakhot 35a; Deuteronomy 10:12; Psalm 24:1.
- *Sefer HaChinukh*, commandment 430; Rabbi Chaim of Volozhin, *Nefesh HaChaim* 2 (1824).
- The *Modeh Ani* prayer, from Rabbi Moshe ibn Makhir, *Seder HaYom* (Safed, 16th century).` },

  { slug: "the-power-of-gratitude", tag: "Gratitude", title: "Gratitude: The Power of a Thankful Heart",
    summary: "Every tradition teaches that thankfulness opens the door to more blessing. What the Bible, the Qur'an, the Buddha, the Stoics and the mystics teach about gratitude, and how it changes a life.",
    body: `Gratitude is one of the simplest and most powerful spiritual practices in the world. It costs nothing, it can be done anywhere, and every tradition praises it.

## What the traditions teach
**The Psalms** are full of thanks:

> "O give thanks unto the LORD; for he is good: for his mercy endureth for ever." (Psalm 136:1)

> "Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name." (Psalm 100:4)

**The apostle Paul** taught to give thanks not only for the good, but in everything:

> "In every thing give thanks: for this is the will of God in Christ Jesus concerning you." (1 Thessalonians 5:18)

**The Qur'an** promises that gratitude brings increase:

> "If ye give thanks, I will give you more." (Qur'an 14:7, Pickthall)

In Islam, *shukr*, thankfulness, is a mark of true faith, and the words *Alhamdulillah*, "all praise and thanks belong to God", are said many times a day, in joy and in difficulty.

**The Buddha** taught that two kinds of people are rare in the world: the one who does good first, without being asked, and the one who is grateful and remembers the good done to him (Anguttara Nikaya). For the Buddha, gratitude is a mark of a noble person.

**The Stoic emperor Marcus Aurelius** began his *Meditations* with a whole book of thanks: to his grandfather, his mother, his teachers, his friends and the gods, naming what he learned from each.

**The Hindu tradition** offers every meal to God first, and receives the food back as *prasad*, a blessed gift.

## What gratitude does
- **It opens the heart.** A thankful heart cannot be bitter at the same time.
- **It brings more.** The traditions agree: what we thank for grows. The Qur'an promises it; the mystics say that gratitude makes us a vessel that can hold more blessing.
- **It changes how we see.** The same day can be a list of problems or a list of gifts. Gratitude chooses the gifts.
- **It turns trials into teachers.** The great souls gave thanks even in suffering, trusting that every trial carries a hidden gift.
- **It connects.** Thanking others builds love, and thanking God builds faith.

## Gratitude in hard times
True gratitude is not pretending that everything is fine. It is finding the thread of grace even in the dark: the friend who called, the breath that still comes, the lesson that is being learned. Joseph, sold by his brothers, could say at the end: "ye thought evil against me; but God meant it unto good" (Genesis 50:20).

## The teaching for us
- Each night, write down or say three things you are thankful for today.
- Thank one person each day, sincerely and by name.
- When something goes wrong, ask: what is the gift hidden in this?
- Say "thank You" to God before you sleep and when you wake.

## Sources
- King James Bible: Psalms 100:4 and 136:1; 1 Thessalonians 5:18; Genesis 50:20.
- The Qur'an 14:7, translated by M. M. Pickthall (1930).
- Anguttara Nikaya 2.118; Marcus Aurelius, *Meditations*, Book 1.` },

  { slug: "the-power-of-affirmations", tag: "Co-Creation", title: "The Power of Affirmations: Co-Creating With the Universe",
    summary: "Thoughts and words create. What the scriptures and the mystics teach about the creative power of the word and of 'I AM', how to affirm the good so that life follows, and how to make affirmations truly powerful.",
    body: `All the great traditions teach that **our thoughts and words are creative**. What we think, we become; what we speak, we call forth. An affirmation is a positive statement of truth, spoken with faith, which plants a seed in the mind and the soul and in the great field of life.

## What the traditions teach
**In the beginning was the Word.** In Genesis, God creates by speaking: "And God said, Let there be light: and there was light" (Genesis 1:3). We are made in His image, so our words carry creative power too.

> "Death and life are in the power of the tongue." (Proverbs 18:21)

> "For as he thinketh in his heart, so is he." (Proverbs 23:7)

**Jesus** taught the power of faith-filled asking:

> "What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them." (Mark 11:24)

**The Buddha** opened the Dhammapada with the power of the mind:

> "All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts." (Dhammapada 1, Max Müller)

**The Hermetic teaching** says that "All is Mind": the universe is mental, and as above, so below. See [The Seven Hermetic Principles](/teachings/the-seven-hermetic-principles).

**I AM.** When Moses asked God's name, God answered: "I AM THAT I AM" (Exodus 3:14). The mystics teach that whatever we place after the words "I am" we claim and call into our life. That is why the Ascended Master teachings of Saint Germain place such power in the "I AM" affirmations and decrees. See [Saint Germain and the Violet Flame](/teachings/saint-germain-and-the-violet-flame).

**Yogananda** wrote a whole book, *Scientific Healing Affirmations* (1924), teaching that words spoken with deep attention, faith and feeling carry the vibration of the soul and can heal the body and the mind.

## Co-creating with the universe
Samadhi teaches that we are always co-creating with God and the universe. When we affirm positive things, always, the universe answers and delivers. We are not victims of life; we are partners in it. Every thought is a seed, and every word is a prayer.

## How to make affirmations powerful
1. **Speak in the present.** Say "I am healthy and full of light", not "I will be healthy". The soul lives in the now.
2. **Make it positive.** Say what you want, not what you don't want: "I am at peace" rather than "I am not anxious."
3. **Feel it.** Feeling is the fire of the affirmation. Feel the joy and gratitude as if it is already done.
4. **Repeat it.** Say it in the morning, before sleep, and whenever the mind drifts. Repetition plants it deep.
5. **Begin with gratitude.** "Thank You, God, that I am..." joins the power of blessing to the power of the word.
6. **Align with love.** Affirm what is good for you and for all. An affirmation that harms no one carries the strength of heaven.
7. **Act on it.** Take one step each day toward what you affirm. The universe meets us when we move.
8. **Let go and trust.** Plant the seed, then trust God's timing and wisdom, as the farmer trusts the rain.

## Affirmations to begin with
- I am a child of God, and divine light flows through me.
- I am grateful for every blessing in my life, and more blessings are coming.
- I am healthy, strong and full of life.
- Love flows to me and through me to everyone I meet.
- Everything I need comes to me at the right time, in the right way.
- I forgive, I am forgiven, and I am free.
- I AM the light of God in action here and now.

## Sources
- King James Bible: Genesis 1:3; Exodus 3:14; Proverbs 18:21 and 23:7; Mark 11:24; John 1:1.
- *The Dhammapada*, translated by F. Max Müller (1881).
- Paramahansa Yogananda, *Scientific Healing Affirmations* (1924).` },

  { slug: "a-day-of-blessing", tag: "Practice", title: "A Day of Blessing: From Waking to Sleep",
    summary: "A simple daily practice that weaves blessing God, gratitude and affirmations through the whole day, from the first breath in the morning to the last thought at night.",
    body: `Blessing, gratitude and affirmation are most powerful when they become a way of living, not just something we do once. Here is a simple path through the day.

## On waking
- Before you open your eyes, give thanks that your soul has returned to you. You can say the Hebrew *Modeh Ani*, or simply: "Thank You, God, for this new day and for my life."
- Take three slow breaths. With each one, bless God: "Blessed are You, source of all life."
- Say your affirmations for the day, in the present, with feeling.

## In the morning
- Bless the water you drink and the food you eat. See light entering it.
- Look at the sky and bless the sun, the source of light, and the One who made it.
- Set one intention: "Today I will bring love and light to everyone I meet."

## Through the day
- Each time something good happens, stop for a moment and say "thank You."
- Each time something difficult happens, breathe and say: "Even in this there is a blessing. Show me the gift."
- Bless the people you meet in silence: "May you be blessed and full of light."
- When worry comes, replace it with an affirmation: "All is well. I am guided and protected."

## In the evening
- Count your blessings: name at least three things you are grateful for today.
- Forgive anyone who hurt you today, and ask forgiveness for any hurt you caused. See [The Power of Forgiveness](/teachings/the-power-of-forgiveness).
- Bless your family, your home, all people, the animals, the plants and the whole earth.

## Before sleep
- Give your soul back to God with trust: "Into thine hand I commit my spirit" (Psalm 31:5).
- Repeat a gentle affirmation as you drift off: "I am loved, I am at peace, and tomorrow is full of blessing."

## A blessing to share
May the Lord bless you and keep you.\\
May the Lord make His face shine upon you, and be gracious unto you.\\
May the Lord lift up His countenance upon you, and give you peace.\\
*(The Priestly Blessing, Numbers 6:24 to 26)*

## Sources
- The practices of the earlier pages in this tab; Psalm 31:5 and Numbers 6:24 to 26.` },
];
