// Spirit in Daily Life: intuition, the power of words, love and marriage, family and children, money and right livelihood,
// service, and why we suffer. Each tradition in its own words; Samadhi's view labelled.
// Quotations: King James Bible; Pickthall's Qur'an (1930); Kahlil Gibran, The Prophet (1923, public domain).

const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;
const series = (n) => `*Spirit in Daily Life · ${n} of 7: [Intuition](/teachings/intuition-the-still-small-voice) · [The Power of Words](/teachings/the-power-of-words) · [Love and Marriage](/teachings/love-and-marriage) · [Family and Children](/teachings/family-and-children) · [Money and Right Livelihood](/teachings/money-and-right-livelihood) · [Service](/teachings/service-love-in-action) · [Why We Suffer](/teachings/why-we-suffer).*`;

// A simple oil lamp with a living flame: the light carried into ordinary life.
function lamp() {
  return `<figure class="cross-hero dl-figure"><svg viewBox="0 0 600 300" role="img" aria-labelledby="dl-t" xmlns="http://www.w3.org/2000/svg"><title id="dl-t">A small clay oil lamp with a gentle golden flame, its light spreading in soft circles across a dark room</title>
<defs><radialGradient id="dl-sky" cx="50%" cy="55%" r="80%"><stop offset="0" stop-color="#2d2146"/><stop offset="1" stop-color="#08070f"/></radialGradient>
<radialGradient id="dl-glow"><stop offset="0" stop-color="#ffe39a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient>
<linearGradient id="dl-clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d79a63"/><stop offset="1" stop-color="#7a4a2a"/></linearGradient>
<radialGradient id="dl-fl" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".5" stop-color="#ffe39a"/><stop offset="1" stop-color="#f29a4a"/></radialGradient></defs>
<rect width="600" height="300" rx="18" fill="url(#dl-sky)"/>
<circle class="sj-breathe" cx="300" cy="150" r="150" fill="url(#dl-glow)"/>
${[60, 100, 140].map((r, i) => `<circle class="dl-ring" style="--d:${i * 2}s" cx="300" cy="160" r="${r}" fill="none" stroke="#ffe39a" stroke-opacity=".18"/>`).join("")}
<path d="M220 210 C230 236 370 236 380 210 C392 206 408 196 414 186 C396 190 380 192 370 192 L230 192 C226 192 218 196 220 210 Z" fill="url(#dl-clay)"/>
<ellipse cx="300" cy="194" rx="72" ry="10" fill="#4a2c18"/>
<g class="dl-flame"><path d="M406 186 C392 168 398 146 410 128 C416 146 430 166 416 186 Z" fill="url(#dl-fl)"/></g>
<text x="300" y="276" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="4" fill="#e6dcf7">SPIRIT IN DAILY LIFE</text>
</svg><figcaption class="fine">A small lamp: the light carried into ordinary days. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}
export function dailyArt(key) { return key === "life-lamp" ? lamp() : ""; }

export const dailyLife = [
  { slug: "intuition-the-still-small-voice", tag: "Spirit in Daily Life · 1", title: "Intuition: The Still Small Voice",
    summary: "The quiet inner knowing that every tradition speaks of: the still small voice, the heart that knows, the inner light. How to tell intuition from fear and wishful thinking, and gentle ways to grow it.",
    body: `{{life-lamp}}

${series(1)}

The prophet Elijah stood on the mountain and waited for God. "A great and strong wind rent the mountains … but the LORD was not in the wind: and after the wind an earthquake; but the LORD was not in the earthquake: and after the earthquake a fire; but the LORD was not in the fire: and after the fire **a still small voice**" (1 Kings 19:11–12). God was in the quiet.

**Intuition** is that quiet inner knowing: the feeling that says *go*, *wait*, *call her today*, *this is not right*, before the mind can explain why.

## What the traditions say
- **Consult your heart (Islam).** A companion of the Prophet came to ask about right and wrong. The Prophet told him to consult his heart: righteousness is what the soul and heart feel at peace with, and sin is what wavers in the soul and troubles the breast, even if people give you their opinions (Hadith 27 of al-Nawawi's *Forty Hadith*, from Ahmad).
- **The inner light (Quakers).** The Quakers wait in silence for the "inner light" of Christ, that of God in every person, to guide them.
- **The third eye (India).** Yoga places intuition at the ***ajna*** chakra, between the eyebrows, the centre of inner sight. See [The Third Eye Chakra](/teachings/chakra-third-eye).
- **Remembering (Plato).** Plato taught that learning is *anamnesis*, remembering what the soul already knew before birth (*Meno*, *Phaedo*). Intuition is the soul remembering.
- **A function of the mind (Jung).** The psychologist Carl Jung named intuition one of the four basic functions of the mind, perception "by way of the unconscious" (*Psychological Types*, 1921).

## Intuition, fear or wishful thinking?
Not every inner voice is intuition. Some gentle tests:
- **Intuition is calm.** It may be firm, but it is not frantic. Fear shouts and rushes; intuition speaks once, quietly, and waits.
- **Intuition is kind.** It never tells you to harm or humiliate anyone. A voice that does is not from the light.
- **Intuition is not what you want to hear.** Wishful thinking always agrees with your desires; intuition sometimes asks you to do the harder thing.
- **Intuition grows clearer when you are rested and honest.** Exhaustion, anger and substances cloud it.
- **Check the important things.** For big decisions, let intuition sit beside reason, wise counsel and time. Never use "my intuition says" to skip a doctor's advice or to ignore facts. See [Discernment](/teachings/discernment).

## Gentle ways to grow it
1. **Be still each day.** Even five minutes of silence opens the space where the small voice can be heard. See [Breath of Peace](/teachings/breath-of-peace).
2. **Notice your body.** A tightening in the stomach, a lightness in the chest: the body often knows first.
3. **Write it down.** Keep a small notebook of hunches. Later, see which ones were right. Trust grows with evidence.
4. **Ask before you sleep.** Hold a question gently as you fall asleep, and notice your first thought on waking. See [Dreams](/teachings/dreams-the-language-of-the-soul).
5. **Act on small nudges.** Call the friend who comes to mind. Intuition grows when it is listened to.

## Samadhi's view
*This is Samadhi's own understanding.*

Intuition is the voice of the soul and of the guides who walk with us. It speaks in a whisper because love never forces. The more we live in gratitude, honesty and stillness, the louder the whisper becomes, until we are guided in every step.${bridge([
      ["Discernment", "/teachings/discernment", "how to tell true guidance from false."],
      ["The Third Eye Chakra", "/teachings/chakra-third-eye", "the centre of inner sight."],
      ["The Power of Words", "/teachings/the-power-of-words", "the next lesson of daily life."],
    ])}

## Sources

- 1 Kings 19:11–12, King James Bible.
- Al-Nawawi, *Forty Hadith*, no. 27 (from Musnad Ahmad).
- Plato, *Meno* and *Phaedo*; C. G. Jung, *Psychological Types* (1921).` },

  { slug: "the-power-of-words", tag: "Spirit in Daily Life · 2", title: "The Power of Words: Speech, Respect and the Vibration of the Tongue",
    summary: "Words carry life or death. The teaching of this path on the vibration of speech and the God who lives in every person, and how the Talmud, the Bible, the Qur'an and the hadith, the Buddha and the Bhagavad Gita all teach respectful, healing speech. With a gentle practice.",
    body: `{{life-lamp}}

${series(2)}

A word takes a second to say and can last a lifetime. A kind word spoken to a child can carry them through hard years; a cruel word can wound them for decades. Every tradition on earth agrees: **"Death and life are in the power of the tongue"** (Proverbs 18:21).

*This page is not written to shame anyone. All of us have spoken words we wish we could take back. It is an invitation to rise: to let our words become blessings.*

## The teaching of this path
*This is Samadhi's view, the teaching of this path. That words carry vibration is offered as spiritual teaching, not as proven science.*

- **Words carry vibration.** Every word we speak sends out an energy. Cursing, profanity and disrespectful words amplify negativity, in us and around us. Loving, kind words raise our energy and the well-being of everyone who hears them.
- **When we curse someone, we curse God.** God lives in every person. When we curse someone out or disrespect them, we are doing it to the God who dwells in them.
- **Shaming weighs on the soul.** When we put someone down and embarrass them, and the blood rushes to their face, we have done something very negative. That moment does not disappear: it weighs on the soul of the one who caused it.

## The traditions that agree
- **Shaming is like shedding blood (Judaism).** The Talmud teaches that whoever shames another person in public is as though they had **shed blood**, and explains why: the face of the one who is shamed first goes red, and then the red leaves it and it turns pale (Bava Metzia 58b). The rabbis went further: it is better to throw oneself into a fiery furnace than to shame another person in public (Bava Metzia 59a). This is exactly the "blood rush" of this path's teaching: the blood that rushes to an embarrassed face is a wound, even if no one can see it bleed.
- **Wounding words and harmful talk (Judaism).** The Torah says, "Ye shall not therefore oppress one another" (Leviticus 25:17), and the rabbis read it as forbidding ***ona'at devarim***, wounding someone with words. ***Lashon hara***, "the evil tongue", is speaking badly about others, even when it is true. In 1873, Rabbi Israel Meir Kagan wrote a whole book on guarding the tongue, and became known by its title, the *Chofetz Chaim*.
- **Death and life (the Bible).** "Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof" (Proverbs 18:21).
- **Blessing and cursing from one mouth (James).** "Therewith bless we God, even the Father; and therewith curse we men, which are made after the similitude of God. Out of the same mouth proceedeth blessing and cursing. My brethren, these things ought not so to be" (James 3:9–10). The tongue is small, James says, but "how great a matter a little fire kindleth!" (James 3:5).
- **Only words that build (Ephesians).** "Let no corrupt communication proceed out of your mouth, but that which is good to the use of edifying, that it may minister grace unto the hearers" (Ephesians 4:29).
- **Speak good or keep silent (Islam).** The Prophet Muhammad said that whoever believes in God and the Last Day should speak good or remain silent (Sahih al-Bukhari 6018; Sahih Muslim 47). He also said that the believer does not taunt, does not curse, and is not obscene or foul-mouthed (Sunan al-Tirmidhi 1977). The Qur'an forbids mocking others, who may be better than the mockers, and insulting one another with names (Qur'an 49:11).
- **Right Speech (Buddhism).** *Right Speech* is the third step of the Buddha's Noble Eightfold Path: to abstain from lying, from divisive speech, from harsh speech and from idle chatter. The Buddha taught that a word well spoken is spoken at the right time, is true, is gentle, is beneficial, and is spoken with a heart of goodwill (*Anguttara Nikaya* 5.198).
- **The austerity of speech (Hinduism).** The Bhagavad Gita calls it a true spiritual discipline, an austerity of speech, to speak words that cause no distress, that are truthful, pleasant and beneficial, and to recite the sacred texts (Bhagavad Gita 17:15).

## Intention matters most
Words are not only sounds; they are carried by the heart behind them. The same word can be a joke between friends or a weapon. The deepest harm is done by **words aimed at a person to make them small**: to humiliate, belittle or shame them. And the deepest healing is done by words that see the light in someone and call it out.

## A gentle practice
1. **Pause before speaking**, especially when you are angry or hurt. One breath can save a friendship.
2. **Ask three questions:** *Is it true? Is it kind? Is it needed?* This modern saying echoes the Buddha's own teaching on well-spoken words.
3. **Never correct someone in front of others** if you can do it privately and gently.
4. **Apologise quickly when you slip.** "I'm sorry, that was not how I want to speak to you" heals more than pride ever could.
5. **Replace cursing with blessing.** When the old words rise up, try a new one: *bless it*, *God help me*, *peace*. Over time the mouth learns a new habit.
6. **Speak blessings on purpose.** Tell someone today what you love about them. See [Blessing God](/teachings/blessing-god) and [The Power of Affirmations](/teachings/the-power-of-affirmations).

## Samadhi's view
*This is Samadhi's own understanding.*

The tongue is a gift from God: with it we pray, we sing, we comfort and we teach. Let us not use the same gift to curse the God who lives in our brothers and sisters. When you speak to anyone, remember who is listening inside them. Choose words that lift, and your own life will lift with them.${bridge([
      ["The Mirror: Seeing God in Every Face", "/teachings/the-mirror-seeing-god-in-every-face", "the God who lives in every person."],
      ["The Golden Rule", "/teachings/the-golden-rule", "speak to others as you wish to be spoken to."],
      ["The Power of Affirmations", "/teachings/the-power-of-affirmations", "words that co-create with the universe."],
      ["Blessing God", "/teachings/blessing-god", "the mouth that blesses."],
      ["Love and Marriage", "/teachings/love-and-marriage", "the next lesson of daily life."],
    ])}

## Sources

- Leviticus 25:17; Proverbs 18:21; Ephesians 4:29; James 3:5–10, King James Bible.
- Babylonian Talmud, [*Bava Metzia* 58b–59a](https://www.sefaria.org/Bava_Metzia.58b); Israel Meir Kagan, *Chofetz Chaim* (1873).
- Sahih al-Bukhari 6018; Sahih Muslim 47; Sunan al-Tirmidhi 1977; Qur'an 49:11.
- *Anguttara Nikaya* 5.198; the Noble Eightfold Path (*Samyutta Nikaya* 45.8); Bhagavad Gita 17:15.` },
  { slug: "love-and-marriage", tag: "Spirit in Daily Life · 3", title: "Love and Marriage: Two Souls on One Path",
    summary: "What the traditions teach about love and marriage: love that is patient and kind, partners as garments and rest for each other, the seven steps, souls who meet again, and the space that keeps love free. With Gibran's wisdom and Samadhi's view.",
    body: `{{life-lamp}}

${series(3)}

Two people meet. Out of billions, these two. They build a home, share bread, face storms, and grow old. In the eyes of the spiritual traditions, **marriage is not only a contract between two people; it is a sacred path, where two souls polish each other** like stones in a river.

## Love as the scriptures describe it
- "**Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil**" (1 Corinthians 13:4–5). (*Charity* here is the old English word for divine love.)
- "**Many waters cannot quench love, neither can the floods drown it**" (Song of Solomon 8:7).
- "**Whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God**" (Ruth 1:16).
- "**And of His signs is this: He created for you helpmeets from yourselves that ye might find rest in them, and He ordained between you love and mercy**" (Qur'an 30:21, Pickthall). The Qur'an also calls spouses "raiment" for each other (2:187): each one covers, protects, warms and beautifies the other.
- The Prophet Muhammad said that **the best of you are those who are best to their families** (Sunan al-Tirmidhi 3895).

## Marriage in the traditions
- **Judaism.** Marriage is *kiddushin*, "sanctification". Under the wedding canopy seven blessings are sung, and the Kabbalists teach that husband and wife together reflect the whole image of God.
- **Christianity.** "They twain shall be one flesh" (Mark 10:8). Many churches see marriage as a sacrament, a channel of God's grace.
- **Hinduism.** In the *saptapadi*, the couple take **seven steps** together around the sacred fire, each step a vow: for nourishment, strength, prosperity, happiness, children, long life and lifelong friendship.
- **Plato's halves.** In Plato's *Symposium*, Aristophanes tells the myth that humans were once whole beings, split in two, and that love is the longing of each half for its other half.
- **Souls who meet again.** Many who teach reincarnation say that partners are often souls who have loved one another before. See [Soul Contracts and Soul Families](/teachings/soul-contracts-and-soul-families).

## The space between
The Lebanese poet **Kahlil Gibran**, in *The Prophet* (1923), wrote: "**Let there be spaces in your togetherness**." He compared a married couple to the pillars of a temple that stand apart, and to the oak and the cypress that do not grow in each other's shadow. True love does not own, control or cage. It lets the other grow.

## Living love every day
- **Speak kindly, especially when tired.** The small words of a normal Tuesday build a marriage more than the big words of a wedding.
- **Forgive quickly, and say sorry first.** Pride is the enemy of every home.
- **Pray or be silent together.** Even a minute of shared gratitude each evening joins two hearts.
- **Keep growing as two souls.** Support each other's dreams, not only each other's duties.
- **Love never asks you to accept abuse.** No spiritual teaching requires anyone to stay in danger. If you are being hurt, please seek help: in the United States, the National Domestic Violence Hotline is **1-800-799-7233**.

## Samadhi's view
*This is Samadhi's own understanding.*

A true partner is a soul who agreed to walk with you and to help you grow, sometimes gently, sometimes by showing you your own reflection. Love God first, and you will know how to love each other; respect each other as two souls, not as owners. The home where there is respect, gratitude and prayer becomes a small temple.${bridge([
      ["Soul Contracts and Soul Families", "/teachings/soul-contracts-and-soul-families", "souls who meet again."],
      ["The Mirror: Seeing God in Every Face", "/teachings/the-mirror-seeing-god-in-every-face", "your partner as a mirror."],
      ["Family and Children", "/teachings/family-and-children", "the next lesson of daily life."],
    ])}

## Sources

- Ruth 1:16; Song of Solomon 8:7; Mark 10:8; 1 Corinthians 13:4–5, King James Bible.
- Qur'an 2:187 and 30:21, Pickthall (1930); Sunan al-Tirmidhi 3895.
- Plato, *Symposium* 189c–193d; the Hindu *saptapadi*; the Jewish *sheva brachot*.
- Kahlil Gibran, [*The Prophet*](https://www.gutenberg.org/ebooks/58585) (1923), "On Marriage".` },

  { slug: "family-and-children", tag: "Spirit in Daily Life · 4", title: "Family and Children: The First School of the Soul",
    summary: "The family as the soul's first school: honouring parents, children as souls who come through us, raising children with love and spirit, and making peace with a difficult family. With Gibran's words on children.",
    body: `{{life-lamp}}

${series(4)}

The first temple any of us enters is a home. The first teachers are our parents; the first classmates our brothers and sisters. **The family is the soul's first school**, where we learn, or fail to learn, to love, to share, to forgive and to be patient.

## Honouring parents
- "**Honour thy father and thy mother**" (Exodus 20:12): the only one of the Ten Commandments that comes with a promise, "that thy days may be long".
- The Qur'an commands kindness to parents, and asks that, when they grow old, we never say even "uff" to them in impatience, but speak to them gracious words and lower to them the wing of humility out of mercy (Qur'an 17:23–24).
- When a man asked the Prophet Muhammad about going out to fight, the Prophet asked whether his mother was living, and told him to stay with her, "for Paradise is at her feet" (Sunan al-Nasa'i 3104).
- **Confucius** placed *xiao*, devotion to parents and family, at the root of all goodness: a person who loves their family learns to love the world (*Analects* 1.2).

## Children are souls, not possessions
Kahlil Gibran, the poet of Lebanon, wrote in *The Prophet* (1923): "**Your children are not your children. They are the sons and daughters of Life's longing for itself.**" They come *through* us, he said, but not *from* us; we may give them our love but not our thoughts, for they have their own. Parents are the bow; the children are living arrows sent forth.

Many traditions that teach reincarnation say the same in another way: **children are souls with their own history**, who chose this family to learn and to teach. Some come wise beyond their years. Parents are their guardians and first teachers, not their owners. See [Planning the Next Life](/teachings/planning-the-next-life).

## Raising children with spirit
"**Train up a child in the way he should go: and when he is old, he will not depart from it**" (Proverbs 22:6). Simple ways, for any faith:
- **Gratitude at the table.** A moment of thanks before meals teaches more than a sermon.
- **A blessing at bedtime.** A prayer, a song, or simply "you are loved".
- **Nature.** Time under the sky, with trees and animals, teaches children that life is sacred.
- **Kindness made visible.** Let them see you give, help and forgive. Children copy what we do, not what we say.
- **Their questions are holy.** "Where was I before I was born?" "Where did grandpa go?" Answer honestly and gently; it is fine to say "I don't know, but this is what I believe".
- **No fear.** Teach God as love, not as a threat.

## When family is difficult
Not every family is a safe place. Honouring parents does **not** mean accepting harm, and loving family does not mean staying silent about abuse. Sometimes love must keep a distance, and forgiveness can be given from afar, in prayer. If a child is in danger, protect them first. And if you are carrying wounds from your own family, you are not alone: many have walked this road, and healing is possible with time, good support and grace.

## Samadhi's view
*This is Samadhi's own understanding.*

Our families are not an accident. The souls in our home are the souls we agreed to meet, to love and to learn with, even the ones who are hard. Children especially are teachers: they come pure, and they show us where our own hearts are closed. Give them love, values and freedom; and give your parents respect and care in their old age. What you give your family returns to you.${bridge([
      ["Soul Contracts and Soul Families", "/teachings/soul-contracts-and-soul-families", "the souls in our family."],
      ["Blessing and Gratitude", "/library?tab=blessing", "gratitude to teach at home."],
      ["Money and Right Livelihood", "/teachings/money-and-right-livelihood", "the next lesson of daily life."],
    ])}

## Sources

- Exodus 20:12; Proverbs 22:6, King James Bible.
- Qur'an 17:23–24; Sunan al-Nasa'i 3104.
- Confucius, *Analects* 1.2.
- Kahlil Gibran, [*The Prophet*](https://www.gutenberg.org/ebooks/58585) (1923), "On Children".` },

  { slug: "money-and-right-livelihood", tag: "Spirit in Daily Life · 5", title: "Money and Right Livelihood: Honest Work as Prayer",
    summary: "What the traditions teach about money and work: right livelihood, honest trade, the danger of loving money, sharing what we are lent, and work as love made visible. Spiritual wisdom, not financial advice.",
    body: `{{life-lamp}}

${series(5)}

Most of our waking life is spent working, and much of our worry is about money. So **if spirituality has nothing to say about work and money, it has little to say about life.** The traditions have a great deal to say. *(This page shares spiritual wisdom, not financial advice.)*

## Money is a tool, not a god
- "**For the love of money is the root of all evil**" (1 Timothy 6:10). Note the words: not money, but the *love* of money.
- "**Ye cannot serve God and mammon**" (Matthew 6:24).
- "**A good name is rather to be chosen than great riches**" (Proverbs 22:1).
- The Qur'an reminds that wealth and children are an adornment of this life, but that good deeds which endure are better in the sight of the Lord (Qur'an 18:46).
- See [The Idols of Today](/teachings/the-idols-of-today): when money becomes what we serve instead of what serves us, it has become an idol.

## Right livelihood
- **The Buddha** made *right livelihood* (*samma ajiva*) the fifth step of the Noble Eightfold Path: earning a living in a way that harms no one. He named five trades a lay follower should not engage in: in weapons, in living beings, in meat, in intoxicants and in poisons (*Anguttara Nikaya* 5.177).
- **Islam** honours honest trade. A hadith says that the truthful, trustworthy merchant will be with the prophets, the truthful and the martyrs (Sunan al-Tirmidhi 1209). Cheating in weights and measures is condemned again and again in the Qur'an.
- **Sikhism** gives three pillars for daily life: ***kirat karni***, earning an honest living by one's own work; ***naam japna***, remembering God; and ***vand chhakna***, sharing with others.
- **Judaism** teaches that the first question asked of a soul after death is: *Did you deal honestly in business?* (Babylonian Talmud, *Shabbat* 31a).
- **The Bhagavad Gita** teaches *karma yoga*: do your work well, as an offering, without being chained to its fruits. "Let right deeds be Thy motive, not the fruit which comes from them" (2:47, Edwin Arnold).

## Work as love made visible
Kahlil Gibran wrote in *The Prophet* (1923): "**Work is love made visible.**" He said that if you bake bread with indifference, you bake a bitter bread that feeds only half a hunger. Any honest work, done with love, becomes prayer: the mechanic, the nurse, the farmer, the salesman, the mother at home.

## Abundance and sharing
- **Everything is lent.** What we have is entrusted to us for a time. See [Charity: Sharing the Blessings We Were Lent](/teachings/charity-sharing-our-blessings).
- **Blessing opens the flow.** The Kabbalists teach that blessing and gratitude open the channels of abundance. See [Blessing and Gratitude](/library?tab=blessing).
- **Give a share.** Many traditions ask for a regular share to be given: the tithe, *zakat*, *dasvandh* (a tenth, among the Sikhs).
- **Enough is a blessing.** Contentment is wealth that no market can take.

## Samadhi's view
*This is Samadhi's own understanding.*

Work honestly, serve your customers as you would serve God, and never build your wealth on another's tears. A steady, honest income that feeds your family and lets you give to others is a great blessing; greed is a prison, however golden. Money is energy: let it flow through you with gratitude and generosity, and it will keep flowing.${bridge([
      ["The Idols of Today", "/teachings/the-idols-of-today", "when money becomes an idol."],
      ["Charity: Sharing the Blessings We Were Lent", "/teachings/charity-sharing-our-blessings", "giving what we were lent."],
      ["Service: Love in Action", "/teachings/service-love-in-action", "the next lesson of daily life."],
    ])}

## Sources

- Proverbs 22:1; Matthew 6:24; 1 Timothy 6:10, King James Bible.
- Qur'an 18:46; Sunan al-Tirmidhi 1209.
- *Anguttara Nikaya* 5.177 (the five trades); Babylonian Talmud, *Shabbat* 31a.
- Bhagavad Gita 2:47, Edwin Arnold, [*The Song Celestial*](https://www.gutenberg.org/ebooks/2388) (1885); Kahlil Gibran, [*The Prophet*](https://www.gutenberg.org/ebooks/58585) (1923), "On Work".` },

  { slug: "service-love-in-action", tag: "Spirit in Daily Life · 6", title: "Service: Love in Action",
    summary: "Seva, the bodhisattva vow, karma yoga, feeding the hungry and serving the least: how every tradition makes service the proof of love, and simple ways to serve every day.",
    body: `{{life-lamp}}

${series(6)}

Prayer lifts the heart to God; **service brings God down to earth**. Every great tradition says that love which never becomes action is not yet love.

## Serving the least
"**Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me**" (Matthew 25:40). Jesus taught that whoever feeds the hungry, gives drink to the thirsty, welcomes the stranger, clothes the naked and visits the sick and the prisoner has served Christ himself. And he washed his disciples' feet: "the Son of man came not to be ministered unto, but to minister" (Mark 10:45).

## Service in every tradition
- **Seva (Sikhism).** Selfless service is at the heart of Sikh life. In every *gurdwara*, the ***langar*** kitchen serves free meals to anyone, of any faith, seated together on the floor as equals. Some serve tens of thousands of people a day.
- **Feeding for the love of God (Islam).** The Qur'an praises those who feed the poor, the orphan and the captive for the love of God, saying that they seek no reward or thanks, only God's face (Qur'an 76:8–9). Giving *zakat* is one of the five pillars.
- **The bodhisattva (Buddhism).** The bodhisattva vows to remain in the world until every being is free. The poet-monk Shantideva prayed to be a doctor for the sick, food for the hungry, a bridge for those who wish to cross, and a lamp for those in darkness (*Bodhicaryavatara* 3).
- **Karma yoga (Hinduism).** The Gita teaches that work done for the good of all, without selfish attachment, frees the soul. Swami Vivekananda taught that to serve human beings is to serve God in them.
- **Tikkun olam (Judaism).** Every good deed helps to mend the world.
- **The Masters.** The Ascended Masters, the Rosicrucians and the Martinists alike say that the true initiate is known by service, not by titles.

## Simple ways to serve, every day
- **Listen** to someone without looking at your phone.
- **Help a neighbour**: carry the shopping, fix the gate, visit the lonely.
- **Give at work**: your patience, your honesty, your best effort.
- **Feed someone.** Share a meal; support a food bank.
- **Serve in silence.** The right hand need not know what the left is doing (Matthew 6:3).
- **Serve yourself too.** Rest when you need it. You cannot pour from an empty cup.

## Samadhi's view
*This is Samadhi's own understanding.*

Service is the quickest road home. When you serve another soul, you serve God in them, and you balance karma faster than any ritual can. The masters are masters because they serve. Start small: one kindness a day, done with love, will change your life and someone else's.${bridge([
      ["Charity: Sharing the Blessings We Were Lent", "/teachings/charity-sharing-our-blessings", "giving what we were lent."],
      ["The Golden Rule", "/teachings/the-golden-rule", "the rule every faith shares."],
      ["Why We Suffer", "/teachings/why-we-suffer", "the last lesson of daily life."],
    ])}

## Sources

- Matthew 6:3 and 25:31–40; Mark 10:45; John 13:1–17, King James Bible.
- Qur'an 76:8–9; the Sikh tradition of *seva* and *langar*.
- Shantideva, *Bodhicaryavatara* 3; Swami Vivekananda, *Karma Yoga* (1896); Bhagavad Gita 3.` },

  { slug: "why-we-suffer", tag: "Spirit in Daily Life · 7", title: "Why We Suffer",
    summary: "The oldest question of all. How the Buddha, the Book of Job, the Gospels, the Qur'an and the teachings of karma and Earth school answer it, what suffering is not, and how to carry it so that it does not harden the heart.",
    body: `{{life-lamp}}

${series(7)}

Sooner or later, every heart asks: **why?** Why illness, loss, betrayal, war, a child in pain? No answer takes the pain away, and anyone who answers too quickly has not suffered much. But the traditions have sat with this question for thousands of years, and they offer light for the road.

## What the traditions say
- **The Buddha.** The first Noble Truth is simply that life contains ***dukkha***, suffering and unease. The second is that it is fed by craving and clinging. The third is that it can end. The fourth is the path that ends it. The Buddha did not ask "why me?", but "how can it be healed?" See [The Buddha's Way](/teachings/the-buddhas-way).
- **Job.** The Book of Job refuses easy answers. Job's friends insist he must have sinned; God rebukes the friends. Job is never told why he suffered, but he meets God in the whirlwind, and that meeting is enough.
- **Patience that grows hope (Christianity).** "**Tribulation worketh patience; and patience, experience; and experience, hope**" (Romans 5:3–4). On the cross, God himself enters human suffering: the Christian faith holds that we never suffer alone.
- **Ease with hardship (Islam).** "**But lo! with hardship goeth ease. Lo! with hardship goeth ease**" (Qur'an 94:5–6, Pickthall). Trials are tests that purify the soul, and the patient are given good tidings: "Lo! we are Allah's and lo! unto Him we are returning" (Qur'an 2:156, Pickthall).
- **Karma (India).** What we sow, we reap, across lives. Suffering can be the ripening of old seeds; and how we meet it plants new ones. See [Reincarnation and Karma](/teachings/reincarnation-and-karma).
- **Free will.** Much suffering is caused not by God but by human choices: violence, greed, neglect. A world where love is free is a world where harm is possible too.
- **Earth school.** Many teachers say that the soul came here to grow, and that some of its deepest lessons, compassion, strength, humility, can only be learned through difficulty. See [Earth School](/teachings/earth-school).

## What suffering is not
- **It is not proof that God has abandoned you.** Every saint knew dark nights.
- **It is not always a punishment.** The disciples asked Jesus whether a man born blind had sinned, or his parents; he answered that neither had (John 9:1–3).
- **It is never a reason to blame the one who suffers.** Karma is never an excuse to look away from someone in pain. Our task is to help.

## Carrying suffering without hardening
- **Let yourself feel it.** Tears are not a lack of faith.
- **Do not carry it alone.** Speak to someone you trust; seek a doctor, a counsellor or a faith community. If you are in crisis, in the United States you can call or text **988**.
- **Ask a new question.** Not only "why?", but "what now?", and "what can this teach me about love?"
- **Let it soften you, not harden you.** Those who have suffered often become the most compassionate healers.
- **Remember it passes.** "This too shall pass", an old saying often traced to the Persian poets, is true of joy and pain alike.

## Samadhi's view
*This is Samadhi's own understanding.*

Earth is the toughest school, and suffering is part of its lessons, never a punishment from a loving God. Often our soul agreed to the hard class before we were born, because it wanted to grow fast. What we resist, we repeat; what we accept with love, we pass. And every pain met with love becomes light, for ourselves and for others.${bridge([
      ["Fear, Ego and Grief", "/teachings/fear-ego-and-grief", "how the traditions answer pain."],
      ["Earth School", "/teachings/earth-school", "why this world is a school."],
      ["The Soul's Journey", "/teachings/death-is-a-doorway", "what lies beyond this life."],
    ])}

## Sources

- John 9:1–3; Romans 5:3–4; the Book of Job, King James Bible.
- Qur'an 2:156 and 94:5–6, Pickthall (1930).
- The Buddha, *Dhammacakkappavattana Sutta* (the Four Noble Truths).` },
];
