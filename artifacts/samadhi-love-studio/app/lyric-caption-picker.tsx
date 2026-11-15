"use client";

import { useEffect, useRef, useState } from "react";
import {
  captionTemplates,
  captionTypefaces,
  getCaptionTemplate,
  loadCaptionFonts,
  type CaptionTemplateId,
} from "./lyric-caption-templates";
import { drawLyricVideo } from "./lyric-video-render";
import { videoThemes, videoSize, type LyricProject } from "./lyric-video-data";

const styleCategories = {
  "neon-pulse": "Glow",
  "sacred-script": "Elegant",
  "illuminated-verse": "Glow",
  "pop-burst": "Pop & bounce",
  "world-glyphs": "Clean & global",
  "ink-echo": "Typewriter",
  "impact-cut": "Pop & bounce",
  "silver-cinema": "Elegant",
  "quiet-space": "Clean & global",
  "outline-anthem": "Pop & bounce",
  "prism-flow": "Color & gradient",
  "clear-voice": "Clean & global",
  "bubble-daydream": "Pop & bounce",
  "vertical-garden": "Clean & global",
} as const;
const animationLabels = {
  pulse: "Word glow + pulse",
  underline: "Drawing underline",
  illuminate: "Illuminated edges",
  pop: "Spring pop-in",
  slide: "Slide + karaoke",
  typewriter: "Typewriter reveal",
  impact: "Punch + emphasis",
  shimmer: "Metallic light sweep",
  rise: "Gentle rise",
  punch: "Word punch-in",
  rainbow: "Rainbow sweep",
  subtitle: "Subtitle highlight",
  orbit: "Bounce + orbit",
  vertical: "Column reveal",
} as const;

export function CaptionTemplatePicker({
  value,
  choose,
  disabled,
  sampleText,
  legend,
}: {
  value?: CaptionTemplateId;
  choose: (id?: CaptionTemplateId) => void;
  disabled: boolean;
  sampleText?: string;
  legend?: string;
}) {
  const selected = getCaptionTemplate(value);
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState("All styles");
  const sample = Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
      sampleText?.trim() || "Love & light",
    ),
    (part) => part.segment,
  )
    .slice(0, 34)
    .join("");
  const matches = captionTemplates.filter(
    (item) =>
      (category === "All styles" || styleCategories[item.id] === category) &&
      `${item.name} ${item.description} ${item.captionStyle} ${item.animationStyle}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  return (
    <fieldset disabled={disabled} className="lyric-style-picker">
      <legend>
        {legend ?? "Lyric text styles"} · {captionTemplates.length}
      </legend>
      <p className="lyric-style-hint">
        Choose a style to apply its lettering, outline, color treatment, and
        animation to your lyrics. Play the recording to see the motion.
      </p>
      <div
        className="lyric-style-categories"
        role="group"
        aria-label="Lyric style categories"
      >
        {["All styles", ...new Set(Object.values(styleCategories))].map(
          (name) => (
            <button
              type="button"
              key={name}
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ),
        )}
      </div>
      <label className="field">
        Find a style
        <input
          type="search"
          value={filter}
          maxLength={80}
          placeholder="Try neon, pop, typewriter, handwritten…"
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      <div className="caption-template-grid" aria-label="Lyric text styles">
        {matches.map((item) => {
          const face = captionTypefaces[item.font];
          return (
            <button
              type="button"
              key={item.id}
              className="caption-template-card"
              data-animation={item.animation}
              data-joined={/[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}]/u.test(
                sample,
              )}
              aria-pressed={value === item.id}
              onClick={() => choose(item.id)}
            >
              <span
                aria-hidden="true"
                className="caption-template-sample"
                dir="auto"
                style={{
                  fontFamily: face.family,
                  fontWeight: face.weight,
                  color: item.accent,
                  textShadow:
                    "outline" in item && item.outline
                      ? "2px 2px 0 #000, -2px -2px 0 #000"
                      : `0 0 15px ${item.accent}66`,
                  fontStyle: "italic" in face ? "italic" : "normal",
                }}
              >
                <b
                  style={{
                    fontWeight: "inherit",
                    ...("fill" in item
                      ? {
                          backgroundImage:
                            item.fill === "metallic"
                              ? "linear-gradient(120deg,#b4c5df,#fff,#8eabc5,#fff)"
                              : "linear-gradient(90deg,#ffb0e5,#afc3ff,#a6ffdf,#ffe2a2)",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          color: "transparent",
                          textShadow: "none",
                        }
                      : {}),
                  }}
                >
                  {sample}
                </b>
              </span>
              <strong>{item.name}</strong>
              <span className="lyric-motion-label">
                {animationLabels[item.animation]}
              </span>
              <small>{item.description}</small>
            </button>
          );
        })}
      </div>
      {!matches.length && (
        <p role="status">
          No matching styles. Choose All styles or try another word.
        </p>
      )}
      {selected && (
        <div className="caption-template-rules" aria-live="polite">
          <p>
            <strong>{selected.name}</strong> · {selected.description}
          </p>
          <p>
            <strong>Typography:</strong> {selected.captionStyle}
          </p>
          <p>
            <strong>Motion:</strong> {selected.animationStyle}
          </p>
          <p>
            <strong>Extra emphasis:</strong> Phrase endings and hook words
            receive{" "}
            {selected.emphasis === "pop"
              ? "a larger pop"
              : selected.emphasis === "glow"
                ? "extra illumination"
                : "an accent color"}
            . Select words in a caption to choose your own emphasis.
          </p>
        </div>
      )}
      <div className="actions">
        <button
          className="secondary small"
          type="button"
          onClick={() => choose(undefined)}
          aria-pressed={!value}
        >
          Use basic caption styling
        </button>
      </div>
    </fieldset>
  );
}

/** A short, silent example makes every preset testable before a recording is added. */
export function CaptionTemplateDemo({
  project,
  useProjectBackground = false,
  backgroundSource,
}: {
  project: LyricProject;
  useProjectBackground?: boolean;
  backgroundSource?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState(false);
  const imageSource = useProjectBackground
    ? backgroundSource || videoThemes[project.theme].image
    : "";
  useEffect(() => {
    setImage(null);
    setImageError(false);
    if (!imageSource) return;
    const picture = new Image();
    picture.onload = () => setImage(picture);
    picture.onerror = () => setImageError(true);
    picture.src = imageSource;
    return () => {
      picture.onload = null;
      picture.onerror = null;
    };
  }, [imageSource]);
  const frameSize = useProjectBackground
    ? videoSize(project.format)
    : { width: 1280, height: 720 };
  useEffect(() => {
    let live = true;
    loadCaptionFonts()
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !ready) return;
    let frame = 0;
    const origin = performance.now();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    function paint() {
      if (!ctx) return;
      const time = playing ? ((performance.now() - origin) / 1000) % 9 : 1.3;
      const text =
        project.captionTemplate === "vertical-garden"
          ? "愛と光が世界をつなぐ"
          : "Let your love light up the world";
      drawLyricVideo(
        ctx,
        time,
        {
          ...project,
          theme: useProjectBackground ? project.theme : "cosmic",
          motion: useProjectBackground ? project.motion : "still",
          format: useProjectBackground ? project.format : "wide",
          pro: useProjectBackground ? project.pro : undefined,
          intensity: reduced ? "still" : project.intensity,
          visualLayers: reduced && project.visualLayers ? { ...project.visualLayers, backgroundMotion: 0, overlayMotion: false } : project.visualLayers,
          cues: [
            { time: 0, end: 4.4, text },
            {
              time: 4.6,
              end: 9,
              text:
                project.captionTemplate === "vertical-garden"
                  ? "夢の中で光を見つける"
                  : "We rise together and shine",
            },
          ],
        },
        "SAMADHI LOVE",
        image,
      );
      if (playing) frame = requestAnimationFrame(paint);
    }
    paint();
    return () => cancelAnimationFrame(frame);
  }, [
    project.theme,
    project.motion,
    project.format,
    useProjectBackground,
    image,
    project.captionTemplate,
    project.font,
    project.color,
    project.intensity,
    project.bpm,
    project.captionLayout,
    project.visualLayers,
    project.pro,
    playing,
    ready,
  ]);
  return (
    <div className="lyric-preview">
      <canvas
        ref={canvas}
        width={frameSize.width}
        height={frameSize.height}
        aria-label="Caption template example"
      />
      <button
        type="button"
        className="secondary small"
        disabled={!ready}
        onClick={() => setPlaying((p) => !p)}
      >
        {playing ? "Pause template example" : "Play template example"}
      </button>
      <p className="muted creation-note">
        {useProjectBackground
          ? "Style preview with sample lyrics. Your recording and synchronized lyrics are used in the finished video."
          : "Silent example · Your lyrics and background are used in the recording preview."}
      </p>
      {imageError && (
        <p role="status">
          This image preview could not load. Choose another background or try
          again.
        </p>
      )}
    </div>
  );
}
