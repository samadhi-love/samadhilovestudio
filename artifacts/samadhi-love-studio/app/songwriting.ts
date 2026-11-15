const themes = [
  {
    match: /danc|joy|festival|celebrat|rhythm/i,
    verses: ["One hand rises and another follows", "Footsteps find a rhythm on the stone", "Leave a little room inside the circle", "Every voice can bring a rhythm of its own"],
    hook: ["Here we move together", "Here the joy comes through", "Every heart can find the rhythm", "I can hear it next to you"],
  },
  {
    match: /awaken|wisdom|truth|God|prayer|spirit|rememb|mantra/i,
    verses: ["I put my questions down beside the water", "And listened while the morning came alive", "The truth was in the kindness of a neighbor", "Who held the gate and took a slower stride"],
    hook: ["Here in this breath I remember", "Here in this heart I can see", "Love is a promise I practice", "Love is a place we can be"],
  },
  {
    match: /kiss|romanc|heart|love|affect/i,
    verses: ["You saved me a seat beside the window", "We watched the rain make silver in the street", "You smiled before I finished what I started", "And all the noise fell quiet underneath"],
    hook: ["Meet me where the light lands", "Stay for one more song", "If the evening gives us one dance", "Let the moment linger on"],
  },
  {
    match: /./,
    verses: ["I took the long way through the open meadow", "The wind was turning every leaf around", "A little seed can travel with the weather", "And find a place to grow in softer ground"],
    hook: ["Carry a little light with you", "Give it room and let it grow", "What you share can reach a stranger", "Farther than you'll ever know"],
  },
];

export function arrangement(minutes: "3" | "4", duet: boolean) {
  const map = minutes === "4" ? [
    "[Intro · 0:00–0:18]", "[Verse 1 · 0:18–0:51]", "[Pre-Chorus · 0:51–1:05]", "[Chorus · 1:05–1:32]",
    "[Verse 2 · 1:32–2:04]", "[Chorus · 2:04–2:31]", "[Bridge / Instrumental · 2:31–3:13]", "[Final Chorus · 3:13–3:49]", "[Outro · 3:49–4:00]",
  ] : [
    "[Intro · 0:00–0:12]", "[Verse 1 · 0:12–0:39]", "[Pre-Chorus · 0:39–0:52]", "[Chorus · 0:52–1:18]",
    "[Verse 2 · 1:18–1:44]", "[Bridge · 1:44–2:12]", "[Final Chorus · 2:12–2:51]", "[Outro · 2:51–3:00]",
  ];
  return map.map(label => duet
    ? label.replace("]", (label.includes("Verse 1") ? " · Male" : label.includes("Verse 2") ? " · Female" : label.includes("Chorus") ? " · Both" : "") + "]")
    : label).join("\n\n");
}

export function songwritingStarter(idea: string, minutes: "3" | "4", duet: boolean) {
  const { verses, hook } = themes.find(theme => theme.match.test(idea)) ?? themes[themes.length - 1];
  const refrain = hook.join("\n");
  const intro = ["From the silence comes the light", "This is Samadhi"].join("\n");
  const bridge = "I can make room for a new beginning\nYou can bring the hope you carry, too\nWe can make a promise with our footsteps\nAnd make a place for something true";
  const first = verses.slice(0, 2).join("\n") + "\nThe day is wide enough for a beginning\nI leave an open place beside me now";
  const second = verses.slice(2).join("\n") + "\nThe things we give away can keep on growing\nLike roots that find each other in the ground";
  const parts = [intro, first, "Take a breath and hear the moment\nLet the next step lead you through", refrain, second,
    ...(minutes === "4" ? [refrain] : []), bridge, refrain, hook[0]];
  return arrangement(minutes, duet).split("\n\n").map((label, index) => label + "\n" + parts[index]).join("\n\n");
}
