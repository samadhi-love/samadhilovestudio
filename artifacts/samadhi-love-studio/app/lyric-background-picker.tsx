"use client";
import { useState } from "react";
import {
  videoThemes,
  lyricTemplates,
  type LyricProject,
  type VideoTheme,
} from "./lyric-video-data";

export const lyricBackgroundGroups = {
  kids: {
    name: "Kids songs · animated",
    themes: ["balloons", "meadow", "undersea", "lullaby"],
  },
  usa: {
    name: "USA & New York · animated",
    themes: ["flag", "liberty", "nycnight"],
  },
  world: {
    name: "Cosmic world music",
    themes: ["silkroad", "lotusrhythm", "earthbeat"],
  },
  sacred: {
    name: "Sacred images & masters",
    themes: [
      "kriya",
      "masters",
      "archangel",
      "jesus",
      "mary",
      "buddha",
      "lotus",
      "flower",
      "tree",
      "temple",
      "wings",
      "mandala",
    ],
  },
  scenes: {
    name: "Background templates",
    themes: [
      "cosmic",
      "celestial",
      "nebula",
      "futuristic",
      "nature",
      "meditation",
      "dawn",
      "ocean",
      "lunar",
      "desert",
      "lake",
      "portal",
    ],
  },
  colors: {
    name: "Color templates",
    themes: [
      "silver",
      "rose",
      "amber",
      "emerald",
      "midnight",
      "lavender",
      "sunset",
      "monochrome",
      "ruby",
      "arctic",
      "terra",
      "peacock",
    ],
  },
} as const satisfies Record<
  string,
  { name: string; themes: readonly VideoTheme[] }
>;

export type BackgroundScope = "all" | "section";
/** Visual-only updates retain all lyric, timing, audio, and singer/language data. */
export function applyLyricBackground(
  project: LyricProject,
  theme: VideoTheme,
  scope: BackgroundScope,
  time: number,
): LyricProject {
  const pro = project.pro;
  if (!pro) return { ...project, theme };
  const section = pro.sections.findLast((s) => s.time <= time && time < s.end);
  if (scope === "section" && !section) return project;
  if (scope === "section" && section)
    return {
      ...project,
      pro: {
        ...pro,
      useTemplateBackground:true,
        sections: pro.sections.map((s) =>
          s.id === section.id ? { ...s, theme, background: undefined } : s,
        ),
      },
    };
  return {
    ...project,
    theme,
    pro: {
      ...pro,
      useTemplateBackground:true,
      background: undefined,
      sections: pro.sections.map((s) => ({
        ...s,
        theme: undefined,
        background: undefined,
      })),
    },
  };
}

export function applyCustomLyricBackground(
  project: LyricProject,
  asset: string,
  scope: BackgroundScope,
  time: number,
): LyricProject {
  if (!project.pro) return project;
  const section = project.pro.sections.findLast(
    (s) => s.time <= time && time < s.end,
  );
  if (scope === "section")
    return section
      ? {
          ...project,
          pro: {
            ...project.pro,
      useTemplateBackground:true,
            sections: project.pro.sections.map((s) =>
              s.id === section.id ? { ...s, background: asset } : s,
            ),
          },
        }
      : project;
  return {
    ...project,
    pro: {
      ...project.pro,
      useTemplateBackground:true,
      background: asset,
      sections: project.pro.sections.map((s) => ({
        ...s,
        background: undefined,
        theme: undefined,
      })),
    },
  };
}

export function LyricBackgroundPicker({
  project,
  time,
  change,
  disabled,
  initialGroup,
  uploadDesign,
  importTemplate,
  exportTemplate,
  customPreview,
}: {
  project: LyricProject;
  time: number;
  change: (project: LyricProject, completePreset?: boolean) => void;
  disabled: boolean;
  initialGroup?: keyof typeof lyricBackgroundGroups;
  uploadDesign?: (file: File, scope: BackgroundScope) => void;
  importTemplate?: (file: File) => void;
  exportTemplate?: () => void;
  customPreview?: boolean;
}) {
  const [group, setGroup] = useState<keyof typeof lyricBackgroundGroups>(
    initialGroup ??
      (lyricBackgroundGroups.kids.themes.some((id) => id === project.theme)
        ? "kids"
        : lyricBackgroundGroups.usa.themes.some((id) => id === project.theme)
        ? "usa"
        : lyricBackgroundGroups.world.themes.some((id) => id === project.theme)
        ? "world"
        : lyricBackgroundGroups.sacred.themes.some((id) => id === project.theme)
        ? "sacred"
        : lyricBackgroundGroups.colors.themes.some((id) => id === project.theme)
          ? "colors"
          : "scenes"),
  );
  const [scope, setScope] = useState<BackgroundScope>("all");
  const section = project.pro?.sections.findLast(
    (s) => s.time <= time && time < s.end,
  );
  const activeTheme = section?.theme ?? project.theme;
  const customImage =
    section?.background ??
    (section?.theme ? undefined : project.pro?.background);
  return (
    <fieldset className="lvp-background-picker" disabled={disabled}>
      <legend>1 · Choose your background</legend>
      <p className="lvp-note">
        Sacred artwork, cinematic scenery, or a color palette. Your lyric style
        stays independent.
      </p>
      <label>
        Apply background to
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as BackgroundScope)}
        >
          <option value="all">Whole video · all sections</option>
          <option value="section" disabled={!section}>
            Current section
            {section ? ` · ${section.name}` : " · seek inside a section first"}
          </option>
        </select>
      </label>
      <div
        className="lvp-background-tabs"
        role="group"
        aria-label="Background collections"
      >
        {Object.entries(lyricBackgroundGroups).map(([id, collection]) => (
          <button
            type="button"
            key={id}
            aria-pressed={group === id}
            onClick={() => setGroup(id as typeof group)}
          >
            {collection.name}{" "}
            <span className="lvp-collection-count">
              {collection.themes.length}
            </span>
          </button>
        ))}
      </div>
      {(uploadDesign || importTemplate) && (
        <div className="lvp-custom-design">
          <h3>Your own design or template</h3>
          <div className="lvp-fields">
            {uploadDesign && (
              <label>
                Upload background design
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  disabled={scope === "section" && !section}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) uploadDesign(file, scope);
                  }}
                />
              </label>
            )}
            {importTemplate && (
              <label>
                Import visual template
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) importTemplate(file);
                  }}
                />
              </label>
            )}
          </div>
          {exportTemplate && (
            <button type="button" onClick={exportTemplate}>
              Save current look as template
            </button>
          )}
          <p className="lvp-note">
            Artwork: JPG, PNG or WebP, up to 15 MB. Templates: Studio
            visual-template JSON, including exported Studio project looks.
            CapCut project files are not imported.
          </p>
        </div>
      )}
      <p className="lvp-collection-title">
        {lyricBackgroundGroups[group].themes.length}{" "}
        {group === "sacred"
          ? "sacred backgrounds"
          : group === "scenes"
            ? "scene templates"
            : group === "world" ? "cosmic world-music backgrounds" : "color templates"}{" "}
        · choose a design below
      </p>
      <div
        className="lvp-background-grid"
        aria-label={lyricBackgroundGroups[group].name}
      >
        {lyricBackgroundGroups[group].themes.map((id) => {
          const theme = videoThemes[id];
          const selected = !customImage && !customPreview && activeTheme === id;
          return (
            <button
              type="button"
              key={id}
              className="lvp-background-card"
              disabled={scope === "section" && !section}
              aria-pressed={selected}
              onClick={() =>
                change(applyLyricBackground(project, id, scope, time))
              }
            >
              <span
                className={`lvp-background-art scene-${id}`}
                aria-hidden="true"
                style={{
                  backgroundImage: theme.image || ("thumb" in theme && theme.thumb)
                    ? `url(${theme.image || ("thumb" in theme ? theme.thumb : "")})`
                    : `radial-gradient(ellipse at 50% 25%,${theme.colors[0]},${theme.colors[1]} 50%,${theme.colors[2]})`,
                }}
              >
                <i>
                  {selected ? "✓ Selected" : group === "colors" ? "Aa" : ""}
                </i>
              </span>
              <strong>{theme.title}</strong>
              {group === "colors" && (
                <span className="lvp-palette-swatches" aria-hidden="true">
                  {theme.colors.map((color, index) => (
                    <i key={index} style={{ background: color }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="lvp-note" aria-live="polite">
        {customImage || customPreview
          ? "Preview uses your uploaded background."
          : `Preview background: ${videoThemes[activeTheme].title}.`}{" "}
        {scope === "all"
          ? "Choosing a background applies it across all sections; Undo restores the previous scenery."
          : "Only the section under the playhead changes."}
      </p>
      {group === "sacred" && (
        <p className="lvp-note">
          Studio sacred artwork is illustrative. You can also upload your own
          authorized image below.
        </p>
      )}
      <details>
        <summary>Ready-made background &amp; caption layouts</summary>
        <p className="lvp-note">
          These restore the original video presets, including format, background
          motion, and basic lettering. You can then choose a different lyric
          style below.
        </p>
        <div className="lvp-ready-presets">
          {lyricTemplates.map((preset) => (
            <button
              type="button"
              key={preset.name}
              onClick={() => {
                const next = applyLyricBackground(
                  project,
                  preset.theme,
                  "all",
                  time,
                );
                change(
                  {
                    ...next,
                    theme: preset.theme,
                    format: preset.format,
                    motion: preset.motion,
                    font: preset.font,
                    color: preset.color,
                    effect: preset.effect,
                    captionTemplate: undefined,
                  },
                  true,
                );
              }}
            >
              <strong>{preset.name}</strong>
              <small>{preset.note}</small>
            </button>
          ))}
        </div>
      </details>
    </fieldset>
  );
}
