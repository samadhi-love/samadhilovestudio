// Companion teachings (Nov 2026): six gentle pages written like a friend walking beside the reader,
// each with one clear idea and a "Carry this with you" line on the old scroll.
// Art keys start with "carry-" and are drawn by carryArt() below.

const scroll = (lines, label) => `<figure class="about-scroll judge-scroll carry-scroll" aria-label="${label}"><img class="as-roll" src="/images/about-scroll-top.png" width="800" height="133" alt="" aria-hidden="true"><div class="as-unroll"><div class="as-inner"><div class="as-text as-poem">${lines.map((l) => (l ? `<p>${l}</p>` : `<p class="as-gap" aria-hidden="true"></p>`)).join("")}</div></div></div><img class="as-roll as-roll-bot" src="/images/about-scroll-bot.png" width="800" height="132" alt="" aria-hidden="true"></figure>`;

const practice = (eyebrow, main, steps) => `<aside class="judge-practice gk-frame"><p class="eyebrow">${eyebrow}</p><p class="jp-main">${main}</p><ul>${steps.map((s) => `<li>${s}</li>`).join("")}</ul></aside>`;

const CARRY = {
  "carry-mind": ["You are not your thoughts.", "", "You are the quiet sky", "they pass across."],
  "carry-ordinary": ["The sacred is not somewhere else.", "", "It is at the kitchen table,", "in the hard conversation,", "in the work of your hands."],
  "carry-body": ["The body is not in the way.", "", "It is the way", "the soul walks home."],
  "carry-awakening": ["If it feels hard,", "you are not failing.", "", "The seed breaks open", "before it grows."],
  "carry-death": ["The wave returns to the ocean.", "", "It was always water."],
  "carry-others": ["You do not need them to see", "what you see", "", "to love them", "as they are."],
};

const PRACTICES = {
  "carry-practice-mind": practice("A practice for a loud mind", "Three breaths and a name.", [
    "<strong>Stop.</strong> Wherever you are, let your feet feel the ground.",
    "<strong>Breathe three times,</strong> a little slower than usual, letting each out-breath be longer than the in-breath.",
    "<strong>Name what is here,</strong> softly and without judgment: <em>\"worry\", \"planning\", \"old sadness\", \"nothing\".</em> Naming it gives you a little space from it.",
    "<strong>Ask kindly:</strong> <em>\"What do I need right now?\"</em> Then do the smallest kind thing you can: a glass of water, a walk, a call to a friend, a prayer.",
  ]),
  "carry-practice-body": practice("A practice for the body", "Sit, breathe, rest.", [
    "<strong>Sit</strong> on a chair or a cushion, with your back upright but not stiff, as if a thread were lifting the crown of your head.",
    "<strong>Soften</strong> your face, your jaw and your shoulders. Let your hands rest.",
    "<strong>Breathe</strong> slowly through the nose into the belly, for five minutes. If the breath wants to be short, let it; it will slow by itself.",
    "<strong>Rest</strong> for a minute afterwards, doing nothing at all. This rest is part of the practice, not a break from it.",
  ]),
};

export function carryArt(key) {
  if (CARRY[key]) return `<p class="carry-label eyebrow">Carry this with you</p>${scroll(CARRY[key], "A line to carry with you, written on an ancient scroll")}`;
  return PRACTICES[key] || "";
}

const related = (links) => `\n\n## Related teachings\n${links.map(([t, u, why]) => `- [${t}](${u})${why ? `: ${why}` : ""}`).join("\n")}`;

// A short section for the top of Where to Begin.
export const simpleBeginning = `## A simple way to begin
**You do not need to believe anything** to begin here. You do not need to understand every word, or agree with every page. Nothing here asks you to change who you are.

If you would like a simple first step, choose one of these, just for today:

- **Notice the breath.** Feel one breath come in, and one breath go out. That is all. You have just meditated.
- **Ask one honest question.** Not a clever one, an honest one: *"What am I really looking for?"* or *"What would love do here?"* Let it stay with you through the day, without forcing an answer.
- **Sit for a few minutes without fixing anything.** No goal, no improving. Just sit, and let things be as they are. It is harder than it sounds, and gentler than you think.

Any of these is a true beginning. The rest of this Library will still be here when you are ready.

`;

export const workingWithTheMind = { slug: "working-with-the-mind", tag: "Practice", title: "Working with the Mind: When Thoughts Are Loud",
  summary: "What to do when the mind will not stop, when old pain comes back, or when you feel nothing at all: practical, kind ways to be with your own mind, without fighting it.",
  body: `Almost everyone who begins to look inward meets the same surprise: **the mind is loud.** Thoughts about yesterday, worries about tomorrow, old conversations played again and again.

This is not a sign that you are doing it wrong. It is simply what minds do. The question is not how to make the mind stop, but **how to be with it kindly**.

## When thoughts are loud
You do not have to win against your thoughts. Fighting them only gives them more strength.

Try this instead: **let them be there, and stop following them.** A thought arrives; you notice it; you come back to the breath, or to a sacred word, or simply to the feeling of your hands. Then another thought arrives, and you come back again.

Each time you come back is not a failure. **The coming back is the practice.** A hundred returns in ten minutes is a hundred small victories.

*Can you notice the space between two thoughts, even for a moment? That space is also you.*

## When old pain returns
Sometimes, when we sit quietly, old pain rises: grief, shame, anger we thought we had left behind. This can feel like going backwards. Usually it is the opposite.

Pain often waits until we are quiet enough, and safe enough, to feel it. **It is coming up to be held, not to hurt you again.**

Be gentle. Put a hand on your heart. Breathe with the feeling instead of pushing it away. If it is too much, open your eyes, stand up, walk, and come back another day. You set the pace, not the pain.

And if the pain is heavy, or keeps returning, **there is no shame in asking for help**, from a friend, a teacher, a counsellor or a doctor. Seeking help is also a spiritual act.

## When you feel nothing
Some days there is no peace, no light, no feeling at all, only flatness. Many sincere people quietly decide they must be failing.

You are not. **Dryness is a real season of the inner life.** The mystics knew it well: Saint John of the Cross wrote of the "dark night", and many traditions say that the seed grows underground long before anything shows above the soil.

On flat days, keep the practice small and keep it anyway. Show up for five minutes. Say one simple prayer. **Faithfulness on the dry days is what makes the bright days possible.**

## A practice for a loud mind
{{carry-practice-mind}}

{{carry-mind}}${related([
    ["Meditation and Prayer: A Simple Daily Practice", "/teachings/meditation-and-prayer"],
    ["The Power of Silence", "/teachings/the-power-of-silence"],
    ["Fear, Ego and Grief", "/teachings/fear-ego-and-grief"],
    ["What Awakening Feels Like", "/teachings/what-awakening-feels-like", "the openings and the hard phases."],
  ])}` };

export const ordinaryLife = { slug: "the-teaching-in-ordinary-life", tag: "Daily life", title: "Ordinary Life: Where the Teaching Really Lives",
  summary: "The teaching is not only for the meditation cushion. How it shows up in family, money, anger, desire and work: the places where spiritual life is truly tested, and truly lived.",
  body: `{{life-lamp}}

It is easy to feel spiritual on a quiet mountain at sunrise. It is harder at the kitchen table, in traffic, or in a difficult meeting.

But this is exactly where the teaching lives. **Ordinary life is not a distraction from the path. It is the path.**

## Family
The people closest to us know exactly where we are still unhealed. That is why family can be the hardest teacher, and the best one.

You do not need to fix your family to grow. Begin with one thing: **listen a little longer before you answer.** Notice what old pattern rises in you, and choose, just once, to respond differently. See [Family and Children](/teachings/family-and-children).

## Money
Money is not unspiritual. It is energy, a way of exchanging care and work between people. What matters is **how we earn it, how we hold it, and what it holds over us.**

Ask gently: *Do I own my money, or does my worry about money own me?* Earn honestly, give something away, and remember that enough is a feeling as much as a number. See [Money and Right Livelihood](/teachings/money-and-right-livelihood).

## Anger
Anger is not evil. Often it is a signal that something we love has been hurt, or a boundary crossed. The trouble comes when **anger chooses our words for us.**

When anger rises, feel it in the body first: the heat, the tight jaw, the fast heart. Breathe before you speak. Then say what is true, without the wish to wound. *Strong and kind can live in the same sentence.*

## Desire
To want is human. The teaching does not ask us to stop wanting, but to **notice what we are really hungry for.**

Behind the wish for one more thing there is often a deeper longing: to be safe, to be loved, to feel whole. *What is the desire under the desire?* When we meet that one, many smaller wants grow quiet by themselves.

## Work
Whatever work you do, selling cars, cooking, teaching, cleaning, healing, it can become a practice. **Do one task today with full attention and an honest heart**, as if it were an offering.

The Bhagavad Gita calls this *karma yoga*: doing our work well, and letting go of our grip on the result. The work becomes lighter, and so do we.

*Where in your ordinary day could the sacred already be waiting for you?*

{{carry-ordinary}}${related([
    ["Family and Children", "/teachings/family-and-children"],
    ["Money and Right Livelihood", "/teachings/money-and-right-livelihood"],
    ["Love and Marriage", "/teachings/love-and-marriage"],
    ["Living with Others", "/teachings/living-with-others", "staying open when others see differently."],
  ])}` };

export const whatAwakeningFeelsLike = { slug: "what-awakening-feels-like", tag: "Daily life", title: "What Awakening Feels Like: The Openings and the Hard Phases",
  summary: "Honest notes on spiritual awakening: the beautiful openings, and the difficult phases that often come with them, so no one walking the path thinks they are failing.",
  body: `{{life-lamp}}

People often imagine awakening as one bright moment after which everything is peaceful forever. For most people, it is not like that. It comes **in waves**: openings, then quieter times, then deeper openings.

Here are some honest notes, so that whatever you are feeling, you know you are not alone, and **you are not failing.**

## The openings
- **Moments of deep peace** that come for no reason, while washing dishes or walking outside.
- **A sense of connection**: to nature, to strangers, to everything, as if the walls between you and the world grew thin.
- **Love that is bigger than you**, for people you hardly know.
- **Meaningful signs and timing**: the right book, the right words, the right person, at the right moment.
- **A quiet knowing** that you are more than your body and your story.

These are gifts. Enjoy them, give thanks for them, and **do not hold on to them.** They come and go like the weather. The sky remains.

## The hard phases
- **Old things come up.** Grief, anger or fear from long ago may surface to be healed. It can feel like going backwards. It is usually a clearing.
- **Feeling out of place.** Old interests, conversations or even friendships may stop fitting, before new ones arrive. This in-between time can feel lonely.
- **Dryness.** After an opening, practice may feel empty for a while. The mystics called this the "dark night". It is a season, not a verdict.
- **Sensitivity.** Noise, crowds or harsh words may feel stronger than before. Rest more, simplify, and spend time in nature.
- **Doubt.** *"Was it real? Am I imagining all this?"* Honest doubt is part of the path. It keeps us humble and keeps us looking.

## Staying grounded
Awakening is not about leaving ordinary life. It is about bringing more love into it. **Eat well, sleep, walk, laugh, keep your commitments, and stay close to good people.**

Be wary of anyone, including your own mind, who tells you that you are now better or more special than others. True awakening makes us **more humble and more kind**, not less.

And if anything you feel becomes frightening or overwhelming, or you cannot sleep, eat or care for yourself, please reach out to a doctor or counsellor. Caring for the body and mind is part of caring for the soul.

*What if what you are going through right now is not a mistake, but a stage of growth?*

{{carry-awakening}}${related([
    ["Working with the Mind", "/teachings/working-with-the-mind", "when thoughts are loud or you feel nothing."],
    ["Why We Suffer", "/teachings/why-we-suffer"],
    ["Fear, Ego and Grief", "/teachings/fear-ego-and-grief"],
    ["Principles and Care", "/teachings/principles-and-care"],
  ])}` };

export const livingWithOthers = { slug: "living-with-others", tag: "Daily life", title: "Living with Others: Staying Open When They See Differently",
  summary: "How to keep your heart open when family, friends or co-workers do not share your path or your beliefs: without arguing, hiding who you are, or closing yourself off.",
  body: `{{life-lamp}}

When something opens inside us, we often want to share it with everyone we love. And sometimes, **they do not see what we see.** They may be puzzled, worried, or even mocking.

This can hurt. But it can also become one of the deepest parts of the path.

## You do not need to convince anyone
Every soul walks at its own pace and by its own road. **Your task is not to bring others to your view. It is to love them where they are.**

The great teachers rarely won people over by arguing. They won hearts by how they lived: their kindness, their patience, their peace. *People may forget what you said; they remember how you made them feel.*

## Let your life speak
Instead of explaining, **let the teaching show in small things**: a calmer voice in an argument, a kinder word about someone absent, more patience with a tired child, more honesty at work.

If someone asks, share simply and briefly, without pressure. If they do not ask, you do not need to tell.

## Respect their path
Many people find God through their church, mosque, synagogue or temple, or through no religion at all. **That is their sacred road.** Honour it as you would want yours honoured. You may find that underneath different words, you are seeking the same Light.

## Protect your own light, gently
Staying open does not mean letting yourself be belittled. You can say kindly and clearly, *"This is meaningful to me, and I respect that you see it differently."* Then change the subject, or step away for a while.

If some company drains you every time, you may need to see it less, or to fill yourself up before and after with prayer, nature or a good friend. **Boundaries can be loving too.**

## Find your people
Everyone needs a few souls who understand. Look for them, through a meditation group, a study circle, or even one friend you can speak with honestly. **You were never meant to walk alone.**

*Who in your life could you simply love today, without needing them to understand you?*

{{carry-others}}${related([
    ["On Judgment: Every Face Is the Face of the One", "/teachings/on-judgment"],
    ["The Golden Rule", "/teachings/the-golden-rule"],
    ["The Power of Words", "/teachings/the-power-of-words"],
    ["Ordinary Life", "/teachings/the-teaching-in-ordinary-life", "family, money, anger, desire and work."],
  ])}` };

export const whyTheBodyMatters = { slug: "why-the-body-matters", tag: "Kriya", title: "Why the Body Matters: Breath, Posture and Rest",
  summary: "A simple explanation of why spiritual practice includes the body: what breath, posture and rest do, and why practices like Kriya Yoga exist, with no rigid rules.",
  body: `Some people think the spiritual path is about leaving the body behind. Most great traditions teach something gentler: **the body is the temple, and the way in.**

You cannot meditate without breathing, sit in prayer without a posture, or grow without rest. The body is not in the way of the soul. **It is the instrument the soul plays.**

## Breath
The breath is the bridge between body and mind. When we are afraid, the breath becomes short and high. When we are at peace, it becomes slow and deep. **It works the other way too:** slow the breath, and the mind begins to settle.

In many languages, breath and spirit are one word: *prana* in Sanskrit, *ruach* in Hebrew, *ruh* in Arabic, *pneuma* in Greek. The ancients knew that **every breath carries life from the Source.**

## Posture
An upright, relaxed posture helps us stay awake and alert without strain. It does not need to be a perfect lotus. A chair is fine. Lying down is fine if you are ill or tired.

The point is simple: **a straight, easy spine lets the energy flow and the mind stay clear**, the way a straight stem lets water reach the flower.

## Rest
Rest is not laziness. A body that is exhausted cannot hold a peaceful mind. **Sleep, quiet and time in nature are part of the practice**, not a break from it.

If you are always tired, the most spiritual thing you can do this week may be to go to bed earlier.

## Why practices like Kriya exist
Kriya Yoga, as taught by Lahiri Mahasaya and Paramahansa Yogananda, works with the breath and the life-force along the spine, so that the mind becomes still and the attention can turn inward toward God. The idea is simple: **when the energy of the body is calmed and gathered, the soul can be felt more easily.**

Kriya is traditionally learned from a qualified teacher, step by step, and that is wise: breath practices are powerful, and a good teacher helps you go at the right pace. You do not need any special technique to begin, though. **Breathing slowly, sitting upright and resting well are already the first steps.**

## No rigid rules
Your body is unique. Some days it wants to move; some days it wants to be still. **Listen to it with kindness.** If a practice causes pain, dizziness or strain, stop, and ask a teacher or a doctor.

*How is your breath right now? What would it feel like to let it be a little slower?*

## A practice for the body
{{carry-practice-body}}

{{carry-body}}${related([
    ["Kriya Yoga", "/teachings/kriya-yoga"],
    ["The Breath of Peace", "/teachings/breath-of-peace"],
    ["The Seven Chakras", "/teachings/the-seven-chakras"],
    ["Patanjali", "/teachings/patanjali", "the eight limbs of yoga."],
  ])}` };

export const deathAndContinuity = { slug: "death-and-continuity", tag: "The Soul's Journey", title: "Death and Continuity: Why the Fear of Ending Softens",
  summary: "A calm reflection on death and awareness: what continues, why the fear of ending grows softer when separation is seen through, and how to live more fully because of it.",
  body: `{{soul-door}}

Almost everyone fears death, or at least avoids thinking about it. That is natural. **To fear ending is to love being alive.**

But the great traditions offer another way of seeing, one that does not ask us to be brave or to pretend. It asks us simply to **look more closely at what we really are.**

## What we are afraid of losing
When we fear death, we usually fear losing *this*: this body, this name, these people, this story. And these do change. Everything that is born, changes.

But notice: you have already lost the body you had as a child, the thoughts you had ten years ago, the person you were before your greatest loss. **Something in you remained through all of it**: the quiet awareness that has watched every chapter of your life.

*Has that awareness ever had a beginning that you can find?*

## The wave and the ocean
Many teachers use the image of a wave. A wave rises, has its own shape for a while, and then returns to the sea. Seen as a wave, it ends. **Seen as water, nothing is lost.** It was always the ocean, moving for a while in the shape of a wave.

The teaching of this path is that we are like this. The personality is the wave; the soul, and the Light it comes from, is the ocean. Death is the wave returning home.

## Why the fear softens
The fear of death is, at its root, **the fear of being separate and then disappearing.** As we come to feel, in prayer, meditation and love, that we were never truly separate from God or from one another, the fear has less to hold on to.

It does not usually vanish all at once. It softens, the way ice softens in the sun. Many people who have come close to death say they came back with **far less fear and far more love.**

## Living because of it
Remembering death is not meant to make us sad. It makes life precious. **Say the kind word now. Forgive now. Love now.** Each day is a gift that will not come again in the same form.

And for those we have lost: the bond of love is not broken. The wave that returned to the ocean is still part of the same water we are.

*If you knew, deeply, that you could not be lost, how would you live today?*

{{carry-death}}${related([
    ["Death Is a Doorway", "/teachings/death-is-a-doorway", "what happens when we die, in the teaching of this path."],
    ["Near-Death Experiences", "/teachings/near-death-experiences"],
    ["Losing Someone We Love", "/teachings/losing-someone-we-love"],
    ["Non-Duality and Ramana Maharshi", "/teachings/non-duality-and-ramana-maharshi", "the self that does not die."],
  ])}` };
