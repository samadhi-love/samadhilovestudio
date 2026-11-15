/** Shared by the picker and project validator; old saved layer IDs remain valid. */
export const overlayDesigns = {
  none: "None",
  rays: "Awaken · light rays",
  flame: "Violet Flame · rising light",
  unity: "Unity · connected circles",
  aurora: "Aurora Silk · flowing light",
  constellation: "Star Stories · linked stars",
  orbit: "Lunar Orbit · circling lights",
  spectrum: "Neon Skyline · rhythmic light bars",
  ribbons: "Prism Dance · color ribbons",
  bokeh: "Velvet Lights · soft floating orbs",
  mandala: "Sacred Bloom · turning petals",
  comet: "Meteor Dreams · drifting trails",
  petals: "Rose Garden · floating petals",
} as const;
export type OverlayStyle = keyof typeof overlayDesigns;
