// The Path of Study: the whole Library arranged as one teaching cycle, told as a story,
// from the Source, through Earth school, back to the Source. It adds a guided order on top of
// the existing tabs; no page moves and every address stays the same.

export const STAGES = [
  { n: 1, title: "Arriving", line: "Welcome, the doorways, and how to read wisely.", tabs: ["start"], begin: "where-to-begin" },
  { n: 2, title: "The Source and the Soul", short: "Source and Soul", line: "God is love; what the soul is, how it grows, and how it prays and gives thanks.", tabs: ["teachings", "names-of-god", "prayers", "blessing", "arabic"], begin: "god-is-pure-love" },
  { n: 3, title: "The Human Story", line: "Why we came, and our long journey as one human family: the first temples, the flood, the ages and the sacred lands.", tabs: ["human-story", "great-flood", "ages-of-the-world", "sacred-lands"], begin: "why-we-came" },
  { n: 4, title: "The Messengers and the Holy Books", short: "Messengers and Holy Books", line: "The prophets, avatars and teachers sent to humanity, and the sacred texts they left.", tabs: ["prophets", "krishna-shiva", "sacred-texts"], begin: "prophets-and-teachers" },
  { n: 5, title: "Masters, Angels and Star Family", short: "Masters and Angels", line: "The helpers of light: the Ascended Masters, the archangels and our star brothers and sisters.", tabs: ["masters", "star-family"], begin: "ascended-masters" },
  { n: 6, title: "The Love of Wisdom", line: "The philosophers, sages, poets and sayings that teach us how to think and live.", tabs: ["philosophers", "stories", "wisdom-stories", "wisdom", "sages-and-kings", "shakespeare", "homer"], begin: "what-is-philosophy" },
  { n: 7, title: "The Mystics and the Mystery Schools", short: "Mystics and Schools", line: "Those who went beyond belief to know God directly, and the inner schools that teach the way.", tabs: ["mystics", "mystery-schools"], begin: "who-are-the-mystics" },
  { n: 8, title: "The Sacred Sciences", line: "The hidden order of creation within us and around us: the chakras, the Tree of Life, sacred geometry and number.", tabs: ["chakras", "tree-of-life", "sacred-geometry", "hermetic-wisdom"], begin: "the-seven-chakras" },
  { n: 9, title: "Practice", line: "From reading to experience: breath, stillness, sound, silence, fasting and a healthy life.", tabs: ["practices", "yoga-kriya", "knowledge"], begin: "practices-and-inner-work" },
  { n: 10, title: "The Heart and Daily Life", line: "How we treat others and how we live: the ego and its faces, the law of return, kind words and forgiveness; then intuition, love, family, work, service and suffering.", tabs: ["heart-and-ego", "daily-life"], begin: "fear-ego-and-grief" },
  { n: 11, title: "Beyond the Veil", line: "We are more than the body: dreams, out-of-body travel, near-death experiences and the subtle worlds.", tabs: ["beyond-the-veil"], begin: "beyond-the-veil" },
  { n: 12, title: "The Soul's Journey Home", short: "The Journey Home", line: "Death as a doorway, the life review, the return, the long road to ascension, and the Source again.", tabs: ["souls-journey"], begin: "death-is-a-doorway" },
];
const stageOfTab = new Map(STAGES.flatMap((s) => s.tabs.map((t) => [t, s])));
export const stageFor = (tabId) => stageOfTab.get(tabId) || null;
export const nextStage = (s) => STAGES[s.n % STAGES.length];

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The wheel: twelve stages on a circle, each one a link, turning back to the Source.
function wheel() {
  const R = 150, cx = 300, cy = 200;
  const nodes = STAGES.map((s, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const lx = cx + (R + 34) * Math.cos(a), ly = cy + (R + 34) * Math.sin(a) + 4;
    const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    return `<a href="/teachings/${s.begin}" class="pw-node"><title>Stage ${s.n}: ${esc(s.title)}</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="17" fill="#4e4024" stroke="#ffe39a"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-size="15" fill="#fff3c4">${s.n}</text>
<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-family="Georgia, serif" font-size="13" fill="#e6dcf7">${esc(s.short || s.title)}</text></a>`;
  }).join("");
  return `<figure class="cross-hero pw-figure"><svg viewBox="-40 0 680 400" role="img" aria-labelledby="pw-t" xmlns="http://www.w3.org/2000/svg"><title id="pw-t">The Path of Study drawn as a wheel of twelve stages around a golden centre, the Source: from Arriving, through the human story, the messengers, wisdom, the mystics, the sacred sciences, practice and daily life, beyond the veil and the soul's journey home, and round again</title>
<defs><radialGradient id="pw-sky" cx="50%" cy="50%" r="80%"><stop offset="0" stop-color="#4e4024"/><stop offset="1" stop-color="#0d0b08"/></radialGradient>
<radialGradient id="pw-core"><stop offset="0" stop-color="#fffbe8"/><stop offset=".5" stop-color="#ffe39a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient></defs>
<rect x="-40" width="680" height="400" rx="18" fill="url(#pw-sky)"/>
<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ffe39a" stroke-opacity=".35" stroke-dasharray="3 7" class="pw-turn"/>
<circle class="sj-breathe" cx="${cx}" cy="${cy}" r="74" fill="url(#pw-core)"/><circle cx="${cx}" cy="${cy}" r="54" fill="#fff3c4" opacity=".85"/>
<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-weight="bold" letter-spacing="2" fill="#3a2a08">THE SOURCE</text>
<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="#3a2a08">where we begin and end</text>
${nodes}</svg><figcaption class="fine">Tap a stage to begin it. After stage 12 the wheel turns back to the Source. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

// The stages as cards, each with its tabs and a first lesson. Built from the live categories.
function stages(categories) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return `<ol class="pw-stages">${STAGES.map((s) => {
    const tabs = s.tabs.map((t) => byId.get(t)).filter(Boolean);
    const count = tabs.reduce((n, c) => n + c.items.length, 0);
    return `<li class="pw-stage" id="stage-${s.n}"><p class="pw-num">Stage ${s.n} of ${STAGES.length}</p><h3>${esc(s.title)}</h3><p>${esc(s.line)}</p>
<p class="pw-tabs">${tabs.map((c) => `<a href="/library?tab=${c.id}">${esc(c.label)}</a>`).join(" · ")} <span class="fine">(${count} teachings)</span></p>
<a class="more" href="/teachings/${s.begin}">Begin stage ${s.n}</a></li>`;
  }).join("")}</ol>`;
}

export function pathArt(key, categories) {
  if (key === "path-wheel") return `<figure class="cross-hero sl-photo sl-photo-square"><div class="sl-photo-frame"><img src="/images/path-wheel.jpg" width="1200" height="1200" alt="A golden wheel set in stone, with a shining light at its centre and twelve painted scenes around the rim: dawn, rivers, trees, storms, the sea and a butterfly" loading="lazy" decoding="async"></div><figcaption class="fine">The wheel of the inner journey, turning around the light of the Source. The twelve stages of study are listed below. Picture shared by Samadhi.</figcaption></figure>`;
  if (key === "path-stages") return stages(categories);
  return "";
}

export const pathPage = {
  slug: "the-path-of-study", tag: "Start here", title: "The Path of Study: Twelve Stages from the Source to the Source",
  summary: "The whole Library arranged as one cycle of teaching, told as a story: from the Source and the soul, through the human story, the messengers, wisdom, the mystics, the sacred sciences, practice and daily life, to the soul's journey home. Follow it step by step, like a school year.",
  body: `You can wander this Library freely, reading whatever calls you. But many people like to learn **in order**, the way a student moves through a school year, each lesson preparing the next. The Path of Study arranges every teaching on this site into **twelve stages** that tell one story: **the soul's story**.

It begins with the Source, God who is Love, and the soul that came from it. It follows the soul into this world and the long human story; it meets the messengers, the masters and the philosophers who came to help; it goes inward with the mystics, the sacred sciences and practice; it brings the light home into daily life; and it ends where it began, with death as a doorway and the soul's return to the Source. **Then the wheel turns again**, as the soul's lives do, and every teaching reads deeper the second time.

{{path-wheel}}

## How to use it
- **Go at your own pace.** A stage might take a week or a season. There is no exam, only understanding.
- **Begin each stage with its first lesson**, then explore its tabs in any order.
- **Look for the path sign** at the bottom of every teaching: it shows which stage you are in and the way to the next.
- **Practise as you read.** From stage 2 on, try one practice a week from [Practices and Inner Work](/teachings/practices-and-inner-work); reading becomes wisdom when it is lived.
- **Keep a notebook.** Write one sentence after each lesson: *what did this teach me about love?*
- **Use the [Glossary](/teachings/glossary)** whenever a sacred word is new.

## The twelve stages

{{path-stages}}

## Why a cycle and not a ladder
A ladder suggests that we leave the lower steps behind. But the soul's journey is a **spiral**: we return to the same truths, life after life, and understand them more deeply each time. A child hears "God is love" and believes it; an old soul hears the same words and weeps. So when you reach stage 12, begin again at stage 2. You will find a new Library, because you will be a new reader.

## Samadhi's view
*This is Samadhi's own understanding.*

Everything here is one teaching told in many voices: we came from the Source, we are learning in the school of Earth, and we are going home. The prophets, the masters, the philosophers and the mystics are all teachers in the same school. Learn with patience, live what you learn, and share it with love.`,
};
