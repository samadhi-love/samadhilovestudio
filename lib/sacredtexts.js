// Sacred Texts: the Torah, the Sefer Yetzirah and the Zohar, and how the sages read them in four layers.
// Quotations from public-domain translations only: the King James Bible, the JPS Tanakh (1917),
// W. Wynn Westcott's Sefer Yetzirah (1887). Facts checked Nov 2026.
// Emblems are drawn in code for SAMADHI LOVE; the 231 Gates use the CSS toggles of Sacred Geometry.

const GOLD = "#f2c46d", PALE = "#fff3c4", LAV = "#c9b8ff", TEAL = "#9fe7dc", ROSE = "#f6b8d0";
const f = (n) => Number(n.toFixed(2));

function stars(n, w, h, seed) {
  let s = seed, out = "";
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) out += `<circle cx="${f(r() * w)}" cy="${f(r() * h)}" r="${f(r() * 1.2 + 0.3)}" fill="#fff" opacity="${f(r() * 0.5 + 0.2)}"/>`;
  return out;
}
const sky = (id, w, h, seed) => `<defs><radialGradient id="${id}-sky" cx="50%" cy="45%" r="80%"><stop offset="0" stop-color="#271c4c"/><stop offset="1" stop-color="#07060f"/></radialGradient>
<radialGradient id="${id}-glow"><stop offset="0" stop-color="${PALE}" stop-opacity=".5"/><stop offset="1" stop-color="${PALE}" stop-opacity="0"/></radialGradient></defs>
<rect width="${w}" height="${h}" rx="18" fill="url(#${id}-sky)"/>${stars(55, w, h, seed)}`;
const text = (x, y, t, size = 13, color = "#d9cfee", extra = "") => `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" font-family="Georgia, serif" font-size="${size}" fill="${color}"${extra}>${t}</text>`;
const fig = (id, title, inner, caption, w = 720, h = 400) => `<figure class="cross-hero st-figure"><svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${title}</title>${inner}</svg><figcaption class="fine">${caption} Drawn for SAMADHI LOVE.</figcaption></figure>`;

// The four levels of reading, PaRDeS, as four rings around a hidden centre.
function pardes() {
  const c = [360, 205], rings = [[170, "PESHAT", "the plain meaning"], [125, "REMEZ", "the hint"], [82, "DERASH", "the seeking"], [40, "SOD", "the secret"]];
  return fig("st-pardes", "Four rings, one inside the other: Peshat, Remez, Derash and Sod, the four levels of reading the Torah",
    `${sky("pa", 720, 410, 401)}<circle cx="${c[0]}" cy="${c[1]}" r="60" fill="url(#pa-glow)"/>
${rings.map(([r, n, m], i) => `<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="${[TEAL, LAV, ROSE, GOLD][i]}" fill-opacity="${0.06 + i * 0.04}" stroke="${[TEAL, LAV, ROSE, GOLD][i]}" stroke-width="2"/>
${text(c[0], c[1] - r + 20, n, 13, [TEAL, LAV, ROSE, PALE][i], ' letter-spacing="2" font-weight="bold"')}`).join("")}
${text(c[0], c[1] + 6, "✦", 18, PALE)}
${rings.map(([r, n, m], i) => `${text(600, 90 + i * 70, `${i + 1}. ${n[0]}${n.slice(1).toLowerCase()}`, 15, [TEAL, LAV, ROSE, PALE][i], ' font-weight="bold"')}${text(600, 110 + i * 70, m, 12.5)}`).join("")}
${text(120, 190, "PaRDeS", 22, PALE, ' font-style="italic"')}${text(120, 214, "the orchard", 13)}`,
    "PaRDeS, the orchard: four ways of reading, from the plain meaning on the outside to the secret at the heart.", 720, 410);
}

// The Torah scroll, rolled on its two wooden rollers.
function scroll() {
  const roller = (x) => `<rect x="${x - 9}" y="70" width="18" height="260" rx="9" fill="#6b4a2a" stroke="${GOLD}" stroke-width="2"/><circle cx="${x}" cy="58" r="13" fill="${GOLD}"/><circle cx="${x}" cy="342" r="13" fill="${GOLD}"/><rect x="${x - 22}" y="84" width="44" height="232" rx="22" fill="#efe2c0" stroke="${GOLD}" stroke-width="1.5"/>`;
  const lines = Array.from({ length: 11 }, (_, i) => `<line x1="${i % 2 ? 300 : 290}" y1="${118 + i * 17}" x2="${i % 2 ? 420 : 430}" y2="${118 + i * 17}" stroke="#7a5a2e" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`).join("");
  return fig("st-scroll", "An open Torah scroll on its two wooden rollers, with columns of lines and a crown of light above",
    `${sky("sc", 720, 400, 411)}<circle cx="360" cy="200" r="190" fill="url(#sc-glow)" opacity=".5"/>
<rect x="250" y="96" width="220" height="208" fill="#f6ecd2" stroke="${GOLD}" stroke-width="1.5"/>${lines}
${roller(228)}${roller(492)}
<path d="M326 40 L340 18 L352 36 L360 12 L368 36 L380 18 L394 40 Z" fill="${GOLD}" opacity=".9"/>
${text(360, 380, "TORAH · TEACHING · THE WAY", 13, "#d9cfee", ' letter-spacing="3"')}`,
    "A Torah scroll is written by hand on parchment by a trained scribe, and read aloud in the synagogue through the year.");
}

// The cube of space: six directions sealed around a holy centre (Sefer Yetzirah 1:13 and 4:3).
function cube() {
  const c = [360, 200], L = 130;
  const iso = (x, y, z) => [c[0] + (x - z) * 0.866 * L, c[1] + (x + z) * 0.5 * L - y * L];
  const P = (x, y, z) => iso(x, y, z).map(f).join(",");
  const edges = [];
  for (const [a, b] of [[[-.6, -.6, -.6], [.6, -.6, -.6]], [[-.6, .6, -.6], [.6, .6, -.6]], [[-.6, -.6, .6], [.6, -.6, .6]], [[-.6, .6, .6], [.6, .6, .6]],
    [[-.6, -.6, -.6], [-.6, .6, -.6]], [[.6, -.6, -.6], [.6, .6, -.6]], [[-.6, -.6, .6], [-.6, .6, .6]], [[.6, -.6, .6], [.6, .6, .6]],
    [[-.6, -.6, -.6], [-.6, -.6, .6]], [[.6, -.6, -.6], [.6, -.6, .6]], [[-.6, .6, -.6], [-.6, .6, .6]], [[.6, .6, -.6], [.6, .6, .6]]])
    edges.push(`<line x1="${P(...a).split(",")[0]}" y1="${P(...a).split(",")[1]}" x2="${P(...b).split(",")[0]}" y2="${P(...b).split(",")[1]}"/>`);
  const axes = [[[0, 1.25, 0], "ABOVE"], [[0, -1.25, 0], "BELOW"], [[1.25, 0, 0], "SOUTH"], [[-1.25, 0, 0], "NORTH"], [[0, 0, 1.25], "EAST"], [[0, 0, -1.25], "WEST"]];
  return fig("st-cube", "A cube of light with six arrows from its centre: above, below, east, west, north and south, around a holy palace at the centre",
    `${sky("cu", 720, 400, 421)}<circle cx="${c[0]}" cy="${c[1]}" r="70" fill="url(#cu-glow)"/>
<g stroke="${GOLD}" stroke-width="1.6" opacity=".7">${edges.join("")}</g>
<g stroke="${TEAL}" stroke-width="2.4" stroke-linecap="round">${axes.map(([p]) => { const [x, y] = iso(...p); return `<line x1="${c[0]}" y1="${c[1]}" x2="${f(x)}" y2="${f(y)}"/>`; }).join("")}</g>
${axes.map(([p, t]) => { const [x, y] = iso(...p.map((v) => v * 1.13)); return text(x, y + 4, t, 12.5, PALE, ' letter-spacing="2" font-weight="bold"'); }).join("")}
<circle cx="${c[0]}" cy="${c[1]}" r="9" fill="${PALE}"/>`,
    "The six directions of space, sealed by God with the letters of His Name, and the holy palace at the centre that holds them all.");
}

// The 231 Gates: the 22 letters on a circle, each joined to every other (22 × 21 ÷ 2 = 231 lines).
const LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת"];
const MOTHERS = new Set(["א", "מ", "ש"]), DOUBLES = new Set(["ב", "ג", "ד", "כ", "פ", "ר", "ת"]);
function gates() {
  const c = [360, 250], R = 190;
  const pts = LETTERS.map((_, i) => { const a = ((-90 + (360 / 22) * i) * Math.PI) / 180; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a), a]; });
  let lines = "";
  for (let i = 0; i < 22; i++) for (let j = i + 1; j < 22; j++) lines += `<line x1="${f(pts[i][0])}" y1="${f(pts[i][1])}" x2="${f(pts[j][0])}" y2="${f(pts[j][1])}"/>`;
  const col = (l) => (MOTHERS.has(l) ? GOLD : DOUBLES.has(l) ? LAV : TEAL);
  return `<figure class="cross-hero sgx"><input type="checkbox" id="sgx-gates-l" class="sgx-lines"><svg viewBox="0 0 720 520" role="img" aria-labelledby="st-gates-t" xmlns="http://www.w3.org/2000/svg"><title id="st-gates-t">The twenty-two Hebrew letters on a circle; when the lines are shown, every letter is joined to every other by 231 lines</title>
${sky("ga", 720, 520, 431)}
<g class="sg-c" stroke="${GOLD}" stroke-width=".55" stroke-opacity=".55">${lines}</g>
<circle cx="${c[0]}" cy="${c[1]}" r="${R}" fill="none" stroke="${GOLD}" stroke-width="1.4" opacity=".6"/>
${pts.map(([x, y, a], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="15" fill="#120d24" stroke="${col(LETTERS[i])}" stroke-width="2"/><text x="${f(x)}" y="${f(y + 6)}" text-anchor="middle" font-family="'Times New Roman', serif" font-size="17" fill="${col(LETTERS[i])}" lang="he">${LETTERS[i]}</text>`).join("")}
${text(80, 470, "● 3 mothers", 13, GOLD, ' text-anchor="start"').replace('text-anchor="middle" ', "")}${text(250, 470, "● 7 doubles", 13, LAV).replace('text-anchor="middle" ', 'text-anchor="start" ')}${text(420, 470, "● 12 simples", 13, TEAL).replace('text-anchor="middle" ', 'text-anchor="start" ')}
</svg><div class="sgx-controls"><label for="sgx-gates-l">Show the 231 gates</label></div><figcaption class="fine">The 22 letters around a circle: the 3 mothers in gold, the 7 doubles in lavender, the 12 simples in teal. Joined each to each, they make 231 lines, the "gates" of the Sefer Yetzirah. Drawn in exact geometry for SAMADHI LOVE.</figcaption></figure>`;
}

// Ein Sof and the radiance: light pouring from a hidden centre through ten rings.
function radiance() {
  const c = [360, 200];
  const rays = Array.from({ length: 48 }, (_, i) => { const a = (i * 7.5 * Math.PI) / 180, r1 = i % 2 ? 60 : 40, r2 = i % 2 ? 175 : 190; return `<line x1="${f(c[0] + r1 * Math.cos(a))}" y1="${f(c[1] + r1 * Math.sin(a))}" x2="${f(c[0] + r2 * Math.cos(a))}" y2="${f(c[1] + r2 * Math.sin(a))}"/>`; }).join("");
  const rings = Array.from({ length: 10 }, (_, i) => `<circle cx="${c[0]}" cy="${c[1]}" r="${30 + i * 15}" fill="none" stroke="${GOLD}" stroke-width="${f(1.8 - i * 0.12)}" opacity="${f(0.9 - i * 0.07)}"/>`).join("");
  return fig("st-zohar", "Light pouring out from a hidden centre through ten rings, like the Infinite shining through the ten Sefirot",
    `${sky("zo", 720, 400, 441)}<circle cx="${c[0]}" cy="${c[1]}" r="190" fill="url(#zo-glow)"/>
<g stroke="${PALE}" stroke-width="1.2" opacity=".55">${rays}</g>${rings}
<circle cx="${c[0]}" cy="${c[1]}" r="16" fill="#07060f" stroke="${PALE}" stroke-width="1.5"/>
${text(c[0], 385, "ZOHAR · SPLENDOUR", 13, "#d9cfee", ' letter-spacing="3"')}${text(110, 196, "Ein Sof", 18, PALE, ' font-style="italic"')}${text(110, 216, "the hidden Infinite", 12.5)}${text(612, 196, "ten Sefirot", 18, PALE, ' font-style="italic"')}${text(612, 216, "the rings of light", 12.5)}`,
    "The dark centre is Ein Sof, the Infinite that cannot be seen; the ten rings are the Sefirot through which its light shines out.");
}

// The levels of the soul in the Zohar, with the two higher levels named by later Kabbalah.
function soul() {
  const c = [360, 225];
  const lv = [[175, "NEFESH", "the living soul", TEAL, 1], [130, "RUACH", "heart and conscience", LAV, 1], [88, "NESHAMAH", "the higher soul", GOLD, 1], [52, "CHAYAH", "the living essence", PALE, 0.5], [22, "YECHIDAH", "the single one", PALE, 0.5]];
  return fig("st-soul", "Five rings of the soul, from Nefesh on the outside to Yechidah at the centre",
    `${sky("so", 720, 440, 451)}<circle cx="${c[0]}" cy="${c[1]}" r="190" fill="url(#so-glow)" opacity=".7"/>
${lv.map(([r, n, m, col, o], i) => `<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="${col}" fill-opacity=".07" stroke="${col}" stroke-width="2" opacity="${o === 1 ? 1 : 0.7}"${o === 1 ? "" : ' stroke-dasharray="5 5"'}/>`).join("")}
${lv.map(([r, n, m, col], i) => `${text(628, 95 + i * 62, n, 14, col, ' font-weight="bold" letter-spacing="2"')}${text(628, 115 + i * 62, m, 12.5)}<line x1="${c[0] + r * 0.72}" y1="${c[1] - r * 0.69}" x2="545" y2="${90 + i * 62}" stroke="${col}" stroke-width="1" opacity=".5"/>`).join("")}
<circle cx="${c[0]}" cy="${c[1]}" r="7" fill="${PALE}"/>`,
    "Nefesh, Ruach and Neshamah, the three levels of the soul taught in the Zohar; the dotted inner rings, Chayah and Yechidah, were added by the later Kabbalists.", 720, 440);
}

// The seven heavens of 2 Enoch, as seven rising arcs, with Enoch's path of ascent.
function heavens() {
  const names = ["Stars, snow and dew", "The Watchers who fell, waiting", "Paradise", "The sun and the moon", "The silent Watchers", "Angels of order and harmony", "The throne of God"];
  const cols = [TEAL, "#9fc8ff", "#9fe7b0", GOLD, LAV, ROSE, PALE];
  const arcs = names.map((n, i) => { const y = 390 - i * 46, w = 300 - i * 30; return `<path d="M${360 - w} ${y} Q360 ${y - 60} ${360 + w} ${y}" fill="none" stroke="${cols[i]}" stroke-width="${i === 6 ? 3 : 2}" opacity=".9"/>${text(360 + w + 8, y + 4, `${i + 1}`, 13, cols[i], ' font-weight="bold" text-anchor="start"').replace('text-anchor="middle" ', "")}${text(360, y - 12, n, 12.5, "#e8e0f8")}`; }).join("");
  return fig("st-heavens", "Seven glowing arcs rising one above another, the seven heavens of the Second Book of Enoch, with a star at the top",
    `${sky("hv", 720, 440, 461)}<circle cx="360" cy="70" r="80" fill="url(#hv-glow)"/>${arcs}
<path d="M360 44 l4 11 h11 l-9 7 3 11 -9 -6 -9 6 3 -11 -9 -7 h11 z" fill="${PALE}"/>`,
    "The seven heavens through which Enoch rose in the Second Book of Enoch, from the first heaven of the stars to the seventh, where he saw the Lord.", 720, 440);
}

// The six gates of the sun in the Astronomical Book (1 Enoch 72): the sun rises in a different gate as the year turns.
function sunGates() {
  const gx = (i) => 140 + i * 88;
  const gatesSvg = Array.from({ length: 6 }, (_, i) => `<path d="M${gx(i) - 26} 300 V230 a26 26 0 0 1 52 0 V300" fill="#120d24" stroke="${GOLD}" stroke-width="2"/>${text(gx(i), 322, `${i + 1}`, 13, PALE, ' font-weight="bold"')}`).join("");
  return fig("st-sungates", "Six arched gates along the eastern horizon, with the sun rising over the fourth gate and an arc showing it moving from gate to gate through the year",
    `${sky("sg", 720, 400, 471)}<rect x="0" y="300" width="720" height="100" fill="#0c0a1a" opacity=".85"/><line x1="40" y1="300" x2="680" y2="300" stroke="${LAV}" stroke-width="1.5"/>
${gatesSvg}
<path d="M${gx(0)} 196 Q${gx(2.5)} 120 ${gx(5)} 196" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="5 6"/>
<circle cx="${gx(3)}" cy="205" r="20" fill="${GOLD}"/><circle cx="${gx(3)}" cy="205" r="34" fill="url(#sg-glow)"/>
${text(gx(0), 182, "winter", 12.5, "#d9cfee")}${text(gx(5), 182, "summer", 12.5, "#d9cfee")}
${text(360, 360, "THE GATES OF THE EAST · 364 DAYS", 13, "#d9cfee", ' letter-spacing="3"')}
${text(120, 60, "north", 12, "#bfb3dc").replace(">north<", ">south<")}${text(600, 60, "north", 12, "#bfb3dc")}`,
    "In the Astronomical Book, the angel Uriel shows Enoch six gates in the east. Through the year the sun rises in one gate after another, toward the north until midsummer and back again, in a year of 364 days.");
}

export function sacredTextArt(key) {
  return { "text-pardes": pardes, "text-scroll": scroll, "text-cube": cube, "text-gates": gates, "text-zohar": radiance, "text-soul": soul, "text-heavens": heavens, "text-sungates": sunGates }[key]?.() || "";
}

const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;

export const sacredTexts = [
  { slug: "sacred-texts", tag: "Overview", title: "Sacred Texts and the Search for Deeper Meaning",
    summary: "How the sages read scripture not only as history and law, but as a living text with layers of meaning, down to the secret at its heart: the four levels of PaRDeS, and the three books of this tab.",
    body: `For the sages of old, a holy book was never only a book of history or rules. It was a living well. You could read it as a child, for its stories, and read it again as an old man, and find water you had never tasted before. Every word was believed to hold more than one meaning: the plain meaning for everyone, and deeper meanings for the one who seeks.

This tab gathers the books that stand at the heart of that search in the Jewish tradition, and that have inspired seekers of every faith:
- **[The Torah](/teachings/the-torah)**, the foundation: the five books of Moses.
- **[The Sefer Yetzirah](/teachings/sefer-yetzirah)**, the *Book of Formation*: how the world was formed from numbers and letters.
- **[The Zohar](/teachings/the-zohar)**, the *Book of Splendour*: the great book of Kabbalah, reading the Torah as a map of God and the soul.
- **[The Books of Enoch](/teachings/the-books-of-enoch)**: the Watchers, the secrets of the sun and moon, the seven heavens, and the scribe of heaven.

## The orchard: four ways of reading
In the Middle Ages, Jewish teachers summed up the levels of reading scripture with one word: **PaRDeS**. It means "orchard", and it is the same word as our "paradise". Each letter stands for one level.

{{text-pardes}}

1. ***Peshat*, the plain meaning.** What the words simply say: the story, the law, the history. The sages taught that a verse never loses its plain meaning, however deep you go.
2. ***Remez*, the hint.** What the words point to beyond themselves: a symbol, an allegory, a hidden pattern.
3. ***Derash*, the seeking.** The teaching the sages "draw out" by searching and comparing verses: lessons for how to live, stories that fill the gaps, ethics for the heart.
4. ***Sod*, the secret.** The mystical meaning: what the text reveals about God, creation and the soul. This is the level of Kabbalah.

## The four who entered the orchard
The Talmud tells of four great sages who "entered the orchard", the realm of mystical knowledge: Ben Azzai, Ben Zoma, Elisha ben Abuyah and Rabbi Akiva. Ben Azzai gazed and died; Ben Zoma gazed and lost his balance of mind; Elisha ben Abuyah lost his faith. **Only Rabbi Akiva entered in peace and came out in peace.** The sages told this story to teach that the deepest knowledge must be approached with humility, a steady life and a pure heart (Talmud, *Hagigah* 14b).

## The same search in every faith
The four-level reading belongs to Judaism, but the search for the inner meaning of scripture is found everywhere. Christian teachers of the Middle Ages also read the Bible in four senses: the literal, the allegorical, the moral and the mystical. Sufi teachers speak of the outer (*zahir*) and the inner (*batin*) meaning of the Qur'an. In India, the Upanishads are called the end, or summit, of the Vedas, where the hymns open into the knowledge of the Self.

## Samadhi's view
*This is Samadhi's own understanding.*

Sacred words are like seeds. The outer shell protects the life inside. Read with the mind, a scripture teaches; read with the heart, it transforms. The secret meaning is not for the proud but for the pure: every scripture opens its deepest door to love.${bridge([
      ["The Ten Sefirot and the animated Tree of Life", "/teachings/the-ten-sefirot", "the map drawn from these books."],
      ["What Is Philosophy? The Love of Wisdom", "/teachings/what-is-philosophy", "the other great road of seeking."],
      ["Prophets and Teachers", "/teachings/prophets-and-teachers", "the messengers through whom the scriptures came."],
    ])}

## Sources

- Babylonian Talmud, *Hagigah* 14b (the four who entered the Pardes).
- Gershom Scholem, *On the Kabbalah and Its Symbolism* (1965), chapter 2, on PaRDeS and the four senses of scripture.
- *Encyclopaedia Britannica*, entry on biblical exegesis.` },

  { slug: "the-torah", tag: "The foundation", title: "The Torah: The Foundation",
    summary: "The five books of Moses, from the creation of the world to the edge of the Promised Land: the root of Judaism, honoured by Christians and Muslims, and the text every Kabbalist read for its hidden light.",
    body: `{{text-scroll}}

**Torah** means "teaching" or "instruction". In its narrow sense it is the first five books of the Hebrew Bible, the Five Books of Moses. In its wide sense it means the whole of God's teaching, written and spoken, passed down through the generations.

## The five books

| | Hebrew name | English name | What it tells |
| --- | --- | --- | --- |
| 1 | *Bereshit*, "In the beginning" | Genesis | Creation, Adam and Eve, the Flood, Abraham, Isaac, Jacob and Joseph |
| 2 | *Shemot*, "Names" | Exodus | Slavery in Egypt, Moses, the Exodus, the Ten Commandments at Sinai |
| 3 | *Vayikra*, "And He called" | Leviticus | Holiness, worship, and the law of love for the neighbour |
| 4 | *Bamidbar*, "In the wilderness" | Numbers | Forty years in the desert |
| 5 | *Devarim*, "Words" | Deuteronomy | Moses' last teachings before his death |

## Its great themes
- **Creation.** One God made the world and saw that it was good, and made the human being in His image: "So God created man in his own image" (Genesis 1:27, King James Bible).
- **Covenant.** A bond of love and faithfulness between God and His people, first with Noah, then Abraham, then at Sinai.
- **Justice.** "Justice, justice shalt thou follow" (Deuteronomy 16:20, JPS 1917). The Torah commands care for the widow, the orphan, the poor and the stranger.
- **Love.** "Thou shalt love thy neighbour as thyself" (Leviticus 19:18) and "Thou shalt love the LORD thy God with all thine heart, and with all thy soul, and with all thy might" (Deuteronomy 6:5, King James Bible). Jesus named these two as the greatest commandments.
- **Freedom and choice.** "I have set before you life and death, blessing and cursing: therefore choose life" (Deuteronomy 30:19, King James Bible).

## How it is kept
A Torah scroll is written by hand, letter by letter, on parchment by a trained scribe, the *sofer*. The Jewish sages counted **613 commandments** in it (Talmud, *Makkot* 23b). It is read aloud in the synagogue in weekly portions, so that the whole Torah is completed every year, and on the festival of *Simchat Torah*, "Rejoicing in the Torah", the reading ends and begins again, with dancing.

## The Torah in three faiths
- **In Judaism** it is the heart of everything: given to Moses at Mount Sinai, studied, sung and lived.
- **In Christianity** it is the first part of the Old Testament, called the Pentateuch ("five scrolls").
- **In Islam** it is the *Tawrat*, the scripture revealed to Moses (Musa), honoured in the Qur'an as "guidance and light" (Qur'an 5:44).

## The Torah as a garment of light
The mystics taught that the stories of the Torah are only its outer clothing. The Zohar says that whoever thinks the Torah came only to tell ordinary stories has missed it: the stories are the garment, the teachings are the body, and the deepest secret is the soul within. The great teacher Nachmanides (1194–1270) wrote that the whole Torah, read in another way, is made of the names of God.

## Samadhi's view
*This is Samadhi's own understanding.*

The Torah is a root of the great tree of wisdom that feeds three faiths. Its laws of justice and love still speak to every human heart, and its stories are also the story of every soul: leaving slavery, crossing the desert, and coming home.${bridge([
      ["Moses: Lawgiver and Liberator", "/teachings/moses", "the prophet through whom the Torah came."],
      ["The Golden Rule: One Law in Every Faith", "/teachings/the-golden-rule", "love your neighbour, in every tradition."],
      ["The Six Branches of Philosophy", "/teachings/the-six-branches-of-philosophy", "ethics: how should we live?"],
    ])}

## Sources

- Genesis 1:27; Leviticus 19:18; Deuteronomy 6:5 and 30:19, King James Bible; Deuteronomy 16:20, JPS Tanakh (1917).
- Babylonian Talmud, *Makkot* 23b (the 613 commandments).
- Qur'an 5:44; Matthew 22:37–40, King James Bible.
- Zohar 3:152a; Nachmanides, introduction to his commentary on the Torah.` },

  { slug: "sefer-yetzirah", tag: "The Book of Formation", title: "Sefer Yetzirah: The Book of Formation",
    summary: "A short, poetic book of creation: God formed the world through 32 paths of wisdom, the ten Sefirot and the 22 letters, and sealed the six directions of space. The seed of the Tree of Life and a bridge to Sacred Geometry.",
    body: `The **Sefer Yetzirah**, the *Book of Formation*, is one of the oldest surviving books of Jewish mysticism. It is very short, only a few pages, and it tells no stories. Instead it speaks, like a hymn, of how the world was formed from **number, letter and sound**. Tradition says its wisdom was revealed to Abraham.

## The thirty-two paths
It opens: "In thirty-two mysterious paths of Wisdom" God engraved His Name and created the universe (1:1, Westcott translation). The thirty-two paths are:
- **Ten Sefirot**, the ten primal numbers or dimensions. "Ten, and not nine; ten, and not eleven," says the book (1:4).
- **Twenty-two letters**, the Hebrew alphabet: the building blocks of everything that exists.

## The three families of letters
1. **Three mothers**: Aleph, Mem and Shin. From them come **air, water and fire**.
2. **Seven doubles**: Bet, Gimel, Dalet, Kaf, Peh, Resh and Tav. Each can be spoken two ways, hard and soft. The book links them to the seven planets, the seven days, and the seven openings of the head (two eyes, two ears, two nostrils and the mouth).
3. **Twelve simples**: the other twelve letters, linked to the twelve signs of the zodiac, the twelve months, and the twelve "boundaries" of space.

## The six directions
God took three letters of His Name, **Yod, He and Vav**, and with them **sealed the six directions**: above and below, east and west, north and south, each with a different order of the three letters (1:13). At the centre is the **holy palace** that holds them all.

{{text-cube}}

This is the first map of space in Jewish mysticism: a cube of six directions around a sacred centre, the world held together by the Name of God.

## The 231 gates
The book places the 22 letters on a circle, like a wall with gates, and joins each letter to every other: 22 × 21 ÷ 2 = **231 gates**. Through these pairings, it teaches, all things are formed. Try the button below to see them.

{{text-gates}}

## Why it matters for this site
- **It is the seed of the Tree of Life.** The later Kabbalists drew its ten Sefirot and twenty-two letters as ten spheres joined by twenty-two paths.
- **It is a bridge to Sacred Geometry.** Number, sound, the cube of space and the circle of gates are geometry used as prayer.

## Samadhi's view
*This is Samadhi's own understanding.*

Creation is sound and number before it is matter. Every letter is a vibration of the Divine, and when we speak with love and truth, we are using the same creative power in a small way. Words build worlds.${bridge([
      ["The Ten Sefirot and the animated Tree of Life", "/teachings/the-ten-sefirot", "the ten and the twenty-two drawn as a tree."],
      ["How God Built the Universe: The 22 Letters and the 32 Paths", "/teachings/the-32-paths-of-wisdom", "the letters in more depth, in The Mystics."],
      ["The Symbols of Sacred Geometry", "/teachings/the-symbols-of-sacred-geometry", "the circle, the cube and the shapes of creation."],
    ])}

## Sources

- *Sefer Yetzirah* 1:1, 1:4, 1:13 and chapter 2, translated by W. Wynn Westcott (1887), [Wikisource](https://en.wikisource.org/wiki/Sepher_Yetzirah/Sepher_Yetzirah).
- Aryeh Kaplan, *Sefer Yetzirah: The Book of Creation* (1990), on the 231 gates.
- Gershom Scholem, *Kabbalah* (1974), on the Sefer Yetzirah.` },

  { slug: "the-zohar", tag: "The Book of Splendour", title: "The Zohar: The Book of Splendour",
    summary: "The great book of Kabbalah: a mystical commentary on the Torah, written in Aramaic, about Ein Sof, the ten Sefirot, the Divine Presence and the levels of the soul.",
    body: `{{text-zohar}}

The **Zohar** is the central book of Kabbalah. Its name means **splendour** or radiance, from the words of the prophet Daniel: "And they that be wise shall shine as the brightness of the firmament" (Daniel 12:3, King James Bible). It is not one book but a whole library: a mystical commentary on the Torah, written mostly in Aramaic, in which the sage Rabbi Shimon bar Yochai and his companions walk the roads of the Holy Land and open the secrets of scripture.

## Its great teachings
- **Ein Sof, the Infinite.** God in His essence is *Ein Sof*, "without end": beyond all names, shapes and thoughts. Nothing can be said of Ein Sof, yet everything comes from it.
- **The ten Sefirot.** The light of Ein Sof shines out through ten qualities, such as wisdom, love, strength and beauty, the same ten drawn on the Tree of Life. Every story in the Torah is read as a movement of these powers.
- **The Shekhinah.** The Divine Presence, the feminine side of God, dwells with the world and goes with the people into exile. Every good deed and prayer helps reunite the Holy One and the Shekhinah.
- **The human being as a small universe.** The body and soul of a person mirror the whole of creation. What we do below stirs the worlds above.

## The levels of the soul
The Zohar teaches that the soul has three levels:
1. **Nefesh**, the living soul: the life of the body and its needs.
2. **Ruach**, the spirit: the heart, the feelings and the conscience.
3. **Neshamah**, the higher soul: the part of us that knows God.

The later Kabbalists added two higher levels, **Chayah** and **Yechidah**, the living essence and the single one, which is one with the Divine.

{{text-soul}}

A person begins with the Nefesh. Through good deeds, prayer and study, the Zohar teaches, the soul is crowned with Ruach, and then with Neshamah.

## The story of the book
Tradition says these teachings come from **Rabbi Shimon bar Yochai**, a sage of the 2nd century, who hid in a cave for thirteen years with his son and received the secrets of the Torah there (the cave story is told in the Talmud, *Shabbat* 33b). The book itself appeared in **Castile, in Spain, in the late 13th century**, through the Kabbalist **Moses de León**. It was first printed in Italy, in **Mantua and Cremona, between 1558 and 1560**, and from there it spread to every Jewish community in the world. See [What History Records](/teachings/sacred-texts-what-history-records).

## Samadhi's view
*This is Samadhi's own understanding.*

The Zohar teaches that every soul is a spark of the Infinite light, and that our deeds are not small: each act of love helps mend the world and join heaven and earth. The splendour it speaks of is not far away. It shines in the heart that turns to God.${bridge([
      ["The Ten Sefirot and the animated Tree of Life", "/teachings/the-ten-sefirot", "the ten Sefirot of the Zohar, drawn and animated."],
      ["The Four Worlds: How the Light Comes Down", "/teachings/the-four-worlds", "how the light of Ein Sof steps down."],
      ["The Six Branches of Philosophy", "/teachings/the-six-branches-of-philosophy", "metaphysics: what is reality, and what is the soul?"],
    ])}

## Sources

- Daniel 12:3, King James Bible; Babylonian Talmud, *Shabbat* 33b.
- Gershom Scholem, *Major Trends in Jewish Mysticism* (1941), lectures 5 and 6; Isaiah Tishby, *The Wisdom of the Zohar* (1989), on the levels of the soul.
- National Library of Israel, [The Zohar: the first printed editions](https://exhibition.nli.org.il/en/exhibition-items-en/zohar).` },

  { slug: "the-books-of-enoch", tag: "The Books of Enoch", title: "The Books of Enoch: Watchers, Heavens and the Scribe of Heaven",
    summary: "Three ancient books carry Enoch's name: the Ethiopic Book of Enoch with the Watchers and the secrets of the sun and moon, the Slavonic Enoch with its seven heavens, and the Hebrew Enoch, where Enoch becomes the angel Metatron.",
    body: `The Bible gives Enoch only a few lines: he "walked with God: and he was not; for God took him" (Genesis 5:24). Because he did not die in the ordinary way, later writers saw him as the one who had seen the secrets of heaven and could reveal them. Three great books carry his name. The numbers 1, 2 and 3 are modern labels; they are three different books, not a series. See [Enoch (Idris)](/teachings/enoch) for the man himself.

## 1 Enoch: the Ethiopic Book of Enoch
The oldest and most important. It was written in Aramaic and translated into Greek and then into Ge'ez, the old language of Ethiopia, where alone the whole book has survived. Aramaic pieces of it were found among the Dead Sea Scrolls. It has five parts:
1. **The Book of the Watchers** (chapters 1–36). In the days of Jared, two hundred angels called **Watchers** came down on Mount Hermon, took human wives, and taught people secrets they were not ready for: the making of weapons, enchantments, and the signs of the stars. Violence filled the earth. Enoch was sent to tell the Watchers of God's judgement, and God sent the archangels **Michael, Gabriel, Raphael and Uriel** to heal the earth. Then Enoch was taken on journeys through heaven and to the ends of the world.
2. **The Parables** (chapters 37–71). Visions of a heavenly figure called **the Son of Man** and **the Elect One**, who will judge the world with righteousness.
3. **The Astronomical Book** (chapters 72–82). The angel Uriel shows Enoch the laws of the sun, moon and stars, and a year of **364 days**.
4. **The Dream Visions** (chapters 83–90). The history of the world told in a dream, from Adam to the time to come.
5. **The Epistle of Enoch** (chapters 91–108). Enoch's teaching to his children: walk in righteousness, and woe to the violent and the unjust.

{{text-sungates}}

## 2 Enoch: the Slavonic Book of Enoch
Known also as the *Secrets of Enoch*, it survives in Old Church Slavonic, translated from Greek, and in a few Coptic fragments found in 2009. Two angels carry Enoch up through **seven heavens**; the longer version adds three more, to ten. In the seventh heaven he sees the Lord, and an angel dictates to him all that can be known, which he writes in **360 books** (some manuscripts say 366). He is sent back to earth for thirty days to teach his children before he is taken up for ever.

{{text-heavens}}

## 3 Enoch: the Hebrew Book of Enoch
Also called *Sefer Hekhalot*, the *Book of the Palaces*. It belongs to the Jewish mystical writings about the ascent to God's chariot-throne, the *Merkabah*. **Rabbi Ishmael** rises through six palaces to the seventh, where he meets the great angel **Metatron**, Prince of the Divine Presence. Metatron tells him that he was once **Enoch son of Jared**: God took him up, turned his flesh to flame, enthroned him, and made him the scribe of heaven, keeper of the records of the world.

## Enoch's great themes
- **Sacred astronomy.** Creation moves by divine measure: the sun, moon and stars keep their appointed gates and times, and do not break their law.
- **Conscience.** Knowledge without wisdom leads to violence; heaven sees injustice and will set it right.
- **Ascent and transformation.** The soul can rise through the heavens, and the one who walks with God is changed into light.

## What history records
- **Scripture or not?** The Book of Enoch is quoted in the Letter of Jude (Jude 14–15 quotes 1 Enoch 1:9) and was widely read by early Jews and Christians. It is **not** in the Hebrew Bible, nor in the Catholic or Protestant Bibles. It is Holy Scripture in the **Ethiopian and Eritrean Orthodox Churches**, and for the Beta Israel, the Jews of Ethiopia.
- **When was it written?** Tradition holds that Enoch wrote before the Flood. Historians date the oldest parts of 1 Enoch, the Watchers and the Astronomical Book, to about the 3rd century BCE, and the Parables, the only part not found at Qumran, to about the turn of the era. 2 Enoch is often placed in the 1st century CE, and 3 Enoch reached its final form in Babylonia around the 5th or 6th century CE.
- **Metatron and "Metatron's Cube".** 3 Enoch joins Enoch and Metatron. The figure of thirteen circles and seventy-eight lines called "Metatron's Cube" is a modern name; the Books of Enoch do not describe it. See [The Symbols of Sacred Geometry](/teachings/the-symbols-of-sacred-geometry).
- **"Enochian".** The angelic language and magic called Enochian was recorded by John Dee and Edward Kelley in the 1580s, in England. It is a Renaissance system, not part of the ancient Books of Enoch.

## Samadhi's view
*This is Samadhi's own understanding.*

Enoch is the soul that walked so close to God that it was taken into the light. His books remind us that the heavens keep perfect order, that knowledge must serve love, and that every human being is invited to rise.${bridge([
      ["Enoch (Idris): The One Who Walked with God", "/teachings/enoch", "the man, in Prophets & Teachers."],
      ["Archangel Metatron", "/teachings/archangel-metatron", "the scribe of heaven."],
      ["The Archangels: an Overview", "/teachings/archangels", "the seven holy angels named in the Book of Enoch."],
      ["The Great Flood", "/library?tab=great-flood", "the flood that followed the days of the Watchers."],
    ])}

## Sources

- Genesis 5:24; Jude 14–15, King James Bible.
- R. H. Charles, *The Book of Enoch* (1917), chapters 1–36, 37–71, 72–82, 83–90 and 91–108.
- F. I. Andersen, "2 (Slavonic Apocalypse of) Enoch", and P. S. Alexander, "3 (Hebrew Apocalypse of) Enoch", in J. H. Charlesworth (ed.), *The Old Testament Pseudepigrapha*, vol. 1 (1983).
- George W. E. Nickelsburg, *1 Enoch 1* (Hermeneia, 2001); J. T. Milik, *The Books of Enoch: Aramaic Fragments of Qumrân Cave 4* (1976).` },

  { slug: "sacred-texts-what-history-records", tag: "What history records", title: "Sacred Texts: What History Records",
    summary: "What tradition teaches and what the historians have found about the Torah, the Sefer Yetzirah and the Zohar, and how true Kabbalah differs from modern 'codes' and trends.",
    body: `Traditions and historians often tell the story of a sacred book in two different ways. Both are worth knowing. Here they are side by side, gently.

## The Torah
- **Tradition** teaches that the Torah was given by God to Moses at Mount Sinai.
- **History records** that the oldest surviving copies of its books are among the **Dead Sea Scrolls**, found from 1947 in caves near Qumran and dated from about the 3rd century BCE to the 1st century CE. Their text is remarkably close to the Torah read in synagogues today. Many modern scholars hold that the books took their final form over a long time; for believers, that long journey is part of how the teaching was carried.

## The Sefer Yetzirah
- **Tradition** says its wisdom was revealed to Abraham.
- **History records** that its date is unknown and much debated. Many historians place it in the first centuries of the Common Era, roughly between the 2nd and 6th centuries. The great sage Saadia Gaon wrote a commentary on it in the 10th century.

## The Zohar
- **Tradition** teaches that the Zohar records the teachings of Rabbi Shimon bar Yochai, in the 2nd century.
- **History records** that the book first appeared in Castile, in Spain, in the late 13th century, through Moses de León. Most modern scholars, following Gershom Scholem, hold that he composed it, perhaps with a circle of fellow Kabbalists, drawing on older teachings. It was first printed in Mantua and Cremona between 1558 and 1560.
- Either way, for more than seven hundred years it has been studied as a holy book, and it shaped Jewish prayer, song and devotion everywhere.

## Kabbalah is not a code or a trend
- **Letters and numbers.** The Kabbalists did study the number values of the Hebrew letters (*gematria*). But they used them for contemplation, prayer and a better life, not to predict the future.
- **"Bible codes".** In the 1990s, popular books claimed that the Torah hid secret predictions of modern events in letter patterns. This is a modern idea, not part of the classical Kabbalah.
- **Not a product.** Kabbalah has sometimes been sold as a fashion, with red strings and celebrity courses. The old teachers asked for something else: humility, study, ethics and a steady life.

## A word of respect
The Torah is, first of all, the living scripture of the Jewish people, prayed and studied every day. The Sefer Yetzirah and the Zohar grew out of centuries of disciplined study inside that tradition. They are not loose symbols to borrow, but a living wisdom to approach with respect.

## Sources

- Emanuel Tov, *Textual Criticism of the Hebrew Bible* (3rd ed., 2012), on the Dead Sea Scrolls.
- Gershom Scholem, *Major Trends in Jewish Mysticism* (1941) and *Kabbalah* (1974).
- National Library of Israel, [The Zohar: the first printed editions](https://exhibition.nli.org.il/en/exhibition-items-en/zohar).
- Saadia Gaon, *Commentary on the Sefer Yetzirah* (931).` },
];
