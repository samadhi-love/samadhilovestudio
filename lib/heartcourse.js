// The Heart and the Ego: one course on how we treat others. Existing pages are moved here by slug
// (their addresses do not change); these four are new: Greed, Envy and Jealousy, Competition,
// Hate and Bad Wishes. Each tradition in its own words; Samadhi's view labelled; no shaming of readers.
// Quotations: King James Bible; Pickthall's Qur'an (1930). Checked Nov 2026.

export const HEART_ORDER = [
  "the-ego-the-veil-and-the-teacher", "fear-ego-and-grief", "give-your-soul-only-to-god", "the-idols-of-today",
  "greed-wanting-more-than-we-need", "envy-and-jealousy", "competition-and-rivalry", "hate-and-bad-wishes",
  "black-magic-and-the-law-of-return",
  "the-power-of-words", "on-judgment", "the-mirror-seeing-god-in-every-face", "the-golden-rule", "the-power-of-forgiveness", "charity-sharing-our-blessings",
];
const T = {
  "the-ego-the-veil-and-the-teacher": "The Ego", "fear-ego-and-grief": "Fear, Ego and Grief", "give-your-soul-only-to-god": "Give Your Soul Only to God", "the-idols-of-today": "The Idols of Today",
  "greed-wanting-more-than-we-need": "Greed", "envy-and-jealousy": "Envy and Jealousy", "competition-and-rivalry": "Competition", "hate-and-bad-wishes": "Hate and Bad Wishes",
  "black-magic-and-the-law-of-return": "The Law of Return", "the-power-of-words": "The Power of Words", "on-judgment": "On Judgment", "the-mirror-seeing-god-in-every-face": "The Mirror",
  "the-golden-rule": "The Golden Rule", "the-power-of-forgiveness": "Forgiveness", "charity-sharing-our-blessings": "Charity",
};
export const heartCourse = (slug) => {
  const n = HEART_ORDER.indexOf(slug) + 1;
  return `*The Heart and the Ego · lesson ${n} of ${HEART_ORDER.length}. The root: ${HEART_ORDER.slice(0, 4).map((s) => `[${T[s]}](/teachings/${s})`).join(" · ")}. The faces of the ego: ${HEART_ORDER.slice(4, 8).map((s) => `[${T[s]}](/teachings/${s})`).join(" · ")}. The law: [${T[HEART_ORDER[8]]}](/teachings/${HEART_ORDER[8]}). The healing: ${HEART_ORDER.slice(9).map((s) => `[${T[s]}](/teachings/${s})`).join(" · ")}.*`;
};
const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;

export const heartFaces = [
  { slug: "the-ego-the-veil-and-the-teacher", tag: "The Heart and the Ego · 1", title: "The Ego: The Veil and the Teacher",
    summary: "What the ego is, how every great tradition names it, the masks it wears in daily life (the spiritual ego too), why it is not an enemy to kill but a wild horse to tame, simple practices, and a teaching story.",
    body: `{{heart-ego-teacher}}

${heartCourse("the-ego-the-veil-and-the-teacher")}

Every soul comes from the Source, pure light. To live in this world it puts on a body, a name and a story. Slowly it begins to believe that it **is** only the body, the name and the story. That small, separate "I" is the **ego**. It builds a wall of "me and mine" and forgets the ocean it came from.

The ego is a **veil** over the true Self. But it is also a **teacher**: every time it rises, it shows us exactly where we still have to grow.

## One truth, many names
- **Hinduism.** *Ahamkara*, "the I-maker": the false self that says "I am the doer." The Bhagavad Gita teaches that the wise act without claiming the fruits, knowing that the true Self is eternal and untouched. See [The Bhagavad Gita](/teachings/the-bhagavad-gita).
- **Buddhism.** The Buddha taught *anatta*: when we look closely, no solid, separate self can be found. Clinging to "I, me, mine" is the root of suffering; letting go of it is freedom.
- **Taoism.** Lao Tzu praised water, which takes the lowest place and yet wears down the hardest stone. "He who overcomes others is strong; he who overcomes himself is mighty." (Tao Te Ching 33, Legge)
- **Sufism.** The *nafs*, the lower self. The Sufis teach that it is refined step by step: from the self that commands evil, to the self that blames itself, to the self at peace (Qur'an 12:53, 75:2, 89:27). The goal is *fana*, the drop returning to the ocean.
- **Judaism.** The Hasidic masters taught *bittul*, self-nullification: making room inside so that God's light can fill it. Moses, the greatest of prophets, was called "very meek, above all the men which were upon the face of the earth" (Numbers 12:3).
- **Christianity.** "He must increase, but I must decrease" (John 3:30). Jesus, the master, knelt and washed the feet of his disciples (John 13).
- **The mystery schools.** The personality is the vehicle and the soul is the driver. The work of the initiate is to make the personality a clear servant of the soul.

## The masks of the ego
The ego rarely shows its own face. It wears masks:
- **Pride:** "I am better than them."
- **Needing to be right:** winning the argument matters more than finding the truth.
- **The wounded self:** "Nobody sees me, nobody values me." This too is ego, turned inside out.
- **Envy and comparison:** another's blessing feels like our loss. See [Envy and Jealousy](/teachings/envy-and-jealousy).
- **Fear of not being enough:** chasing money, titles and praise to fill an empty place. See [The Idols of Today](/teachings/the-idols-of-today).
- **The spiritual ego:** the subtlest mask of all. "I meditate more than you. I am more awakened. I am proud of how humble I am." When we use the path to feel special, the ego has put on a robe of light.

## The ego is not the enemy
Many seekers try to kill the ego, and the fight itself becomes one more ego project. The masters teach a gentler way.

The ego is like a **wild horse**. Untamed, it runs wherever fear and desire pull it, and the rider is thrown. We do not shoot the horse. We calm it, we feed it, we train it with patience, until it carries the rider home. A tamed ego still has a name, a family, a job and a voice, but it **serves the heart** instead of ruling it.

## Practices for taming the ego
1. **Watch it.** Each time you feel hurt, angry or proud, pause and ask: "Who is offended?" Simply seeing the ego loosens its grip.
2. **The pause.** Before reacting, take three slow breaths. The ego lives in the reaction; the soul lives in the pause.
3. **Serve without being seen.** Do one good thing each week that no one will ever know about.
4. **Gratitude.** Name what you have received. A grateful heart remembers that everything is a gift. See [Gratitude](/teachings/the-power-of-gratitude).
5. **Let others be right.** In small things, let go of winning. Peace is worth more.
6. **Silence.** In meditation, rest as the one who watches the thoughts. You are not the noise; you are the sky in which it passes.
7. **Give the credit to God.** When something good comes through you, say inwardly: "Thank You. It was Your light."

## A teaching story: The Bucket and the Well
{{heart-ego-well}}

In a village there was a well, and beside the well hung a bucket. Every morning the bucket went down into the darkness and came up full of cool, clear water. The people drank, the gardens grew, and everyone praised the water.

Slowly the bucket began to think: "Look how much they need me. Without me there would be no water. The water is mine."

One day it grew so proud that it would not go down into the darkness any more. "Let them come and thank me first," it said. It hung there, full of itself, and by evening the little water it held had turned warm and stale. No one drank from it.

The old well keeper took the bucket in his hands and said gently: "You were never the water, little one. You were only the way the water came up. Go down again, empty yourself, and you will be full."

The bucket went down into the cool dark, and came up shining.

**Carry this with you:** you are not the source of the light, only its vessel. Empty yourself of "mine", and the well will fill you again every day.

## Samadhi's view
*This is Samadhi's own understanding.*

{{heart-veils-plaque}}

{{heart-ego-plaque}}

## Words of the masters
> "Whosoever shall exalt himself shall be abased; and he that shall humble himself shall be exalted." (Jesus, Matthew 23:12, King James Bible)

> "Self is the lord of self, who else could be the lord? With self well subdued, a man finds a lord such as few can find." (The Buddha, Dhammapada 160, Müller)

> "Turn not thy cheek in scorn toward folk, nor walk with pertness in the land. Lo! Allah loveth not each braggart boaster." (Qur'an 31:18, Pickthall)

> "Pride goeth before destruction, and an haughty spirit before a fall." (Proverbs 16:18, King James Bible)

> "Let nothing be done through strife or vainglory; but in lowliness of mind let each esteem other better than themselves." (Saint Paul, Philippians 2:3, King James Bible)${bridge([
      ["Fear, Ego and Grief", "/teachings/fear-ego-and-grief", "the next lesson: how the traditions answer three human struggles."],
      ["The Mirror: Seeing God in Every Face", "/teachings/the-mirror-seeing-god-in-every-face", "when the ego quiets, we see the Divine in others."],
      ["Give Your Soul Only to God", "/teachings/give-your-soul-only-to-god", "where the heart belongs."],
    ])}

## Sources

- Bhagavad Gita, chapters 2, 3 and 13; the Buddhist teaching of *anatta* (not-self).
- *Tao Te Ching*, chapters 8 and 33, tr. James Legge (1891).
- Qur'an 12:53, 75:2, 89:27 and 31:18, tr. M. M. Pickthall (1930).
- Numbers 12:3; Proverbs 16:18; Matthew 23:12; John 3:30; John 13:1–17; Philippians 2:3, King James Bible.
- *The Dhammapada*, verse 160, tr. F. Max Müller (1881).
- The Hasidic teaching of *bittul* (self-nullification).
- "The Bucket and the Well" is a teaching story written for this site.` },

  { slug: "greed-wanting-more-than-we-need", tag: "The Heart and the Ego · 5", title: "Greed: Wanting More Than We Need",
    summary: "The hunger that is never filled. How the Buddha, the Ten Commandments, Jesus, the Qur'an and the hadith, the Gita, the Tao and the rabbis see greed, why it never satisfies, and the medicine of contentment and giving.",
    body: `{{heart-emblem}}

${heartCourse("greed-wanting-more-than-we-need")}

Greed is a strange hunger: **the more we feed it, the hungrier it gets.** One more car, one more house, one more account, one more "like". It promises peace at the next step, and the next step never comes.

## What the traditions teach
- **One of the three poisons (Buddhism).** The Buddha named greed (*lobha*), hatred (*dosa*) and delusion (*moha*) as the three roots of all suffering, the "three poisons" that keep beings turning on the wheel. Their cures are generosity, loving-kindness and wisdom.
- **The Tenth Commandment.** "Thou shalt not covet thy neighbour's house … nor any thing that is thy neighbour's" (Exodus 20:17).
- **The rich fool (Jesus).** "Take heed, and beware of covetousness: for a man's life consisteth not in the abundance of the things which he possesseth" (Luke 12:15). Jesus told of a rich man who built bigger barns to store his harvest, planning to rest and enjoy it, and died that night (Luke 12:16–21).
- **The root of evil.** "The love of money is the root of all evil" (1 Timothy 6:10).
- **The valley of gold (Islam).** The Prophet Muhammad said that if the son of Adam had a valley full of gold, he would want a second one, and nothing will fill his mouth but the dust of the grave (Sahih al-Bukhari 6439). The Qur'an warns that rivalry in worldly increase distracts people until they come to the graves (Surah 102).
- **A gate of self-destruction (Hinduism).** The Bhagavad Gita names desire, anger and greed as three gates that lead the soul to ruin, and says the wise abandon all three (Gita 16:21).
- **Knowing enough (Taoism).** The *Tao Te Ching* teaches that there is no greater misfortune than not knowing when one has enough, and that whoever knows that enough is enough always has enough (chapter 46).
- **Who is rich? (Judaism).** "Who is rich? The one who rejoices in his portion" (*Pirkei Avot* 4:1).

## Why greed never satisfies
Greed is not really about things. It is an empty place in the heart trying to fill itself from outside. The soul is hungry for God, for love and for meaning; greed tries to feed it with objects, and it stays hungry. See [The Idols of Today](/teachings/the-idols-of-today).

## The medicine
- **Gratitude.** Each day, name three things you already have. Greed cannot live where thanks is spoken.
- **Enough.** Decide, honestly, what is enough for your family's real needs, and let that be a peace, not a limit.
- **Giving.** The surest cure for greed is to open the hand. Give something away this week that you could have kept. See [Charity](/teachings/charity-sharing-our-blessings).
- **Honest work.** Earn by serving, never by taking from others. See [Money and Right Livelihood](/teachings/money-and-right-livelihood).

## Samadhi's view
*This is Samadhi's own understanding.*

Everything we have is lent to us for a short time; we take nothing through the doorway of death but the love we gave. Greed makes us slaves of the things we think we own. Work hard, provide for your family, enjoy God's gifts, and share. Then wealth is a blessing and not a chain.${bridge([
      ["Envy and Jealousy", "/teachings/envy-and-jealousy", "the next face of the ego."],
      ["The Idols of Today", "/teachings/the-idols-of-today", "when money becomes a god."],
      ["Charity: Sharing the Blessings We Were Lent", "/teachings/charity-sharing-our-blessings", "the cure of the open hand."],
    ])}

## Sources

- Exodus 20:17; Luke 12:15–21; 1 Timothy 6:10, King James Bible.
- Sahih al-Bukhari 6439; Qur'an, Surah 102 (*At-Takathur*).
- Bhagavad Gita 16:21; *Tao Te Ching*, chapter 46; *Pirkei Avot* 4:1; the Buddhist teaching of the three poisons.` },

  { slug: "envy-and-jealousy", tag: "The Heart and the Ego · 6", title: "Envy and Jealousy: The Pain at Another's Blessing",
    summary: "Envy wants what another has; jealousy fears losing what we have. Cain and Abel, Joseph's brothers and King Saul, the hadith and the Qur'an, the Buddha's joy in others' joy, and how to turn envy into blessing.",
    body: `{{heart-emblem}}

${heartCourse("envy-and-jealousy")}

**Envy** is the pain we feel when someone else is blessed: their success, their beauty, their family, their talent. **Jealousy** is the fear of losing what we have to someone else. Both are as old as humanity, and both hurt the one who carries them more than anyone else.

## The first stories
- **Cain and Abel.** The Bible's first story outside the Garden is about envy. When God accepted Abel's offering, Cain's face fell, and God warned him: sin "lieth at the door", but "thou shalt rule over him" (Genesis 4:7). Cain did not rule it, and envy became the first murder.
- **Joseph's brothers.** "And his brethren envied him" (Genesis 37:11). Because their father loved Joseph and he dreamed great dreams, they sold him into slavery. Years later, Joseph forgave them: "ye thought evil against me; but God meant it unto good" (Genesis 50:20).
- **King Saul.** When the women sang that Saul had slain his thousands, but David his ten thousands, Saul was very angry, "and Saul eyed David from that day and forward" (1 Samuel 18:7–9). Jealousy ate away at a king.

## What the traditions teach
- **The rot in the bones.** "A sound heart is the life of the flesh: but envy the rottenness of the bones" (Proverbs 14:30). "Charity envieth not" (1 Corinthians 13:4).
- **Seeking refuge from envy (Islam).** The Qur'an teaches the believer to seek refuge in the Lord of the Daybreak "from the evil of the envier when he envieth" (Qur'an 113:5). The Qur'an also asks us not to covet the things by which God has made some excel others, but to ask God of His bounty (Qur'an 4:32).
- **Do not envy one another (hadith).** The Prophet Muhammad said: do not envy one another, do not hate one another, do not turn your backs on one another, but be, O servants of God, brothers (Sahih al-Bukhari 6065; Sahih Muslim 2563). A saying recorded by Abu Dawud warns that envy eats up good deeds as fire eats wood (Sunan Abi Dawud 4903).
- **Good envy and bad envy (Islam).** Muslim scholars distinguish ***hasad***, wishing someone to lose their blessing, from ***ghibta***, wishing for the same blessing without wanting it taken from them. The Prophet said the only "envy" allowed is of two people: one given wealth who spends it rightly, and one given wisdom who lives by it and teaches it (Sahih al-Bukhari 73).
- **Joy in others' joy (Buddhism).** The Buddha taught ***mudita***, sympathetic joy: being glad at the happiness and success of others. It is one of the four "divine abodes" (*brahmaviharas*), with loving-kindness, compassion and equanimity, and it is the direct medicine for envy.
- **The green-eyed monster.** Shakespeare called jealousy "the green-eyed monster which doth mock the meat it feeds on" (*Othello* 3.3). See [Shakespeare's Spiritual Wisdom](/teachings/shakespeare-spiritual-wisdom).

## Turning envy into blessing
1. **Notice it without shame.** Envy is a human feeling. Simply say inwardly: *there is envy.*
2. **Bless the person.** Silently wish them more of what they have. It feels strange at first; it works. See [The Power of Words](/teachings/the-power-of-words).
3. **Learn from them.** Turn envy into *ghibta*: "what can I learn from how they got there?"
4. **Count your own blessings.** Envy looks only at what others have; gratitude looks at what God gave you.
5. **Remember the unseen.** We see others' blessings, never their hidden struggles. No one's life is what it looks like from outside.
6. **In love, trust.** Jealousy in a relationship grows from fear. Speak honestly, and build trust rather than control. See [Love and Marriage](/teachings/love-and-marriage).

## Samadhi's view
*This is Samadhi's own understanding.*

Each soul came with its own plan, its own gifts and its own lessons. Another person's blessing takes nothing from you; God's treasury does not run out. When you envy, you are telling God that He made a mistake. When you bless, you open the same door of blessing for yourself.${bridge([
      ["Competition: When Striving Becomes Rivalry", "/teachings/competition-and-rivalry", "the next face of the ego."],
      ["The Mirror: Seeing God in Every Face", "/teachings/the-mirror-seeing-god-in-every-face", "what we resent in others."],
      ["Blessing and Gratitude", "/library?tab=blessing", "the medicine of a thankful heart."],
    ])}

## Sources

- Genesis 4:3–8, 37:11 and 50:20; 1 Samuel 18:7–9; Proverbs 14:30; 1 Corinthians 13:4, King James Bible.
- Qur'an 4:32 and 113:5; Sahih al-Bukhari 73 and 6065; Sahih Muslim 2563; Sunan Abi Dawud 4903.
- The Buddhist *brahmaviharas* (*mudita*); William Shakespeare, *Othello* 3.3.` },

  { slug: "competition-and-rivalry", tag: "The Heart and the Ego · 7", title: "Competition: When Striving Becomes Rivalry",
    summary: "Healthy striving or ego rivalry? Racing in good deeds, the disciples who argued who was greatest, the first who shall be last, the water that does not compete, and how to do your best without needing others to fail.",
    body: `{{heart-emblem}}

${heartCourse("competition-and-rivalry")}

We live in a world of competition: in school, sports, business, even in families and on social media. Some competition is healthy: it pushes us to grow and to do our best. But when striving turns into **rivalry**, when we need others to **fail** so that we can feel big, the ego has taken the wheel.

## Healthy striving
The traditions do not ask us to be lazy. They ask us to strive for the right things:
- "**So run, that ye may obtain**" (1 Corinthians 9:24). Paul compares the spiritual life to a race run with all one's heart.
- The Qur'an tells the believers to **race one another in good deeds** (Qur'an 2:148 and 5:48): the only competition God asks for is in kindness, charity and goodness.
- The Bhagavad Gita says it is better to follow your **own** path (*svadharma*), even imperfectly, than another's path well (Gita 3:35). Your race is your own.

## When striving becomes rivalry
- **Who is the greatest?** On the road, the disciples argued about which of them was the greatest. Jesus sat down and said: "**If any man desire to be first, the same shall be last of all, and servant of all**" (Mark 9:35). And: "So the last shall be first, and the first last" (Matthew 20:16).
- **Rivalry in increase.** The Qur'an warns that rivalry in piling up worldly things distracts people until they come to the graves (Surah 102, *At-Takathur*, "the rivalry in increase").
- **The water that does not compete (Taoism).** The *Tao Te Ching* teaches that the highest good is like water, which benefits all things and does not compete (chapter 8), and that because the sage does not compete, no one in the world can compete with him (chapter 22).
- **Comparison is the root.** The Buddha taught that measuring ourselves against others, as "better than", "equal to" or "worse than", is itself a form of conceit (*mana*) that keeps us bound.

## Signs that the ego is competing
- You feel a secret pleasure when a colleague or friend fails.
- You cannot honestly congratulate someone who wins.
- You cut corners, hide information or speak badly of others to get ahead.
- Your peace depends on being first.

## A better way to strive
1. **Compete with yesterday's self**, not with your neighbour.
2. **Do your best, then let go of the result.** "Let right deeds be Thy motive, not the fruit which comes from them" (Gita 2:47, Edwin Arnold).
3. **Win honestly or not at all.** In business and sport, honest effort is worship; cheating is theft from your own soul.
4. **Celebrate others' wins**, out loud. It frees the heart. See [Envy and Jealousy](/teachings/envy-and-jealousy).
5. **Cooperate where you can.** Many of the greatest works of humanity were built together.

## Samadhi's view
*This is Samadhi's own understanding.*

There is no real competition between souls: each one has its own path, its own timing and its own blessings, and God has enough for everyone. Work hard and do your best, but never build your success on someone else's fall. The only race that matters is the race toward love.${bridge([
      ["Hate and Bad Wishes", "/teachings/hate-and-bad-wishes", "the next face of the ego."],
      ["Money and Right Livelihood", "/teachings/money-and-right-livelihood", "honest work as prayer."],
      ["Service: Love in Action", "/teachings/service-love-in-action", "the first who become servants."],
    ])}

## Sources

- Mark 9:33–35; Matthew 20:16; 1 Corinthians 9:24, King James Bible.
- Qur'an 2:148, 5:48 and Surah 102.
- Bhagavad Gita 2:47 (Edwin Arnold, [*The Song Celestial*](https://www.gutenberg.org/ebooks/2388), 1885) and 3:35; *Tao Te Ching*, chapters 8 and 22.` },

  { slug: "hate-and-bad-wishes", tag: "The Heart and the Ego · 8", title: "Hate and Bad Wishes: Why They Return to the Sender",
    summary: "Hatred, grudges and wishing harm on others. How every tradition answers hate with love, what the evil eye means in many cultures and how they answer it with blessing, why bad wishes return to the one who sends them, and how to let hate go.",
    body: `{{heart-emblem}}

${heartCourse("hate-and-bad-wishes")}

Hate is a fire we light to burn someone else, and it burns our own house first. A bad wish, a silent curse, "I hope they suffer": these feel powerful in the moment, but every tradition says the same thing: **they return to the one who sends them.**

## What the traditions teach
- **Hatred never ceases by hatred (Buddhism).** "Hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule" (*Dhammapada*, verse 5).
- **Love your enemies (Christianity).** "**Love your enemies, bless them that curse you, do good to them that hate you, and pray for them which despitefully use you**" (Matthew 5:44). "Bless, and curse not" (Romans 12:14). "If a man say, I love God, and hateth his brother, he is a liar" (1 John 4:20).
- **No hate in the heart (Judaism).** "Thou shalt not hate thy brother in thine heart" (Leviticus 19:17). The rabbis taught that the Second Temple was destroyed because of *sinat chinam*, baseless hatred between people (Babylonian Talmud, *Yoma* 9b).
- **Repel evil with good (Islam).** "**Repel the evil deed with one which is better, then lo! he, between whom and thee there was enmity (will become) as though he was a bosom friend**" (Qur'an 41:34, Pickthall). The Prophet said: do not hate one another (Sahih Muslim 2563).
- **You reap what you sow.** "Whatsoever a man soweth, that shall he also reap" (Galatians 6:7). The law of karma teaches the same: every thought and wish is a seed.

## The evil eye: what many cultures believe
Across the Mediterranean, the Middle East, South Asia and Latin America, people speak of the **evil eye**: harm that can come from an envious or ill-wishing look. In Lebanon and its neighbours many hang a blue eye-bead for protection; Jews say *bli ayin hara*, "without the evil eye"; in India it is called *drishti*; in Mexico *mal de ojo*. Islamic tradition records the Prophet saying that the evil eye is real (Sahih al-Bukhari 5740), and teaches that when you admire something, you should **invoke God's blessing** on it, saying *Mashallah* ("what God has willed") or *Barak Allah* ("God bless it"). Muslims recite the last two surahs of the Qur'an, *Al-Falaq* and *An-Nas*, for protection.

Notice the answer every culture gives: **the protection from bad wishes is blessing.** The more we bless, the less power envy and ill-will have, in others and in ourselves. There is no need to live in fear; God's protection is greater than any look.

## Why bad wishes return
- **They live in us first.** Before a bad wish reaches anyone, it fills our own mind with darkness, anger and unrest.
- **The law of return.** What we send out comes back to us. See [Black Magic and the Law of Return](/teachings/black-magic-and-the-law-of-return).
- **We become what we hate.** What we hate, we tend to repeat and to meet again and again in our lives. See [The Mirror: Seeing God in Every Face](/teachings/the-mirror-seeing-god-in-every-face).

## Letting hate go
1. **Hate the harm, not the person.** We can stand firmly against wrong without wishing evil on anyone.
2. **Protect yourself.** Letting go of hate does not mean staying near someone who hurts you. Keep your distance and seek help where needed.
3. **Pray for them**, even if only a short line: *God, heal them, and heal me.*
4. **Replace the bad wish with a blessing.** When the thought "I hope they suffer" rises, answer it: *may they find peace, and may I be free.*
5. **Forgive in time.** Forgiveness is a gift to yourself first. See [The Power of Forgiveness](/teachings/the-power-of-forgiveness).

## Samadhi's view
*This is Samadhi's own understanding.*

God lives in every person, so when we hate anyone, we send hate toward God, and it comes back to us. Bad wishes are like throwing stones into the sky: they fall on our own head. Wish good for everyone, even those who hurt you; you do not have to keep them close, but keep your heart clean. Then no darkness can touch you.${bridge([
      ["Black Magic and the Law of Return", "/teachings/black-magic-and-the-law-of-return", "why harm comes back to its sender."],
      ["The Power of Words", "/teachings/the-power-of-words", "the first step of the healing."],
      ["The Power of Forgiveness", "/teachings/the-power-of-forgiveness", "letting the past go."],
    ])}

## Sources

- Leviticus 19:17; Matthew 5:44; Romans 12:14; Galatians 6:7; 1 John 4:20, King James Bible; Babylonian Talmud, *Yoma* 9b.
- Qur'an 41:34, Pickthall (1930), and Surahs 113–114; Sahih al-Bukhari 5740; Sahih Muslim 2563.
- *Dhammapada*, verse 5.` },

  { slug: "on-judgment", tag: "The Heart and the Ego · 11", title: "On Judgment: Every Face Is the Face of the One",
    summary: "Why judging, mocking and putting others down wounds not only them but the One who lives in them; what every judgment reveals about ourselves; and a simple practice for seeing the Divine in the person we find hardest to love.",
    body: `{{heart-scroll-open}}

${heartCourse("on-judgment")}

We all do it. A glance, a quiet verdict, a joke at someone's expense, a comment we would never say to their face. It feels small. It passes in a second.

But the great teachers of every path say the same strange thing: **it is never small**, and it is never only about the other person.

## Why judgment wounds the One
Walk with this thought for a moment: every soul is a spark of the same Light. If that is true, then there is no one we can look down on without looking down on the Light that shines in them.

Jesus put it plainly: *"Judge not, that ye be not judged. For with what judgment ye judge, ye shall be judged"* (Matthew 7:1–2). And in his parable of the last judgment, the King says: *"Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me"* (Matthew 25:40). The kindness we show the smallest person, we show to God. The contempt, too.

**In the Kabbalah**, every soul carries a spark of the Divine Light, and our task is to help gather and lift the sparks, the repair of the world (*tikkun*). The sages were fierce about the evil tongue, *lashon hara*: the Talmud says it "kills three", the one who speaks it, the one who hears it and the one it is spoken about (Arakhin 15b). Words that tear another down do not stay with that person; they darken the speaker and the listener too. (See [The Power of Words](/teachings/the-power-of-words).)

**The Qur'an** says: *"Let not a folk deride a folk who may be better than they (are)… neither defame one another, nor insult one another by nicknames"* (49:11, Pickthall). The one we mock may be closer to God than we are.

**The Buddha** turned the eyes inward: *"Not the wrong of others, or what others have done or have not done, one should consider, but what has been done and not done by oneself"* (Dhammapada 50, translated by Ānandajoti Bhikkhu).

**In the yoga of Patanjali**, the first of all the restraints is *ahimsa*, non-harm, and it is meant in thought and word as well as in deed (Yoga Sutra 2.30). Of the one firmly rooted in it, Patanjali says that in their presence hostility falls away (Yoga Sutra 2.35). The mind that keeps judging builds the very walls it then feels trapped behind.

**The teachers of non-duality**, like [Ramana Maharshi](/teachings/non-duality-and-ramana-maharshi), go one step further: there is only one Consciousness looking out through every pair of eyes. The "other" is not truly other. To judge the apparent other is, in the end, to judge the Self.

## The mirror in every judgment
Here is the gentlest and hardest part. Notice what you judge most quickly in others. Laziness? Pride? Weakness? Noise? Very often, what we condemn outside is something we have not yet met with compassion inside: a part of ourselves we were once shamed for, or are still afraid of.

Every judgment is a mirror. It does not mean we are the same as the person we judge. It means the strong feeling is pointing at something in us that wants healing.

So the next time a harsh verdict rises, it can become a question instead:
- *What is this touching in me?*
- *When was I treated this way, or afraid of being this way?*
- *Can I be kind to that, here, now?*

This is not about pretending wrong is right. We can still see clearly, set boundaries and protect what must be protected. Discernment sees what someone did. Judgment decides who someone **is**, and closes the door. (See [The Mirror: Seeing God in Every Face](/teachings/the-mirror-seeing-god-in-every-face).)

## Samadhi's view
*This is Samadhi's view, the teaching of this path.*

To judge another, to make fun of them or put them down, is not only harmful to them. It is an act against God and against His creation. Every soul is a spark of the Divine, so whatever we do to another, we do to the One. There is no true separation. When we judge, we forget that the person in front of us is also the face of God.

## A practice for today
{{heart-practice}}

## A blessing to carry
{{heart-scroll-close}}
${bridge([
      ["The Power of Words", "/teachings/the-power-of-words", "the evil tongue and the healing word."],
      ["The Mirror: Seeing God in Every Face", "/teachings/the-mirror-seeing-god-in-every-face", "seeing ourselves and the Divine in others."],
      ["The Golden Rule", "/teachings/the-golden-rule", "one law in every faith."],
      ["The Power of Forgiveness", "/teachings/the-power-of-forgiveness", "letting go of the verdict."],
    ])}

## Sources
- Matthew 7:1–2 and 25:40, King James Bible.
- Qur'an 49:11, translated by Marmaduke Pickthall (1930).
- Dhammapada, verse 50, translated by Ānandajoti Bhikkhu (Ancient Buddhist Texts).
- Babylonian Talmud, Arakhin 15b, on *lashon hara*.
- Patanjali, *Yoga Sutras* 2.30 and 2.35, on *ahimsa*.` },
];
