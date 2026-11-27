// Practices & Inner Work: breath pacers, trataka, contemplation and optional sound.
// The interactive parts run from /practice.js (the site allows no inline scripts). Without scripts,
// every page still reads as clear written instructions. Sound is made live in the browser with
// Web Audio, never plays by itself, and is off until the visitor chooses it.

const GOLD = "#f2c46d", PALE = "#fff3c4", LAV = "#c9b8ff", TEAL = "#9fe7dc";
const f = (n) => Number(n.toFixed(2));

// ---- Sound bar (shared by every practice page) ----
const soundBar = (chimes) => `<div class="px-sound" data-px-sound>
<p class="px-sound-title"><span aria-hidden="true">♪</span> Sound <span class="px-sound-state" data-px-sound-state>off</span></p>
<div class="px-sound-row" role="group" aria-label="Choose a background sound">
<button type="button" class="px-chip is-on" data-sound="off" aria-pressed="true">Silence</button>
<button type="button" class="px-chip" data-sound="bowl" aria-pressed="false">Singing bowl</button>
<button type="button" class="px-chip" data-sound="drone432" aria-pressed="false">Drone 432</button>
<button type="button" class="px-chip" data-sound="drone528" aria-pressed="false">Drone 528</button>
<button type="button" class="px-chip" data-sound="rain" aria-pressed="false">Soft rain</button>
</div>
<label class="px-vol">Volume <input type="range" min="0" max="100" value="40" data-px-volume aria-label="Volume"></label>
${chimes ? `<label class="px-check"><input type="checkbox" data-px-chimes> Gentle chimes when the breath changes</label>` : ""}
</div>`;

// ---- Breath pacers ----
const PACERS = {
  belly: { name: "Calm belly breathing", rhythm: "In for 4 · out for 6", steps: [["in", 4, "Breathe in through the nose, belly rising"], ["out", 6, "Breathe out slowly, belly falling"]] },
  box: { name: "Box breathing", rhythm: "In for 4 · hold 4 · out for 4 · hold 4", steps: [["in", 4, "Breathe in"], ["hold", 4, "Hold, softly full"], ["out", 4, "Breathe out"], ["holdout", 4, "Hold, softly empty"]] },
  nadi: { name: "Alternate nostril breathing", rhythm: "In left 4 · out right 6 · in right 4 · out left 6", steps: [["in", 4, "In through the left nostril", "left"], ["out", 6, "Out through the right nostril", "right"], ["in", 4, "In through the right nostril", "right"], ["out", 6, "Out through the left nostril", "left"]] },
  kapal: { name: "Kapalbhati", kapal: true },
};
function pacer(kind, minutes = [1, 3, 5]) {
  const p = PACERS[kind];
  const nose = kind === "nadi" ? `<g class="px-nose" aria-hidden="true"><text x="120" y="244" text-anchor="middle" font-size="13" fill="${LAV}" font-family="Georgia, serif" data-px-left>LEFT</text><text x="280" y="244" text-anchor="middle" font-size="13" fill="${LAV}" font-family="Georgia, serif" data-px-right>RIGHT</text></g>` : "";
  const rhythm = p.kapal ? "30 quick out-breaths, then 30 seconds of quiet breathing · 3 rounds" : p.rhythm;
  return `<div class="px-pacer" data-px-pacer="${kind}" data-steps='${p.kapal ? "" : JSON.stringify(p.steps)}'>
<div class="px-stage"><svg viewBox="0 0 400 260" role="img" aria-label="A circle of light that grows as you breathe in and shrinks as you breathe out"><defs><radialGradient id="px-g-${kind}"><stop offset="0" stop-color="${PALE}" stop-opacity=".95"/><stop offset=".55" stop-color="${GOLD}" stop-opacity=".55"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient></defs>
<circle cx="200" cy="125" r="104" fill="none" stroke="${GOLD}" stroke-opacity=".25" stroke-dasharray="2 6"/>
<g class="px-orb" data-px-orb style="transform-origin:200px 125px"><circle cx="200" cy="125" r="100" fill="url(#px-g-${kind})"/><circle cx="200" cy="125" r="34" fill="${PALE}" opacity=".9"/></g>${nose}</svg>
<p class="px-phase" data-px-phase aria-live="polite">Ready when you are</p><p class="px-count" data-px-count aria-hidden="true"></p></div>
<p class="px-rhythm">${rhythm}</p>
<div class="px-controls">${p.kapal ? "" : `<label>Time <select data-px-minutes>${minutes.map((m) => `<option value="${m}"${m === 3 ? " selected" : ""}>${m} minute${m > 1 ? "s" : ""}</option>`).join("")}</select></label>`}
<button type="button" class="px-btn" data-px-start>Begin</button><button type="button" class="px-btn px-ghost" data-px-stop hidden>Stop</button></div>
<noscript><p class="fine">The moving guide needs JavaScript. You can follow the rhythm above with a gentle count.</p></noscript></div>`;
}

// ---- Trataka shapes ----
function bindu() {
  return `<svg viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="150" fill="none" stroke="${GOLD}" stroke-width="3"/><circle cx="200" cy="200" r="9" fill="${PALE}"/></svg>`;
}
function flower() {
  const r = 46, pts = [[0, 0]];
  for (let ring = 1; ring <= 2; ring++) for (let k = 0; k < 6 * ring; k++) {
    const side = Math.floor(k / ring), step = k % ring;
    const a1 = (side * 60 * Math.PI) / 180, a2 = ((side + 1) * 60 * Math.PI) / 180;
    const x = ring * r * Math.cos(a1) + step * r * (Math.cos(a2) - Math.cos(a1)), y = ring * r * Math.sin(a1) + step * r * (Math.sin(a2) - Math.sin(a1));
    pts.push([x, y]);
  }
  return `<svg viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="${GOLD}" stroke-width="1.8">${pts.map(([x, y]) => `<circle cx="${f(200 + x)}" cy="${f(200 + y)}" r="${r}"/>`).join("")}<circle cx="200" cy="200" r="${r * 3}" stroke-width="2.6"/></g><circle cx="200" cy="200" r="4" fill="${PALE}"/></svg>`;
}
function flame() {
  return `<svg viewBox="0 0 400 400" aria-hidden="true"><defs><radialGradient id="tk-fl" cx="50%" cy="65%" r="60%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".45" stop-color="#ffd76a"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient><radialGradient id="tk-halo"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".35"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>
<circle cx="200" cy="170" r="150" fill="url(#tk-halo)"/><g class="tk-flame"><path d="M200 70 C230 120 250 150 245 190 C240 225 222 245 200 245 C178 245 160 225 155 190 C150 150 170 120 200 70 Z" fill="url(#tk-fl)"/><path d="M200 150 C212 170 216 185 213 200 C210 215 205 222 200 222 C195 222 190 215 187 200 C184 185 188 170 200 150 Z" fill="#fffef5"/></g>
<rect x="194" y="245" width="12" height="20" rx="3" fill="#3a2a1a"/><rect x="160" y="262" width="80" height="80" rx="8" fill="#efe6d2"/><ellipse cx="200" cy="262" rx="40" ry="7" fill="#f8f1e2"/></svg>`;
}
function sri(geometryArt) {
  const html = geometryArt("geo-sri");
  const svg = html.match(/<svg[\s\S]*?<\/svg>/);
  return svg ? `<div class="sgx">${svg[0].replace(/role="img"[^>]*?aria-labelledby="[^"]*"/, 'aria-hidden="true"')}</div>` : bindu();
}

function trataka(geometryArt) {
  const shapes = [["bindu", "Point and circle", bindu()], ["flame", "Candle flame", flame()], ["flower", "Flower of Life", flower()], ["sri", "Sri Yantra", sri(geometryArt)]];
  return `<div class="tk" data-px-trataka>
<div class="tk-pick" role="radiogroup" aria-label="Choose what to gaze at">${shapes.map(([id, name, art], i) => `<label class="tk-opt"><input type="radio" name="tk-shape" value="${id}"${i === 0 ? " checked" : ""}><span class="tk-thumb">${art}</span><span>${name}</span></label>`).join("")}</div>
<div class="px-controls"><label>Time <select data-tk-minutes><option value="1">1 minute</option><option value="3" selected>3 minutes</option><option value="5">5 minutes</option><option value="10">10 minutes</option></select></label>
<label class="px-check"><input type="checkbox" data-tk-bell checked> Soft bell at the end</label>
<button type="button" class="px-btn" data-tk-start>Begin full-screen gazing</button></div>
<div class="tk-screen" data-tk-screen hidden><div class="tk-art" data-tk-art></div><p class="tk-time" data-tk-time></p><p class="tk-hint" data-tk-hint>Rest your gaze softly on the centre. Blink when you need to.</p><button type="button" class="px-btn px-ghost tk-end" data-tk-end>End</button></div>
<noscript><p class="fine">Full-screen mode needs JavaScript. You can gaze at any of the shapes above just as well.</p></noscript></div>`;
}

// ---- Contemplation prompts ----
const PROMPTS = [
  ["Who am I, beneath my thoughts and feelings?", "Vedanta · Ramana Maharshi's self-inquiry"],
  ["What in my life today is in my power, and what is not?", "Stoic · Epictetus, Enchiridion 1"],
  ["What do I believe that I have never truly examined?", "Socratic · Plato, Apology 38a"],
  ["If this were my last day, what would I stop worrying about?", "Stoic · Marcus Aurelius, Meditations 2.11"],
  ["Where did I act from fear today, and where from love?", "The mystics of every faith"],
  ["What am I grateful for in this very moment?", "Blessing and gratitude"],
  ["What would the wisest, kindest version of me do next?", "Aristotle · the good person as the measure"],
  ["Is this thought true, or only familiar?", "Socratic · the examined life"],
  ["What am I holding on to that I am ready to let go of?", "The Buddha · craving as the root of suffering"],
  ["Who is the one who is aware right now?", "Vedanta · the witness, sakshi"],
  ["How did I treat others today, and how would I want to be treated?", "The Golden Rule"],
  ["What small good can I do before I sleep?", "Seneca's evening review · On Anger 3.36"],
];
function prompts() {
  return `<div class="px-today" data-px-today><p class="px-today-label">Today's question</p><p class="px-today-q" data-px-today-q>${PROMPTS[0][0]}</p><p class="px-today-src" data-px-today-src>${PROMPTS[0][1]}</p>
<div class="px-controls"><button type="button" class="px-btn" data-px-sit>Sit with it for two minutes</button><button type="button" class="px-btn px-ghost" data-px-next>Another question</button></div><p class="px-count" data-px-sit-time aria-live="polite"></p></div>
<ol class="px-prompts">${PROMPTS.map(([q, src]) => `<li data-q="${q}" data-src="${src}"><strong>${q}</strong><span>${src}</span></li>`).join("")}</ol>`;
}

export function practiceArt(key, geometryArt) {
  if (key === "practice-sound") return soundBar(false);
  if (key === "practice-sound-breath") return soundBar(true);
  if (key === "practice-trataka") return trataka(geometryArt);
  if (key === "practice-prompts") return prompts();
  const m = key.match(/^practice-pacer-(\w+)$/);
  return m && PACERS[m[1]] ? pacer(m[1]) : "";
}

const care = `> **A word of care.** These practices are gentle, but listen to your body. If you feel dizzy, light-headed or uneasy, stop and breathe normally. They support, and never replace, medical or mental-health care. See [Principles & Care](/teachings/principles-and-care).`;

export const practicePages = [
  { slug: "practices-and-inner-work", tag: "Start here", title: "Practices and Inner Work: From Reading to Experience",
    summary: "Reading about the chakras, the yantras and philosophy stays in the head until we taste stillness for ourselves. Simple, guided practices to try right on this page.",
    body: `Every tradition on this site says the same thing in its own way: **knowing about the truth is not the same as tasting it.** The yogi does not only read about prana; he breathes. The Stoic does not only read about calm; he practises it every morning and evening. These pages turn the teachings into a few minutes of direct experience.

## The practices
- **[Breath of Peace](/teachings/breath-of-peace)**: four breathing practices with a glowing guide that grows and shrinks with your breath: calm belly breathing, box breathing, alternate nostril breathing, and Kapalbhati.
- **[Trataka: Gazing Meditation](/teachings/trataka)**: a quiet, full-screen mode for resting your gaze on a candle flame, the point and circle, the Flower of Life or the Sri Yantra.
- **[Questions to Sit With](/teachings/questions-to-sit-with)**: one question a day from the Stoics, Socrates, Vedanta and the mystics, with a two-minute timer.
- **[Sound for Stillness](/teachings/sound-for-stillness)**: an optional singing bowl, a soft drone or gentle rain, made live in your browser, always off until you choose it.

## How to begin
- **Little and often.** Three quiet minutes every day do more than one long session a month.
- **The same time and place.** Morning, before the day begins, or evening, before sleep.
- **Sit comfortably, spine tall.** On a chair is perfect; you do not need to sit on the floor.
- **Be kind to the wandering mind.** Every time you notice it has wandered and bring it back, that is the practice.

${care}

## Samadhi's view
*This is Samadhi's own understanding.*

The teachings are a map; practice is the journey. A few minutes of true stillness each day opens the door that no book can open for you. Begin small, begin today, and let the silence teach you.

## Sources

- Patanjali, *Yoga Sutras* 1.2 and 2.46–2.53, on stillness of mind, posture and breath.
- Pierre Hadot, *Philosophy as a Way of Life* (1995), on the daily exercises of the ancient schools.` },

  { slug: "breath-of-peace", tag: "Breath", title: "Breath of Peace: Guided Breathing",
    summary: "Four breathing practices with a glowing guide that grows as you breathe in and softens as you breathe out: calm belly breathing, box breathing, alternate nostril breathing and Kapalbhati.",
    body: `In the yoga traditions, breath is the bridge between body and mind. The Sanskrit word ***prāṇāyāma*** means the extension, or the guiding, of the life-force through the breath. Calm the breath, the yogis say, and the mind follows.

{{practice-sound-breath}}

## 1. Calm belly breathing
The simplest and safest of all. Breathe in through the nose so the belly rises, and breathe out a little longer than you breathe in. A longer out-breath tells the body it is safe to relax.

{{practice-pacer-belly}}

## 2. Box breathing
Four equal sides: breathe in, hold, breathe out, hold. A steadying rhythm for a busy mind. If the holds feel hard, simply breathe without them.

{{practice-pacer-box}}

## 3. Alternate nostril breathing (Nadi Shodhana)
*Nāḍī Śodhana* means "cleansing the channels". It is taught to bring balance between the two sides of the body and the two currents of energy, *ida* and *pingala*.

**How to hold your hand:** rest the first two fingers of your right hand between your eyebrows. Close the right nostril with your thumb and the left with your ring finger, opening one side at a time as the guide shows. Keep the breath soft and silent.

{{practice-pacer-nadi}}

## 4. Kapalbhati, "shining skull breath"
Short, strong out-breaths from the belly, about one each second, with the in-breath happening by itself. After thirty, rest and breathe quietly. This is an energising practice, best in the morning on an empty stomach.

> **Please do not practise Kapalbhati** if you are pregnant, have high blood pressure, heart disease, a hernia, epilepsy, or have had recent surgery, and stop at once if you feel dizzy. If you are unsure, ask your doctor and learn it from an experienced teacher.

{{practice-pacer-kapal}}

${care}

## Samadhi's view
*This is Samadhi's own understanding.*

Every breath is a gift from the Divine, given again and again without asking. When we breathe with awareness, we receive that gift consciously, and the life-force flows more freely through the whole body and the centres of light.

## Sources

- *Hatha Yoga Pradipika* 2.7–2.10 (alternate nostril breathing) and 2.35 (*kapalabhati*), translated by Pancham Sinh (1914).
- Patanjali, *Yoga Sutras* 2.49–2.53, on prāṇāyāma.` },

  { slug: "trataka", tag: "Gaze", title: "Trataka: Gazing Meditation",
    summary: "The yogic practice of resting the gaze on a single point until the mind grows still: a candle flame, the point and circle, the Flower of Life or the Sri Yantra, in a quiet full-screen mode with a gentle timer.",
    body: `***Trāṭaka*** is the yogic practice of steady gazing. The *Hatha Yoga Pradipika* describes it simply: look without blinking at a small object, with a still mind, until the eyes begin to water (2.31). When the eyes close, the image glows on the inner screen, and the attention rests there. The yogis say it strengthens concentration and prepares the mind for meditation.

## How to practise
1. **Choose your object** below and the length of time. Begin with one to three minutes.
2. **Sit about an arm's length from the screen**, eyes level with the centre. Dim the room if you can.
3. **Rest your gaze softly** on the very centre. Do not stare hard. Blink whenever you need to.
4. **When the time ends, close your eyes.** Watch the glowing after-image between your eyebrows until it fades.

{{practice-trataka}}

{{practice-sound}}

> **A word of care.** Do not strain the eyes, and stop if they hurt. If you wear contact lenses, keep sessions short or practise without them. If you have epilepsy or are sensitive to light, choose the still shapes rather than the flame. Traditional trataka uses a real candle; if you light one, never leave it unattended.

## Sources

- *Hatha Yoga Pradipika* 2.31–2.32, translated by Pancham Sinh (1914).
- *Gheranda Samhita* 1.53–1.54, on trataka.` },

  { slug: "questions-to-sit-with", tag: "Contemplation", title: "Questions to Sit With",
    summary: "One question a day from the Stoics, Socrates, Vedanta and the mystics, with a two-minute timer: not to answer quickly, but to let it work in you.",
    body: `The great teachers often gave a question rather than an answer. Socrates asked his questions in the marketplace; Ramana Maharshi gave one question to everyone: *Who am I?* The point is not to find a clever answer quickly, but to **sit with the question** and let it open something in you.

## How to sit with a question
1. Read the question slowly, twice.
2. Close your eyes and let it rest in the heart, not only the head.
3. Notice what rises, without judging it.
4. When the two minutes end, write one line, or simply carry the question into your day.

{{practice-prompts}}

{{practice-sound}}

## Samadhi's view
*This is Samadhi's own understanding.*

A true question is a prayer. When we ask it sincerely and wait in silence, the answer comes, not always in words, but as a deeper peace and a clearer heart.

## Sources

- Plato, *Apology* 38a; Epictetus, *Enchiridion* 1; Marcus Aurelius, *Meditations* 2.11; Seneca, *On Anger* 3.36.
- Ramana Maharshi, *Who Am I?* (*Nan Yar?*, 1902).` },

  { slug: "sound-for-stillness", tag: "Sound", title: "Sound for Stillness",
    summary: "Sound is sacred in almost every tradition, from the Om of the yogis to the harmony of Pythagoras. An optional singing bowl, a soft drone or gentle rain to sit with, always off until you choose it.",
    body: `Nearly every tradition on this site honours sound. The yogis speak of ***nāda***, the inner sound, and of Om as the sound of creation. Pythagoras heard the harmony of the spheres in the ratios of number. The Sefer Yetzirah teaches that the world was formed through the letters, and the Gospel of John begins: "In the beginning was the Word."

## Choose a sound
Nothing plays until you press a button. The sounds are made live in your browser, so nothing is downloaded and nothing plays by itself. They keep playing while you stay on this page.

{{practice-sound}}

- **Singing bowl:** a soft bowl struck every few breaths, its tone slowly fading.
- **Drone 432** and **Drone 528:** warm, steady tones built around 432 and 528 vibrations a second, with gentle harmonics.
- **Soft rain:** a quiet, even hush, like rain on leaves.

## An honest word about frequencies
Many websites claim that 432 Hz or 528 Hz heal the body or repair DNA. These claims are not supported by research. The tones here are offered simply as **beautiful, calming sound** to help you settle, not as a cure. What truly heals in this practice is the stillness you bring to it.

## Sources

- John 1:1, King James Bible; *Sefer Yetzirah* 2.
- *Mandukya Upanishad* 1, on Om; *Hatha Yoga Pradipika* 4.65–4.102, on *nāda*, the inner sound.` },
];
