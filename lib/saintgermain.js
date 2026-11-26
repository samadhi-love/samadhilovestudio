// Saint Germain: his lifetimes as the Ascended Master teachings give them, each beside what history records,
// with an original violet flame drawing and the violet flame mantra in a panel at the side.

export function violetArt() {
  const id = "sg-flame";
  const tongues = [
    [400, 120, 70, 230], [340, 170, 50, 180], [460, 170, 50, 180], [300, 220, 36, 130], [500, 220, 36, 130],
  ].map(([x, top, w, h], i) => `<path d="M${x} ${top} C ${x + w * 0.9} ${top + h * 0.35}, ${x + w * 0.7} ${top + h * 0.8}, ${x} ${top + h} C ${x - w * 0.7} ${top + h * 0.8}, ${x - w * 0.9} ${top + h * 0.35}, ${x} ${top} Z" fill="url(#${id}-f)" opacity="${(0.95 - i * 0.12).toFixed(2)}"/>`).join("");
  let s = 97, stars = "";
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 110; i++) stars += `<circle cx="${(r() * 800).toFixed(1)}" cy="${(r() * 430).toFixed(1)}" r="${(r() * 1.3 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`;
  const arm = (a) => `<path d="M0 0 L-26 -92 Q0 -78 26 -92 Z" fill="url(#${id}-g)" transform="rotate(${a})"/>`;
  return `<figure class="sg-art"><svg viewBox="0 0 800 430" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">Original drawing: a violet flame rising from a golden Maltese cross beneath a night sky</title>
<defs>
  <radialGradient id="${id}-sky" cx="50%" cy="55%" r="75%"><stop offset="0" stop-color="#3b1f5e"/><stop offset="1" stop-color="#07060f"/></radialGradient>
  <linearGradient id="${id}-f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#e3c6ff"/><stop offset=".6" stop-color="#a45cff"/><stop offset="1" stop-color="#6b2fd6" stop-opacity=".1"/></linearGradient>
  <linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".6" stop-color="#f2c46d"/><stop offset="1" stop-color="#b8862f"/></linearGradient>
  <radialGradient id="${id}-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#c79bff" stop-opacity=".6"/><stop offset="1" stop-color="#c79bff" stop-opacity="0"/></radialGradient>
  <filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<rect width="800" height="430" fill="url(#${id}-sky)"/>${stars}
<circle cx="400" cy="260" r="190" fill="url(#${id}-halo)"/>
<g filter="url(#${id}-blur)" opacity=".7">${tongues}</g>${tongues}
<g transform="translate(400 372) scale(.55)">${[0, 90, 180, 270].map(arm).join("")}<circle r="14" fill="#fff8dc"/></g>
<text x="400" y="38" text-anchor="middle" fill="#e3c6ff" font-family="Georgia, serif" font-size="17" letter-spacing="4">THE VIOLET FLAME OF FREEDOM</text>
</svg><figcaption class="fine">Original drawing for SAMADHI LOVE: the violet flame rising from the Maltese cross, Saint Germain's sign.</figcaption></figure>`;
}

export function sgPortrait() {
  return `<figure class="sg-portrait"><img src="/images/saint-germain-engraving.jpg" width="505" height="632" alt="Engraved portrait of the Count of Saint Germain in a powdered wig and a fur-trimmed embroidered coat" loading="lazy" decoding="async"><figcaption class="fine">The Count of Saint Germain, 1783 engraving by Nicolas Thomas after a lost painting. Public domain, via Wikimedia Commons.</figcaption></figure>`;
}

export function violetPanel() {
  return `<aside class="violet-panel" aria-label="The violet flame mantra">
<p class="violet-eyebrow">The violet flame mantra</p>
<p class="violet-mantra">I AM a being of violet fire,<br>I AM the purity God desires!</p>
<p class="violet-how">Say it slowly, again and again, while you picture a gentle violet fire in your heart, dissolving all that is not love.</p>
<p class="violet-eyebrow">The longer decree</p>
<p class="violet-decree">I AM the violet flame<br>In action in me now<br>I AM the violet flame<br>To Light alone I bow<br>I AM the violet flame<br>In mighty cosmic power<br>I AM the Light of God<br>Shining every hour<br>I AM the violet flame<br>Blazing like a sun<br>I AM God's sacred power<br>Freeing every one</p>
<p class="violet-source">Mantras of The Summit Lighthouse.</p>
</aside>`;
}

export const saintGermainTeaching = {
  slug: "saint-germain-and-the-violet-flame", tag: "Ascended Master", title: "Saint Germain: His Lifetimes and the Violet Flame",
  summary: "The Master of the violet flame and the seventh ray: his lifetimes across the ages as the Ascended Master teachings give them, what history records of each, the mysterious Count of Saint Germain, and how to use the violet flame.",
  body: `{{sg-portrait}}

{{sg-panel}}

**Saint Germain** is honoured in the Ascended Master teachings as the Master of the **violet flame**: the spiritual fire of freedom, forgiveness, mercy and transformation. His name comes from the Latin *Sanctus Germanus*, "Holy Brother."

{{sg-art}}

## His offices in the teachings
- **Chohan (Lord) of the seventh ray**, the violet ray of freedom, mercy, alchemy and transformation.
- **Hierarch of the Aquarian age**, the new two-thousand-year age, together with his twin flame **Portia**, the Goddess of Justice. He is the sponsor of the flame of freedom; she is the sponsor of the flame of justice.
- **His retreat** is taught to be the Rakoczy Mansion in Transylvania. **His sign** is the Maltese cross.
- **His ascension** is taught to have taken place at the Rakoczy Mansion on **1 May 1684**.

## His lifetimes across the ages
These are the lifetimes given in the teachings of The Summit Lighthouse (founded by Mark L. Prophet in 1958 and carried on by Elizabeth Clare Prophet). The teachings say that in every life his soul worked for one thing: **to make people free.** Beside each one is what history or the old texts record of that person.

| Age | Who he was, in these teachings | His role | What history and the old texts record |
| --- | --- | --- | --- |
| Tens of thousands of years ago | **Ruler of a golden-age civilization** in the land that is now the Sahara | A just and wise king of a land of peace and plenty | A teaching of the Ascended Masters; no historical record |
| The age of Atlantis | **High priest of the Violet Flame Temple** on Atlantis | Keeper of the violet flame, which drew people from far away to be healed and freed | A teaching of the Ascended Masters; Atlantis itself is first told of by Plato |
| About the 11th century BC | **The prophet Samuel** | Prophet and last of the judges of Israel; he anointed Saul and then David as kings | Told in the First Book of Samuel in the Bible |
| 1st century BC – 1st century AD | **Saint Joseph** | Husband of Mother Mary and protector and earthly father of Jesus | Told in the Gospels of Matthew and Luke; honoured as a saint |
| 3rd or 4th century AD | **Saint Alban** | The first martyr of Britain, who sheltered a fleeing Christian priest and gave his life in his place | Honoured as Britain's first martyr; the city of St Albans bears his name |
| AD 412–485 | **Proclus** | The great Neoplatonist philosopher and head of Plato's Academy in Athens | A real philosopher whose many writings survive |
| 5th–6th century AD | **Merlin** | Prophet, alchemist and counsellor at the court of King Arthur | A figure of legend, first written about in the Middle Ages |
| About 1220–1292 | **Roger Bacon** | Franciscan friar and philosopher who taught learning by experiment and foresaw flying machines and engines | A real English scholar, remembered as a pioneer of the scientific method |
| 1451–1506 | **Christopher Columbus** | The navigator whose voyage of 1492 opened the way between Europe and the Americas | A real explorer. History also remembers the great suffering his voyages brought to the native peoples of the Caribbean |
| 1561–1626 | **Francis Bacon** | Philosopher, statesman and Lord Chancellor of England, father of the modern scientific method; these teachings also hold that he wrote the plays known as Shakespeare's | A real philosopher and statesman. Most scholars hold that Shakespeare wrote his own plays |
| 1 May 1684 | **His ascension** | Taught to have ascended at the Rakoczy Mansion in Transylvania, becoming an Ascended Master | A teaching of the Ascended Masters |
| 18th century | **The Comte (Count) de Saint Germain** | The "Wonderman of Europe": alchemist, musician and diplomat at the courts of kings, working for peace and freedom | A real, mysterious man. Voltaire called him "a man who never dies, and who knows everything." Church records say he died at Eckernförde in 1784, though he was said to be seen in Paris years later |

## The Count of Saint Germain: the man history knows
The Count was very real. He appeared in the great courts of 18th-century Europe, spoke many languages, played the violin, painted, and was said to know the secrets of alchemy and of precious stones. No one ever found out where he came from, and he seemed not to grow old. He spent his last years with Prince Charles of Hesse-Cassel, studying alchemy, and the parish records of Eckernförde record his death in February 1784. The teachings say this was not his end: as an Ascended Master he simply laid that form aside.

## How the teachings came to the world
- **Theosophy** (late 19th century) first spoke of him as one of the Masters of the Ancient Wisdom.
- **Mount Shasta, 1930:** Guy Ballard, a mining engineer, wrote that he met Saint Germain on the slopes of Mount Shasta in California. He told the story in *Unveiled Mysteries* (1934) and founded the "I AM" Activity.
- **The Summit Lighthouse (1958):** Mark L. Prophet and later Elizabeth Clare Prophet taught the violet flame and Saint Germain's lifetimes to people all over the world.

## The violet flame
Saint Germain's great gift, the teachings say, is the **violet flame**: a spiritual fire of mercy and forgiveness that can **transform** (they call it *transmute*) old pain, mistakes and heavy energy, from this life and from lives before, back into light. It does not punish or destroy; like a gentle fire it changes darkness into light.

**How to use it:**
1. Sit quietly and breathe slowly. Feel the presence of God within you, your *I AM Presence*.
2. Picture a soft violet flame in your heart, growing until it surrounds your whole body.
3. Say the mantra, slowly and with love, as many times as you like: *I AM a being of violet fire, I AM the purity God desires!*
4. Send the violet flame into anything heavy: a memory, a hurt, a fear, a relationship. Let it be changed into light.
5. Finish by giving thanks.

The mantra and the longer decree are in the violet panel on this page, so you can come back to them any time.

**Samadhi's view:** Saint Germain has walked with humanity through many lives, as prophet, protector, martyr, philosopher, scientist and explorer, always working for freedom. His violet flame is a gift of mercy for everyone, and anyone can use it.

*Read with this: [The Power of Forgiveness](/teachings/the-power-of-forgiveness): the violet flame is forgiveness made into fire.*

*The lifetimes and offices on this page are teachings of the Ascended Master tradition, especially The Summit Lighthouse, shared here with respect. The column "What history and the old texts record" shows what is known from history, so every reader can see which is which.*

## Sources

- The teachings on his offices, lifetimes and the violet flame: Mark L. Prophet and Elizabeth Clare Prophet, *Saint Germain on Alchemy* (1985), *Lords of the Seven Rays* (1986) and *The Masters and Their Retreats* (2003).
- Guy Ballard, *Unveiled Mysteries* (1934), on Mount Shasta.
- [Encyclopedia.com: Ascended Masters](https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/ascended-masters), on how the teaching grew from Theosophy.
- The historical Count: [Britannica: comte de Saint-Germain](https://www.britannica.com/biography/comte-de-Saint-Germain); Isabel Cooper-Oakley, *The Comte de St. Germain* (1912); Voltaire's letter to Frederick the Great of 15 April 1760; the Eckernförde parish register for 1784.
- The history column: 1 Samuel, Matthew 1–2 and Luke 1–2, King James Bible; Bede, *Ecclesiastical History* 1.7 (Saint Alban); [Stanford Encyclopedia of Philosophy: Proclus](https://plato.stanford.edu/entries/proclus/), [Roger Bacon](https://plato.stanford.edu/entries/roger-bacon/) and [Francis Bacon](https://plato.stanford.edu/entries/francis-bacon/); Geoffrey of Monmouth, *History of the Kings of Britain* (Merlin).`,
};
