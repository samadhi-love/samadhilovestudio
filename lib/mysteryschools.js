// The Mystery Schools: the inner paths Samadhi has walked. The Rosicrucians, the Martinists,
// the I AM teachings, the Sufi path and Advaita (non-duality) with Ramana Maharshi.
// Each tradition in its own words; Samadhi's view labelled. Quotations: King James Bible;
// Pickthall's Qur'an (1930). Hadith with collection numbers. Checked Nov 2026.

const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;
const series = (n) => `*The Mystery Schools · ${n} of 6: [The Inner Path](/teachings/the-mystery-schools) · [The Rosicrucian Path](/teachings/the-rosicrucian-path) · [Martinism](/teachings/martinism-the-way-of-the-heart) · [The I AM Teachings](/teachings/the-i-am-teachings) · [The Sufi Path](/teachings/the-sufi-path) · [Non-Duality and Ramana Maharshi](/teachings/non-duality-and-ramana-maharshi).*`;

const sky = (id) => `<defs><radialGradient id="${id}" cx="50%" cy="45%" r="80%"><stop offset="0" stop-color="#2b2052"/><stop offset="1" stop-color="#07060f"/></radialGradient>
<radialGradient id="${id}-g"><stop offset="0" stop-color="#fff3c4" stop-opacity=".5"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-r" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#ffe0ea"/><stop offset=".5" stop-color="#f29ab5"/><stop offset="1" stop-color="#b8466e"/></radialGradient></defs>`;
const starsAt = [[60, 50], [540, 70], [110, 280], [500, 300], [40, 180], [570, 200], [180, 36], [430, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff" opacity=".7"/>`).join("");

// A rose of light: five petal rings opening around a golden centre.
function rose(cx, cy, s, id) {
  const ring = (n, r, w, h, rot, op) => Array.from({ length: n }, (_, i) => `<ellipse cx="${cx}" cy="${cy - r}" rx="${w}" ry="${h}" transform="rotate(${(i * 360) / n + rot} ${cx} ${cy})" fill="url(#${id}-r)" opacity="${op}"/>`).join("");
  return `<g class="ms-bloom">${ring(5, 34 * s, 26 * s, 30 * s, 0, .55)}${ring(5, 22 * s, 19 * s, 22 * s, 36, .75)}${ring(5, 11 * s, 12 * s, 14 * s, 0, .95)}<circle cx="${cx}" cy="${cy}" r="${7 * s}" fill="#ffe39a"/></g>`;
}
function roseArt(withCross) {
  const id = withCross ? "ms-rc" : "ms-rs";
  const cross = withCross ? `<g fill="#f2c46d" opacity=".95"><rect x="292" y="56" width="16" height="222" rx="4"/><rect x="214" y="122" width="172" height="16" rx="4"/></g>` : "";
  const title = withCross ? "A rose of light blooming at the centre of a golden cross: the rose cross of the Rosicrucians" : "A rose of light slowly opening in a circle of soft gold: the heart opening to God";
  return `<figure class="cross-hero ms-figure"><svg viewBox="0 0 600 340" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${title}</title>${sky(id)}
<rect width="600" height="340" rx="18" fill="url(#${id})"/>${starsAt}
<circle cx="300" cy="${withCross ? 130 : 160}" r="140" fill="url(#${id}-g)"/>
<circle cx="300" cy="${withCross ? 130 : 160}" r="100" fill="none" stroke="#ffe39a" stroke-opacity=".35" stroke-dasharray="2 7"/>
${cross}${rose(300, withCross ? 130 : 160, withCross ? 1.1 : 1.6, id)}
<text x="300" y="318" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="4" fill="#d9cfee">${withCross ? "THE ROSE AND THE CROSS" : "THE MYSTERY SCHOOLS"}</text></svg>
<figcaption class="fine">${withCross ? "The rose cross: the soul blooming on the cross of earthly life." : "The rose: the heart opening, layer by layer, to the Divine."} Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

// The Chart of the I AM Presence, drawn with lights and flames, not faces.
function chart() {
  const rings = ["#fffbe8", "#bfe9ff", "#ffe39a", "#ffb3c8", "#7fb2ff", "#9fe7b0", "#c9a0ff"].map((c, i) => `<circle cx="300" cy="78" r="${16 + i * 7}" fill="none" stroke="${c}" stroke-width="5" opacity="${(0.9 - i * 0.08).toFixed(2)}"/>`).join("");
  const flame = (x, y, s, fill) => `<path d="M${x} ${y} C${x - 16 * s} ${y - 20 * s} ${x - 8 * s} ${y - 36 * s} ${x} ${y - 52 * s} C${x + 8 * s} ${y - 36 * s} ${x + 16 * s} ${y - 20 * s} ${x} ${y} Z" fill="${fill}"/>`;
  return `<figure class="cross-hero ms-figure"><svg viewBox="0 0 600 420" role="img" aria-labelledby="ms-ch-t" xmlns="http://www.w3.org/2000/svg"><title id="ms-ch-t">The Chart of the I AM Presence drawn as light: at the top a sun of God's Presence ringed with the colours of the seven rays; in the middle a golden flame for the Christ Self; below, a small white light standing in a violet flame inside a tube of light, joined to the Presence above by a shining cord</title>${sky("ms-ch")}
<linearGradient id="ms-ch-v" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7a3cff"/><stop offset="1" stop-color="#e2c6ff" stop-opacity=".2"/></linearGradient>
<rect width="600" height="420" rx="18" fill="url(#ms-ch)"/>${starsAt}
<rect x="262" y="250" width="76" height="160" rx="38" fill="#fffbe8" opacity=".08" stroke="#fffbe8" stroke-opacity=".35"/>
<line x1="300" y1="78" x2="300" y2="352" stroke="#fffbe8" stroke-width="2" stroke-opacity=".7" class="ms-cord"/>
<g class="ms-turn">${rings}</g><circle cx="300" cy="78" r="14" fill="#fffbe8"/>
<circle cx="300" cy="186" r="40" fill="url(#ms-ch-g)"/>${flame(300, 210, 1.1, "#ffe39a")}
<g class="ms-flicker">${flame(300, 404, 2.2, "url(#ms-ch-v)")}</g><circle cx="300" cy="352" r="10" fill="#fffbe8"/>
<g font-family="Georgia, serif" font-size="13" fill="#f1ebff"><text x="372" y="72">The I AM Presence</text><text x="372" y="90" font-size="11" fill="#bdb3d9">God individualised for each soul</text>
<text x="340" y="180">The Holy Christ Self</text><text x="340" y="198" font-size="11" fill="#bdb3d9">the inner teacher, the bridge</text>
<text x="352" y="348">The soul on earth</text><text x="352" y="366" font-size="11" fill="#bdb3d9">in the violet flame and the tube of light</text></g>
</svg><figcaption class="fine">The Chart of the I AM Presence as the I AM teachings describe it, drawn as lights. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

// Samadhi's own picture: an artistic rendering of the Chart of the I AM Presence.
function chartPhoto() {
  return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/i-am-chart.jpg" width="1600" height="1067" alt="An artistic rendering of the Chart of the I AM Presence: a radiant figure of light in a golden sphere above, a seated figure of light below it, and a person standing on a mountain top inside a tube of light filled with violet flame, joined to the light above by a shining cord" loading="lazy" decoding="async"></div><figcaption class="fine">The Chart of the I AM Presence, as the I AM teachings describe it. Picture shared by Samadhi.</figcaption></figure>`;
}

export function mysteryArt(key) {
  return { "myst-rose": () => roseArt(false), "myst-rosecross": () => roseArt(true), "myst-chart": chartPhoto }[key]?.() || "";
}

export const mysterySchools = [
  { slug: "the-mystery-schools", tag: "The Mystery Schools · 1", title: "The Mystery Schools: The Inner Path",
    summary: "What a mystery school is: the inner, experiential side of the great traditions, where seekers are taught step by step to know God directly. The schools of the ancient world, and the living inner paths gathered in this section.",
    body: `{{myst-rose}}

${series(1)}

Every great tradition has an **outer** face and an **inner** one. The outer face is the temple, the scripture and the law that everyone can share. The inner face is the path of those who want to *know* God directly, not only believe: the **mystery school**. Its students are taught step by step, through study, prayer, meditation and service, to awaken the soul and walk home consciously.

"Know ye not that ye are the temple of God, and that the Spirit of God dwelleth in you?" (1 Corinthians 3:16).

## The ancient mysteries
- **Egypt.** The temples of Egypt trained priests in the hidden wisdom of Ma'at, the soul's journey and the sacred sciences. Many later schools looked to Egypt as their source.
- **Greece.** The Mysteries of **Eleusis** were celebrated for nearly two thousand years. Initiates swore never to reveal what they saw, and many said they no longer feared death. Cicero wrote that from them people had learned how to live with joy and to die with better hope (*On the Laws* 2.36). **Pythagoras** founded a school where students kept silence, studied number and music, and lived in harmony. See [Pythagoras and the Music of Numbers](/teachings/pythagoras-music-of-numbers).
- **The East.** In India, Tibet and China, the inner teachings were passed from teacher to student in an unbroken chain: the guru and disciple, the lama and student, the master and the "inner chamber" of the Tao.

## The living inner paths in this section
1. **[The Rosicrucian Path](/teachings/the-rosicrucian-path):** the Fraternity of the Rose Cross, from the manifestos of 1614 to AMORC today.
2. **[Martinism: The Way of the Heart](/teachings/martinism-the-way-of-the-heart):** Martinez de Pasqually, Louis-Claude de Saint-Martin, Papus and the Reintegration of the soul.
3. **[The I AM Teachings](/teachings/the-i-am-teachings):** the Presence of God within, decrees, the violet flame and the Chart.
4. **[The Sufi Path](/teachings/the-sufi-path):** the inner path of Islam, the way of love and remembrance.
5. **[Non-Duality and Ramana Maharshi](/teachings/non-duality-and-ramana-maharshi):** the teaching that the Self and God are not two.

## What they share
- **Direct experience** of the Divine, not only belief.
- **The soul's return**: we came from God and are travelling back, consciously.
- **Inner work**: purifying the heart, mastering the self, serving others.
- **A living chain** of teachers and students.
- **Respect for all paths**: the mystics of every faith recognise one another.

## Samadhi's view
*This is Samadhi's own understanding.*

Samadhi has walked these inner paths for many years: the Rosicrucian and Martinist schools, the I AM teachings, the Sufi way and non-duality. He found that they are not rivals but rooms of one house. Each one opens a door of the heart, and behind every door is the same Light. A true school never makes you depend on it; it teaches you to find the Teacher within.${bridge([
      ["Who Are the Mystics?", "/library?tab=mystics", "the souls of every faith who knew God directly."],
      ["Martinist and Rosicrucian Sayings", "/teachings/martinist-rosicrucian-sayings", "short sayings from these schools."],
      ["The Tree in the Western Mysteries", "/teachings/the-tree-in-the-western-mysteries", "the Tree of Life in the Western schools."],
    ])}

## Sources

- 1 Corinthians 3:16, King James Bible; Cicero, *On the Laws* 2.36.
- Walter Burkert, *Ancient Mystery Cults* (1987); Antoine Faivre, *Access to Western Esotericism* (1994).` },

  { slug: "the-rosicrucian-path", tag: "The Mystery Schools · 2", title: "The Rosicrucian Path: The Rose and the Cross",
    summary: "The Fraternity of the Rose Cross: the three manifestos of 1614 to 1616 and the legend of Christian Rosenkreutz, the Rosicrucian Enlightenment, the modern orders such as AMORC founded by H. Spencer Lewis, and their teaching on the soul's cycles.",
    body: `{{myst-rosecross}}

${series(2)}

In 1614, in the German town of Kassel, a small pamphlet appeared that set Europe talking. It announced a secret **Fraternity of the Rose Cross**: brothers devoted to healing, wisdom and the renewal of the world, who invited the learned of Europe to join them. No one knew who they were. Four centuries later, the rose and the cross still call to seekers.

## The three manifestos
- **The *Fama Fraternitatis* (1614)** tells the story of **Brother C.R.C.**, later called Christian Rosenkreutz. According to the legend he was born in 1378, travelled as a young man to the East, to **Damascus**, to "Damcar" in Arabia, and to **Fez** in Morocco, and learned there the wisdom of the Arab and Eastern sages: medicine, mathematics, and the harmony of the universe. Returning to Germany, he gathered a few brothers and founded the fraternity. Their rules were simple: to **heal the sick, freely**; to wear the clothes of the country they lived in; to meet once a year; to find a worthy successor; and to keep the fraternity hidden for a hundred years. C.R.C. died, the legend says, in 1484, and his tomb was found 120 years later, lit by an inner sun, his body uncorrupted.
- **The *Confessio Fraternitatis* (1615)** explained the fraternity's aims and its hope for a general reformation of the world.
- ***The Chymical Wedding of Christian Rosenkreutz* (1616)** told, as an allegory in seven days, of a soul's mystical marriage with the Divine. Its author, the Lutheran theologian **Johann Valentin Andreae**, later called the whole affair a *ludibrium*, a playful fiction; yet the ideals it spread were taken to heart by many.

## What history records
Historians have found no evidence that a fraternity existed in 1614 as the *Fama* describes it; the story of C.R.C. is understood by most scholars as a spiritual allegory. But the manifestos inspired real people: physicians, philosophers and mystics such as **Robert Fludd** and **Michael Maier** defended the Rosicrucian ideals, and the historian Frances Yates called this movement the *Rosicrucian Enlightenment* (1972). Rosicrucian orders have existed ever since.

## The modern orders
- **AMORC.** The Ancient Mystical Order Rosae Crucis was founded in New York in 1915 by **H. Spencer Lewis** (1883–1939), and is based today at Rosicrucian Park in San Jose, California, home of the Rosicrucian Egyptian Museum. AMORC teaches by graded lessons: the nature of the soul, the cycles of life, mystical breathing and meditation, healing, and the mastery of life. It also sponsors the Traditional Martinist Order.
- **The Rosicrucian Fellowship**, founded by **Max Heindel** in 1909 in California, teaches from *The Rosicrucian Cosmo-Conception* (1909), including a detailed account of the soul's experience after death and the review of the life.
- **The Lectorium Rosicrucianum**, founded in the Netherlands in 1935, teaches a Gnostic Christian path of inner rebirth.

## What the Rose Cross teaches
- **The rose on the cross.** The cross is the body and earthly life; the rose is the soul, unfolding petal by petal through experience and love.
- **The soul is the true person.** H. Spencer Lewis taught that we are souls clothed with bodies, and that the soul passes through many lives in great cycles. AMORC's teaching that the soul ideally returns **every 144 years** is told in [The 144-Year Cycle](/teachings/the-144-year-cycle).
- **Mastery of life.** The aim is not to escape the world, but to live in it as a healer and a helper, in harmony with the cosmic laws.
- **Silence and service.** True initiates heal freely, serve quietly and claim no titles.

## Samadhi's view
*This is Samadhi's own understanding.*

The Rose Cross is the path of the heart that blooms on the cross of life. The pains and trials of earth are not a punishment: they are the cross on which the rose opens. From the Rosicrucian teaching on the soul's cycles comes much of what this site shares about death and return. It is moving, too, that the legend sends Christian Rosenkreutz to learn wisdom in Damascus and Arabia: the light of the East and the West were always one light.${bridge([
      ["The 144-Year Cycle", "/teachings/the-144-year-cycle", "the Rosicrucian teaching on the soul's return."],
      ["Martinism: The Way of the Heart", "/teachings/martinism-the-way-of-the-heart", "the sister path of the Rose Cross."],
      ["Martinist and Rosicrucian Sayings", "/teachings/martinist-rosicrucian-sayings", "short sayings from these schools."],
    ])}

## Sources

- *Fama Fraternitatis* (Kassel, 1614); *Confessio Fraternitatis* (1615); Johann Valentin Andreae, *Chymische Hochzeit Christiani Rosencreutz* (Strasbourg, 1616).
- Frances A. Yates, *The Rosicrucian Enlightenment* (1972); Christopher McIntosh, *The Rosicrucians* (1997).
- H. Spencer Lewis, *Mansions of the Soul* (1930) and *Rosicrucian Questions and Answers*; [Rosicrucian Order AMORC](https://www.rosicrucian.org); Max Heindel, *The Rosicrucian Cosmo-Conception* (1909).` },

  { slug: "martinism-the-way-of-the-heart", tag: "The Mystery Schools · 3", title: "Martinism: The Way of the Heart",
    summary: "The Christian mystical path of Martinez de Pasqually, Louis-Claude de Saint-Martin, the Unknown Philosopher, and Papus: the fall and the Reintegration of the soul, the inner way of the heart, and the Martinist orders today.",
    body: `{{myst-rose}}

${series(3)}

Martinism is a quiet path. It does not seek crowds. Its students wear, in their gatherings, a **mask and a cloak**: the mask because the personality does not matter, only the soul; the cloak because the work is done in silence, hidden from the world. Its great theme is a single word: **Reintegration**, the return of the soul to the glory it had in God before the fall.

## The three founders
- **Martinez de Pasqually** (c. 1727–1774) founded, in France in the 1760s, the **Order of the Élus Coëns** ("Elect Priests"). He taught, in his *Treatise on the Reintegration of Beings*, that the first human, Adam, was a radiant spiritual being, emanated by God to serve Him, who fell into matter through his own will. Humanity's task is to be **reintegrated**: restored to its first state, and to help the whole creation return with it. Pasqually's way was through sacred ritual, or *theurgy*.
- **Louis-Claude de Saint-Martin** (1743–1803), Pasqually's disciple and secretary, wrote under the name of ***the Unknown Philosopher***. He came to believe that the outward rituals were not needed: the true work happens **in the heart**, through prayer, inner purity and union with the Divine. This inner way is often called *la voie cardiaque*, **the way of the heart**. He loved the writings of the German mystic Jacob Boehme and translated them into French. His books include *Of Errors and Truth* (1775), *The Man of Desire* (1790) and *The New Man* (1792).
- **Papus**, the pen name of the physician **Gérard Encausse** (1865–1916), gathered the scattered lines of Saint-Martin's followers and, with Augustin Chaboseau, founded the **Martinist Order** in Paris in 1891. Papus wrote widely on the Western mysteries, the Kabbalah and the Tarot.

Alongside them stands **Jean-Baptiste Willermoz** (1730–1824) of Lyon, another of Pasqually's disciples, who carried the teaching into the Rectified Scottish Rite.

## What Martinism teaches
- **The fall and the return.** We are spiritual beings in exile in matter. The purpose of life is to remember our origin and return to it, consciously and with love.
- **The Man of Desire.** Saint-Martin's ideal is the human being whose whole heart desires God, and in whom the Divine can act in the world.
- **Christ the Repairer.** For the Martinists, Christ is the Repairer who opens the way of Reintegration for every soul.
- **The inner initiation.** The true initiation is not a ceremony, but the awakening of the heart. Martinist initiates are called *S.I.*, *Superior Unknown*: unknown because they serve without seeking recognition.
- **The chain.** Martinism is passed from initiator to initiate, person to person, in an unbroken chain going back to Saint-Martin.

## Martinism today
Several Martinist orders work today, among them the **Traditional Martinist Order**, which is associated with AMORC, and the **Martinist Order** and its branches descending from Papus. They meet in small groups called *heptads*, study the writings of Saint-Martin, and work on themselves in silence.

## Samadhi's view
*This is Samadhi's own understanding.*

Martinism taught Samadhi that the real temple is the heart, and the real initiation is love. The mask is a beautiful teaching: in the light, no one cares about our name, our job or our wealth; only the soul shines. The soul fell into this world to learn, and it is returning, life by life, to the Source. Every act of love is a step of Reintegration.${bridge([
      ["The Rosicrucian Path", "/teachings/the-rosicrucian-path", "the sister path of the Rose Cross."],
      ["Martinist and Rosicrucian Sayings", "/teachings/martinist-rosicrucian-sayings", "short sayings from these schools."],
      ["Death Is a Doorway", "/teachings/death-is-a-doorway", "the soul's return through death."],
    ])}

## Sources

- Martinez de Pasqually, *Traité sur la réintégration des êtres* (written c. 1771–1772, published 1899).
- Louis-Claude de Saint-Martin, *Des erreurs et de la vérité* (1775), *L'Homme de désir* (1790), *Le Nouvel Homme* (1792).
- Papus, *Martinésisme, Willermosisme, Martinisme et Franc-Maçonnerie* (1899); Antoine Faivre, *Access to Western Esotericism* (1994); Robert Amadou's editions of Saint-Martin.` },

  { slug: "the-i-am-teachings", tag: "The Mystery Schools · 4", title: "The I AM Teachings: The Presence of God Within",
    summary: "The I AM teachings of Guy and Edna Ballard and the Ascended Masters: the Mighty I AM Presence, the Holy Christ Self, decrees, the violet flame of Saint Germain, the Chart of the Presence and the goal of the ascension.",
    body: `{{myst-chart}}

${series(4)}

When Moses asked God His name at the burning bush, the answer was: "**I AM THAT I AM**" (Exodus 3:14). The I AM teachings begin there. They teach that the name of God is spoken every time we say "I am", and that **God's Presence is individualised above every one of us**, as our own Mighty I AM Presence.

## Where the teaching came from
In the 1930s, **Guy W. Ballard** (1878–1939) and his wife **Edna Ballard** (1886–1971) began the **"I AM" Activity** in the United States. Guy Ballard told how, in 1930, on **Mount Shasta** in California, he met the Ascended Master **Saint Germain**, who taught him about the Presence, the violet flame and the ascension. He told the story in *Unveiled Mysteries* (1934), under the pen name **Godfré Ray King**. The Saint Germain Foundation continues this work today. Later movements carried the same teachings in their own way, among them the Bridge to Freedom (1951) and The Summit Lighthouse, founded by Mark L. Prophet in 1958 and continued by Elizabeth Clare Prophet.

## The Chart of the Presence
The heart of the teaching is a picture, the **Chart of the I AM Presence**, shown above:
- **At the top, the I AM Presence**: God individualised for each soul, surrounded by the spheres of the **causal body**, where all the good we have ever done is stored as light, in the colours of the seven rays.
- **In the middle, the Holy Christ Self**: the inner teacher and higher mind, the bridge between God and the soul on earth.
- **Below, the soul on earth**, standing in the **violet flame** inside a **tube of light** that protects it.
- **The crystal cord**: the stream of life and light that flows from the Presence into the heart, every moment, keeping us alive.

## Decrees and the violet flame
- **Decrees** are spoken prayers of command, made in the name of the I AM Presence: for example, *"I AM the resurrection and the life"* (from John 11:25), or *"I AM a being of violet fire, I AM the purity God desires."* The teaching is that whatever follows the words "I AM" is creative, so we must use them with care.
- **The violet flame** is the spiritual fire of mercy, forgiveness and transmutation associated with **Saint Germain** and the seventh ray. It is called on to change heavy energy, past mistakes and karma back into light. See [Saint Germain and the Violet Flame](/teachings/saint-germain-and-the-violet-flame).

## The goal: the ascension
In these teachings the purpose of all our lives is the **ascension**: the reunion of the soul with its I AM Presence, when the soul has balanced enough of its karma and fulfilled its mission on earth. The Ascended Masters, such as Saint Germain, Jesus, Mother Mary and Kuan Yin, are souls who have walked this path before us and now help humanity. See [The Ascended Masters](/teachings/ascended-masters) and [800 Lifetimes to Ascension](/teachings/800-lifetimes-to-ascension).

## The drop and the ocean
*This is Samadhi's view, in the words of the mystics.*

The I AM Presence within you is the Divine. The little self is not God, but the Light within it is. The drop is ocean, yet the drop is not the whole ocean.

The mystics of every faith have said this in their own words:
- ***Aham Brahmasmi***, "I am Brahman" (Brihadaranyaka Upanishad 1.4.10): the Self within is one with the Absolute (Advaita).
- ***Ana al-Haqq***, "I am the Truth", the cry of the Sufi al-Hallaj (died 922), spoken not by his ego but by the Divine Light that filled him.
- "**Ye are gods; and all of you are children of the most High**" (Psalm 82:6), words Jesus repeated: "Is it not written in your law, I said, Ye are gods?" (John 10:34).
- **The divine spark.** Kabbalah teaches that a spark (*nitzotz*) of the Divine lives within every soul.
- **The I AM Presence**, in the Ascended Master teachings, is God individualised above each one of us.

## Echoes in the scriptures
- "Before Abraham was, I am" (John 8:58). "I am the way, the truth, and the life" (John 14:6), read by the mystics as the I AM in every heart. See [I Am the Way](/teachings/i-am-the-way).
- "Be still, and know that I am God" (Psalm 46:10).
- "We are nearer to him than his jugular vein" (Qur'an 50:16, Pickthall).

## Holding the teaching wisely
Historians note that these teachings are modern, coming from the 1930s onward, and that they draw on Theosophy and the Western mysteries. Their messages are received through dictations, which cannot be checked like history. Students take what helps them love and serve, and use the decrees with humility and joy, never to control others.

## Samadhi's view
*This is Samadhi's own understanding.*

The I AM Presence is God within us, the light above every head and the life in every heartbeat. When we say "I am", we use God's own name, so we should never say "I am weak" or "I am nothing", but "I AM the light, I AM love, I AM God in action". The violet flame is God's mercy: it frees us from the past so we can walk lighter toward home.${bridge([
      ["Saint Germain and the Violet Flame", "/teachings/saint-germain-and-the-violet-flame", "the master of the seventh ray."],
      ["The Life Review and the Karmic Board", "/teachings/the-life-review-and-the-karmic-board", "the Board of the Ascended Master teachings."],
      ["The Seven Rays", "/teachings/seven-rays", "the seven colours of the causal body."],
    ])}

## Sources

- Exodus 3:14; Psalm 46:10; John 8:58, 11:25 and 14:6, King James Bible; Qur'an 50:16, Pickthall (1930).
- Godfré Ray King (Guy W. Ballard), *Unveiled Mysteries* (1934) and *The Magic Presence* (1935); Saint Germain Foundation.
- Mark L. Prophet and Elizabeth Clare Prophet, *The Chart of Your Divine Self*; J. Gordon Melton, "I AM Religious Activity", *Encyclopedia of American Religions*.` },

  { slug: "the-sufi-path", tag: "The Mystery Schools · 5", title: "The Sufi Path: The Way of Love and Remembrance",
    summary: "Sufism, the inner path of Islam: ihsan, the remembrance of God (dhikr), the teacher and the orders, the stations of the heart, passing away in God (fana), and the great Sufis from Rabia and al-Ghazali to Rumi and Ibn Arabi.",
    body: `{{myst-rose}}

${series(5)}

The Sufis say that the outer law is like the shell of a nut, and the inner path is its kernel. **Sufism** (*tasawwuf*) is the inner, mystical path of Islam: the way of those who long not only to obey God, but to **love Him and know Him with the heart**.

## The heart of the path: ihsan
In a famous hadith, the angel Gabriel came in human form and asked the Prophet Muhammad about faith. When he asked about *ihsan*, excellence, the Prophet answered: *to worship God as though you see Him, and if you do not see Him, He sees you* (Sahih al-Bukhari 50; Sahih Muslim 8). The whole Sufi path is the effort to live in that awareness.

"We verily created man and We know what his soul whispereth to him, and We are nearer to him than his jugular vein" (Qur'an 50:16, Pickthall).

## Remembrance (dhikr)
"Verily in the remembrance of Allah do hearts find rest!" (Qur'an 13:28, Pickthall). The central practice of the Sufis is ***dhikr***, remembrance: repeating the names of God, such as *Allah*, or the phrase *La ilaha illa'llah*, "there is no god but God", aloud in a circle or silently in the heart, until the heart itself remembers with every breath. The Mevlevi order, the followers of **Rumi**, also remember God through music and the turning dance (*sama*).

## The teacher and the orders
The Sufi seeker (*murid*, "the one who desires") walks with a teacher (*shaykh* or *murshid*), who received the teaching through a chain (*silsila*) going back to the Prophet. Over the centuries, great **orders** (*tariqas*) formed around such teachers, among them:
- the **Qadiriyya**, from Abd al-Qadir al-Jilani of Baghdad (12th century);
- the **Chishtiyya** of India, from Mu'in al-Din Chishti of Ajmer, famous for its music and its love of the poor;
- the **Shadhiliyya** of North Africa, from Abu al-Hasan al-Shadhili;
- the **Naqshbandiyya**, from Baha al-Din Naqshband of Bukhara, known for silent remembrance;
- the **Mevlevi**, the order of Rumi in Konya.

## The stations of the heart
The Sufis describe the journey as a series of **stations** (*maqamat*), reached through effort, and **states** (*ahwal*), given by grace. Among the stations: *tawba*, turning back to God; *sabr*, patience; *shukr*, gratitude; *tawakkul*, trust in God; *zuhd*, freedom from attachment; and *rida*, contentment with God's will. At the summit is ***fana***, the **passing away** of the ego in God, and ***baqa***, **abiding** in God: living in the world with the self emptied and God's light shining through. A saying beloved by the Sufis, though not found in the main hadith collections, sums it up: *"Die before you die."*

A hadith *qudsi*, in which God speaks through the Prophet's words, describes the goal: when the servant draws near to God through love, God says, *I become the hearing with which he hears, the sight with which he sees, the hand with which he strikes and the foot with which he walks* (Sahih al-Bukhari 6502).

## Great Sufis
- **Rabia al-Adawiyya** of Basra (8th century), who loved God for Himself alone, not for fear of hell or hope of paradise. See [Rabia of Basra](/teachings/rabia-of-basra).
- **Junayd of Baghdad** (died 910), master of the "sober" path, who taught that the mystic returns to the world after union, to serve.
- **Al-Ghazali** (1058–1111), the great scholar who left his fame to seek God, and showed in *The Revival of the Religious Sciences* that the inner path and the outer law belong together.
- **Jalal al-Din Rumi** (1207–1273), the poet of divine love. See [Rumi](/teachings/rumi).
- **Ibn Arabi** (1165–1240), who taught the *oneness of being*. See [Ibn Arabi](/teachings/ibn-arabi).

## Samadhi's view
*This is Samadhi's own understanding.*

The Sufi way is the way of love. Remember God with every breath, and the heart becomes a mirror where He can see Himself. The ego must "die before we die": not the body, but the false self that thinks it is separate. Then what is left is only Love, and Love is God.${bridge([
      ["Rumi", "/teachings/rumi", "the poet of divine love."],
      ["Non-Duality and Ramana Maharshi", "/teachings/non-duality-and-ramana-maharshi", "the same summit, seen from India."],
      ["Give Your Soul Only to God", "/teachings/give-your-soul-only-to-god", "devotion that belongs to God alone."],
    ])}

## Sources

- Qur'an 13:28 and 50:16, Pickthall (1930); Sahih al-Bukhari 50 and 6502; Sahih Muslim 8.
- Al-Qushayri, *The Risala* (11th century); al-Ghazali, *The Revival of the Religious Sciences* and *Deliverance from Error*.
- Annemarie Schimmel, *Mystical Dimensions of Islam* (1975); William C. Chittick, *Sufism: A Beginner's Guide* (2000).` },

  { slug: "non-duality-and-ramana-maharshi", tag: "The Mystery Schools · 6", title: "Non-Duality and Ramana Maharshi: Who Am I?",
    summary: "Advaita Vedanta, the teaching that the Self and God are not two: the great sayings of the Upanishads, Adi Shankara, and the sage Ramana Maharshi of Arunachala, who awoke at sixteen and taught the simple practice of asking: who am I?",
    body: `{{myst-rose}}

${series(6)}

Every mystery school leads, in the end, to the same summit. The Sufis call it *fana*, the Christians union, the Kabbalists the return to Ein Sof. The sages of India call it **Advaita**: **"not two."** The Self in you and the God of all are not two different things. There is only One.

## The great sayings of the Upanishads
The Upanishads, the summit of the Vedas, give four "great sayings" (*mahavakyas*):
- ***Tat tvam asi***, "**That thou art**" (Chandogya Upanishad 6.8.7): what you truly are is the Infinite.
- ***Aham Brahmasmi***, "**I am Brahman**" (Brihadaranyaka Upanishad 1.4.10).
- ***Ayam Atma Brahma***, "**This Self is Brahman**" (Mandukya Upanishad 2).
- ***Prajnanam Brahma***, "**Consciousness is Brahman**" (Aitareya Upanishad 3.3).

## Shankara and Advaita Vedanta
The sage **Gaudapada** taught this oneness in his verses on the Mandukya Upanishad, and the great **Adi Shankara** (traditionally dated to the 8th century) explained it in his commentaries on the Upanishads, the Bhagavad Gita and the Brahma Sutras. A famous summary of his teaching is: *Brahman alone is real; the world, as we see it, is appearance; and the individual self is not other than Brahman.* We suffer because we mistake ourselves for the body and mind, as a man in the dusk mistakes a rope for a snake. When the light of knowledge comes, the snake vanishes; there was only ever the rope. See [Adi Shankara](/teachings/adi-shankara).

Other great schools of Vedanta see it differently, and with equal love: **Ramanuja** taught *qualified* non-duality, in which souls are real parts of God, and **Madhva** taught *dualism*, the eternal difference between the soul and God, joined by devotion. All three are honoured traditions of India.

## The drop and the ocean
*This is Samadhi's view, in the words of the mystics.*

The I AM Presence within you is the Divine. The little self is not God, but the Light within it is. The drop is ocean, yet the drop is not the whole ocean.

The mystics of every faith have said this in their own words:
- ***Aham Brahmasmi***, "I am Brahman" (Brihadaranyaka Upanishad 1.4.10): the Self within is one with the Absolute (Advaita).
- ***Ana al-Haqq***, "I am the Truth", the cry of the Sufi al-Hallaj (died 922), spoken not by his ego but by the Divine Light that filled him.
- "**Ye are gods; and all of you are children of the most High**" (Psalm 82:6), words Jesus repeated: "Is it not written in your law, I said, Ye are gods?" (John 10:34).
- **The divine spark.** Kabbalah teaches that a spark (*nitzotz*) of the Divine lives within every soul.
- **The I AM Presence**, in the Ascended Master teachings, is God individualised above each one of us.

## Ramana Maharshi
**Ramana Maharshi** (1879–1950) was born in the village of Tiruchuzhi in South India. In 1896, when he was **sixteen**, sitting alone in his uncle's house in Madurai, he was seized by a sudden fear of death. Instead of running from it, he lay down and **acted out his own death**: he held his breath, kept his body still as a corpse, and asked, *"This body dies. But am I dead? Who am I?"* In that moment he realised that he was not the body, but the deathless Self. The fear never returned.

Soon after, he left home for the holy mountain of **Arunachala** at Tiruvannamalai, and stayed there for the rest of his life, more than fifty years. Seekers came from all over the world. He taught most of all in **silence**, and when he spoke, he gave one simple practice: ***self-inquiry*** (*atma vichara*).

## The practice: Who am I?
1. **Sit quietly.** Let thoughts come and go.
2. **When a thought arises, ask: to whom does this thought come?** The answer will be: *to me.*
3. **Then ask: who am I?** Do not answer with words. Turn the attention back toward the feeling of "I" itself, its source.
4. **Rest there.** Each time the mind wanders, gently ask again. Ramana taught that the question "Who am I?" destroys all other thoughts, and is itself consumed in the end, like the stick used to stir a funeral fire.

## Other voices of non-duality
- **Nisargadatta Maharaj** (1897–1981) of Mumbai, whose talks were gathered in *I Am That* (1973).
- **Meister Eckhart**, the Christian mystic, who said the eye with which he sees God is the same eye with which God sees him. See [Meister Eckhart](/teachings/meister-eckhart).
- **Ibn Arabi** and the Sufis of the *oneness of being*. See [Ibn Arabi](/teachings/ibn-arabi).
- **Kashmir Shaivism** and the Buddhist teachings of emptiness, which speak of non-duality in their own words.

## Samadhi's view
*This is Samadhi's own understanding.*

At the end of every path we discover that we never left home. The wave searches for the ocean, and finds it was always water. Ramana's story is a teaching about death too: when we see that we are not the body, death loses its sting, and life becomes free. Ask "Who am I?" until only Love remains.${bridge([
      ["Adi Shankara", "/teachings/adi-shankara", "the great teacher of Advaita."],
      ["Death Is a Doorway", "/teachings/death-is-a-doorway", "what the deathless Self means for death."],
      ["The Power of Silence", "/teachings/the-power-of-silence", "Ramana's teaching in silence."],
    ])}

## Sources

- *Chandogya Upanishad* 6.8.7; *Brihadaranyaka Upanishad* 1.4.10; *Mandukya Upanishad* 2; *Aitareya Upanishad* 3.3.
- Adi Shankara, commentaries on the Upanishads and the *Brahma Sutras*; Gaudapada, *Mandukya Karika*.
- Ramana Maharshi, *Who Am I?* (*Nan Yar?*); Arthur Osborne, *Ramana Maharshi and the Path of Self-Knowledge* (1954); [Sri Ramanasramam](https://www.sriramanamaharshi.org).
- Nisargadatta Maharaj, *I Am That* (1973).` },
];
