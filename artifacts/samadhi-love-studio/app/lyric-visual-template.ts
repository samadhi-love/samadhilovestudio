import { isLyricProject, type LyricProject } from "./lyric-video-data";
import { isProLook, type ProLook } from "./lyric-pro-data";

export const maxDesignBytes = 15 * 1024 * 1024;
export const maxVisualTemplateBytes = 21 * 1024 * 1024;
export type VisualSettings = Omit<LyricProject, "cues" | "pro">;
export type LyricVisualTemplate = {
  schema: "samadhi-lyric-visual/v1";
  name: string;
  visual: VisualSettings;
  layout?: ProLook;
  captionMode?: "karaoke" | "lines";
  duetColors?: [string, string];
  background?: { dataUrl: string };
};
const visualKeys = [
  "theme",
  "motion",
  "format",
  "font",
  "color",
  "effect",
  "captionTemplate",
  "intensity",
  "bpm",
  "captionLayout",
  "visualLayers",
] as const;
export function visualSettings(project: LyricProject): VisualSettings {
  const settings = {} as VisualSettings;
  for (const key of visualKeys)
    if (project[key] !== undefined)
      Object.assign(settings, { [key]: project[key] });
  return settings;
}
export function makeVisualTemplate(
  project: LyricProject,
  name = "SAMADHI LOVE visual look",
): LyricVisualTemplate {
  return {
    schema: "samadhi-lyric-visual/v1",
    name: name.slice(0, 100),
    visual: visualSettings(project),
    ...(project.pro
      ? {
          layout: {
            ...(project.pro.formatLooks?.[project.format] ?? project.pro.look),
          },
          captionMode: project.pro.captionMode,
          duetColors: project.pro.duetColors,
        }
      : {}),
  };
}
/** Allowlisted visual fields only: source songs, recordings, lyrics and timings are never imported. */
export function parseVisualTemplate(input: unknown): LyricVisualTemplate {
  if (!input || typeof input !== "object")
    throw new Error(
      "Choose a Studio visual-template JSON file or an exported Studio project JSON.",
    );
  const value = input as Record<string, unknown>;
  if (
    value.schema === "samadhi-lyric-video-pro/v1" &&
    isLyricProject(value.project)
  )
    return makeVisualTemplate(value.project);
  if (
    value.schema !== "samadhi-lyric-visual/v1" ||
    !value.visual ||
    typeof value.visual !== "object"
  )
    throw new Error(
      "This is not a supported Studio visual template. CapCut project files are not compatible.",
    );
  const raw = value.visual as Record<string, unknown>,
    candidate: Record<string, unknown> = { cues: [] };
  for (const key of visualKeys)
    if (Object.hasOwn(raw, key)) candidate[key] = raw[key];
  if (!isLyricProject(candidate))
    throw new Error(
      "The template contains unsupported background, font, animation, or video settings.",
    );
  if (value.layout !== undefined && !isProLook(value.layout))
    throw new Error("The template's text layout is invalid.");
  if (
    value.captionMode !== undefined &&
    !["karaoke", "lines"].includes(String(value.captionMode))
  )
    throw new Error("Choose a valid caption style in the template.");
  if (
    value.duetColors !== undefined &&
    (!Array.isArray(value.duetColors) ||
      value.duetColors.length !== 2 ||
      !value.duetColors.every(
        (c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c),
      ))
  )
    throw new Error("The template's duet colors are invalid.");
  const template: LyricVisualTemplate = {
    schema: "samadhi-lyric-visual/v1",
    name:
      typeof value.name === "string"
        ? value.name.slice(0, 100)
        : "Imported visual look",
    visual: visualSettings(candidate),
    ...(value.layout ? { layout: { ...(value.layout as ProLook) } } : {}),
    ...(value.captionMode
      ? { captionMode: value.captionMode as LyricVisualTemplate["captionMode"] }
      : {}),
    ...(value.duetColors
      ? {
          duetColors: [...(value.duetColors as [string, string])] as [
            string,
            string,
          ],
        }
      : {}),
  };
  if (value.background !== undefined) {
    const background = value.background as { dataUrl?: unknown };
    if (!background || typeof background.dataUrl !== "string")
      throw new Error("The template's background image is invalid.");
    template.background = { dataUrl: background.dataUrl };
    decodeTemplateBackground(template); // Check MIME, base64 and decoded byte limit.
  }
  return template;
}
export function decodeTemplateBackground(
  template: LyricVisualTemplate,
): Blob | null {
  if (!template.background) return null;
  const match =
    /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(
      template.background.dataUrl,
    );
  if (!match || match[2].length > (maxDesignBytes * 4) / 3 + 4096)
    throw new Error(
      "Template backgrounds must be JPG, PNG or WebP images up to 15 MB.",
    );
  let binary: string;
  try {
    binary = atob(match[2]);
  } catch {
    throw new Error("The template background could not be decoded.");
  }
  if (!binary.length || binary.length > maxDesignBytes)
    throw new Error("The template background exceeds the 15 MB limit.");
  return new Blob([Uint8Array.from(binary, (c) => c.charCodeAt(0))], {
    type: match[1],
  });
}
export function applyVisualTemplate(
  project: LyricProject,
  template: LyricVisualTemplate,
): LyricProject {
  const next: LyricProject = {
    ...project,
    font: "classic",
    color: "pearl",
    effect: "fade",
    intensity: "full",
    bpm: 100,
    captionLayout: "auto",
    ...template.visual,
    captionTemplate: template.visual.captionTemplate,
    visualLayers: template.visual.visualLayers,
  };
  if (!project.pro) return next;
  return {
    ...next,
    pro: {
      ...project.pro,
      useTemplateBackground:true,
      background: undefined,
      sections: project.pro.sections.map((section) => ({
        ...section,
        background: undefined,
        theme: undefined,
      })),
      captionMode: template.captionMode ?? "karaoke",
      ...(template.duetColors
        ? { duetColors: [...template.duetColors] as [string, string] }
        : {}),
      ...(template.layout
        ? {
            formatLooks: {
              ...project.pro.formatLooks,
              [next.format]: { ...template.layout },
            },
          }
        : {}),
    },
  };
}
