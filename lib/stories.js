// Stories for the Soul (Nov 2026): short teaching stories, each on its own page, kept on a rolled scroll
// that shows the story's name and who it is by; a tap rolls it down, another rolls it up (CSS only, no scripts).
// Tales of the Path are labelled as teaching stories of this path; traditional tales are retold in our own
// words and name their source. Every word is in the page, so it is readable with motion off and by search engines.

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");

export function storyScroll(story) {
  const id = `st-${story.slug}`;
  const lines = story.text.trim().split(/\n\s*\n/).map((p) => `<p>${inline(p.replace(/\n/g, " "))}</p>`).join("");
  const carry = story.carry.map((l) => inline(l)).join("<br>");
  return `<figure class="about-scroll story-scroll" aria-label="${esc(story.name)}, ${esc(story.by)}"><input type="checkbox" id="${id}" class="st-toggle">
<label for="${id}" class="st-label"><span class="st-wood"><img class="as-roll" src="/images/about-scroll-top.png" width="800" height="133" alt="" aria-hidden="true"><span class="st-carve st-name${story.name.length > 24 ? " st-long" : ""}">${esc(story.name)}</span></span></label>
<div class="as-unroll st-unroll"><div class="as-inner"><div class="as-text st-text">${lines}<p class="st-carry-label">Carry this with you</p><p class="st-carry">${carry}</p></div></div></div>
<label for="${id}" class="st-label st-bottom"><span class="st-wood"><img class="as-roll as-roll-bot" src="/images/about-scroll-bot.png" width="800" height="132" alt="" aria-hidden="true"><span class="st-carve st-by">${esc(story.by)}</span></span></label>
<p class="st-hint" aria-hidden="true"><span class="st-hint-open">Tap the scroll to roll it down</span><span class="st-hint-close">Tap the scroll to roll it up</span></p></figure>`;
}

const PATH = "A teaching story of this path";

export const STORIES = [
  // Tales of the Path
  { slug: "the-flame-and-the-wind", name: "The Flame and the Wind", by: PATH, kind: "path",
    summary: "A man asks a teacher how to know if he is making progress. The teacher points to a lamp that has just been lit.",
    text: `A man once asked a teacher, "How do I know if I am making progress?"

The teacher pointed to a lamp that had just been lit. "Watch the flame," he said.

At first the flame flickered and leaned, chasing every small wind. After a while it grew steadier. It still moved, but it no longer went out.

The man waited, expecting more.

The teacher only added, "That is the whole path. You do not force the flame to be still. You stop feeding the wind."`,
    carry: ["Progress is not the absence of movement.", "It is the moment the light stops being", "at the mercy of every passing wind."],
    related: [["Working with the Mind", "/teachings/working-with-the-mind"], ["What Awakening Feels Like", "/teachings/what-awakening-feels-like"]] },

  { slug: "the-two-wells", name: "The Two Wells", by: PATH, kind: "path",
    summary: "Two neighbours share a field with two wells. One well is kept clean, and one is filled with stones.",
    text: `Two neighbours once shared a field with two wells. One day they quarrelled, and in his anger the first neighbour threw a stone into the second man's well.

The second man said nothing. That night he threw a stone into the first man's well. The next day, two stones came back. Then four.

By the end of the summer, both wells were full of stones, and both families were thirsty.

An old woman passing by asked them why. Each began to tell her what the other had done.

She listened, then picked up a bucket and began to lift the stones out of the nearest well, one by one. "It does not matter who threw the first stone," she said. "It only matters who lifts the first one out."

By evening, both men were working beside her.`,
    carry: ["Forgiveness is not saying the stone was never thrown.", "It is choosing to clear the water", "so that everyone can drink again."],
    related: [["The Power of Forgiveness", "/teachings/the-power-of-forgiveness"], ["Joseph (Yusuf): The Dreamer Who Forgave", "/teachings/joseph"]] },

  { slug: "the-stone-in-the-shoe", name: "The Stone in the Shoe", by: PATH, kind: "path",
    summary: "A traveller walks for days with a small stone in his shoe, blaming the road, the hills and the weather.",
    text: `A traveller set out on a long road. On the first morning, a small stone slipped into his shoe.

He felt it, but he was in a hurry. "The road is rough," he said. By noon he was limping. "These hills are too steep," he complained. By evening he was angry at the weather, the innkeeper and the other travellers, who all seemed to walk so easily.

On the third day he sat down by the road, exhausted, and finally took off his shoe. Out fell a stone no bigger than a grain of rice.

He looked at it for a long time. Then he laughed, put his shoe back on, and walked lightly the rest of the way.`,
    carry: ["Much of what we blame on the road", "is a small stone we have not yet stopped to remove."],
    related: [["Fear, Ego and Grief", "/teachings/fear-ego-and-grief"], ["The Mirror: Seeing God in Every Face", "/teachings/the-mirror-seeing-god-in-every-face"]] },

  { slug: "the-night-the-river-spoke", name: "The Night the River Spoke", by: PATH, kind: "path",
    summary: "A grieving woman sits by a river at night and asks where the people she loved have gone.",
    text: `After her mother died, a woman went to sit by the river every night. "Where has she gone?" she asked the dark water.

One night, the river seemed to answer.

"Look at me," it said. "The water that passed you yesterday is in the sea tonight. Tomorrow some of it will rise as mist, fall on the mountain as rain, and come back down to this very bank. I am always leaving, and I am never gone."

The woman put her hand into the cold water and held it there.

When she walked home that night, she was still sad. But she was no longer afraid.`,
    carry: ["Love changes its form.", "It does not end."],
    related: [["Death and Continuity", "/teachings/death-and-continuity"], ["Losing Someone We Love", "/teachings/losing-someone-we-love"]] },

  { slug: "the-merchants-scale", name: "The Merchant's Scale", by: PATH, kind: "path",
    summary: "A merchant with a famous honest scale is asked by his son why he never adds the small extra weight everyone else adds.",
    text: `In an old market there was a spice merchant whose scale was known for being honest. Other merchants hid a little weight under their pans; he never did.

His son, watching the others grow rich, asked him one day, "Father, why don't you add just a little? No one would ever know."

The merchant handed his son the scale. "Hold it level," he said.

The son held it.

"Now," said the merchant, "every day for forty years, my hands have held this scale level. That is why they do not shake. A man who tilts his scale learns to tilt his heart. And a tilted heart cannot rest at night."`,
    carry: ["What we do with small things", "is what we become in great ones."],
    related: [["Money and Right Livelihood", "/teachings/money-and-right-livelihood"], ["Ordinary Life", "/teachings/the-teaching-in-ordinary-life"]] },

  { slug: "the-mirror-in-the-market", name: "The Mirror in the Market", by: PATH, kind: "path",
    summary: "A man complains that every face in the market looks angry, until a mirror-seller shows him something.",
    text: `A man walked through the market one morning in a bad mood. "Everyone here is unfriendly," he muttered. "Every face is angry."

He stopped at a stall that sold mirrors. The mirror-seller smiled at him. The man frowned back.

The seller held up a mirror. In it, the man saw a frowning face with tight lips and narrow eyes.

"You are right," said the seller kindly. "That one does look angry."

The man was about to argue. Then, slowly, he began to laugh. The face in the mirror laughed with him.

When he walked on, he noticed that the market was full of people smiling back.`,
    carry: ["The world often answers us", "in the voice we use to speak to it."],
    related: [["On Judgment: Every Face Is the Face of the One", "/teachings/on-judgment"], ["Living with Others", "/teachings/living-with-others"]] },

  // Stories from the Traditions (retold in our own words)
  { slug: "the-elephant-in-the-dark", name: "The Elephant in the Dark", by: "Rumi, from the Masnavi (Sufi)", kind: "tradition",
    summary: "Rumi's famous parable of people touching an elephant in a dark room, each sure they know what it is.",
    text: `Some travellers brought an elephant to a town where no one had ever seen one, and kept it in a dark house.

People came to see it, but in the dark they could only touch it.

One touched the trunk and said, "It is like a water pipe." Another touched the ear: "No, it is like a fan." Another touched the leg: "It is a pillar." Another touched the back: "It is a great throne."

Each was sure. Each was partly right. And they argued until night.

Rumi says: if each of them had carried a candle, their differences would have disappeared.`,
    carry: ["Each of us touches a part of the Truth.", "Bring a light, and the quarrels fade."],
    source: "Retold from Jalal al-Din Rumi, *Masnavi*, Book III. An older form of the story appears in Sanai's *Hadiqat al-Haqiqa* and in early Buddhist and Jain teaching.",
    related: [["One Source, One Message", "/teachings/one-source-one-message"], ["Rumi", "/teachings/rumi"]] },

  { slug: "kisa-gotami-and-the-mustard-seed", name: "Kisa Gotami and the Mustard Seed", by: "From the Buddhist tradition", kind: "tradition",
    summary: "A grieving mother asks the Buddha to bring her child back. He asks her for one mustard seed from a house where no one has died.",
    text: `When her little son died, a young mother named Kisa Gotami could not accept it. She carried him from house to house, asking for medicine to bring him back.

At last someone sent her to the Buddha. "I can help you," he said gently. "Bring me a mustard seed from a house where no one has ever died."

She went from door to door. Every family wanted to help. But in every house someone had died: a father, a sister, a child.

By evening she understood. She was not alone. Grief lives in every home.

She laid her son to rest with love, and returned to the Buddha, not with a seed, but with an open heart.`,
    carry: ["Sorrow does not make us separate.", "It is the door through which we meet everyone."],
    source: "Retold from the story of Kisa Gotami in the commentary on the *Dhammapada* and the *Therigatha*.",
    related: [["Losing Someone We Love", "/teachings/losing-someone-we-love"], ["Siddhartha Gautama, the Buddha", "/teachings/the-buddha"]] },

  { slug: "the-prodigal-son", name: "The Son Who Came Home", by: "Jesus, from the Gospel of Luke", kind: "tradition",
    summary: "The parable of the prodigal son: a young man wastes everything, comes home in shame, and is met by his father running toward him.",
    text: `A man had two sons. The younger asked for his share of the inheritance, went to a far country, and wasted it all.

When famine came, he ended up feeding pigs, hungry enough to eat their food. Then he came to himself. "I will go home," he said, "and ask to be one of my father's servants."

But while he was still a long way off, his father saw him, and ran to him, and threw his arms around him.

The son began his speech of shame. The father did not let him finish. He called for the best robe, a ring and a feast.

"For this my son was dead, and is alive again; he was lost, and is found."`,
    carry: ["However far we wander,", "the way home is shorter than we think,", "and Someone is already running to meet us."],
    source: "Retold from Luke 15:11–32; the closing words are from Luke 15:24, King James Bible.",
    related: [["God Is Pure Love", "/teachings/god-is-pure-love"], ["Jesus of Nazareth (Isa)", "/teachings/jesus-of-nazareth"]] },

  { slug: "rabbi-zusyas-question", name: "Rabbi Zusya's Question", by: "From the Hasidic tradition", kind: "tradition",
    summary: "Before he died, Rabbi Zusya was afraid, not that he had failed to be Moses, but that he had failed to be Zusya.",
    text: `Rabbi Zusya was a gentle and beloved teacher. When he was old and near the end of his life, his students found him weeping.

"Rabbi," they said, "why are you afraid? You have been as wise as Moses and as kind as Abraham."

Zusya shook his head.

"When I come before the heavenly court," he said, "they will not ask me, 'Zusya, why were you not Moses?' They will ask me, 'Zusya, why were you not Zusya?'"`,
    carry: ["No one is asking you to become someone else.", "Only to become fully, truly yourself."],
    source: "Retold from the tale of Rabbi Zusya of Hanipol, as collected in Martin Buber, *Tales of the Hasidim* (1947).",
    related: [["The Nature of the Soul", "/teachings/nature-of-the-soul"], ["Why We Came", "/teachings/why-we-came"]] },

  { slug: "nachiketa-and-death", name: "Nachiketa and Death", by: "From the Katha Upanishad (Hindu)", kind: "tradition",
    summary: "A boy goes to the house of Death, waits three days, and is offered three wishes. For the third, he asks what happens after we die.",
    text: `A young boy named Nachiketa was sent, in his father's anger, to the house of Yama, the Lord of Death. Yama was away, and the boy waited at his door for three days without food.

When Yama returned, he was ashamed to have kept a guest waiting, and offered Nachiketa three wishes.

For the first, the boy asked for peace with his father. For the second, he asked to learn the sacred fire. For the third, he asked: "When a person dies, some say he is, and some say he is not. Teach me the truth."

Yama tried to turn him away. He offered gold, long life, kingdoms and every pleasure instead.

Nachiketa refused them all. "These things pass," he said. "Keep your gifts. I want the truth."

So Death taught him: the true Self is not born, and does not die. It is not slain when the body is slain.`,
    carry: ["Choose what lasts", "over what only shines."],
    source: "Retold from the *Katha Upanishad*, chapters 1 and 2; Yama's teaching on the Self is in 1.2.18.",
    related: [["Death and Continuity", "/teachings/death-and-continuity"], ["Krishna and Rama", "/teachings/krishna-and-rama"]] },

  { slug: "a-cup-of-tea", name: "A Cup of Tea", by: "From the Zen tradition", kind: "tradition",
    summary: "A learned professor visits a Zen master to ask about Zen. The master pours him tea, and keeps pouring.",
    text: `A learned professor came to visit the Zen master Nan-in, to ask him about Zen.

Nan-in served tea. He poured his visitor's cup full, and then kept on pouring. The tea ran over the cup, onto the saucer, onto the table.

The professor watched until he could no longer stay quiet. "It is overfull! No more will go in!"

"Like this cup," said Nan-in, "you are full of your own opinions. How can I show you Zen, unless you first empty your cup?"`,
    carry: ["Wisdom needs room.", "Empty the cup, and the Light can pour in."],
    source: "Retold from \"A Cup of Tea\", in Paul Reps and Nyogen Senzaki, *Zen Flesh, Zen Bones* (1957).",
    related: [["Grace, Surrender and Humility", "/teachings/grace-surrender-and-humility"], ["Meditation and Prayer", "/teachings/meditation-and-prayer"]] },
];

const storyPage = (s) => ({
  slug: `story-${s.slug}`, tag: s.kind === "path" ? "Tales of the Path" : "From the traditions",
  title: `${s.name}: A Story for the Soul`, summary: s.summary, storyName: s.name, storyBy: s.by,
  body: `{{story-${s.slug}}}

${s.kind === "path" ? `*${PATH}, written for SAMADHI LOVE. Tap the scroll to open it, and again to roll it up.*` : `*${s.source} Tap the scroll to open it, and again to roll it up.*`}

## Related teachings
${s.related.map(([t, u]) => `- [${t}](${u})`).join("\n")}

See all the stories in [Stories for the Soul](/library?tab=stories).`,
});
export const storyPages = STORIES.map(storyPage);

export function storyArt(key) {
  const s = STORIES.find((x) => `story-${x.slug}` === key);
  return s ? storyScroll(s) : "";
}
