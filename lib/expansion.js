// The Great Expansion (Nov 2026): new teachings approved by Samadhi, added in phases.
// Each tradition in its own words; history and legend told apart; facts checked before publishing.

const sources = (lines) => `\n\n## Sources\n${lines.map((l) => `- ${l}`).join("\n")}`;
const related = (links) => `\n\n## Related teachings\n${links.map(([t, u, why]) => `- [${t}](${u})${why ? `: ${why}` : ""}`).join("\n")}`;

// ---------- Phase 1 ----------
export const fortyTwo = { slug: "forty-two-the-answer-and-the-question", tag: "Sacred Number", title: "42: The Answer, and the Question",
  summary: "A famous joke says the answer to life, the universe and everything is 42. The joke hides a real teaching about questions, and 42 turns out to be a sacred number in Egypt, the Kabbalah and the Bible.",
  body: `## The famous joke
In Douglas Adams' comic science-fiction story *The Hitchhiker's Guide to the Galaxy* (first a radio play in 1978, then a book in 1979), a vast computer called **Deep Thought** is asked for the answer to the great question of life, the universe and everything. After seven and a half million years of thinking, it gives its answer: **42.**

Everyone is disappointed. The computer explains, calmly, that the answer is correct. The trouble is that **nobody ever really knew what the question was.**

Adams later said he chose 42 simply because it was an ordinary, unremarkable number, and that was the joke. Millions of readers have smiled at it ever since.

## The teaching hidden in the joke
Without meaning to, the joke points to something the mystics have always said: **we rush to find answers before we know our real question.**

We ask, "How do I become rich?" when our real question is, "How do I feel safe?" We ask, "Why did this happen to me?" when our real question is, "Am I still loved?" An answer to the wrong question, however true, will never satisfy the heart.

The spiritual path is often less about finding answers than about **finding the true question**, and living with it patiently. As the poet Rilke advised a young friend, we can learn to love the questions themselves.

*What is the real question underneath the questions you are asking right now?*

## 42 in the sacred traditions
Surprisingly, 42 is not an ordinary number in the old traditions at all.

- **In ancient Egypt**, the *Book of the Dead* describes the soul entering the Hall of the Two Truths, where it stands before **42 divine judges** and speaks **42 declarations of innocence**: "I have not stolen", "I have not lied", "I have not caused anyone to weep". Then its heart is weighed against the feather of **Ma'at**, truth and harmony. See [Ma'at](/teachings/maat-wisdom-of-egypt).
- **In the Kabbalah**, there is a hidden **42-letter Name of God**, mentioned in the Talmud as a Name entrusted only to the humble and the pure-hearted. It is woven into the prayer *Ana BeKoach*, whose 42 words begin with its letters, and some medieval commentators said it is drawn from the first 42 letters of the Torah's story of creation.
- **In the Torah**, the Israelites made **42 journeys** through the desert from Egypt to the Promised Land, each one listed by name (Numbers 33). The Hasidic masters taught that these 42 stations are the stages of every human life, from birth to our final homecoming.
- **In the Gospel of Matthew**, the family line of Jesus is counted as three times fourteen generations from Abraham: **42 generations** (Matthew 1:17).

## And in numerology
In the numerology of this site, 42 becomes 4 + 2 = **6**: the number of **love and care**, home, healing and responsibility. Perhaps that is the answer after all: the ultimate answer to life, the universe and everything is love. See [Numerology](/teachings/numerology-the-meaning-of-numbers).

*The answer was never the hard part. The question is the door.*${related([
    ["Questions to Sit With", "/teachings/questions-to-sit-with", "living with the real questions."],
    ["Questions People Ask", "/teachings/questions-people-ask"],
    ["Ma'at", "/teachings/maat-wisdom-of-egypt", "the 42 declarations and the weighing of the heart."],
  ])}${sources([
    "Douglas Adams, *The Hitchhiker's Guide to the Galaxy* (BBC radio, 1978; book, 1979). Mentioned briefly; no text reproduced.",
    "The *Book of the Dead*, Spell 125 (the declarations of innocence before the 42 judges).",
    "Babylonian Talmud, Kiddushin 71a, on the 42-letter Name; Tosafot on Chagigah 11b; the prayer *Ana BeKoach*.",
    "Numbers 33; Matthew 1:17, King James Bible.",
    "Rainer Maria Rilke, *Letters to a Young Poet*, letter 4 (1903).",
  ])}` };
