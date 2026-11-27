// Sacred Lands: the Holy Land and Lebanon as one sacred landscape, and the call to peace.
// No politics: no modern borders, states, armies or sides. Every people is spoken of with the same love.
// Quotations: King James Bible; Pickthall's Qur'an (1930). Facts checked Nov 2026.
// Drawings are made in code for SAMADHI LOVE.

const GOLD = "#f2c46d", PALE = "#fff3c4", LAV = "#c9b8ff", TEAL = "#9fe7dc", SEA = "#1d3b6b", LAND = "#2a2147";
const f = (n) => Number(n.toFixed(1));

// ---- The land as the scriptures knew it: real positions, no modern borders ----
const K = 2.6, LON0 = 34.0, LAT0 = 34.75;
const P = (lat, lon) => [f((lon - LON0) * 92 * K), f((LAT0 - lat) * 111 * K)];
const COAST = [[34.75, 35.95], [34.45, 35.82], [34.25, 35.66], [34.12, 35.64], [33.89, 35.47], [33.75, 35.42], [33.56, 35.36], [33.27, 35.19], [33.09, 35.1], [32.92, 35.07], [32.82, 34.98], [32.5, 34.89], [32.08, 34.77], [31.8, 34.64], [31.6, 34.55], [31.3, 34.3], [30.9, 34.0]];
const PLACES = [
  // [lat, lon, name, note, colour, anchor]
  [34.24, 36.05, "Cedars of God", "the ancient cedars", GOLD, "start"],
  [34.25, 35.92, "Holy Valley", "Qadisha", LAV, "end"],
  [34.12, 35.65, "Byblos", "Gebal", PALE, "end"],
  [33.89, 35.5, "Beirut", "Berytus", PALE, "end"],
  [33.56, 35.37, "Sidon", "", PALE, "end"],
  [33.46, 35.3, "Zarephath", "Elijah and the widow", TEAL, "end"],
  [33.27, 35.2, "Tyre", "Hiram's city", PALE, "end"],
  [33.21, 35.3, "Qana", "a beloved tradition", TEAL, "start"],
  [33.42, 35.86, "Mount Hermon", "", PALE, "start"],
  [33.51, 36.29, "Damascus", "", PALE, "end"],
  [32.7, 35.3, "Nazareth", "", PALE, "end"],
  [31.78, 35.23, "Jerusalem", "al-Quds · Yerushalayim", GOLD, "end"],
  [31.7, 35.2, "Bethlehem", "", PALE, "end"],
  [31.53, 35.1, "Hebron", "the tomb of Abraham", TEAL, "end"],
];
function landscape() {
  const W = 680, H = 1110;
  const coast = COAST.map(([la, lo]) => P(la, lo));
  const sea = `M0 0 L${coast[0][0]} 0 ${coast.map(([x, y]) => `L${x} ${y}`).join(" ")} L0 ${H} Z`;
  // Mountains of Lebanon and Anti-Lebanon as rows of peaks
  const range = (a, b, n, size) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); const [x, y] = P(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); return `<path d="M${f(x - size)} ${f(y + size * 0.6)} L${x} ${f(y - size * 0.7)} L${f(x + size)} ${f(y + size * 0.6)}" />`; }).join("");
  const galilee = P(32.82, 35.59), dead = [P(31.76, 35.53), P(31.05, 35.42)];
  const jordan = [P(33.25, 35.62), P(33.0, 35.62), P(32.88, 35.6), P(32.71, 35.57), P(32.45, 35.57), P(32.2, 35.54), P(31.95, 35.55), P(31.76, 35.55)];
  const jordanD = `M${jordan.map(([x, y], i) => `${i ? "L" : ""}${x} ${y}`).join(" ")}`;
  const label = ([la, lo, name, note, col, anchor]) => { const [x, y] = P(la, lo); const dx = anchor === "end" ? -10 : 10; return `<circle cx="${x}" cy="${y}" r="${name === "Jerusalem" ? 7 : 4.5}" fill="${col}"/>${name === "Jerusalem" ? `<circle cx="${x}" cy="${y}" r="16" fill="none" stroke="${GOLD}" stroke-opacity=".5"/>` : ""}<text x="${f(x + dx)}" y="${f(y + 4)}" text-anchor="${anchor}" font-family="Georgia, serif" font-size="${name === "Jerusalem" ? 19 : 15}" fill="${col}"${name === "Jerusalem" ? ' font-weight="bold"' : ""}>${name}</text>${note ? `<text x="${f(x + dx)}" y="${f(name === "Jerusalem" ? y - 16 : y + 21)}" text-anchor="${anchor}" font-family="Georgia, serif" font-size="11.5" font-style="italic" fill="#bfb3dc">${note}</text>` : ""}`; };
  const [lx, ly] = P(34.05, 35.95), [ax, ay] = P(33.95, 36.45);
  return `<figure class="cross-hero sl-figure"><svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="sl-map-t" xmlns="http://www.w3.org/2000/svg"><title id="sl-map-t">The land as the scriptures knew it, from the cedars of Lebanon in the north to Jerusalem and Hebron in the south, between the Great Sea and the River Jordan, with no modern borders</title>
<defs><linearGradient id="sl-sea" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d1a38"/><stop offset="1" stop-color="${SEA}"/></linearGradient><radialGradient id="sl-land" cx="60%" cy="40%" r="80%"><stop offset="0" stop-color="#352a5c"/><stop offset="1" stop-color="#17112e"/></radialGradient></defs>
<rect width="${W}" height="${H}" rx="18" fill="url(#sl-land)"/>
<path d="${sea}" fill="url(#sl-sea)"/>
<path d="M${coast.map(([x, y]) => `${x} ${y}`).join(" L")}" fill="none" stroke="${TEAL}" stroke-opacity=".6" stroke-width="2"/>
<g fill="none" stroke="${LAV}" stroke-width="2" stroke-linejoin="round" opacity=".75">${range([34.55, 36.2], [33.45, 35.6], 9, 13)}${range([34.3, 36.6], [33.45, 35.95], 7, 11)}</g>
${(() => { const c = P(34.24, 36.05); return `<g transform="translate(${c[0]} ${f(c[1] - 22)})" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"><path d="M0 18 V-2 M-14 4 H14 M-11 -3 H11 M-8 -10 H8 M-4 -16 H4"/></g>`; })()}
<path d="${jordanD}" fill="none" stroke="${TEAL}" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="${galilee[0]}" cy="${galilee[1]}" rx="12" ry="20" fill="${SEA}" stroke="${TEAL}" stroke-width="1.6"/>
<path d="M${dead[0][0]} ${dead[0][1]} Q${f(dead[0][0] + 14)} ${f((dead[0][1] + dead[1][1]) / 2)} ${dead[1][0]} ${dead[1][1]} Q${f(dead[1][0] - 12)} ${f((dead[0][1] + dead[1][1]) / 2)} ${dead[0][0]} ${dead[0][1]} Z" fill="${SEA}" stroke="${TEAL}" stroke-width="1.6"/>
<text x="${lx}" y="${ly}" text-anchor="middle" font-family="Georgia, serif" font-size="17" letter-spacing="4" fill="${LAV}" transform="rotate(-62 ${lx} ${ly})">LEBANON</text>
<text x="${ax}" y="${ay}" text-anchor="middle" font-family="Georgia, serif" font-size="12" letter-spacing="3" fill="${LAV}" opacity=".8" transform="rotate(-62 ${ax} ${ay})">ANTI-LEBANON</text>
<text x="${f(galilee[0] + 22)}" y="${f(galilee[1] + 4)}" font-family="Georgia, serif" font-size="13" fill="${TEAL}">Sea of Galilee</text>
<text x="${f(P(32.25, 35.56)[0] + 12)}" y="${P(32.25, 35.56)[1]}" font-family="Georgia, serif" font-size="13" fill="${TEAL}" font-style="italic">River Jordan</text>
<text x="${f(dead[1][0] + 16)}" y="${f(dead[1][1] - 20)}" font-family="Georgia, serif" font-size="13" fill="${TEAL}">Dead Sea</text>
<text x="70" y="560" font-family="Georgia, serif" font-size="20" letter-spacing="5" fill="${TEAL}" opacity=".7" transform="rotate(-90 70 560)">THE GREAT SEA</text>
${PLACES.map(label).join("")}
<g transform="translate(640 60)" fill="none" stroke="${PALE}" stroke-width="1.6"><path d="M0 -26 L7 0 L0 -6 L-7 0 Z" fill="${PALE}"/><text x="0" y="18" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="${PALE}" stroke="none">N</text></g>
</svg><figcaption class="fine">The land as the scriptures knew it, drawn for SAMADHI LOVE: the mountains and cedars of Lebanon, the coast of Tyre and Sidon, Galilee, the River Jordan and the hills of Jerusalem. No modern borders are drawn: this is one sacred landscape.</figcaption></figure>`;
}

// ---- A cedar of Lebanon, with its flat, layered branches ----
function cedar() {
  // A cedar of Lebanon drawn as it grows: a massive flared trunk, great tapering limbs, and wide flat
  // layers of foliage built from many small tufts of needles. Each layer sways gently, as if a soft wind
  // passed through it, and small gold glitters drift up through the branches (CSS only; still if the
  // visitor prefers reduced motion).
  let seed = 104;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const G = ["#1e4d33", "#28603f", "#33744b", "#3f8a57", "#55a46a"];
  // [centre x, y, half-width, height, sway delay]
  const plates = [[300, 120, 120, 26, 0], [190, 160, 82, 22, 1.4], [412, 150, 88, 22, 0.7], [120, 214, 74, 20, 2.1], [482, 204, 76, 20, 1.1], [300, 188, 110, 26, 0.4], [214, 262, 100, 24, 1.8], [390, 256, 102, 24, 0.9], [300, 306, 132, 26, 2.6], [128, 304, 62, 18, 0.2], [474, 298, 66, 18, 1.6]];
  const tufts = (cx, cy, w, h) => {
    let out = "";
    const n = Math.round(w * 0.9);
    for (let k = 0; k < n; k++) {
      const t = rnd() * 2 - 1, x = cx + t * w * 0.96;
      const top = cy - h * (1 - t * t) * 0.9;
      const y = top + rnd() * (cy - top + h * 0.25);
      const depth = (y - top) / (cy - top + h * 0.25 + 0.01);
      const c = G[Math.min(4, Math.max(0, Math.round((1 - depth) * 3.4 + rnd() * 1.2)))];
      out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(5 + rnd() * 8)}" ry="${f(2.4 + rnd() * 2.6)}" transform="rotate(${f(rnd() * 16 - 8)} ${f(x)} ${f(y)})" fill="${c}"/>`;
    }
    // sunlit needle tips along the top edge
    for (let k = 0; k < Math.round(w / 6); k++) { const t = rnd() * 2 - 1, x = cx + t * w * 0.9, y = cy - h * (1 - t * t) * 0.85 + rnd() * 4; out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(4 + rnd() * 4)}" ry="1.6" fill="#86c995" opacity=".55"/>`; }
    return out;
  };
  const plate = ([x, y, w, h, d]) => `<g class="cd-sway" style="animation-delay:-${d}s;transform-origin:${x}px ${y + h * 0.4}px">
<ellipse cx="${x}" cy="${f(y + h * 0.3)}" rx="${f(w * 0.98)}" ry="${f(h * 0.42)}" fill="#0f2b1d" opacity=".85"/>${tufts(x, y, w, h)}</g>`;
  const limb = (x1, y1, x2, y2, w) => `<path d="M${x1} ${y1} C${f(x1 + (x2 - x1) * 0.3)} ${f(y1 - 10)} ${f(x2 - (x2 - x1) * 0.25)} ${f(y2 + 22)} ${x2} ${f(y2 + 8)}" fill="none" stroke="#4a3220" stroke-width="${w}" stroke-linecap="round"/><path d="M${x1} ${y1} C${f(x1 + (x2 - x1) * 0.3)} ${f(y1 - 10)} ${f(x2 - (x2 - x1) * 0.25)} ${f(y2 + 22)} ${x2} ${f(y2 + 8)}" fill="none" stroke="#8a6440" stroke-width="${f(w * 0.3)}" stroke-linecap="round" opacity=".55" transform="translate(-1 -1)"/>`;
  const limbs = [[300, 320, 300, 122, 12], [296, 330, 192, 162, 9], [304, 326, 412, 152, 9], [292, 344, 122, 216, 8], [308, 340, 482, 206, 8], [298, 336, 300, 190, 10], [294, 352, 214, 264, 9], [306, 350, 390, 258, 9], [300, 362, 300, 308, 12], [290, 370, 128, 306, 7], [310, 368, 474, 300, 7]].map((l) => limb(...l)).join("");
  const bark = Array.from({ length: 9 }, (_, k) => { const x = 284 + k * 4 + rnd() * 3; return `<path d="M${f(x)} 470 C${f(x - 3 + rnd() * 6)} 430 ${f(x - 3 + rnd() * 6)} 390 ${f(x + rnd() * 4 - 2)} 352" stroke="#2e1d12" stroke-width="${f(1 + rnd())}" fill="none" opacity=".7"/>`; }).join("");
  const glitter = Array.from({ length: 26 }, (_, k) => { const x = 110 + rnd() * 380, y = 110 + rnd() * 250, r = 1 + rnd() * 1.8; return `<g class="cd-glint" style="animation-delay:-${f(rnd() * 9)}s;animation-duration:${f(6 + rnd() * 6)}s"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#ffe39a"/><path d="M${f(x - r * 3)} ${f(y)} H${f(x + r * 3)} M${f(x)} ${f(y - r * 3)} V${f(y + r * 3)}" stroke="#fff3c4" stroke-width=".7" opacity=".8"/></g>`; }).join("");
  const stars = [[40, 40], [560, 50], [90, 80], [520, 90], [36, 330], [570, 340], [300, 28], [200, 44], [410, 36], [150, 96], [470, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff" opacity=".7"/>`).join("");
  return `<figure class="cross-hero sl-figure sl-cedar"><svg viewBox="0 0 600 500" role="img" aria-labelledby="sl-cedar-t" xmlns="http://www.w3.org/2000/svg"><title id="sl-cedar-t">A great cedar of Lebanon with a massive trunk and wide, flat layers of green needles, swaying gently in the wind while small gold lights drift through its branches</title>
<defs><radialGradient id="cd-sky" cx="50%" cy="35%" r="85%"><stop offset="0" stop-color="#2b2052"/><stop offset="1" stop-color="#07060f"/></radialGradient><radialGradient id="cd-halo" cx="50%" cy="45%"><stop offset="0" stop-color="#fff3c4" stop-opacity=".32"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
<linearGradient id="cd-trunk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a2616"/><stop offset=".45" stop-color="#7a5636"/><stop offset="1" stop-color="#3a2616"/></linearGradient>
<linearGradient id="cd-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2650"/><stop offset="1" stop-color="#120d24"/></linearGradient></defs>
<rect width="600" height="500" rx="18" fill="url(#cd-sky)"/>${stars}
<circle cx="300" cy="230" r="250" fill="url(#cd-halo)"/>
<path d="M0 462 Q150 440 300 452 Q450 436 600 458 L600 500 L0 500 Z" fill="url(#cd-hill)"/>
<path d="M262 474 C276 456 282 420 284 380 C286 350 288 330 290 318 L310 318 C312 330 314 350 316 380 C318 420 324 456 342 474 Z" fill="url(#cd-trunk)"/>${bark}
<path d="M266 470 Q250 470 240 474 L266 476 Z M338 470 Q354 470 364 475 L338 476 Z" fill="#4a3220"/>
${limbs}
${plates.map(plate).join("")}
<g class="cd-glitter">${glitter}</g>
</svg><figcaption class="fine">"The cedars of Lebanon, which he hath planted" (Psalm 104:16). A cedar of Lebanon, its wide branches moving softly in the mountain wind. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

// ---- The cedars of Lebanon: Samadhi's artistic image, with gold glitters drifting over it ----
function cedarPhoto() {
  let seed = 77;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Glitters are kept over the trees (the middle band of the picture), never over the sky or the ground.
  const glints = Array.from({ length: 40 }, () => { const x = 6 + rnd() * 88, y = 24 + rnd() * 50, r = 2.6 + rnd() * 3; return `<g class="cd-glint" style="animation-delay:-${f(rnd() * 9)}s;animation-duration:${f(6 + rnd() * 6)}s"><circle cx="${f(x * 14)}" cy="${f(y * 7.88)}" r="${f(r)}" fill="#ffe39a"/><path d="M${f(x * 14 - r * 3)} ${f(y * 7.88)} H${f(x * 14 + r * 3)} M${f(x * 14)} ${f(y * 7.88 - r * 3)} V${f(y * 7.88 + r * 3)}" stroke="#fff3c4" stroke-width="1.6" opacity=".9"/></g>`; }).join("");
  return `<figure class="cross-hero sl-photo sl-cedar"><div class="sl-photo-frame"><img src="/images/cedars-of-lebanon.jpg" width="1400" height="788" alt="Ancient cedars of Lebanon with wide, layered branches on a rocky mountainside, with snow on the far peaks" decoding="async"><svg class="sl-glitter" viewBox="0 0 1400 788" aria-hidden="true" preserveAspectRatio="none">${glints}</svg></div><figcaption class="fine">An artistic vision of the cedars of Lebanon on their mountain. Image shared by SAMADHI LOVE.</figcaption></figure>`;
}

// ---- Olive branch and dove: the peace emblem ----
function peace() {
  const leaves = Array.from({ length: 9 }, (_, i) => { const t = i / 8, x = 120 + t * 170, y = 250 - t * 70 + Math.sin(t * 3) * 6, a = i % 2 ? 35 : -35; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="16" ry="6" transform="rotate(${a - 20} ${f(x)} ${f(y)})" fill="#7fae7a" stroke="${GOLD}" stroke-width="1"/>`; }).join("");
  return `<figure class="cross-hero sl-figure"><svg viewBox="0 0 400 320" role="img" aria-labelledby="sl-peace-t" xmlns="http://www.w3.org/2000/svg"><title id="sl-peace-t">A white dove carrying an olive branch, flying beneath a crescent of light</title>
<defs><radialGradient id="pc-sky" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#2a2152"/><stop offset="1" stop-color="#07060f"/></radialGradient><radialGradient id="pc-glow"><stop offset="0" stop-color="${PALE}" stop-opacity=".45"/><stop offset="1" stop-color="${PALE}" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="320" rx="18" fill="url(#pc-sky)"/><circle cx="210" cy="140" r="140" fill="url(#pc-glow)"/>
<path d="M110 260 Q200 230 300 170" fill="none" stroke="#6b4a2a" stroke-width="3"/>${leaves}
<g fill="#fdfbff" stroke="${GOLD}" stroke-width="1.4" stroke-linejoin="round">
<path d="M140 150 Q190 110 250 130 Q275 120 292 126 Q282 134 270 138 Q250 160 210 168 Q170 172 140 150 Z"/>
<path d="M190 140 Q200 70 260 50 Q245 95 228 132 Z"/><path d="M178 146 Q160 90 190 60 Q200 110 205 138 Z" opacity=".9"/>
<path d="M140 150 Q118 146 104 158 Q124 160 142 158 Z"/></g>
<circle cx="276" cy="128" r="2.2" fill="#120d24"/>
<path d="M291 127 L302 130 L291 132 Z" fill="${GOLD}"/>
<text x="200" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="15" letter-spacing="4" fill="${PALE}">SHALOM · SALAAM · PEACE</text>
</svg><figcaption class="fine">The dove and the olive branch, the sign of peace since Noah. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

function jerusalemSigns() {
  // Samadhi's own picture: ancient olive trees on the hills, with the city far off in the evening light.
  return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/jerusalem-olives.jpg" width="1600" height="900" alt="Ancient olive trees with twisted trunks on a rocky hillside, and the old city of Jerusalem far away on the hills in the soft evening light" loading="lazy" decoding="async"></div><figcaption class="fine">Jerusalem, holy city to Jews, Christians and Muslims. Picture shared by Samadhi.</figcaption></figure>`;
}

export function landArt(key) {
  return { "land-jerusalem": jerusalemSigns, "land-map": landscape, "land-cedar": cedar, "land-cedar-photo": cedarPhoto, "land-peace": peace }[key]?.() || "";
}

const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;

export const sacredLands = [
  { slug: "the-holy-land-and-lebanon", tag: "One sacred landscape", title: "The Holy Land and Lebanon: One Sacred Landscape",
    summary: "Why a small strip of earth between the mountains of Lebanon and the hills of Jerusalem is holy to Judaism, Christianity and Islam: a land the Qur'an calls blessed for all peoples, where the prophets walked and the cedars of God still stand.",
    body: `{{land-map}}

On the eastern shore of the Mediterranean, between the desert and the sea, lies a small land, barely a few days' walk from north to south. And yet more of humanity's prophets walked here than anywhere else on earth. Abraham pitched his tent here. Moses looked on it from the mountain before he died. David sang his psalms here, and Solomon built the Temple. Elijah, Isaiah and Jeremiah spoke here. Jesus was born, taught, healed and was crucified here. The Prophet Muhammad was carried here by night, and rose from here to the heavens.

To the north, the white mountains of **Lebanon** rise above it, crowned with the cedars that the Bible calls the trees of the Lord. In the scriptures the two belong together: the holy hills and the holy mountain, the land of the prophets and the land of the cedars, one sacred landscape.

## A land blessed for all peoples
The Qur'an tells how God saved Abraham and Lot and brought them "to the land which We have blessed for (all) peoples" (Qur'an 21:71, Pickthall). It speaks again of the Far Mosque in Jerusalem, "the neighbourhood whereof We have blessed" (Qur'an 17:1). The great commentators understood this blessed land as **al-Sham**, the whole of the Levant, which includes Lebanon: blessed, they said, because God sent so many prophets to it.

Notice the words: **for all peoples**. In every one of the three faiths, the holiness of this land is a gift from God and a trust, not a prize. It was blessed so that blessing would flow out from it to the whole world.

## Holy in three faiths
- **In Judaism** it is the Land promised to Abraham, Isaac and Jacob, where the Torah was to be lived, and where the Divine Presence, the *Shekhinah*, dwelt in the Temple in Jerusalem.
- **In Christianity** it is the Holy Land, where the Word became flesh: Bethlehem, Nazareth, Galilee, Jerusalem. Pilgrims have walked its roads for more than sixteen centuries.
- **In Islam** it is the blessed land of the prophets, and Jerusalem, *al-Quds*, is the third holiest city, the first direction of prayer, and the place of the Night Journey.

## Lebanon in the sacred story
Lebanon is never a stranger in the scriptures. Its cedars built the Temple of God; its coast at Tyre and Sidon heard the voice of Jesus; its village of Zarephath welcomed the prophet Elijah; its Holy Valley sheltered generations of hermits in prayer. See [Lebanon in Scripture: The Cedars of God](/teachings/lebanon-in-scripture).

## Samadhi's view
*This is Samadhi's own understanding.*

The Holy Land and Lebanon are like two pillars of one sacred house: one the seat of the covenant and the prophets, the other the mountain of majesty, abundance and the living sanctuary of creation. God planted His blessing in this land for all His children. To walk here with love is to walk on holy ground; to bring hatred here is to forget whose land it is.${bridge([
      ["Jerusalem: City of Peace", "/teachings/jerusalem-city-of-peace", "the holy city of three faiths."],
      ["Lebanon in Scripture: The Cedars of God", "/teachings/lebanon-in-scripture", "Lebanon's place in the sacred story."],
      ["Peace in the Land of God", "/teachings/peace-in-the-land-of-god", "why war has no place in the sacred land."],
      ["Prophets and Teachers", "/teachings/prophets-and-teachers", "the messengers who walked this land."],
    ])}

## Sources

- Qur'an 17:1 and 21:71, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=21&verse=71); Ibn Kathir, *Tafsir*, on 21:71.
- Genesis 12–13; Deuteronomy 34:1–4; 1 Kings 5–8; Luke 2, King James Bible.` },

  { slug: "jerusalem-city-of-peace", tag: "The holy city", title: "Jerusalem: City of Peace",
    summary: "The city whose very name has been read as 'peace': holy to Jews as the place of the Temple, to Christians as the place of the cross and resurrection, and to Muslims as al-Quds, the place of the Night Journey.",
    body: `{{land-jerusalem}}

## A name of peace
In Hebrew the city is *Yerushalayim*. Its ancient name is often read as "city of peace", because its ending echoes *shalom*, peace. In Arabic it is *al-Quds*, "the Holy", and *Bayt al-Maqdis*, "the House of Holiness". Its very names are a prayer.

## Holy to Jews
- On Mount Moriah, tradition teaches, Abraham bound Isaac, and God provided a ram in his place (Genesis 22).
- King David made Jerusalem his city, and King Solomon built the **First Temple** there, where the Divine Presence dwelt in the Holy of Holies (1 Kings 8).
- For three thousand years Jews have turned toward Jerusalem in prayer, and ended the Passover meal with the words "Next year in Jerusalem".

## Holy to Christians
- Jesus taught in the Temple courts, wept over the city, shared the Last Supper, prayed in Gethsemane, and was crucified and, Christians believe, rose again here.
- The **Church of the Holy Sepulchre** has drawn pilgrims since the 4th century.
- As he came near the city, "he beheld the city, and wept over it, saying, If thou hadst known, even thou, at least in this thy day, the things which belong unto thy peace!" (Luke 19:41–42, King James Bible).

## Holy to Muslims
- On the **Night Journey**, the Prophet was carried "from the Inviolable Place of Worship to the Far distant place of worship the neighbourhood whereof We have blessed" (Qur'an 17:1, Pickthall), and from there he rose through the heavens, the *Mi'raj*.
- Jerusalem was the **first direction of prayer** (*qibla*) for the early Muslims, before the Kaaba in Mecca (Qur'an 2:142–144).
- The **Dome of the Rock** and **al-Aqsa Mosque** stand on the Noble Sanctuary, honoured as the third holiest place in Islam.

## One city, many prayers
On a single day in Jerusalem, prayers rise in Hebrew at the Western Wall, in Greek, Arabic, Armenian and many other tongues in the churches, and in Arabic from al-Aqsa. They rise to the same heaven. The psalmist wrote: "Pray for the peace of Jerusalem: they shall prosper that love thee" (Psalm 122:6).

## Samadhi's view
*This is Samadhi's own understanding.*

Jerusalem is the heart of the sacred land, and a heart is meant to love. A city whose name means peace is a promise and a test for all of humanity. When its children pray there side by side, it fulfils its name.${bridge([
      ["The Holy Land and Lebanon: One Sacred Landscape", "/teachings/the-holy-land-and-lebanon", "the whole land."],
      ["Peace in the Land of God", "/teachings/peace-in-the-land-of-god", "the call to peace."],
      ["Muhammad: The Messenger of the Qur'an", "/teachings/muhammad", "the Night Journey."],
      ["Jesus of Nazareth", "/teachings/jesus-of-nazareth", "his life and teaching."],
    ])}

## Sources

- Genesis 22; 1 Kings 8; Psalm 122:6; Luke 19:41–42, King James Bible.
- Qur'an 2:142–144 and 17:1, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=17&verse=1).
- Karen Armstrong, *Jerusalem: One City, Three Faiths* (1996).` },

  { slug: "lebanon-in-scripture", tag: "The cedars of God", title: "Lebanon in Scripture: The Cedars of God",
    summary: "The cedars God planted, the wood of Solomon's Temple, the widow of Zarephath, Jesus on the coast of Tyre and Sidon, the beloved tradition of Qana, and the Holy Valley of the hermits: Lebanon's place in the sacred story.",
    body: `{{land-cedar-photo}}

The name **Lebanon** comes from the old Semitic word for "white", for the snow that crowns its mountains. It is named more than seventy times in the Bible, almost always as a picture of majesty, beauty, fragrance and the blessing of God.

## The trees of the Lord
"The trees of the LORD are full of sap; the cedars of Lebanon, which he hath planted" (Psalm 104:16, King James Bible). The cedar was the king of trees: tall, fragrant, evergreen and almost incorruptible. "The righteous shall flourish like the palm tree: he shall grow like a cedar in Lebanon" (Psalm 92:12).

## The wood of the house of God
When Solomon set out to build the Temple in Jerusalem, he sent to **Hiram, king of Tyre**: "command thou that they hew me cedar trees out of Lebanon" (1 Kings 5:6). Hiram's men brought the cedars down from the mountains to the sea and floated them south, and the house of God in Jerusalem was lined with the wood of Lebanon. The Temple itself joined the two lands.

## The poetry of Lebanon
- "Come with me from Lebanon, my spouse, with me from Lebanon" (Song of Solomon 4:8). The beloved's garments smell "like the smell of Lebanon" (4:11).
- Isaiah promises that the desert shall blossom, and "the glory of Lebanon shall be given unto it" (Isaiah 35:2).
- Hosea, speaking of God's healing love: "I will be as the dew unto Israel: he shall grow as the lily, and cast forth his roots as Lebanon... and his smell as Lebanon" (Hosea 14:5–6).

## Elijah at Zarephath
In a time of famine, God sent the prophet **Elijah** to **Zarephath**, "which belongeth to Zidon" (1 Kings 17:9), the village now called Sarafand, between Sidon and Tyre. There a poor widow shared her last meal with him; her flour and oil did not run out, and Elijah raised her son to life. Jesus himself remembered her: "unto none of them was Elias sent, save unto Sarepta, a city of Sidon, unto a woman that was a widow" (Luke 4:26).

## Jesus on the coast of Tyre and Sidon
- Crowds came to Jesus "from the sea coast of Tyre and Sidon, which came to hear him, and to be healed of their diseases" (Luke 6:17; also Mark 3:8).
- Jesus went himself "into the borders of Tyre and Sidon" (Mark 7:24). There a mother begged him to heal her daughter. Mark calls her a Greek, a Syrophenician; Matthew calls her "a woman of Canaan". Moved by her faith, Jesus healed her child (Mark 7:24–30; Matthew 15:21–28).

## Qana: a beloved tradition
The Gospel of John tells that Jesus turned water into wine at a wedding in **Cana of Galilee** (John 2). Many Lebanese, Christians and Muslims alike, honour the village of **Qana**, near Tyre, as that place, a tradition already noted by Eusebius in the 4th century. Other places in Galilee are also proposed; for the people of Qana, the memory of that joyful wedding lives on in their village.

## The Holy Valley and the Cedars of God
In the north, the **Qadisha Valley**, the "Holy Valley", cuts deep into the mountains. For centuries hermits and monks lived in its caves and cliffside monasteries in prayer and silence. Above it stands the **Forest of the Cedars of God** (*Horsh Arz el-Rab*). UNESCO honours both together as a World Heritage Site, calling the valley one of the most important early Christian monastic settlements in the world, and the cedars "survivors of a sacred forest".

## The land of the alphabet and the book
The Phoenician cities of Lebanon gave the world the **alphabet** from which the Hebrew, Greek, Latin and Arabic letters descend. And from the port of **Byblos** came the Greek word for papyrus, *byblos*, from which we have the word **Bible**, "the books".

## Samadhi's view
*This is Samadhi's own understanding.*

Lebanon is a land favoured by God: the mountain He planted with His own trees, the land whose wood built His house, the shore where His prophets and His Son walked and healed. Its beauty is a sign of His blessing, and its calling is the calling of the cedar: to stand tall, to give shelter, and to stay green in every season.${bridge([
      ["The Holy Land and Lebanon: One Sacred Landscape", "/teachings/the-holy-land-and-lebanon", "the whole land."],
      ["Peace in the Land of God", "/teachings/peace-in-the-land-of-god", "the call to peace."],
      ["Jesus of Nazareth", "/teachings/jesus-of-nazareth", "his life and teaching."],
    ])}

## Sources

- Psalm 92:12 and 104:16; 1 Kings 5:6–10 and 17:8–24; Song of Solomon 4:8–11; Isaiah 35:2; Hosea 14:5–6; Mark 3:8 and 7:24–30; Matthew 15:21–28; Luke 4:26 and 6:17; John 2:1–11, King James Bible.
- UNESCO World Heritage Centre, [Ouadi Qadisha (the Holy Valley) and the Forest of the Cedars of God](https://whc.unesco.org/en/list/850).
- Eusebius, *Onomasticon* (4th century), on Cana.` },

  { slug: "peace-in-the-land-of-god", tag: "The call to peace", title: "Peace in the Land of God",
    summary: "The scriptures of all three faiths speak with one voice: God made this land holy for blessing, not for bloodshed. Why war brings chaos into the sacred land, why no one wins by killing, and a prayer for everyone who lives there.",
    body: `{{land-peace}}

This page takes no side and names no side. It speaks for every child, mother and father who lives in the sacred land, whatever their faith or their people, and for every soul who loves it.

## The scriptures speak with one voice
- **The Torah and the prophets:** "They shall not hurt nor destroy in all my holy mountain: for the earth shall be full of the knowledge of the LORD, as the waters cover the sea" (Isaiah 11:9). "They shall beat their swords into plowshares... nation shall not lift up sword against nation, neither shall they learn war any more" (Isaiah 2:4). "Seek peace, and pursue it" (Psalm 34:14).
- **The Gospel:** "Blessed are the peacemakers: for they shall be called the children of God" (Matthew 5:9). "Love your enemies, bless them that curse you, do good to them that hate you" (Matthew 5:44). Weeping over Jerusalem, Jesus said: "If thou hadst known... the things which belong unto thy peace!" (Luke 19:42).
- **The Qur'an:** "whosoever killeth a human being for other than manslaughter or corruption in the earth, it shall be as if he had killed all mankind, and whoso saveth the life of one, it shall be as if he had saved the life of all mankind" (Qur'an 5:32, Pickthall). "And if they incline to peace, incline thou also to it, and trust in Allah" (Qur'an 8:61). One of the names of God in Islam is ***as-Salam***, Peace itself (Qur'an 59:23).

## One word, one family
In Hebrew, peace is ***shalom***. In Arabic, it is ***salaam***. They are the same word, grown from the same ancient root, and both are used as a greeting: *peace be upon you*. The children of this land greet each other with the same blessing.

When Abraham, the father of faith, died, the Torah says: "his sons Isaac and Ishmael buried him in the cave of Machpelah" (Genesis 25:9). The two brothers, fathers of many peoples, stood side by side in peace at their father's grave. That is the memory this land was meant to keep.

## War is not God's will for His land
- **The land was blessed for all peoples** (Qur'an 21:71). A gift given for all cannot be honoured by destroying some.
- **Every life is sacred.** Each person who falls is a child of the same Creator, made in His image (Genesis 1:27), breathed into by His spirit.
- **Holiness and bloodshed cannot live together.** The Bible tells that David, though he loved God, was not allowed to build the Temple, "because thou hast shed much blood upon the earth in my sight" (1 Chronicles 22:8). The house of God was built by Solomon, whose very name comes from *shalom*.
- **No one wins by killing.** Violence answered with violence only gives birth to more grief, as the Buddha also taught: "hatred does not cease by hatred at any time: hatred ceases by love" (Dhammapada 5). The only victory in the land of God is the victory of mercy.

## Samadhi's view
*This is Samadhi's own understanding.*

God did not make this land holy so that His children would fight over it. When we bring war into the sacred land, we bring chaos into the house of God, and God has never encouraged it. No one will win through fighting and killing: every life taken there is a loss for all of us, and every tear shed there is shed by God's own children. The land is not honoured by those who hold it, but by those who live in it with love. Peace in the sacred land begins in each human heart: when we stop seeing an enemy, and see a brother and a sister.

## A prayer for peace
*Source of all life, Lord of peace,*\\
*bless the land You made holy, from the cedars of Lebanon to the hills of Jerusalem.*\\
*Comfort every mother who weeps there, whoever she is.*\\
*Heal the wounded, shelter the children, and give rest to those who have died.*\\
*Soften every heart that has grown hard, and turn every sword into a plough.*\\
*Let Your children greet each other again with shalom and salaam,*\\
*and let this land become what You made it to be:*\\
*a blessing for all peoples. Amen.*${bridge([
      ["The Holy Land and Lebanon: One Sacred Landscape", "/teachings/the-holy-land-and-lebanon", "the land blessed for all peoples."],
      ["Jerusalem: City of Peace", "/teachings/jerusalem-city-of-peace", "the city whose name is peace."],
      ["The Golden Rule: One Law in Every Faith", "/teachings/the-golden-rule", "the shared rule of every tradition."],
      ["Abraham (Ibrahim)", "/teachings/abraham", "the father of faith for all three."],
    ])}

## Sources

- Genesis 1:27 and 25:9; 1 Chronicles 22:8–9; Psalm 34:14; Isaiah 2:4 and 11:9; Matthew 5:9 and 5:44; Luke 19:42, King James Bible.
- Qur'an 5:32, 8:61, 21:71 and 59:23, Pickthall translation, [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=5&verse=32).
- *The Dhammapada*, verse 5, translated by F. Max Müller (1881).` },
];
