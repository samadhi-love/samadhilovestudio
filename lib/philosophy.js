// Philosophy: the opening pages of the Philosophers tab (what philosophy is, its branches,
// who a philosopher is, and philosophy as medicine for the soul).
// Quotations from public-domain translations: Jowett's Plato, Yonge's Cicero, Long's Epictetus and Marcus,
// Legge's Confucius and Laozi, Arnold's Gita, the King James Bible. Checked Nov 2026.
// Emblems are drawn in code for SAMADHI LOVE.

const GOLD = "#f2c46d", PALE = "#fff3c4", LAV = "#c9b8ff", TEAL = "#9fe7dc";

function owl() {
  return `<figure class="cross-hero philo-figure"><svg viewBox="0 0 720 360" role="img" aria-labelledby="po-t" xmlns="http://www.w3.org/2000/svg"><title id="po-t">The owl of wisdom, drawn in gold lines, before a crescent moon and stars</title>
<defs><radialGradient id="po-sky" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#473b23"/><stop offset="1" stop-color="#0d0b08"/></radialGradient><radialGradient id="po-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${PALE}" stop-opacity=".35"/><stop offset="1" stop-color="${PALE}" stop-opacity="0"/></radialGradient></defs>
<rect width="720" height="360" rx="18" fill="url(#po-sky)"/>
${[[90, 60], [150, 120], [600, 70], [640, 180], [520, 40], [210, 40], [110, 260], [610, 290], [470, 300], [250, 300]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".7"/>`).join("")}
<path d="M560 70 a52 52 0 1 0 38 88 a42 42 0 1 1 -38 -88 z" fill="${PALE}" opacity=".85"/>
<circle cx="360" cy="185" r="150" fill="url(#po-glow)"/>
<g fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
<path d="M300 110 L318 80 L340 104 Q360 98 380 104 L402 80 L420 110"/>
<path d="M300 110 Q284 170 300 232 Q322 300 360 312 Q398 300 420 232 Q436 170 420 110"/>
<circle cx="333" cy="140" r="26"/><circle cx="387" cy="140" r="26"/>
<circle cx="333" cy="140" r="9" fill="${GOLD}"/><circle cx="387" cy="140" r="9" fill="${GOLD}"/>
<path d="M352 160 L360 176 L368 160"/>
<path d="M322 198 Q360 214 398 198"/><path d="M326 222 Q360 238 394 222"/><path d="M332 246 Q360 260 388 246"/>
<path d="M300 232 Q268 220 262 186"/><path d="M420 232 Q452 220 458 186"/>
<path d="M336 312 L332 326 M346 314 L346 328 M374 314 L374 328 M384 312 L388 326"/>
<path d="M250 330 L470 330" stroke="${LAV}" stroke-width="2.4"/>
</g>
<text x="360" y="352" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#d9cfee" letter-spacing="3">ΦΙΛΟΣΟΦΙΑ · LOVE OF WISDOM</text>
</svg><figcaption class="fine">The owl, companion of Athena, goddess of wisdom: for the Greeks a sign of the one who sees in the dark. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

const icon = (paths) => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" class="philo-icon"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
const branchCards = [
  ["Metaphysics", "What is reality?", "Existence, consciousness, time, the soul, free will and the nature of the universe.",
    icon(`<circle cx="24" cy="24" r="18"/><path d="M8 24 Q24 10 40 24 Q24 38 8 24 Z"/><circle cx="24" cy="24" r="5" fill="currentColor"/>`)],
  ["Epistemology", "How do we know?", "Truth, perception, reason, intuition, and the limits of what we can know.",
    icon(`<path d="M18 38 h12 M19 34 h10 M24 6 a12 12 0 0 1 7 21.5 V32 H17 V27.5 A12 12 0 0 1 24 6 z"/><path d="M24 14 v8"/>`)],
  ["Ethics", "How should we live?", "Virtue, integrity, compassion, justice and responsibility for our actions.",
    icon(`<path d="M24 6 V42 M14 42 h20 M8 14 h32"/><path d="M8 14 L3 26 h10 Z M40 14 L35 26 h10 Z"/>`)],
  ["Logic", "What is sound reasoning?", "Clear thinking, good arguments, and spotting the tricks that lead us astray.",
    icon(`<circle cx="10" cy="12" r="4"/><circle cx="38" cy="12" r="4"/><circle cx="24" cy="38" r="4"/><path d="M14 12 h20 M12 15 L22 35 M36 15 L26 35"/>`)],
  ["Aesthetics", "What is beauty?", "Harmony, music, art and creative expression, and why beauty moves the soul.",
    icon(`<path d="M14 8 Q8 24 14 40 h20 Q40 24 34 8"/><path d="M14 8 h20 M19 12 V38 M24 12 V38 M29 12 V38"/>`)],
  ["Social philosophy", "How should we live together?", "Community, fairness, freedom, friendship and the dignity of every person.",
    icon(`<circle cx="24" cy="10" r="4"/><circle cx="10" cy="32" r="4"/><circle cx="38" cy="32" r="4"/><path d="M24 14 V22 M24 22 L12 29 M24 22 L36 29"/><circle cx="24" cy="24" r="21"/>`)],
];
function branchesGrid() {
  return `<div class="philo-grid" role="list">${branchCards.map(([name, q, text, ic]) => `<div class="philo-card" role="listitem">${ic}<h3>${name}</h3><p class="philo-q">${q}</p><p>${text}</p></div>`).join("")}</div>`;
}

// Samadhi's own picture: an owl on an ancient column beside an olive branch, a Greek temple behind.
function owlPhoto() {
  return `<figure class="cross-hero sl-photo"><div class="sl-photo-frame"><img src="/images/athena-owl.jpg" width="1600" height="900" alt="An owl with golden eyes perched on the top of an ancient stone column, beside an olive branch, with the columns of a Greek temple behind" loading="lazy" decoding="async"></div><figcaption class="fine">The owl, companion of Athena, goddess of wisdom: for the Greeks a sign of the one who sees in the dark. Picture shared by Samadhi.</figcaption></figure>`;
}

export function philosophyArt(key) {
  return { "philo-owl": owlPhoto, "philo-branches": branchesGrid }[key]?.() || "";
}

export const philosophyPages = [
  { slug: "what-is-philosophy", tag: "Start here", title: "What Is Philosophy? The Love of Wisdom",
    summary: "From the Greek philosophia, love of wisdom: the open-hearted search for the deepest truths of life, in every land and every age, and how it joins knowledge and the spirit.",
    body: `{{philo-owl}}

**Philosophy** comes from the Greek *philosophia*: *philo*, "love", and *sophia*, "wisdom". It is the **love of wisdom**: the honest, open-minded search for the deepest truths of life. What is real? Who am I? How do we know what is true? How should I live? What is beauty? Why are we here?

## The first philosopher
The story is told by Cicero. When a prince asked **Pythagoras** what art he practised, Pythagoras answered that he had no art: he was a *philosopher*, a lover of wisdom. Life, he said, is like the great festival of the Olympic Games. Some come to win the crowns, some come to buy and sell, and the best come simply **to see**: to watch and understand. So in life, some seek glory, some seek money, and a few seek wisdom. Those few are the philosophers (Cicero, *Tusculan Disputations* 5.3).

## It begins in wonder
"Wonder is the feeling of a philosopher, and philosophy begins in wonder," says Socrates in Plato's *Theaetetus* (155d, Jowett translation). Aristotle agreed: it is because of wonder that people first began to philosophise (*Metaphysics* 1.2). Every child who asks "why?" again and again is standing at the door of philosophy.

## A search found in every land
- **Greece:** Pythagoras, Socrates, Plato, Aristotle, the Stoics, Plotinus.
- **India:** the Upanishads, the Buddha, the Bhagavad Gita, and the six schools of Indian philosophy. In Sanskrit a school of philosophy is a *darshana*, "a way of seeing".
- **China:** Confucius, Laozi, Mencius and Zhuangzi.
- **Egypt:** the *Instruction of Ptahhotep*, among the oldest wisdom books in the world, teaches truth, humility and justice.
- **The Islamic world:** *falsafa* and *hikma* (wisdom), from al-Kindi, Avicenna and Averroes to Rumi and Ibn Arabi.
- **The Jewish tradition:** Philo of Alexandria and Maimonides, who joined faith and reason.
- **Africa:** the spirit of *ubuntu*, summed up as "I am because we are".
- **The modern world:** Descartes, Spinoza, Kant, Kierkegaard, William James, Simone Weil and many more, still asking the same questions.

## Between knowledge and the spirit
Philosophy stands in the middle of the road. **Science** asks *how* the world works. **Spirituality** seeks *what is sacred*. **Philosophy** asks *why it matters*, and *what we are really assuming*. It examines our beliefs, so that what we hold is truly ours; it clears away confusion, so that we can see; and at its best it leads the seeker from knowledge to wisdom, and from wisdom to love.

## Samadhi's view
*This is Samadhi's own understanding.*

Philosophy is the soul asking to remember who it is. The great philosophers were not only thinkers; many of them were seekers of God, and their questions were prayers. Wisdom without love is cold, and love without wisdom loses its way. The true philosopher holds both.

*Read next: [The Six Branches of Philosophy](/teachings/the-six-branches-of-philosophy) · [Who Is a Philosopher? Every Seeker Can Be](/teachings/who-is-a-philosopher) · [Philosophy as Medicine for the Soul](/teachings/philosophy-as-medicine-for-the-soul).*

## Sources

- Cicero, *Tusculan Disputations* 5.3.8–9, translated by C. D. Yonge, [Standard Ebooks](https://standardebooks.org/ebooks/cicero/tusculan-disputations/c-d-yonge/text/chapter-5); Diogenes Laertius, *Lives of the Eminent Philosophers* 8.8.
- Plato, [*Theaetetus*](https://classics.mit.edu/Plato/theatu.html) 155d (Jowett translation); Aristotle, [*Metaphysics*](https://classics.mit.edu/Aristotle/metaphysics.1.i.html) 1.2.
- *The Instruction of Ptahhotep*; John Mbiti, *African Religions and Philosophy* (1969), on *ubuntu*.
- [Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/).` },

  { slug: "the-six-branches-of-philosophy", tag: "The branches", title: "The Six Branches of Philosophy",
    summary: "Metaphysics, epistemology, ethics, logic, aesthetics and social philosophy: the six great questions, with what the sages of East and West have said about each.",
    body: `Philosophy has many rooms, but six great doors. Each one opens on a question that every human being meets sooner or later.

{{philo-branches}}

## 1. Metaphysics: what is reality?
Metaphysics asks what truly exists. Is the world only matter, or is there spirit behind it? What is time? What is the soul? Are we free?
- **Parmenides** taught that true Being is one, unchanging and eternal.
- **Plato** taught that the things we see are shadows of eternal Forms. See [Plato's Allegory of the Cave](/teachings/allegory-of-the-cave).
- **The Upanishads** teach that the deepest Self, *Atman*, is one with *Brahman*, the Absolute: "Tat tvam asi", you are That.
- **Descartes** began from the one thing he could not doubt: "I think, therefore I am" (1637).
- **Free will:** in the Gita, Krishna lays out all his teaching and then tells Arjuna to reflect on it and act as he chooses (18:63).

## 2. Epistemology: how do we know?
Epistemology asks what knowledge is and how we can be sure. Can we trust our senses? Our reason? Our intuition?
- **Socrates:** true wisdom begins by knowing that we do not know.
- **Plato** asked whether knowledge is "true opinion with an account" (*Theaetetus* 201d).
- **India's Nyaya school** named the valid ways of knowing (*pramanas*): perception, inference, comparison and the word of a trustworthy person.
- **The mystics** of every tradition add a further way: direct knowing, in the stillness of the heart.

## 3. Ethics: how should we live?
Ethics asks what is good, what is right, and what kind of person to become.
- **Aristotle:** happiness is a life of virtue, found in the balanced middle. See [Aristotle](/teachings/aristotle).
- **Confucius** taught *ren*, humane goodness, and the rule: "What you do not want done to yourself, do not do to others" (*Analects* 15.23, Legge).
- **The Buddha** taught the Eightfold Path. See [The Buddha's Way](/teachings/the-buddhas-way).
- **Kant** taught that we should act only in the way we could wish everyone to act, and treat every person as an end, never only as a means.
- See also [The Golden Rule: One Law in Every Faith](/teachings/the-golden-rule).

## 4. Logic: what is sound reasoning?
Logic is the art of thinking clearly. **Aristotle** set out the first full system of reasoning, the syllogism: *all humans are mortal; Socrates is human; so Socrates is mortal*. In India, the Nyaya philosophers built their own careful method of proof. Logic also teaches us to spot common traps:
- **Attacking the person** instead of the argument.
- **The straw man:** arguing against a weaker version of what someone said.
- **The false choice:** pretending there are only two options when there are more.
- **Following the crowd:** believing something only because many people do.
- **Circular reasoning:** assuming what we set out to prove.

Clear thinking protects the seeker, too: it is the first step of discernment.

## 5. Aesthetics: what is beauty?
Aesthetics asks what beauty is, and why art, music and nature move the soul.
- **Pythagoras** found harmony in number and music. See [Pythagoras and the Music of Numbers](/teachings/pythagoras-music-of-numbers).
- **Plato**, in the *Symposium* (210a–212a), describes a ladder of love: from one beautiful body, to all beauty, to beautiful souls, to beautiful knowledge, and at last to Beauty itself, eternal and divine.
- **India's *rasa* theory**, from the *Natyashastra*, teaches that art awakens a pure taste of feeling in the heart of the one who receives it.
- **Keats** wrote: "Beauty is truth, truth beauty" (*Ode on a Grecian Urn*, 1819).

## 6. Social philosophy: how should we live together?
Social philosophy asks how people can live together in fairness, friendship and dignity.
- **Aristotle** called the human being by nature a social creature, made to live in community (*Politics* 1.2).
- **Confucius** taught that good order begins with virtue in the family and the heart.
- **Mencius** taught that the people matter most. See [Confucius and Mencius](/teachings/confucius-and-mencius).
- ***Ubuntu*** teaches that a person is a person through other people.

These are questions of the heart, not of party: this site does not take sides in the politics of any country.

## Sources

- Plato, [*Theaetetus*](https://classics.mit.edu/Plato/theatu.html) 201d and *Symposium* 210a–212a (Jowett translation).
- Aristotle, *Prior Analytics* and *Politics* 1.2; René Descartes, *Discourse on the Method* (1637); Immanuel Kant, *Groundwork of the Metaphysics of Morals* (1785).
- *Chandogya Upanishad* 6.8.7; Bhagavad Gita 18:63; *Analects* 15.23, Legge translation, [Chinese Text Project](https://ctext.org/analects/wei-ling-gong).
- Bharata, *Natyashastra*; John Keats, *Ode on a Grecian Urn* (1819).
- [Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/).` },

  { slug: "who-is-a-philosopher", tag: "Every seeker", title: "Who Is a Philosopher? Every Seeker Can Be",
    summary: "Not only the great names of the past: a philosopher is anyone who loves wisdom, questions honestly, and tries to live what they learn. A stonemason's son, a slave, a weaver, a shoemaker, and you.",
    body: `When people hear the word "philosopher", they often picture a bearded man in ancient Greece, or a professor surrounded by thick books. Those are philosophers. But they are not the only ones, and the word was never meant to belong only to them.

## The great philosophers of history
Across the centuries, certain thinkers built lasting ways of understanding life, and their names are still honoured:
- **The West:** Socrates, Plato, Aristotle, Epictetus, Marcus Aurelius, Plotinus, Augustine, Thomas Aquinas, Spinoza, Kant.
- **The East:** Laozi, Confucius, Mencius, Zhuangzi, the Buddha, Nagarjuna, Adi Shankara, Patanjali.
- **The Islamic and Jewish worlds:** al-Kindi, Avicenna, Averroes, Rumi, Ibn Arabi, Maimonides.
- **Modern times:** Kierkegaard, William James, Carl Jung, Simone Weil and many more.

Many of them have their own pages in this tab.

## But look at who they really were
The great philosophers were often ordinary people with extraordinary questions:
- **Socrates** was the son of a stonemason and a midwife. He wrote no books, held no office, and owned almost nothing. He simply asked questions in the marketplace.
- **Epictetus** was born a slave. One of the most loved teachers of the ancient world learned his wisdom in chains.
- **Diogenes** lived in a large clay jar and owned a cup until he saw a child drink from cupped hands, and threw the cup away.
- **Kabir** was a weaver who sang his wisdom at his loom.
- **Jakob Böhme** (1575–1624) was a shoemaker in Germany whose visions shaped mystics and philosophers for centuries.
- **Spinoza** earned his living grinding lenses.
- **Marcus Aurelius** was an emperor, and still wrote his philosophy as private notes to himself in army tents.

Wisdom did not ask any of them for a degree.

## Who is a philosopher today?
**Anyone who loves wisdom.** You do not need a university degree, a title, or published books. You are practising philosophy, in its truest and oldest sense, whenever you:
- pause and question the habits you have been living on autopilot;
- seek the truth, even when a comfortable belief would be easier;
- reflect deeply on life, death, love and meaning;
- test your own beliefs honestly, and change your mind when you see more clearly;
- try to live by what you have understood.

A grandmother who has learned patience through hard years, a worker who thinks deeply on the way home, a young person asking "why are we here?", a seeker reading these pages: all of them are philosophers. **Every age has had its philosophers, and this age has them too. You may be one of them.**

## The marks of a philosopher
- **Curiosity over certainty.** Asking *why*, instead of accepting "that's just how it is".
- **Honesty with yourself.** Being willing to say "I was wrong" and grow.
- **Self-reflection.** Looking at your own motives, habits and inner life. "Know thyself," said the temple at Delphi.
- **Living your principles.** Turning insight into character, day by day, not only into talk.
- **Humility.** Socrates said his only wisdom was knowing that he did not know.
- **Love.** The word itself begins with love: *philo*. A philosopher loves wisdom, and wisdom teaches love.

## Samadhi's view
*This is Samadhi's own understanding.*

Philosophers did not only live in the past. Every seeker is a philosopher: every soul that stops, looks within and asks the great questions with a sincere heart. The masters, the mystics and the sages were seekers first. The same light that moved through them moves through anyone who truly searches. Do not wait to be called a philosopher. Begin to love wisdom today, and live it.

## Try this today
Take one belief you hold strongly. Ask yourself, gently: *Why do I believe this? Where did it come from? Does it make me more loving, more honest and more free?* Whatever the answer, you have just practised philosophy.

## Sources

- Plato, [*Apology*](https://classics.mit.edu/Plato/apology.html) 21d and 38a, and *Theaetetus* 149a (Socrates' mother the midwife); Diogenes Laertius, *Lives* 2.18 and 6.37.
- Epictetus, *Discourses*; Marcus Aurelius, [*Meditations*](https://classics.mit.edu/Antoninus/meditations.html).
- *Songs of Kabir*, translated by Rabindranath Tagore (1915); Jakob Böhme, *Aurora* (1612).
- [Stanford Encyclopedia of Philosophy: Spinoza](https://plato.stanford.edu/entries/spinoza/).` },

  { slug: "philosophy-as-medicine-for-the-soul", tag: "A way of life", title: "Philosophy as Medicine for the Soul",
    summary: "The ancient schools did not treat philosophy as cold argument but as healing for the mind and heart: daily practices from the Stoics, the Epicureans, the Buddha and Vedanta that still work today.",
    body: `Many people think of philosophy as cold, dry overthinking, or as clever arguing to win. The ancient schools would not have recognised that picture. For them, philosophy was **a way of life**, and above all a **medicine for the soul**.

## What the ancients said
- **Cicero:** "Philosophy is certainly the medicine of the soul" (*Tusculan Disputations* 3.3, Yonge translation).
- **Epicurus**, in a saying preserved by Porphyry: empty is the word of a philosopher that heals no human suffering, for just as medicine is useless if it does not drive out the sicknesses of the body, so philosophy is useless if it does not drive out the suffering of the soul.
- **The Buddha** spoke like a healer: first the illness, then its cause, then its cure, then the medicine. See [The Buddha's Way](/teachings/the-buddhas-way).
- **Vedanta** teaches that ignorance of our true Self is the root of suffering, and that knowledge of the Self is liberation.
- **The historian Pierre Hadot** showed that the ancient schools taught *spiritual exercises*: daily practices to transform the whole person.

## Practices from the ancient schools
1. **The morning preparation** (Marcus Aurelius): each morning, remind yourself that you will meet difficult people today, and resolve to meet them with patience, because they are your kin (*Meditations* 2.1).
2. **What is in my power?** (Epictetus): sort every worry into what you can change and what you cannot, and give your energy only to the first (*Enchiridion* 1).
3. **The evening review** (Seneca): before sleep, look back over the day without anger. What did I do well? Where did I fall short? What will I do better? (*On Anger* 3.36).
4. **The question** (Socrates): when a strong opinion rises, ask "how do I know this is true?"
5. **The view from above** (Marcus Aurelius): picture your troubles from high above the earth, small within the great cosmos, and feel them grow lighter.
6. **Self-inquiry** (Vedanta): ask quietly "who am I?", beneath the body, the thoughts and the feelings, and rest in the awareness that remains.

## Two gentle corrections
- **Philosophy is not cold.** The Stoics, the Epicureans, the Buddhists and the sages of Vedanta all taught that the aim of philosophy is peace, freedom and a good heart.
- **Wisdom is not only for professors.** Some of the clearest insights in history came from lived experience, quiet observation and honest self-inquiry, often from people with no schooling at all. See [Who Is a Philosopher? Every Seeker Can Be](/teachings/who-is-a-philosopher).

## Samadhi's view
*This is Samadhi's own understanding.*

True philosophy heals. It is not a game of words but a path of the heart. When it is lived, wisdom becomes peace, and peace becomes love.

## Sources

- Cicero, *Tusculan Disputations* 3.3, translated by C. D. Yonge, [Standard Ebooks](https://standardebooks.org/ebooks/cicero/tusculan-disputations/c-d-yonge/text/chapter-3).
- Porphyry, *Letter to Marcella* 31 (Epicurus, fragment 221 Usener).
- Marcus Aurelius, [*Meditations*](https://classics.mit.edu/Antoninus/meditations.html) 2.1; Epictetus, [*Enchiridion*](https://classics.mit.edu/Epictetus/epicench.html) 1; Seneca, *On Anger* 3.36.
- Pierre Hadot, *Philosophy as a Way of Life* (1995).` },
];
