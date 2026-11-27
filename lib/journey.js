// The Soul's Journey: death, the life review, planning the next life, the cycles of return,
// the long road to ascension, souls who leave Earth school, and comfort in grief.
// Each tradition in its own words; Samadhi's teaching labelled as "the teaching of this path".
// Quotations: King James Bible; Pickthall's Qur'an (1930); Edwin Arnold's Gita (1885). Checked Nov 2026.

const bridge = (links) => `\n\n## Explore the connection\n${links.map(([t, u, why]) => `- [${t}](${u}): ${why}`).join("\n")}`;
const lesson = (n) => `*The Soul's Journey · lesson ${n} of 7: [Death Is a Doorway](/teachings/death-is-a-doorway) · [The Life Review](/teachings/the-life-review-and-the-karmic-board) · [Planning the Next Life](/teachings/planning-the-next-life) · [The 144-Year Cycle](/teachings/the-144-year-cycle) · [800 Lifetimes](/teachings/800-lifetimes-to-ascension) · [No Soul Is Lost](/teachings/when-a-soul-quits) · [Losing Someone We Love](/teachings/losing-someone-we-love).*`;
const path = `## The teaching of this path\n*This is Samadhi's view, the teaching of this path. It is offered as a teaching, not as a proof.*`;

// Soft-light art only: a doorway of light, the eight lights of the Karmic Board, the wheel of return.
const stars = (pts) => pts.map(([x, y, r = 1.4]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".7"/>`).join("");
function door() {
  const sparks = Array.from({ length: 14 }, (_, i) => `<circle class="sj-spark" style="--d:${(i * 0.7).toFixed(1)}s" cx="${250 + ((i * 37) % 100)}" cy="300" r="${1.5 + (i % 3)}" fill="#fff3c4"/>`).join("");
  return `<figure class="cross-hero sj-figure"><svg viewBox="0 0 600 340" role="img" aria-labelledby="sj-door-t" xmlns="http://www.w3.org/2000/svg"><title id="sj-door-t">An open doorway of soft golden light at the top of a gentle path, with small lights rising through it</title>
<defs><radialGradient id="sj-sky" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#2d2458"/><stop offset="1" stop-color="#08070f"/></radialGradient>
<linearGradient id="sj-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="#ffe39a"/><stop offset="1" stop-color="#f2c46d" stop-opacity=".6"/></linearGradient>
<radialGradient id="sj-glow"><stop offset="0" stop-color="#fff3c4" stop-opacity=".6"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
<linearGradient id="sj-path" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d9c8ff" stop-opacity=".05"/><stop offset="1" stop-color="#fff3c4" stop-opacity=".5"/></linearGradient></defs>
<rect width="600" height="340" rx="18" fill="url(#sj-sky)"/>${stars([[60, 50], [540, 60], [110, 270], [500, 290], [40, 170], [570, 190], [170, 40], [440, 34], [90, 120], [520, 130]])}
<circle class="sj-breathe" cx="300" cy="150" r="140" fill="url(#sj-glow)"/>
<path d="M150 340 L282 222 L318 222 L450 340 Z" fill="url(#sj-path)"/>
<path d="M262 222 V120 A38 38 0 0 1 338 120 V222 Z" fill="url(#sj-door)"/>
<path d="M262 222 V120 A38 38 0 0 1 338 120 V222" fill="none" stroke="#fffbe8" stroke-width="2" opacity=".8"/>
<g>${sparks}</g>
<text x="300" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="4" fill="#e6dcf7">THE SOUL'S JOURNEY</text>
</svg><figcaption class="fine">Death as a doorway of light. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

const BOARD = [["Great Divine Director", "1st ray", "#7fb2ff"], ["Goddess of Liberty", "2nd ray", "#ffe39a"], ["Nada", "3rd ray", "#ffb3c8"], ["Cyclopea", "4th ray", "#f6f3ff"],
  ["Pallas Athena", "5th ray", "#9fe7b0"], ["Portia", "6th ray", "#f2c46d"], ["Kuan Yin", "7th ray", "#c9a0ff"], ["Vairochana", "eighth member", "#bfe9ff"]];
function board() {
  const items = BOARD.map(([n, ray, c], i) => {
    const a = ((i * 45 - 90) * Math.PI) / 180, x = 300 + 112 * Math.cos(a), y = 180 + 112 * Math.sin(a);
    const lx = 300 + 162 * Math.cos(a), ly = 184 + 158 * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    return `<g class="sj-light" style="--d:${(i * 0.6).toFixed(1)}s"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="${c}" opacity=".22"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${c}"/></g>
<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-family="Georgia, serif" font-size="13" fill="#f1ebff">${n}<tspan x="${lx.toFixed(1)}" dy="15" font-size="11" fill="#bdb3d9">${ray}</tspan></text>`;
  }).join("");
  return `<figure class="cross-hero sj-figure"><svg viewBox="0 0 600 366" role="img" aria-labelledby="sj-board-t" xmlns="http://www.w3.org/2000/svg"><title id="sj-board-t">Eight soft lights in a circle, one for each member of the Karmic Board, around a gentle golden centre: the soul's own light</title>
<defs><radialGradient id="sj-sky2" cx="50%" cy="50%" r="80%"><stop offset="0" stop-color="#2a2150"/><stop offset="1" stop-color="#08070f"/></radialGradient>
<radialGradient id="sj-core"><stop offset="0" stop-color="#fffbe8"/><stop offset=".5" stop-color="#ffe39a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient></defs>
<rect width="600" height="366" rx="18" fill="url(#sj-sky2)"/>
<circle cx="300" cy="180" r="112" fill="none" stroke="#e6dcf7" stroke-opacity=".25" stroke-dasharray="3 6"/>
<circle class="sj-breathe" cx="300" cy="180" r="58" fill="url(#sj-core)"/><circle cx="300" cy="180" r="34" fill="#fff3c4" opacity=".85"/>
<text x="300" y="185" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-weight="bold" letter-spacing="2" fill="#3a2a08">THE SOUL</text>
${items}</svg><figcaption class="fine">The eight members of the Karmic Board as the Ascended Master teachings name them, shown as lights rather than faces. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

function cycle() {
  const arc = (from, to, r) => { const p = (d) => { const a = ((d - 90) * Math.PI) / 180; return [(300 + r * Math.cos(a)).toFixed(1), (175 + r * Math.sin(a)).toFixed(1)]; }; const [x1, y1] = p(from), [x2, y2] = p(to); return `M${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`; };
  return `<figure class="cross-hero sj-figure"><svg viewBox="0 0 600 350" role="img" aria-labelledby="sj-cyc-t" xmlns="http://www.w3.org/2000/svg"><title id="sj-cyc-t">A circle of 144 years: two golden arcs for two lives on earth, each followed by a short violet arc of rest between lives, and a long soft arc of light in the higher worlds</title>
<defs><radialGradient id="sj-sky3" cx="50%" cy="50%" r="80%"><stop offset="0" stop-color="#2a2150"/><stop offset="1" stop-color="#08070f"/></radialGradient></defs>
<rect width="600" height="350" rx="18" fill="url(#sj-sky3)"/>
<circle cx="300" cy="175" r="120" fill="none" stroke="#e6dcf7" stroke-opacity=".18" stroke-width="16"/>
<g class="sj-turn"><path d="${arc(0, 125, 120)}" fill="none" stroke="#ffe39a" stroke-width="16" stroke-linecap="round"/>
<path d="${arc(131, 141, 120)}" fill="none" stroke="#c9a0ff" stroke-width="16" stroke-linecap="round"/>
<path d="${arc(147, 272, 120)}" fill="none" stroke="#f2c46d" stroke-width="16" stroke-linecap="round"/>
<path d="${arc(278, 354, 120)}" fill="none" stroke="#bfe9ff" stroke-width="16" stroke-linecap="round" stroke-opacity=".7"/></g>
<text x="300" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#fff3c4">144</text>
<text x="300" y="194" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="3" fill="#d9cfee">YEARS</text>
<g font-family="Georgia, serif" font-size="13" fill="#f1ebff"><text x="470" y="110">a life on earth</text><text x="470" y="262">a short rest</text><text x="64" y="262">a second life</text><text x="64" y="104">time in the light</text></g>
</svg><figcaption class="fine">As the mystery schools teach, drawn as a wheel: two lives in one 144-year cycle, with a short rest between them. The lengths are a picture, not a measurement. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

// Samadhi's own pictures: an open door of light in an old stone wall, and a stairway rising into the light.
const photo = (src, alt, caption) => `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/${src}" width="1600" height="900" alt="${alt}" loading="lazy" decoding="async"></div><figcaption class="fine">${caption} Picture shared by Samadhi.</figcaption></figure>`;
export function journeyArt(key) {
  if (key === "soul-door") return photo("soul-door.jpg", "An old wooden door standing open in an ancient stone wall covered with ivy, golden light pouring through it", "Death as a doorway of light.");
  if (key === "soul-stairs") return photo("soul-stairs.jpg", "A lone figure climbing a long white stairway through soft clouds toward a column of light", "The soul's long road home, step by step.");
  return "";
}

export const soulsJourney = [
  { slug: "death-is-a-doorway", tag: "The Soul's Journey · 1", title: "Death Is a Doorway",
    summary: "What happens when we die? The teaching of this path, and the way each great tradition describes the passage in its own words: the Bardo, the weighing of the heart, barzakh, gilgul, the particular judgment and the Bhagavad Gita.",
    body: `{{soul-door}}

${lesson(1)}

Every human being will walk through one door. Most of us are taught to fear it. Yet almost every tradition on earth says the same quiet thing: **death is not an end but a passage.** The body is laid down like a coat; the one who wore it goes on.

"Then shall the dust return to the earth as it was: and the spirit shall return unto God who gave it" (Ecclesiastes 12:7).

${path}

When the body dies, the soul rises out of it, often feeling light and free, and passes into the **astral realm**, the world of light that lies just beyond this one. There it is met by love: by guides, by souls it knew, and in time by the **Karmic Board**. With them it looks back over the life just lived, **without punishment**, to see what was learned and what is still to learn. Then it rests, heals, and begins to plan its next step. Nothing is lost. Death is the soul's graduation from one class and its walk to the next.

## How the traditions describe the passage
- **The Tibetan Bardo.** The *Bardo Thödol*, "Liberation through Hearing in the Intermediate State", traditionally attributed to Padmasambhava and revealed by Karma Lingpa in the 14th century, guides the dying and the dead through the **bardo**, the in-between state, for **49 days**. At the moment of death a **Clear Light** dawns; the teaching is to recognise it as one's own true nature. The visions that follow are understood as projections of the mind. Lamas read the text aloud beside the dead, so that the soul may hear and be freed, or else find a good rebirth.
- **Egypt: the weighing of the heart.** In the Egyptian *Book of Going Forth by Day* (the "Book of the Dead", spell 125), the soul enters the Hall of the Two Truths. Anubis weighs the heart against the feather of **Ma'at**, truth and balance, while Thoth records the result. The soul declares that it has lived rightly. A heart as light as truth passes on into the Field of Reeds. See [Ma'at, the Wisdom of Egypt](/teachings/maat-wisdom-of-egypt).
- **Judaism and Kabbalah.** The soul returns to its Source. Jewish tradition speaks of a time of cleansing, of at most twelve months according to the Mishnah (*Eduyot* 2:10), before the soul rests in the Garden of Eden; this is why the mourner's Kaddish is said for eleven months. The Kabbalists, in the *Zohar* and in the teaching of Isaac Luria, add ***gilgul***, the turning of souls through new lives until their repair (*tikkun*) is complete.
- **Islam: the barzakh.** The Qur'an tells of a barrier between this life and the next: "behind them is a barrier until the day when they are raised" (Qur'an 23:100, Pickthall). In the ***barzakh*** the soul waits, at peace or in unrest according to its deeds, until the Day of Resurrection. To the soul that trusted God the call comes: "But ah! thou soul at peace! Return unto thy Lord, content in His good pleasure!" (Qur'an 89:27–28, Pickthall). When a loss comes, Muslims say: "Lo! we are Allah's and lo! unto Him we are returning" (Qur'an 2:156, Pickthall).
- **Christianity: the particular judgment.** "It is appointed unto men once to die, but after this the judgment" (Hebrews 9:27). Catholic teaching calls this the *particular judgment*: each soul, at death, sees its life in the light of God's love. To the thief beside him Jesus said: "To day shalt thou be with me in paradise" (Luke 23:43). And he promised: "In my Father's house are many mansions … I go to prepare a place for you" (John 14:2). Eastern Orthodox Christians pray especially for the soul during the first **forty days**.
- **Hinduism: the Bhagavad Gita.** "Nay, but as when one layeth / His worn-out robes away, / And, taking new ones, sayeth, / 'These will I wear to-day!' / So putteth by the spirit / Lightly its garb of flesh, / And passeth to inherit / A residence afresh" (Bhagavad Gita 2:22, Edwin Arnold, 1885). The Self is never born and never dies; it changes bodies as we change clothes, until it is free (*moksha*).
- **Plato.** In the *Phaedo*, Socrates spends his last day teaching that the philosopher should not fear death, for the soul is freed from the body to go to the divine and the wise. See [The Death of Socrates](/teachings/death-of-socrates).

## What people who came back report
People who have been close to death and returned often describe the same things: peace, leaving the body, a tunnel or passage, a light full of love, meeting loved ones, and often a review of the life. Researchers have studied thousands of these accounts. See [Near-Death Experiences](/teachings/near-death-experiences).

## Living with the doorway in view
- **Fear softens when we understand.** "O death, where is thy sting? O grave, where is thy victory?" (1 Corinthians 15:55).
- **Live so that the review is a joy.** Every tradition says the same: what we carry through the door is not money or name, but love, truth and the good we did.
- **Speak of it gently with those you love.** Death is easier for everyone when it is not a forbidden subject.${bridge([
      ["The Life Review and the Karmic Board", "/teachings/the-life-review-and-the-karmic-board", "what the soul sees when it looks back."],
      ["Reincarnation and Karma", "/teachings/reincarnation-and-karma", "the soul's many lives."],
      ["Near-Death Experiences", "/teachings/near-death-experiences", "the accounts of those who returned."],
      ["Archangel Azrael", "/teachings/archangel-azrael", "the angel who gently guides souls home."],
    ])}

## Sources

- Ecclesiastes 12:7; Luke 23:43; John 14:2; 1 Corinthians 15:55; Hebrews 9:27, King James Bible; *Catechism of the Catholic Church* 1021–1022.
- Qur'an 2:156, 23:100 and 89:27–28, Pickthall, *The Meaning of the Glorious Koran* (1930).
- Bhagavad Gita 2:22, Edwin Arnold, [*The Song Celestial*](https://www.gutenberg.org/ebooks/2388) (1885).
- The *Bardo Thödol* (the "Tibetan Book of the Dead"); the Egyptian *Book of Going Forth by Day*, spell 125; Mishnah *Eduyot* 2:10; the *Zohar*; Hayyim Vital, *Sha'ar HaGilgulim*; Plato, *Phaedo*.` },

  { slug: "the-life-review-and-the-karmic-board", tag: "The Soul's Journey · 2", title: "The Life Review and the Karmic Board",
    summary: "After death the soul looks back over its whole life, not to be punished but to understand. The life review in near-death accounts and in the scriptures, the Lords of Karma, and the eight members of the Karmic Board in the Ascended Master teachings.",
    body: `{{soul-stairs}}

${lesson(2)}

Imagine watching your whole life again, every moment of it, and feeling not only what you felt, but what **everyone you touched** felt because of you. The kindness you forgot. The hurt you never noticed. This is what many traditions, and many people who have come close to death, describe: **the life review.**

${path}

After death the soul is brought, in the astral realm, before the **Karmic Board**: great beings of love and wisdom who help each soul see its life as it truly was. **There is no punishment.** The Board is not a court that condemns, but a council of teachers. Together with the soul, it weighs what was learned, what was balanced, and what is still to be balanced, and it helps the soul choose what comes next. The soul is its own most honest judge; in the light of so much love, nothing can be hidden, and nothing needs to be.


## The Karmic Board in the Ascended Master teachings
In the Ascended Master teachings, the Karmic Board, also called the Lords of Karma, is a council of eight ascended beings who dispense justice and mercy for the souls of this world, adjudicating karma on behalf of every soul. Its members are usually named with the ray each one represents:
- **The Great Divine Director** (first ray)
- **The Goddess of Liberty** (second ray)
- **Lady Master Nada** (third ray)
- **Elohim Cyclopea** (fourth ray)
- **Pallas Athena**, the Goddess of Truth (fifth ray)
- **Portia**, the Goddess of Justice (sixth ray)
- **Kuan Yin**, the Goddess of Mercy (seventh ray)
- **Vairochana**, one of the five Dhyani Buddhas, named in these teachings as the eighth member

These teachings say that the Board meets especially at the **winter and summer solstices**, and students write letters to it asking for help and mercy for themselves, their families and the world. They also stress that karma never has the purpose of punishing anyone, only of teaching. See [The Ascended Masters](/teachings/ascended-masters), [The Seven Rays](/teachings/seven-rays) and [Other Masters](/teachings/other-masters), where Kuan Yin is honoured.

## Older roots
- **The Lipika (Theosophy).** H. P. Blavatsky's *The Secret Doctrine* (1888) speaks of the **Lipika**, the "Recorders" or "Scribes", who keep the record of every action in the astral light: the Lords of Karma.
- **The Akashic Records.** Later teachers called this record the *Akashic Records*: a memory of everything that has ever been, written in the subtle substance (*akasha*) of the universe.
- **Chitragupta (Hinduism).** In Hindu tradition, Chitragupta keeps an account of every deed of every soul, and reads it before Yama, the lord of death.
- **The book that is opened (Bible).** "And the books were opened … and the dead were judged out of those things which were written in the books, according to their works" (Revelation 20:12).
- **Every deed confronted (Qur'an).** "On the day when every soul will find itself confronted with all that it hath done of good and all that it hath done of evil" (Qur'an 3:30, Pickthall). And in the same verse: "Allah is full of pity for (His) bondmen."
- **Egypt.** Thoth, the scribe of the gods, records the weighing of the heart against Ma'at (see [Death Is a Doorway](/teachings/death-is-a-doorway)).

## The life review in near-death accounts
In *Life After Life* (1975), Dr. Raymond Moody described what many of his subjects reported: a panoramic review of their life, shown in the presence of a being of light who radiated love and **did not condemn**, but seemed to ask, in effect, what they had done with their life and how they had loved. Dr. Michael Newton, in *Journey of Souls* (1994), described clients under hypnosis who spoke of meeting a "council of elders" between lives: wise beings who reviewed the life with them kindly, like teachers with a student. Dolores Cannon, in *Between Death and Life* (1993), gave similar accounts. These are experiences and reports, deeply moving, but they cannot be checked like history.

## What this means for today
- **Every act of kindness is recorded.** So is every hurt. Live so that you would be glad to watch your life again.
- **We can review our life now.** At the end of each day, look back gently: where did I love? Where did I hurt? What can I mend tomorrow? This is the life review in small, and it lightens the great one.
- **Forgive, and ask forgiveness, while you can.** What is balanced here does not need to be balanced later.${bridge([
      ["Planning the Next Life", "/teachings/planning-the-next-life", "what the soul does after the review."],
      ["The Ascended Masters", "/teachings/ascended-masters", "the masters of the rays."],
      ["Reincarnation and Karma", "/teachings/reincarnation-and-karma", "the law that every action returns."],
    ])}

## Sources

- Revelation 20:12, King James Bible; Qur'an 3:30, Pickthall (1930).
- The Summit Lighthouse, [*Encyclopedia of the Ascended Masters*: Karmic Board](https://encyclopedia.summitlighthouse.org/w/Translations:Karmic_Board/4/en); The Hearts Center, [Karmic Board Letters](https://www.heartscenter.org/images/PDFs/KarmicBoardLetter-Instructions.pdf).
- H. P. Blavatsky, *The Secret Doctrine* (1888), on the Lipika.
- Raymond Moody, *Life After Life* (1975); Michael Newton, *Journey of Souls* (1994); Dolores Cannon, *Between Death and Life* (1993).` },

  { slug: "planning-the-next-life", tag: "The Soul's Journey · 3", title: "Planning the Next Life",
    summary: "After the review, the soul rests, heals and plans its next life: the lessons it will learn, the family it will be born into, the souls it will meet and the challenges it accepts. What the traditions and modern teachers say, and how to hold it wisely.",
    body: `{{soul-door}}

${lesson(3)}

Why were you born to these parents, in this country, with these gifts and these struggles? Many traditions answer: **because, in some way, your soul chose them.**

${path}

After the life review, the soul rests and heals in the higher worlds. Then, with the help of its guides and the Karmic Board, it **plans its next life**: which lessons to learn, which debts of karma to balance, which gifts to develop, and which souls to meet again. It chooses its parents, its family, the place and time of its birth, and the great challenges that will help it grow. Then it agrees, and it is born, forgetting the plan so that the lessons can be truly lived. The plan is a map, not a cage: on earth, free will decides how we walk it.

## What the traditions teach
- **Plato's Myth of Er.** At the end of the *Republic*, Plato tells of the soldier Er, who saw souls between lives come before the Fates and **choose their next lives** from many patterns spread on the ground. Wise souls chose carefully; others chose in haste. Then they drank from the river of forgetfulness and were born. "The responsibility is with the chooser", says the herald; "God is justified" (*Republic* 10.617e, Jowett).
- **Kabbalah.** The Jewish mystics teach that the soul descends into this world with a mission, its own part of the repair of the world (*tikkun*), and returns through *gilgul* until its part is done.
- **Islam.** The Qur'an tells of the covenant all souls made with God before birth: "Am I not your Lord?" "Yea, verily" (Qur'an 7:172, Pickthall). Islamic teaching holds that each person's provision, lifespan and deeds are written while they are still in the womb, while every soul remains responsible for its choices.
- **The Bible.** "Before I formed thee in the belly I knew thee" (Jeremiah 1:5). "To every thing there is a season, and a time to every purpose under the heaven" (Ecclesiastes 3:1).
- **Hinduism and Buddhism.** The karma we carry shapes the birth we take. The Hindu teaching of *prarabdha karma* is the part of our past that has "begun to bear fruit" in this life. Tibetan Buddhists teach that great teachers (*tulkus*) can choose their rebirth out of compassion.

## What modern teachers report
**Dolores Cannon**, in *Between Death and Life* (1993) and *The Convoluted Universe* series, described clients under hypnosis who spoke of planning their lives with guides: choosing their bodies, their families and their tests, and agreeing to "contracts" with other souls. **Michael Newton**, in *Journey of Souls* and *Destiny of Souls*, described a "place of life selection" where souls were shown possible lives before choosing one. **Robert Schwartz**, in *Your Soul's Plan* (2007), gathered accounts of souls who planned even their hardest challenges. These books have helped many people find meaning; they rest on personal experience, not on proof.

## Holding these ideas wisely
- **Never use it to blame.** No one should ever be told that they "chose" abuse, illness or injustice, or that they deserve it. The purpose of these ideas is meaning and compassion, never blame.
- **Free will still decides.** "Allah changeth not the condition of a folk until they (first) change that which is in their hearts" (Qur'an 13:11, Pickthall). The plan is the stage; we write our part.
- **Ask a different question.** Instead of "why me?", try: *what did my soul come to learn here, and whom did it come to love?*${bridge([
      ["Soul Contracts and Soul Families", "/teachings/soul-contracts-and-soul-families", "the souls we agree to meet."],
      ["The 144-Year Cycle", "/teachings/the-144-year-cycle", "how often the soul returns."],
      ["Earth School", "/teachings/earth-school", "why this world is a school."],
    ])}

## Sources

- Plato, *Republic* 10.614b–621d (the Myth of Er), Jowett translation.
- Qur'an 7:172 and 13:11, Pickthall (1930); Jeremiah 1:5; Ecclesiastes 3:1, King James Bible.
- Dolores Cannon, *Between Death and Life* (1993) and *The Convoluted Universe* (2001 onward); Michael Newton, *Journey of Souls* (1994) and *Destiny of Souls* (2000); Robert Schwartz, *Your Soul's Plan* (2007).` },

  { slug: "the-144-year-cycle", tag: "The Soul's Journey · 4", title: "The 144-Year Cycle: How Often Does the Soul Return?",
    summary: "How long does a soul rest between lives? The teaching of this path, the Rosicrucian 144-year cycle of H. Spencer Lewis and AMORC, Theosophy's long rest in devachan, and what researchers found in children who remember past lives.",
    body: `{{soul-stairs}}

${lesson(4)}

If we return, **how soon?** Do we rest for centuries, or come back quickly to the people and places we love? The traditions give very different answers, and it is good to see them side by side.

${path}

As the mystery schools teach, between most lives the soul rests for **about five years** before returning. In the Rosicrucian teaching, life moves in a great rhythm of **144 years**: in each cycle of 144 years the soul usually lives **two lives on earth, one after the other**, with only a short rest between them, and spends the rest of the cycle in the higher worlds, learning and preparing. Souls in a hurry to grow, or called back by love or by unfinished work, may return sooner; the rhythm serves the soul, not the other way round.


## The Rosicrucian teaching (AMORC)
The number 144 comes from the Rosicrucian tradition. **H. Spencer Lewis** (1883–1939), who founded the Ancient Mystical Order Rosae Crucis (AMORC) in 1915, wrote about the soul's cycles in *Mansions of the Soul: The Cosmic Conception* (1930), and told the story of one soul's many lives in *A Thousand Years of Yesterdays*. Scholars who describe AMORC's teaching summarise it this way: **ideally, a person should reincarnate every 144 years.** The aim of the Rosicrucian student is not to escape the wheel, but to use each life to grow and to serve. The title *Mansions of the Soul* echoes the words of Jesus: "In my Father's house are many mansions" (John 14:2).

Lewis also made the point that the soul is the true person: a soul clothed with a body, not a body that happens to have a soul.

## Other answers, side by side
- **Theosophy: a long rest.** H. P. Blavatsky taught that after death the soul enjoys a long, happy dream-rest called ***devachan***. In *The Key to Theosophy* (1889) she wrote that the stay in devachan depends on the spirituality and merit of the last life, and that the average is **1,000 to 1,500 years**. Later Theosophists, like William Q. Judge, stressed that this was only an average: it could be much shorter.
- **Besant and Leadbeater.** Annie Besant and C. W. Leadbeater taught that the interval varies with the soul's development: shorter for younger souls who have gathered little to digest, much longer for advanced souls with much to absorb.
- **Research: often very quick.** Dr. Ian Stevenson of the University of Virginia studied thousands of young children who spoke of a previous life. His successor, Dr. Jim Tucker, reports that these children usually describe a recent, ordinary life, with a **median gap of about 16 months** between the death of the previous person and the birth of the child.
- **The Tibetan Bardo:** **49 days** between death and rebirth for most beings (see [Death Is a Doorway](/teachings/death-is-a-doorway)).
- **The Druze and others:** some traditions teach that rebirth is **immediate**: the soul passes at once into a newborn body.

## Why the answers differ
Different traditions speak of different souls, different worlds and different purposes. A teaching about the *average* soul is not a rule for every soul. Hold the numbers lightly: what matters is not *when* we come back, but *how* we live while we are here.${bridge([
      ["800 Lifetimes to Ascension", "/teachings/800-lifetimes-to-ascension", "how many lives the journey takes."],
      ["The Rosicrucian Path", "/teachings/the-rosicrucian-path", "the tradition behind the 144-year cycle."],
      ["Reincarnation and Karma", "/teachings/reincarnation-and-karma", "the wheel of lives."],
    ])}

## Sources

- John 14:2, King James Bible.
- H. Spencer Lewis, *Mansions of the Soul: The Cosmic Conception* (Rosicrucian Press, 1930) and [*A Thousand Years of Yesterdays*](https://rosicrucian.org/rosicrucian-books-a-thousand-years-of-yesterdays); Massimo Introvigne on AMORC's teaching of a 144-year cycle.
- H. P. Blavatsky, *The Key to Theosophy* (1889), section 9; William Q. Judge, ["Devachan"](https://theosociety.org/pasadena/path/v07n12p369_devachan.htm), *The Path*, March 1893.
- Jim B. Tucker, ["Children's Reports of Past-Life Memories: A Review"](https://med.virginia.edu/perceptual-studies/wp-content/uploads/sites/360/2015/11/REI37.pdf), University of Virginia; Ian Stevenson, *Children Who Remember Previous Lives* (1987).` },

  { slug: "800-lifetimes-to-ascension", tag: "The Soul's Journey · 5", title: "800 Lifetimes to Ascension",
    summary: "How many lives does it take for a soul to become a master? The teaching of this path, the 800 lives in three phases of Barbara Martin and Dimitri Moraitis, Theosophy's symbolic 777, the 8.4 million forms of life in the Hindu tradition, and the Michael Teachings.",
    body: `{{soul-stairs}}

${lesson(5)}

No one becomes a master in one life. A diamond is pressed for ages; a great tree grows ring by ring. The traditions that teach reincarnation agree that **the soul's journey home is long, patient and certain.**

${path}

As the mystery schools teach, a soul lives **about 800 to 1,000 lives, or more,** on its way to ascension. It begins young and unknowing, learns through instinct and struggle, then through the mind and its choices, and at last through love and conscious union with God. Each life is a class; Earth is the hardest and the best school. When the lessons of Earth are complete, the soul **ascends**: it no longer needs to return, though it may choose to come back to help others, as the masters do.

## The 800 lives in three phases
The teachers **Barbara Y. Martin and Dimitri Moraitis**, of the Spiritual Arts Institute, write in their book *Karma and Reincarnation* that on average each soul reincarnates about **800 times** to attain spiritual mastery, in three great phases:
- **The instinctual phase: about 200 lives.** The soul learns to survive in a body and in the physical world, guided mostly by instinct.
- **The intellectual phase: about 500 lives.** The soul becomes self-aware, develops the mind, and learns to take responsibility for its actions. Most of humanity is here.
- **The enlightened phase: about 100 lives.** The soul consciously co-creates with God, and its light grows until it reaches mastery.

They present this as spiritual teaching, not as something that can be measured.

## Other answers, side by side
- **Theosophy: 777.** In *The Mahatma Letters*, the Master K.H. wrote to A. P. Sinnett of 777 incarnations, but in the context of the long cycles of "rounds" and planets, and he said plainly that he was not permitted to give the total number of lives. Later Theosophists such as G. de Purucker explained that 777 is **not the literal number** of a soul's incarnations. It is best read as a sacred, symbolic number.
- **Hinduism: 8.4 million forms.** A verse often quoted from the Puranas (cited from the Padma, Vishnu or Garuda Purana) counts **8,400,000 kinds of life** (*84 lakh yonis*) through which the soul may pass: in water, as plants, insects, birds, animals and humans. The point of the teaching is that a human birth is rare and precious: it is the doorway to liberation. The Sikh scriptures and Jain texts also speak of the 8.4 million forms.
- **The Michael Teachings.** These channelled teachings describe the soul growing through **five stages of soul age** (infant, baby, young, mature and old), each with its own lessons, but they do not give an exact number of lives.
- **Buddhism.** The Jataka tales tell of the Buddha's own countless past lives. The Buddha said that the beginning of the wandering of beings cannot be found.

## Why patience is a blessing
If the journey is long, there is no need to panic about one mistake or one hard life. And if every life counts, there is no excuse to waste this one. **Be patient with yourself, and serious about love.**${bridge([
      ["When a Soul Quits: No Soul Is Lost", "/teachings/when-a-soul-quits", "what happens to souls who leave Earth school."],
      ["The Ascended Masters", "/teachings/ascended-masters", "souls who completed the journey."],
      ["Earth School", "/teachings/earth-school", "why Earth is the hardest school."],
    ])}

## Sources

- Barbara Y. Martin and Dimitri Moraitis, *Karma and Reincarnation*; Spiritual Arts Institute, ["800 Lives to Enlightenment"](https://www.spiritualarts.org/800-lives-to-enlightenment).
- *The Mahatma Letters to A. P. Sinnett*, [Letter 14](https://theosociety.org/pasadena/mahatma/ml-14.htm); G. de Purucker, ["Studies in The Mahatma Letters"](https://theosociety.org/pasadena/forum/f21n01p18_transactions-of-the-headquarters-lodge-xxvi.htm), *The Theosophical Forum*, January 1943.
- The *Padma Purana* verse on the 8.4 million forms of life (*jalaja nava-lakshani*); the Michael Teachings (Chelsea Quinn Yarbro, *Messages from Michael*, 1979); the *Jataka* tales.` },

  { slug: "when-a-soul-quits", tag: "The Soul's Journey · 6", title: "When a Soul Quits: No Soul Is Ever Lost",
    summary: "Earth is the hardest school in creation. Some souls stop coming here. The teaching of this path is that they keep learning elsewhere, and that no soul is ever lost. What the traditions teach about God's mercy that never gives up on anyone.",
    body: `{{soul-door}}

${lesson(6)}

*A word of care first: this page is about souls between lives and the great journey of the soul. It is not about ending one's life. If you are struggling or thinking of harming yourself, please reach out now: in the United States you can call or text **988**, and elsewhere your local emergency number or crisis line. You are not alone.*

${path}

**Earth is the toughest school in creation, and the best.** Here love must be chosen in the middle of pain, fear, the body and forgetting, and that is why the lessons learned here are so precious. Not every soul stays in this school. Some souls, after many lives, **stop returning to Earth**: the lessons here are too hard for them for now. They are not punished and they are not abandoned. **They keep learning in other worlds and other schools,** at a gentler pace, and one day they will reach the same Source. **No soul is ever lost.** God does not give up on anyone, and love and healing reach every soul.

This life is precious, and its lessons are best learned here, with the help of those who love us. Leaving early is never an easier or more peaceful path. Every day lived here with love is a treasure for the soul.

## God's mercy that never gives up
- **The lost sheep.** "What man of you, having an hundred sheep, if he lose one of them, doth not leave the ninety and nine in the wilderness, and go after that which is lost, until he find it?" (Luke 15:4). And: the Lord is "not willing that any should perish" (2 Peter 3:9).
- **The restoration of all things.** Some early Christian teachers, such as Origen and Gregory of Nyssa, hoped for the *apokatastasis*, the final restoration of all souls to God (see Acts 3:21, "the times of restitution of all things").
- **Mercy that embraces all.** "My mercy embraceth all things" (Qur'an 7:156, Pickthall).
- **Every soul returns (Hinduism).** In Vedanta, the Self in every being is one with Brahman; however long the wandering, liberation is the soul's true nature, waiting to be remembered.
- **Many dwellings (the Bible).** "In my Father's house are many mansions" (John 14:2). The mystics read this as many worlds and many levels where souls live and learn.
- **Return, always (Kabbalah).** The Jewish mystics teach that every spark of light that fell into the world will be raised and returned to its Source in the great repair (*tikkun*).

## Many schools
Many teachers, ancient and modern, speak of countless inhabited worlds and planes where souls live and grow. The Ascended Master and Theosophical teachings speak of other planets and systems in the soul's evolution. Some modern teachers, like Dolores Cannon, describe souls who chose to come to Earth from other worlds to help, and souls who chose other worlds when Earth was too heavy. These teachings cannot be proven, but they share one hope: **the universe is a home with many rooms, and every soul has a place in it.**

## What this means for us
- **Never write anyone off.** Not a criminal, not an enemy, not yourself. God has not.
- **Be gentle with those who struggle in this school.** Everyone here is taking the hardest class.
- **You are not behind.** Every soul learns at its own pace. What matters is the next step of love.${bridge([
      ["Losing Someone We Love", "/teachings/losing-someone-we-love", "comfort for those who grieve."],
      ["Earth School", "/teachings/earth-school", "why this world is a school."],
      ["Principles and Care", "/teachings/principles-and-care", "where to find help if you are struggling."],
    ])}

## Sources

- Luke 15:4; John 14:2; Acts 3:21; 2 Peter 3:9, King James Bible; Origen, *On First Principles*; Gregory of Nyssa, *On the Soul and the Resurrection*.
- Qur'an 7:156, Pickthall (1930).
- Dolores Cannon, *The Three Waves of Volunteers and the New Earth* (2011).` },

  { slug: "losing-someone-we-love", tag: "The Soul's Journey · 7", title: "Losing Someone We Love",
    summary: "Comfort for those who grieve: what the traditions say about where our loved ones are, how love continues across the veil, how to pray for them and remember them, and how to carry grief gently.",
    body: `{{soul-door}}

${lesson(7)}

Nothing in life hurts like losing someone we love. All the teachings in the world do not remove the empty chair at the table. **Grief is love with nowhere to go**, and it is not a failure of faith. Jesus himself stood at the tomb of his friend Lazarus, and "Jesus wept" (John 11:35).

${path}

The one you love **is not gone; they have gone home first.** They have passed through the doorway into the world of light, where they are met with love, rest and heal, and look back on the life they shared with you. The love between you is not ended by death: **love is the one thing that crosses the veil.** They can feel your love and your prayers, and they often send theirs back, in a dream, a sign, a sudden warmth, a song at the right moment. And souls who love each other meet again, in the light and in lives to come.

## What the traditions offer the grieving
- **Christianity.** "Blessed are they that mourn: for they shall be comforted" (Matthew 5:4). "God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow" (Revelation 21:4). Christians pray for the departed and believe in the communion of saints: the living and the dead united in one family of love.
- **Islam.** "Lo! we are Allah's and lo! unto Him we are returning" (Qur'an 2:156, Pickthall). Muslims pray for the dead, give charity in their name, and trust in God's mercy. The Prophet Muhammad wept when his infant son Ibrahim died, and said that the eyes shed tears and the heart grieves, but we say only what pleases our Lord (Sahih al-Bukhari 1303).
- **Judaism.** Mourners sit *shiva* for seven days, surrounded by community, and say the Kaddish, a prayer that does not mention death at all, only the greatness of God. The departed are remembered: "May their memory be a blessing."
- **Hinduism.** The *shraddha* rites honour the ancestors with food, water and prayer, and families remember them each year. The Gita reminds the grieving that the Self never dies.
- **Buddhism.** Families gather to chant, make offerings and dedicate merit to the departed, especially during the first 49 days. The Buddha taught that all that is born will pass, and that loving kindness can be sent to every being, living or gone.
- **Mexico and many peoples.** On the Day of the Dead and in many cultures' days of remembrance, families welcome the souls of the departed with flowers, candles, music and their favourite food: grief turned into a festival of love.

## If someone you love took their own life
There is no shame and no blame on you, or on them. You did not cause it, and you could not carry it for them. Many traditions today speak of God's mercy here. The Catholic Church, for example, teaches that we should not despair of the eternal salvation of those who have taken their own lives, for God can provide in ways known to Him alone (*Catechism* 2283). Please let others carry you through this grief, and seek support: in the United States you can call or text **988** for yourself too.

## Gentle ways to carry grief
- **Let it come in waves.** Grief is not a straight road. Some days are lighter, some return to the beginning. That is normal.
- **Talk to them.** Many people find comfort in speaking to their loved one, writing them a letter, or keeping a small place of remembrance.
- **Pray for them, and do good in their name.** Light a candle, give to someone in need, plant a tree. Love sent across the veil is never wasted.
- **Let others in.** Friends, family, a faith community, a grief group or a counsellor. You were not made to carry this alone.
- **Be patient.** There is no deadline for grief. Love does not have one either.${bridge([
      ["Death Is a Doorway", "/teachings/death-is-a-doorway", "where our loved ones go."],
      ["Fear, Ego and Grief", "/teachings/fear-ego-and-grief", "how the traditions answer grief."],
      ["Archangel Azrael", "/teachings/archangel-azrael", "the angel who comforts the grieving."],
      ["Prayers", "/library?tab=prayers", "short prayers for healing and peace."],
    ])}

## Sources

- Matthew 5:4; John 11:35; Revelation 21:4, King James Bible; *Catechism of the Catholic Church* 2283.
- Qur'an 2:156, Pickthall (1930); Sahih al-Bukhari 1303.
- The Jewish Kaddish and the customs of *shiva*; the Hindu *shraddha* rites; Buddhist dedication of merit; the Mexican *Día de Muertos*.` },
];
