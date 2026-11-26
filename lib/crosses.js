// Original drawings for "The Cross of Light": simple gold line art on a night sky, drawn for SAMADHI LOVE.
// No outside images. Each drawing is small SVG, so the page stays light.

const defs = (id) => `<defs>
  <linearGradient id="${id}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f2c46d"/><stop offset="1" stop-color="#b8862f"/></linearGradient>
  <radialGradient id="${id}-sky" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#2a1f4a"/><stop offset="1" stop-color="#07060f"/></radialGradient>
  <radialGradient id="${id}-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset=".55" stop-color="#f2c46d" stop-opacity=".12"/><stop offset="1" stop-color="#f2c46d" stop-opacity="0"/></radialGradient>
  <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

function stars(n, w, h, seed) {
  let s = seed, out = "";
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) out += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(r() * 1.2 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`;
  return out;
}

// Each small drawing: [key, title, caption, inner SVG drawn in a 200 x 200 box]
const symbols = [
  ["sun", "The sun cross", "The oldest cross of all: four equal arms in a circle. The four directions, the four seasons and the four elements, held in the circle of the whole.",
    (id) => `<circle cx="100" cy="100" r="58" fill="none" stroke="url(#${id}-gold)" stroke-width="7"/><path d="M100 30v140M30 100h140" stroke="url(#${id}-gold)" stroke-width="7" stroke-linecap="round"/>`],
  ["ankh", "The ankh", "The ancient Egyptian sign of life. The loop above is the eternal, the bar is the meeting point, and the stem below reaches down into the living world.",
    (id) => `<ellipse cx="100" cy="62" rx="26" ry="34" fill="none" stroke="url(#${id}-gold)" stroke-width="8"/><path d="M100 96v80M58 104h84" stroke="url(#${id}-gold)" stroke-width="8" stroke-linecap="round"/>`],
  ["tau", "The tau", "The T-shaped cross. In the Hebrew alphabet the last letter, tav, was once written as a cross: a mark of protection and completion.",
    (id) => `<path d="M46 50h108M100 50v124" stroke="url(#${id}-gold)" stroke-width="10" stroke-linecap="round"/><circle cx="100" cy="50" r="5" fill="#fff8dc"/>`],
  ["celtic", "The Celtic cross", "The cross joined by a ring: the meeting of heaven and earth held inside the circle of eternity.",
    (id) => `<circle cx="100" cy="78" r="34" fill="none" stroke="url(#${id}-gold)" stroke-width="7"/><path d="M100 22v156M52 78h96" stroke="url(#${id}-gold)" stroke-width="10" stroke-linecap="round"/>`],
  ["rose", "The rose cross", "The emblem of the Rosicrucians: a rose blooming at the heart of the cross. The soul's love unfolding at the centre of earthly life.",
    (id) => `<path d="M100 26v148M40 92h120" stroke="url(#${id}-gold)" stroke-width="9" stroke-linecap="round"/><g transform="translate(100 92)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="10" ry="17" cy="-11" fill="#e8577a" opacity=".9" transform="rotate(${a})"/>`).join("")}${[36, 108, 180, 252, 324].map((a) => `<ellipse rx="7" ry="11" cy="-7" fill="#ff9bb0" transform="rotate(${a})"/>`).join("")}<circle r="5" fill="#ffe08a"/></g>`],
  ["chi", "The cross of the world soul", "Plato pictured the soul of the universe as two great circles crossing like the letter X, turning together for ever.",
    (id) => `<ellipse cx="100" cy="100" rx="72" ry="26" fill="none" stroke="url(#${id}-gold)" stroke-width="5" transform="rotate(28 100 100)"/><ellipse cx="100" cy="100" rx="72" ry="26" fill="none" stroke="url(#${id}-gold)" stroke-width="5" transform="rotate(-28 100 100)"/><circle cx="100" cy="100" r="6" fill="#fff8dc"/>`],
];

function small([key, title, caption, draw]) {
  const id = `cross-${key}`;
  return `<figure class="cross-card"><svg viewBox="0 0 200 200" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${title}</title>${defs(id)}
<rect width="200" height="200" rx="18" fill="url(#${id}-sky)"/>${stars(26, 200, 200, key.length * 7919 + 13)}
<circle cx="100" cy="100" r="80" fill="url(#${id}-halo)"/><g filter="url(#${id}-glow)">${draw(id)}</g></svg>
<figcaption><strong>${title}</strong><span>${caption}</span></figcaption></figure>`;
}

// The large drawing: a person standing with arms spread, the living cross where heaven meets earth.
function human() {
  const id = "cross-human";
  return `<figure class="cross-hero"><svg viewBox="0 0 800 460" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">Original drawing: a person standing with arms spread wide, a beam of light falling from heaven to earth through them and a band of light flowing out through their hands, forming a cross of light with the heart at its centre</title>${defs(id)}
<linearGradient id="${id}-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d0" stop-opacity=".9"/><stop offset=".55" stop-color="#f2c46d" stop-opacity=".35"/><stop offset="1" stop-color="#f2c46d" stop-opacity=".05"/></linearGradient>
<linearGradient id="${id}-band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9cc7ff" stop-opacity="0"/><stop offset=".5" stop-color="#ffe9a8" stop-opacity=".75"/><stop offset="1" stop-color="#9cc7ff" stop-opacity="0"/></linearGradient>
<linearGradient id="${id}-earth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a3a"/><stop offset="1" stop-color="#07060f"/></linearGradient>
<rect width="800" height="460" fill="url(#${id}-sky)"/>${stars(120, 800, 330, 4242)}
<path d="M0 360 Q200 330 400 342 T800 352 V460 H0Z" fill="url(#${id}-earth)"/>
<rect x="388" y="0" width="24" height="460" fill="url(#${id}-beam)"/>
<rect x="60" y="176" width="680" height="16" rx="8" fill="url(#${id}-band)"/>
<circle cx="400" cy="184" r="150" fill="url(#${id}-halo)"/>
<g fill="#07060f" stroke="url(#${id}-gold)" stroke-width="3" filter="url(#${id}-glow)">
  <circle cx="400" cy="120" r="22"/>
  <path d="M378 150 Q400 142 422 150 L520 178 Q530 184 520 190 L430 182 L428 262 L446 352 L428 356 L404 274 L396 274 L372 356 L354 352 L372 262 L370 182 L280 190 Q270 184 280 178 Z"/>
</g>
<circle cx="400" cy="184" r="9" fill="#fff3c4"/><circle cx="400" cy="184" r="22" fill="none" stroke="#ffe9a8" stroke-opacity=".6"/>
<text x="400" y="34" text-anchor="middle" fill="#fff3c4" font-family="Georgia, serif" font-size="17" letter-spacing="3">HEAVEN · THE INFINITE</text>
<text x="400" y="440" text-anchor="middle" fill="#cdbb8a" font-family="Georgia, serif" font-size="17" letter-spacing="3">EARTH · THE PHYSICAL</text>
<text x="112" y="166" text-anchor="middle" fill="#bcd6ff" font-family="Georgia, serif" font-size="14" letter-spacing="2">GIVING</text>
<text x="688" y="166" text-anchor="middle" fill="#bcd6ff" font-family="Georgia, serif" font-size="14" letter-spacing="2">RECEIVING</text>
<text x="400" y="226" text-anchor="middle" fill="#fff3c4" font-family="Georgia, serif" font-size="13" letter-spacing="2">THE HEART</text>
</svg><figcaption class="fine">Original drawing for SAMADHI LOVE: the living cross. Light from above, life from below, love flowing out through open hands, all meeting in the heart.</figcaption></figure>`;
}

export function crossArt(key) {
  if (key === "cross-human") return human();
  if (key === "cross-gallery") return `<div class="cross-gallery">${symbols.map(small).join("")}</div>`;
  return "";
}

export const crossTeaching = {
  slug: "the-cross-of-light", tag: "Sacred Symbols", title: "The Cross of Light: Where Heaven Meets Earth",
  summary: "Long before it belonged to any one religion, the cross was a sign known all over the world: the meeting of the infinite and the physical, with the heart at the centre. What the spiritual and mystical teachings say, with drawings of the great crosses.",
  body: `Stand up and spread your arms wide. Your body has become a cross.

Long before it became the sign of any one religion, the cross was drawn by people all over the world, on cave walls, on pottery, on temples and on standing stones. It is one of the oldest and simplest signs we have, and the spiritual and mystical teachings of many lands read it the same way: **the cross is where heaven meets earth.**

{{cross-human}}

## The meaning of the two lines
- **The vertical line** runs from above to below: from heaven to earth, from spirit to matter, from the infinite to the physical. It is the line of our connection with God, the Source of all.
- **The horizontal line** runs from side to side: across the world of time and space, of people, of giving and receiving. It is the line of our life on earth, our connection with each other and with all living things.
- **The centre**, where the two lines cross, is **the heart.** This is where the infinite enters the physical, where spirit lives inside a body. The mystics teach that this meeting point is exactly where each of us stands.

So the cross is not first of all a sign of belonging to one group. It is a picture of what a human being *is*: a soul from heaven, living on earth, with open arms.

## What the teachings say
- **Arms spread wide.** In the second century, Justin Martyr wrote that the cross is found everywhere in the world: in the mast and sail of a ship, in the plough, in the tools of every worker. And he saw it in the human body itself: the human form differs from the animals "in nothing else than in its being erect and having the hands extended" (*First Apology*, chapter 55, trans. Roberts and Donaldson).
- **Plato's cross in the heavens.** In the *Timaeus*, Plato described the soul of the whole universe as two great circles joined across each other like the letter X (chi), turning together for ever. Early Christian writers loved this image: Justin wrote that Plato said the divine power was "placed crosswise in the universe" (*First Apology*, chapter 60).
- **The four directions.** The equal-armed cross inside a circle, often called the sun cross, is found across ancient Europe, Asia and the Americas. Many Native American peoples honour the **four directions** in prayer, and the medicine wheel joins them in the sacred circle of life. North, south, east and west; spring, summer, autumn and winter; earth, water, fire and air: all held together in one whole.
- **The ankh, the key of life.** In ancient Egypt the ankh was the sign of life itself. In temple art the gods hold it, and offer it to the king as the breath of eternal life.
- **The tau, the mark of protection.** The last letter of the Hebrew alphabet, *tav*, was written in ancient times as a simple cross. In Ezekiel's vision, a mark is set "upon the foreheads of the men that sigh and that cry" over the wrongs done in the city, and they are spared (Ezekiel 9:4, KJV). The Hebrew word for that mark is *tav*. Centuries later, Saint Francis of Assisi signed his letters with the tau.
- **The rose cross.** The Rosicrucians took as their sign a rose blooming at the centre of the cross. The cross is the body and the life of this world; the rose is the soul, unfolding in love right at its heart.
- **The cross of light in the body.** In the Western mystery schools, students learn to trace a cross of light through their own body while saying Hebrew words of praise: at the forehead *Ateh*, "Thou art"; at the heart down to the feet *Malkuth*, "the Kingdom"; at the right shoulder *ve-Geburah*, "and the Power"; at the left shoulder *ve-Gedulah*, "and the Glory"; and with hands joined at the heart *le-Olam, Amen*, "for ever, Amen." The words echo the end of the Lord's Prayer: *for thine is the kingdom, and the power, and the glory, for ever.*
- **The measure of a person.** The Roman architect Vitruvius noted that a person standing with arms spread is as wide as they are tall, so the body fits perfectly in a square, and Leonardo da Vinci famously drew it. With arms open, each of us is a living cross, balanced and whole.
- **Theosophy** taught that the cross is far older than any church, and that it pictures spirit descending into matter, and matter rising back to spirit.

## With respect for every path
For Christians, the cross is the most sacred sign of all: the sign of Jesus, of love that gives itself completely. "Greater love hath no man than this, that a man lay down his life for his friends" (John 15:13, KJV). That meaning is honoured here with all respect.

The spiritual teachings simply remind us that this sign is also older and wider than any one faith. It belongs to the whole human family, because every human being is a meeting of heaven and earth.

{{cross-gallery}}

## Samadhi's view: the cross is a connection, not a label
*This is Samadhi's own understanding:* the cross is not really a religious sign. It is the shape of connection between the physical and the infinite. When we spread our hands to the sides, we open ourselves to give and to receive, and the light from above can pour through us into the world. The cross is not something to wear to show which side we are on. It is something to **become**.

## A simple practice: standing as the cross
1. Stand tall, feet on the earth, and breathe slowly.
2. Feel a beam of light coming down from above, through the crown of your head, down your spine and into the earth beneath you.
3. Slowly spread your arms out to the sides, palms open. Feel the light flowing out through your heart and your hands, to everyone and everything.
4. Rest your attention at the centre, in your heart, where the two lines meet.
5. Say quietly: *"I am the meeting of heaven and earth. Let Your light pass through me."*
6. Stay for a few breaths, then bring your hands together at your heart and give thanks.

**The insight:** every time we open our arms in love, we become the cross of light: the bridge where the infinite touches the earth.`,
};
