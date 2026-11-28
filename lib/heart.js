// The Heart and the Ego: three teachings in the Teachings tab.
// No names of any politician, party or country. Every tradition in its own words.
// Quotations: King James Bible; Pickthall's Qur'an (1930); Legge's Tao Te Ching (1891); Max Müller's
// Dhammapada (1881); hadith from Sahih al-Bukhari and Sahih Muslim. Facts checked Nov 2026.

// A golden heart of light, breathing softly, for the top of each page in the series (no religious symbol).
const scroll = (lines, label) => `<figure class="about-scroll judge-scroll" aria-label="${label}"><img class="as-roll" src="/images/about-scroll-top.png" width="800" height="133" alt="" aria-hidden="true"><div class="as-unroll"><div class="as-inner"><div class="as-text as-poem">${lines.map((l) => (l ? `<p>${l}</p>` : `<p class="as-gap" aria-hidden="true"></p>`)).join("")}</div></div></div><img class="as-roll as-roll-bot" src="/images/about-scroll-bot.png" width="800" height="132" alt="" aria-hidden="true"></figure>`;
const JUDGE_OPEN = ["Before you name another,", "look again.", "", "The face you are judging", "was made by the same Light", "that made yours.", "", "There is no one in front of you", "who is not, somehow,", "the One."];
const JUDGE_CLOSE = ["May I see You in every face,", "and every face in You.", "", "May my eyes be kind,", "my words be clean,", "and my heart be one", "with all that lives.", "", "Amen. Amin. Om. Shalom."];
const JUDGE_PRACTICE = `<aside class="judge-practice gk-frame"><p class="eyebrow">Today's practice</p><p class="jp-main">Today, practise seeing the Divine in one person you usually judge.</p><ul><li>Choose one person: a colleague, a neighbour, a stranger online, someone in your own family.</li><li>When the judgment rises, pause and breathe once. Silently say: <em>"You too were made by the Light."</em></li><li>Ask yourself gently: <em>What in me is this touching? Where have I not yet been kind to that same thing in myself?</em></li><li>Tonight, before sleep, wish that person one good thing, sincerely, by name.</li></ul></aside>`;

export function heartArt(key) {
  if (key === "heart-scroll-open") return scroll(JUDGE_OPEN, "An opening poem, written on an ancient scroll");
  if (key === "heart-scroll-close") return scroll(JUDGE_CLOSE, "A closing blessing, written on an ancient scroll");
  if (key === "heart-practice") return JUDGE_PRACTICE;
  // Samadhi's own pictures for The Ego: The Veil and the Teacher (Nov 28, 2026).
  if (key === "heart-ego-teacher") return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/ego-teacher.jpg" width="1600" height="900" alt="A wise old teacher in simple robes, in a stone room lit by an oil lamp, wiping the word EGO from a slate board on a wooden stand and writing the word LOVE beneath it in chalk" loading="lazy" decoding="async"></div><figcaption class="fine">The teacher wipes away EGO and writes LOVE. Picture shared by Samadhi.</figcaption></figure>`;
  if (key === "heart-ego-well") return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/bucket-and-well.jpg" width="1600" height="900" alt="An old stone well in a village courtyard at sunrise, a wooden bucket on a rope at its edge, stone houses and an olive tree behind" loading="lazy" decoding="async"></div><figcaption class="fine">The bucket and the well at sunrise. Picture shared by Samadhi.</figcaption></figure>`;
  if (key === "heart-ego-plaque") return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/evil-live-plaque.jpg" width="1600" height="900" alt="An ancient bronze plaque with a Greek-key border, engraved in gold: Evil is only Live spelled backward. When we stop feeding the reverse and choose Love instead, the illusion dissolves and we simply Live, in peace, as one, as the Light we already are. Samadhi" loading="lazy" decoding="async"></div><figcaption class="fine">Samadhi's words, engraved in bronze. Picture shared by Samadhi.</figcaption></figure>`;
  if (key === "heart-love-plaque") return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/gods-love-plaque.jpg" width="1600" height="900" alt="An ancient bronze plaque with a carved border and a candle on each side, engraved in gold: God&#39;s love is not earned, not measured, and never withdrawn. It shines equally on every soul, the saint and the sinner, the seeker and the lost, for all are one in the Light that has no opposite. To rest in that love is to remember we were never apart. Samadhi" loading="lazy" decoding="async"></div><figcaption class="fine">Samadhi's words, engraved in bronze. Picture shared by Samadhi.</figcaption></figure>`;
  if (key === "heart-veils-plaque") return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/veils-plaque.jpg" width="1600" height="900" alt="An ancient bronze plaque with a lotus border and candles, engraved in gold: We place curtains and layers of darkness upon our divine light. Yet no matter how much we cover it, the light never turns off; it only shines brighter as we remove the dark veils we ourselves created. Love is the chisel and the hammer. Love is the burning fire that opens the doors. Samadhi" loading="lazy" decoding="async"></div><figcaption class="fine">Samadhi's words, engraved in bronze. Picture shared by Samadhi.</figcaption></figure>`;
  if (key === "heart-eternal-plaque") return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/eternal-plaque.jpg" width="1600" height="900" alt="An ancient bronze plaque with a carved border and candles, engraved in gold: We are eternal, immortal, non-carnal, non-dual, free of all imperfection. We are simply on a journey of self-discovery, evolving the soul toward infinite potential. Samadhi" loading="lazy" decoding="async"></div><figcaption class="fine">Samadhi's words, engraved in bronze. Picture shared by Samadhi.</figcaption></figure>`;
  if (key !== "heart-emblem") return "";
  // Samadhi's own picture: the heart of light, gently beating.
  return `<figure class="cross-hero sl-photo he-photo"><div class="sl-photo-frame"><img class="he-photo-beat" src="/images/heart-light.jpg" width="1600" height="900" alt="A heart made of golden light shining in the clouds, with rays of light streaming out in every direction" loading="lazy" decoding="async"></div><figcaption class="fine">The heart of light that every faith speaks of. Picture shared by Samadhi.</figcaption></figure>`;
  const rays = Array.from({ length: 36 }, (_, i) => { const a = (i * 10 * Math.PI) / 180, r1 = i % 2 ? 92 : 84, r2 = i % 2 ? 150 : 175; return `<line x1="${(300 + r1 * Math.cos(a)).toFixed(1)}" y1="${(170 + r1 * Math.sin(a)).toFixed(1)}" x2="${(300 + r2 * Math.cos(a)).toFixed(1)}" y2="${(170 + r2 * Math.sin(a)).toFixed(1)}"/>`; }).join("");
  const heart = "M300 250 C240 205 196 172 196 128 C196 96 220 74 250 74 C274 74 291 88 300 106 C309 88 326 74 350 74 C380 74 404 96 404 128 C404 172 360 205 300 250 Z";
  return `<figure class="cross-hero he-figure"><svg viewBox="0 0 600 340" role="img" aria-labelledby="he-t" xmlns="http://www.w3.org/2000/svg"><title id="he-t">A golden heart of light, softly breathing, with rays shining out in every direction</title>
<defs><radialGradient id="he-sky" cx="50%" cy="45%" r="80%"><stop offset="0" stop-color="#4e4024"/><stop offset="1" stop-color="#0d0b08"/></radialGradient>
<radialGradient id="he-glow"><stop offset="0" stop-color="#fff3c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
<radialGradient id="he-gold" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".35" stop-color="#ffe39a"/><stop offset=".8" stop-color="#f2c46d"/><stop offset="1" stop-color="#b8862f"/></radialGradient></defs>
<rect width="600" height="340" rx="18" fill="url(#he-sky)"/>
${[[60, 50], [540, 70], [110, 280], [500, 300], [40, 180], [570, 200], [180, 36], [430, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff" opacity=".7"/>`).join("")}
<g class="he-rays" stroke="#ffe39a" stroke-width="1.4" stroke-linecap="round" opacity=".45">${rays}</g>
<circle cx="300" cy="165" r="150" fill="url(#he-glow)"/>
<g class="he-beat"><path d="${heart}" fill="url(#he-gold)" stroke="#fff3c4" stroke-width="2"/>
<path d="M232 118 C236 100 250 92 264 94" fill="none" stroke="#fffbe8" stroke-width="5" stroke-linecap="round" opacity=".8"/></g>
<text x="300" y="316" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="4" fill="#d9cfee">THE HEART AND THE EGO</text>
</svg><figcaption class="fine">The heart of light that every faith speaks of. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

const series = `*Part of the series **The Heart and the Ego**: [Give Your Soul Only to God](/teachings/give-your-soul-only-to-god) · [The Idols of Today](/teachings/the-idols-of-today) · [Charity: Sharing the Blessings We Were Lent](/teachings/charity-sharing-our-blessings) · [The Mirror: Seeing God in Every Face](/teachings/the-mirror-seeing-god-in-every-face).*`;
const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;

export const heartAndEgo = [
  { slug: "give-your-soul-only-to-god", tag: "The Heart and the Ego", title: "Give Your Soul Only to God",
    summary: "No human being deserves the devotion that belongs to God alone. Why blind loyalty to any leader is a spiritual trap, how to recognise religion used for power by its fruits, and the one-eyed deceiver as a symbol.",
    body: `{{heart-emblem}}

${series}

In many places, crowds have chanted to a leader: *with our soul, with our blood, we give ourselves for you.* The words may be sincere, but the soul does not belong to any human being. It came from God and it returns to God. To hand it to a man, however powerful, is to place him where only God should be.

## What every tradition teaches
- **The Torah:** "Thou shalt have no other gods before me" (Exodus 20:3).
- **The Psalms:** "Put not your trust in princes, nor in the son of man, in whom there is no help" (Psalm 146:3). And Jeremiah: "Cursed be the man that trusteth in man, and maketh flesh his arm, and whose heart departeth from the LORD" (Jeremiah 17:5).
- **The Gospel:** "Beware of false prophets, which come to you in sheep's clothing, but inwardly they are ravening wolves. Ye shall know them by their fruits" (Matthew 7:15–16).
- **The Qur'an** describes the day when "those who were followed disown those who followed (them)" (Qur'an 2:166, Pickthall): the leaders cannot save the ones who gave everything for them. And it warns against the most hidden idol of all: "Hast thou seen him who chooseth for his god his own lust?" (Qur'an 25:43).
- **The Prophet Muhammad** taught: "There is no obedience in disobedience to God; obedience is only in what is good" (Sahih al-Bukhari 7257).
- **The Buddha** told the Kalamas not to accept anything only because of tradition, scripture or the authority of a teacher, but to test it themselves: what leads to harm and suffering, abandon; what leads to welfare and happiness, follow (Kalama Sutta, Anguttara Nikaya 3.65).

## Religion used for power
Faith is the most precious thing people have, and that is why it is so often misused. When anyone, of any religion, uses God's name to spread hatred, fear or division, to send others to suffer or die while they stay safe, or to gather power and wealth for themselves, the tradition itself gives the test: **look at the fruits.**
- True faith bears **love, mercy, humility, justice and peace.**
- Faith misused bears **hatred, fear, pride and division.**

Jesus said of such teachers: "they say, and do not" (Matthew 23:3). The prophets of Israel spoke against those who honour God with their lips while their hearts are far from Him (Isaiah 29:13).

## The one-eyed deceiver
The Prophet Muhammad described the great deceiver of the last days, the *Dajjal*, as blind in one eye (Sahih al-Bukhari). Christianity speaks of the Antichrist, who comes in the guise of what is holy. Many spiritual teachers read the one eye as a symbol: **a vision of the world that sees only the material side**, power, money and the self, and is blind to the spirit. Whoever leads people with that one eye, whatever title he carries, leads them away from God.

## A mirror, not a weapon
This teaching is not meant for pointing at others. Every one of us can give our soul to the wrong master: a leader, a group, money, anger or our own ego. The question for each reader is simple: *Who, or what, have I given my heart to?*

## Samadhi's view
*This is Samadhi's own understanding.*

When people cry that they will give their blood and their soul for a leader, it is like selling the soul. Many who rise to power under the banner of religion see with only one eye: they see themselves, and they use people for their own gain. That is the way of darkness, and it only creates more suffering. The soul is God's alone. Give your love to God, your service to people, and your soul to no one but its Creator.${bridge([
      ["Peace in the Land of God", "/teachings/peace-in-the-land-of-god", "why no one wins through fighting and killing."],
      ["Prophets and Teachers", "/teachings/prophets-and-teachers", "the true messengers, known by their fruits."],
      ["The Idols of Today", "/teachings/the-idols-of-today", "money, status and pride as hidden idols."],
    ])}

## Sources

- Exodus 20:3; Psalm 146:3; Isaiah 29:13; Jeremiah 17:5; Matthew 7:15–16 and 23:3, King James Bible.
- Qur'an 2:166 and 25:43, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=2&verse=166).
- Sahih al-Bukhari 7257 (obedience only in what is good) and the hadith of the Dajjal.
- *Kalama Sutta*, Anguttara Nikaya 3.65.` },

  { slug: "the-idols-of-today", tag: "The Heart and the Ego", title: "The Idols of Today",
    summary: "Idols are no longer only statues. When money, status or even our children become the proof that we are better than others, a blessing has become an idol. What every tradition teaches about gratitude, humility and true blessing.",
    body: `{{heart-emblem}}

${series}

In the old stories, idols were made of stone and gold. Abraham broke the idols in his father's house; Moses came down the mountain to find his people dancing around a golden calf (Exodus 32). Today the idols are less visible, but no less real: **money, status, power, appearance, and the pride we take in what we own.**

## Blessing or proof?
Many people believe that if they have wealth and children, it proves God is pleased with them, and that the poor or the childless must have displeased Him. The scriptures say clearly that this is not so.
- **The Qur'an:** "Wealth and children are an ornament of life of the world. But the good deeds which endure are better in thy Lord's sight" (Qur'an 18:46, Pickthall). "Your wealth and your children are only a temptation" (64:15): a test, not a medal.
- **The Book of Job** was written to answer exactly this. Job lost his wealth and his children, and his friends insisted he must have sinned. God Himself told them they were wrong (Job 42:7). Job's words remain: "the LORD gave, and the LORD hath taken away; blessed be the name of the LORD" (Job 1:21).
- **Jesus:** "a man's life consisteth not in the abundance of the things which he possesseth" (Luke 12:15). He told of the rich man who built bigger barns and planned to take his ease, and God said to him: "Thou fool, this night thy soul shall be required of thee" (Luke 12:20).

## When a blessing becomes an idol
- **When it replaces God.** "Ye cannot serve God and mammon" (Matthew 6:24). Paul calls greed "covetousness, which is idolatry" (Colossians 3:5), and writes that "the love of money is the root of all evil" (1 Timothy 6:10): not money itself, but the love of it.
- **When it fills us with pride.** The Qur'an tells of two men with gardens; one boasted, "I am more than thee in wealth, and stronger in respect of men", and his garden was destroyed in a night (Qur'an 18:32–44). It also says: "Turn not thy cheek in scorn toward folk, nor walk with pertness in the land" (31:18). "Pride goeth before destruction" (Proverbs 16:18).
- **When it never ends.** "Rivalry in worldly increase distracteth you until ye come to the graves" (Qur'an 102:1–2). The Bhagavad Gita describes the restless mind that says: this I have gained today, that I shall gain tomorrow; this wealth is mine, and more shall be mine (Gita 16:13).
- **When it makes us forget the giver.** Everything we have was lent to us. We came into the world with nothing and leave with nothing.

## The way back
- **Gratitude.** Thank God for every gift, and remember that it is a gift.
- **Contentment.** "He who is satisfied with his lot is rich" (Tao Te Ching 33, Legge).
- **Humility.** Treat every person, rich or poor, with the same respect. In God's eyes the only rank is the heart.
- **Sharing.** The surest cure for the idol of money is to give some of it away. See [Charity: Sharing the Blessings We Were Lent](/teachings/charity-sharing-our-blessings).

## Samadhi's view
*This is Samadhi's own understanding.*

Many people think that because they have children and money, they are the blessed ones. Then they lose their faith and treat others from above. But a blessing that makes you proud has already turned into a test you are failing. True blessing is a heart that stays humble, grateful and kind, whatever it has or does not have.${bridge([
      ["Abraham (Ibrahim)", "/teachings/abraham", "the one who broke the idols."],
      ["Give Your Soul Only to God", "/teachings/give-your-soul-only-to-god", "the idol of blind loyalty."],
      ["The Buddha's Way", "/teachings/the-buddhas-way", "craving as the root of suffering."],
    ])}

## Sources

- Exodus 32; Job 1:21 and 42:7; Proverbs 16:18; Matthew 6:24; Luke 12:15–21; Colossians 3:5; 1 Timothy 6:10, King James Bible.
- Qur'an 18:32–44, 18:46, 31:18, 64:15 and 102:1–2, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=18&verse=46).
- *Bhagavad Gita* 16:13–15; *Tao Te Ching* 33, translated by James Legge (1891).` },

  { slug: "charity-sharing-our-blessings", tag: "The Heart and the Ego", title: "Charity: Sharing the Blessings We Were Lent",
    summary: "Every faith calls us to share: tzedakah, zakat, sadaqa, dana and seva. How to give in secret, without pride and with dignity, why giving does not make us poorer, and why we must never look down on anyone in need.",
    body: `{{heart-emblem}}

${series}

What we have is not truly ours. It was lent to us by God for a time, and part of it was always meant for others. That is why every tradition places **giving** at the heart of the spiritual life.

## What every tradition teaches
- **Judaism:** the Hebrew word for charity, ***tzedakah***, comes from *tzedek*, **justice**. Giving to the poor is not a favour; it is putting right what is owed. "He that hath pity upon the poor lendeth unto the LORD; and that which he hath given will he pay him again" (Proverbs 19:17).
- **Christianity:** "I was an hungred, and ye gave me meat... Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me" (Matthew 25:35, 40). "It is more blessed to give than to receive" (Acts 20:35), and "God loveth a cheerful giver" (2 Corinthians 9:7).
- **Islam:** ***zakat***, a yearly share of one's wealth for those in need, is one of the five pillars of faith, and ***sadaqa*** is any freely given kindness. The Prophet taught that "charity does not decrease wealth" (Sahih Muslim 2588), and that even a smile for your brother is charity (Tirmidhi). The Qur'an praises those who feed the needy, the orphan and the prisoner, saying: "We feed you, for the sake of Allah only. We wish for no reward nor thanks from you" (Qur'an 76:8–9, Pickthall).
- **Hinduism:** ***dana***, giving. The Upanishad teaches: give with faith, give with plenty, give with modesty (Taittiriya Upanishad 1.11.3). The Gita calls the purest gift one given as a duty, at the right time, to one in need, expecting nothing back (Gita 17:20).
- **Buddhism:** *dana* is the first of the perfections on the path to awakening.
- **Sikhism:** ***vand chakna***, sharing what you earn, is one of the three pillars of Guru Nanak's way, and many Sikhs give a tenth (*dasvandh*). The free kitchen, the *langar*, feeds everyone who comes.

## How to give
- **In secret.** "When thou doest alms, let not thy left hand know what thy right hand doeth" (Matthew 6:3). "If ye hide it and give it to the poor, it will be better for you" (Qur'an 2:271).
- **Without pride or reproach.** "Render not vain your almsgiving by reproach and injury" (Qur'an 2:264). A gift given with a look of contempt wounds more than it helps.
- **With dignity for the one who receives.** The great Jewish teacher Maimonides set out eight levels of giving. Near the top: giving so that neither giver nor receiver knows the other. And the highest of all: **helping a person stand on their own**, with a loan, a partnership or work, so they will not need to ask again (Mishneh Torah, Gifts to the Poor 10:7–14).
- **With what we have.** Money, food, time, skill, a kind word, a listening ear: all of it is charity.

## Never look down on anyone in need
The person asking for help is not lower than us. He is a child of the same God, and he may be closer to God than we are. "There but for the grace of God go I," says an old saying: life can change in a single day, and any one of us could be the one in need.

**A word of care.** Some have twisted the teaching of karma to say that the poor *deserve* their poverty because of past lives, and used it to look down on them. That is the opposite of every true teaching. Whatever the reasons for a person's suffering are known only to God; our part is only compassion. The Buddha, Jesus, the Prophet and Guru Nanak all sat with the poor.

## Samadhi's view
*This is Samadhi's own understanding.*

We must share our blessings with others, because in the next life we could be the ones in need. If we look down on a beggar with ego today, in another lifetime we could be that beggar. The soul learns from both sides of the hand: the hand that gives and the hand that receives. So give with love, and with humility, as if you were giving to your own future self, and to God.${bridge([
      ["Reincarnation and Karma", "/teachings/reincarnation-and-karma", "the soul's many lives and the law of cause and effect."],
      ["The Golden Rule: One Law in Every Faith", "/teachings/the-golden-rule", "treat others as you would be treated."],
      ["Guru Nanak", "/teachings/guru-nanak", "honest work, sharing and the free kitchen."],
      ["The Idols of Today", "/teachings/the-idols-of-today", "when blessings become idols."],
    ])}

## Sources

- Proverbs 19:17; Matthew 6:3 and 25:35–40; Acts 20:35; 2 Corinthians 9:7, King James Bible.
- Qur'an 2:264, 2:271 and 76:8–9, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=76&verse=8); Sahih Muslim 2588; Jami' at-Tirmidhi 1956.
- *Taittiriya Upanishad* 1.11.3; *Bhagavad Gita* 17:20.
- Maimonides, *Mishneh Torah*, Laws of Gifts to the Poor 10:7–14.` },

  { slug: "the-mirror-seeing-god-in-every-face", tag: "The Heart and the Ego", title: "The Mirror: Seeing God in Every Face",
    summary: "Look at anyone as if you are looking in a mirror, and look at everyone as if you are looking at God. What the traditions teach about seeing ourselves and the Divine in others, why hatred wounds the one who hates, and a simple daily practice.",
    body: `{{heart-emblem}}

${series}

Every person you meet is a mirror. In their face you can see yourself, and, if you look deeply enough, you can see God. The great traditions teach this in many words, and when it is truly seen, hatred has nowhere left to stand.

## What every tradition teaches
- **The Upanishads:** "he who beholds all beings in the Self, and the Self in all beings, he never turns away from it" (Isha Upanishad 6, Max Müller): the Sanskrit says he feels no aversion toward anyone. "What sorrow, what trouble can there be to him who once beheld that unity?" (verse 7).
- **The Bhagavad Gita:** the one whose heart is joined in yoga sees the Self in all beings and all beings in the Self, and feels the joy and pain of others as his own (Gita 6:29–32).
- **The Torah:** every human being is made "in the image of God" (Genesis 1:27). "The stranger that dwelleth with you shall be unto you as one born among you, and thou shalt love him as thyself; for ye were strangers in the land of Egypt" (Leviticus 19:34). *You were once the stranger*: remember it, and love.
- **The Gospel:** "Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me" (Matthew 25:40). "If a man say, I love God, and hateth his brother, he is a liar: for he that loveth not his brother whom he hath seen, how can he love God whom he hath not seen?" (1 John 4:20).
- **The Qur'an:** "O mankind! Lo! We have created you male and female, and have made you nations and tribes that ye may know one another. Lo! the noblest of you, in the sight of Allah, is the best in conduct" (Qur'an 49:13, Pickthall). Different peoples and paths are a test of goodness, not a reason for war: "So vie one with another in good works" (5:48).
- **The Prophet Muhammad:** "The believer is the mirror of his brother" (Sunan Abu Dawud 4918).
- **The Buddha:** "hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule" (Dhammapada 5, Max Müller).
- **The Sikh scripture:** "No one is my enemy, and no one is a stranger. I get along with everyone" (Guru Granth Sahib, Ang 1299).
- **The Indian greeting *namaste*** means "I bow to you", and is often understood as: the Divine in me honours the Divine in you.

## Hatred wounds the one who hates
Hatred feels like a weapon aimed at another, but it lives inside the one who carries it. It hardens the heart, darkens the mind and closes the door to God. The Buddhist teacher Buddhaghosa compared anger to picking up a burning ember to throw at someone: the first hand it burns is your own (*Visuddhimagga* 9.23). To hate a whole religion, a whole people or a whole country is to hate countless souls you have never met, every one of them made in the image of the same God.

## Samadhi's view
*This is Samadhi's own understanding.*

What you hate, you experience. If you hate another belief, another religion or even another country, your next lesson, and even your next life, may be inside it, so that you come to know it from within and learn to love it. Every soul you hate is a lesson in love waiting for you, so why not learn it now? Look at anyone as if you are looking in the mirror: that person is you. Look at everyone as if you are looking at God, because God is there, in every face.

## A practice for every day
1. **Once a day, look at someone you find difficult**, in person or in your mind.
2. **Breathe slowly**, and silently say: *"You are me. You are God's."*
3. **Notice what softens** in you, even a little.
4. **Before sleep**, think of one people, faith or country you have judged, and send them a simple blessing: *"May you be at peace."*

Little by little, the mirror becomes clear.${bridge([
      ["Peace in the Land of God", "/teachings/peace-in-the-land-of-god", "shalom and salaam, one word."],
      ["Reincarnation and Karma", "/teachings/reincarnation-and-karma", "the soul's many lives and lessons."],
      ["The Golden Rule: One Law in Every Faith", "/teachings/the-golden-rule", "treat others as yourself."],
      ["Give Your Soul Only to God", "/teachings/give-your-soul-only-to-god", "faith known by its fruits."],
    ])}

## Sources

- *Isha Upanishad* 6–7, translated by F. Max Müller, *Sacred Books of the East*, vol. 1 (1879); *Bhagavad Gita* 6:29–32.
- Genesis 1:27; Leviticus 19:34; Matthew 25:40; 1 John 4:20, King James Bible.
- Qur'an 5:48 and 49:13, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=49&verse=13); Sunan Abu Dawud 4918.
- *The Dhammapada*, verse 5, translated by F. Max Müller (1881); Buddhaghosa, *Visuddhimagga* 9.23; Guru Granth Sahib, [Ang 1299](https://searchgurbani.com/guru-granth-sahib/ang/1299).` },
];
