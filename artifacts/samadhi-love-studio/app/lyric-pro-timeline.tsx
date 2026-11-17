"use client";
import {PanelErrorBoundary} from "./panel-error-boundary";
import { useEffect, useRef, useState, type RefObject } from "react";
import { captionTokens } from "./lyric-caption-render";
import {
  defaultProLook,
  sectionsFromLyrics,
  type ProLook,
} from "./lyric-pro-data";
import {
  videoThemes,
  type LyricProject,
  type LyricCue,
} from "./lyric-video-data";
export function ProTimeline(props:Parameters<typeof ProTimelineContent>[0]) {
  return <PanelErrorBoundary panel="video-timeline"><ProTimelineContent {...props}/></PanelErrorBoundary>;
}
function ProTimelineContent({
  project,
  edit,
  audio,
  time,
  seek,
  analyze,
  busy,
  active=false,
  request,
}: {
  project: LyricProject;
  edit: (next: LyricProject) => void;
  audio: RefObject<HTMLAudioElement | null>;
  time: number;
  seek: (time: number) => void;
  analyze: () => void;
  busy: boolean;
  active?:boolean;
  request?:{id:number;index?:number};
}) {
  const editor=useRef<HTMLDetailsElement>(null);
  const p = project.pro!,
    [zoom, setZoom] = useState(1),
    [loop, setLoop] = useState(false),
    [speed, setSpeed] = useState(1),
    [selected, setSelected] = useState(0);
  useEffect(()=>{
    if(active&&editor.current){editor.current.open=true;if(request){if(request.index!==undefined)setSelected(Math.max(0,Math.min(request.index,project.cues.length-1)));editor.current.scrollIntoView?.({behavior:"smooth",block:"start"});}}
  },[active,request?.id]);
  useEffect(()=>{if(selected>=project.cues.length)setSelected(0);},[selected,project.cues.length]);
  const windowSize = Math.max(5, p.duration / zoom),
    start = Math.max(
      0,
      Math.min(p.duration - windowSize, time - windowSize * 0.3),
    );
  function updateCue(index: number, patch: Partial<LyricCue>) {
    edit({
      ...project,
      cues: project.cues.map((c, i) => (i === index ? { ...c, ...patch } : c)),
      pro: {
        ...p,
        alignment: p.alignment
          ? { ...p.alignment, reviewed: false }
          : undefined,
      },
    });
  }
  function moveCue(index: number, next: number) {
    const cue = project.cues[index];
    if (!Number.isFinite(next)) return;
    const delta = next - cue.time;
    updateCue(index, {
      time: next,
      end: cue.end === undefined ? undefined : cue.end + delta,
      words: cue.words?.map((w) => ({ ...w, time: w.time + delta })),
    });
  }
  const look = p.formatLooks?.[project.format] ?? p.look;
  function setLook(patch: Partial<ProLook>) {
    edit({
      ...project,
      pro: {
        ...p,
        formatLooks: {
          ...p.formatLooks,
          [project.format]: { ...look, ...patch },
        },
      },
    });
  }
  const cue = project.cues[selected];
  useEffect(() => {
    const element = audio.current;
    if (!element || !loop || !cue) return;
    const stop = cue.end ?? project.cues[selected + 1]?.time ?? p.duration;
    const repeat = () => {
      if (element.currentTime >= stop) element.currentTime = cue.time;
    };
    element.addEventListener("timeupdate", repeat);
    return () => element.removeEventListener("timeupdate", repeat);
  }, [loop, cue?.time, cue?.end, selected, p.duration]);
  useEffect(
    () => () => {
      if (audio.current) audio.current.playbackRate = 1;
    },
    [],
  );
  return (
    <details className="lvp-advanced" id="lyric-caption-editor" ref={editor} aria-label="Caption editor">
      <summary>Caption editor · words, timing &amp; advanced tools</summary>
      <fieldset disabled={busy}>
        <p className="lvp-note">Choose a caption to correct its text or timing. Text changes clear old word highlighting for that line; review or realign it after editing.</p>
        <button type="button" disabled={!p.duration||project.cues.length>=200} onClick={()=>{
          const start=Math.max(0,Math.min(time,p.duration-.05)),cue={text:"New lyric line",time:start,end:Math.min(p.duration,start+3)};
          const cues=[...project.cues,cue].sort((a,b)=>a.time-b.time);setSelected(cues.indexOf(cue));
          edit({...project,cues,pro:{...p,alignment:p.alignment?{...p.alignment,reviewed:false}:undefined}});
        }}>Add caption at playhead</button>
        {!project.cues.length&&<p>No captions yet. Generate them from the saved lyrics, or add a line here for manual timing.</p>}
        <details><summary>Waveform &amp; playback tools</summary>
        <div className="lvp-actions">
          <label>
            Timeline zoom
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            >
              {[1, 2, 4, 8, 16].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
          <label>
            Preview speed
            <select
              value={speed}
              onChange={(e) => {
                const n = Number(e.target.value);
                setSpeed(n);
                if (audio.current) {
                  audio.current.playbackRate = n;
                  audio.current.preservesPitch = true;
                }
              }}
            >
              {[0.5, 0.75, 1, 1.25, 1.5].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={analyze}>
            Load waveform &amp; audio accents
          </button>
        </div>
        <p className="lvp-note">
          Preview speed never changes exported audio. Drag the playhead below or
          tap a caption. Word timestamps stay relative to the untouched
          recording; excerpt exports shift them automatically.
        </p>
        <svg
          className="lvp-wave"
          viewBox="0 0 1000 150"
          role="img"
          aria-label="Audio waveform and caption timeline"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(start + ((e.clientX - r.left) / r.width) * windowSize);
          }}
        >
          <rect width="1000" height="150" fill="#f3f4f7" />
          {(p.waveform ?? []).map((peak, i) => {
            const t =
              (i / Math.max(1, (p.waveform?.length ?? 1) - 1)) * p.duration;
            return t < start || t > start + windowSize ? null : (
              <line
                key={i}
                x1={((t - start) / windowSize) * 1000}
                x2={((t - start) / windowSize) * 1000}
                y1={55 - peak * 43}
                y2={55 + peak * 43}
                stroke="#8d789c"
                strokeWidth="2"
              />
            );
          })}
          {project.cues.map((c, i) => {
            const end = c.end ?? project.cues[i + 1]?.time ?? p.duration;
            const x = Math.max(0, ((c.time - start) / windowSize) * 1000),
              w = Math.min(1000, ((end - start) / windowSize) * 1000) - x;
            return w <= 0 || x > 1000 ? null : (
              <rect
                key={i}
                x={x}
                y="115"
                width={w}
                height="24"
                fill={selected === i ? "#bb8b35" : "#b8c9d5"}
                stroke="#fff"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(i);
                  seek(c.time);
                }}
              />
            );
          })}
          <line
            x1={((time - start) / windowSize) * 1000}
            x2={((time - start) / windowSize) * 1000}
            y1="0"
            y2="150"
            stroke="#c45d71"
            strokeWidth="3"
          />
        </svg>
        <input
          aria-label="Preview playhead"
          type="range"
          min="0"
          max={p.duration || 1}
          step="0.01"
          value={Math.min(time, p.duration)}
          onChange={(e) => seek(Number(e.target.value))}
        />
        </details>
        <div className="lvp-fields">
          <label>
            Caption
            <select
              value={selected}
              onChange={(e) => {
                setSelected(Number(e.target.value));
                const c = project.cues[Number(e.target.value)];
                if (c) seek(c.time);
              }}
            >
              {project.cues.map((c, i) => (
                <option key={i} value={i}>
                  {i + 1}. {c.text.slice(0, 55)}
                </option>
              ))}
            </select>
          </label>
          <label className="lvp-check">
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
            />{" "}
            Loop selected caption
          </label>
        </div>
        {cue && (
          <div className="lvp-cue-editor">
            <label>
              Caption text
              <input
                value={cue.text}
                dir="auto"
                maxLength={180}
                onChange={(e) =>
                  updateCue(selected, {
                    text: e.target.value,
                    words: undefined,
                    accentWords: undefined,
                  })
                }
              />
            </label>
            <div className="lvp-fields">
              <label>
                Start (seconds)
                <input
                  type="number"
                  min="0"
                  max={p.duration}
                  step=".01"
                  value={cue.time}
                  onChange={(e) => moveCue(selected, e.target.valueAsNumber)}
                />
              </label>
              <label>
                End (seconds)
                <input
                  type="number"
                  min="0"
                  max={p.duration}
                  step=".01"
                  value={cue.end ?? ""}
                  onChange={(e) =>
                    updateCue(selected, {
                      end:
                        e.target.value === ""
                          ? undefined
                          : e.target.valueAsNumber,
                    })
                  }
                />
              </label>
              <label>
                Singer
                <input
                  value={cue.singer ?? ""}
                  maxLength={60}
                  onChange={(e) =>
                    updateCue(selected, { singer: e.target.value })
                  }
                  placeholder="Lead A / Lead B"
                />
              </label>
              <label>
                Vocal role
                <select
                  value={cue.role ?? "lead"}
                  onChange={(e) =>
                    updateCue(selected, {
                      role: e.target.value as LyricCue["role"],
                    })
                  }
                >
                  <option value="lead">Lead</option>
                  <option value="backing">Backing</option>
                  <option value="adlib">Ad-lib</option>
                </select>
              </label>
              <label>
                Language / dialect
                <input
                  value={cue.language ?? ""}
                  maxLength={80}
                  onChange={(e) =>
                    updateCue(selected, { language: e.target.value })
                  }
                />
              </label>
              <label>
                Extra emphasis
                <select
                  value={cue.emphasis ?? "auto"}
                  onChange={(e) =>
                    updateCue(selected, {
                      emphasis: e.target.value as LyricCue["emphasis"],
                    })
                  }
                >
                  <option value="auto">Template rule</option>
                  <option value="glow">Illuminate</option>
                  <option value="color">Color pop</option>
                  <option value="pop">Pop-up</option>
                </select>
              </label>
            </div>
            <label>
              Translation · optional, separate from original
              <input
                value={cue.translation ?? ""}
                dir="auto"
                maxLength={180}
                onChange={(e) =>
                  updateCue(selected, { translation: e.target.value })
                }
              />
            </label>
            <label>
              Transliteration · optional, editable
              <input
                value={cue.transliteration ?? ""}
                dir="auto"
                maxLength={180}
                onChange={(e) =>
                  updateCue(selected, { transliteration: e.target.value })
                }
              />
            </label>
            <p className="lvp-note">
              Translation and transliteration are editable text layers. Studio
              does not automatically translate or formalize your dialect.
            </p>
            <div className="lvp-actions">
              <button type="button" onClick={() => moveCue(selected, time)}>
                Tap-to-time: start here
              </button>
              <button
                type="button"
                onClick={() => updateCue(selected, { accentWords: undefined })}
              >
                Automatic emphasis
              </button>
              <button
                type="button"
                onClick={() =>
                  edit({
                    ...project,
                    cues: project.cues.filter((_, i) => i !== selected),
                  })
                }
              >
                Remove caption
              </button>
            </div>
            <div className="lvp-words" dir="auto">
              {captionTokens(
                cue,
                cue.end ?? project.cues[selected + 1]?.time ?? p.duration,
              ).map((word, i) => (
                <label key={word.end} className="lvp-word">
                  <button
                    type="button"
                    aria-pressed={cue.accentWords?.includes(word.end) ?? false}
                    onClick={() => {
                      const words = cue.accentWords ?? [];
                      updateCue(selected, {
                        accentWords: words.includes(word.end)
                          ? words.filter((o) => o !== word.end)
                          : [...words, word.end],
                      });
                    }}
                  >
                    {word.text}
                  </button>
                  <input
                    aria-label={`Word ${i + 1} time`}
                    type="number"
                    min={cue.time}
                    max={cue.end ?? p.duration}
                    step=".01"
                    value={Math.round(word.time * 100) / 100}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      if (!Number.isFinite(value)) return;
                      updateCue(selected, {
                        words: captionTokens(
                          cue,
                          cue.end ??
                            project.cues[selected + 1]?.time ??
                            p.duration,
                        ).map((w, j) => ({
                          offset: w.end,
                          time: i === j ? value : w.time,
                        })),
                      });
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        )}
        <h3>Layout · {project.format} override</h3>
        <p className="lvp-note">
          Overrides apply only to the selected aspect ratio. Reposition captions
          around important faces or subjects; automatic face detection is not
          included.
        </p>
        <div className="lvp-fields">
          {(
            [
              ["position", "Vertical position", 0.25, 0.82, 0.01],
              ["size", "Font size", 0.65, 1.6, 0.05],
              ["outline", "Outline", 0, 2, 0.1],
              ["shadow", "Shadow", 0, 2, 0.1],
              ["spacing", "Line spacing", 1.1, 1.7, 0.05],
            ] as const
          ).map(([key, label, min, max, step]) => (
            <label key={key}>
              {label}
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={look[key]}
                onChange={(e) => setLook({ [key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <label className="lvp-check">
            <input
              type="checkbox"
              checked={look.safe}
              onChange={(e) => setLook({ safe: e.target.checked })}
            />{" "}
            Show platform safe-area guide
          </label>
        </div>
        <button
          type="button"
          onClick={() =>
            edit({
              ...project,
              pro: {
                ...p,
                formatLooks: {
                  ...p.formatLooks,
                  [project.format]: { ...defaultProLook },
                },
              },
            })
          }
        >
          Reset this format's layout
        </button>
        <h3>Song sections &amp; changing scenery</h3>
        <button
          type="button"
          onClick={() =>
            edit({
              ...project,
              pro: {
                ...p,
                sections: sectionsFromLyrics(
                  p.approvedLyrics,
                  project.cues,
                  p.duration,
                ),
              },
            })
          }
        >
          Build markers from approved section headings
        </button>
        <div className="lvp-sections">
          {p.sections.map((section, i) => (
            <div key={section.id} className="lvp-fields">
              <label>
                Section
                <input
                  maxLength={100}
                  value={section.name}
                  onChange={(e) =>
                    edit({
                      ...project,
                      pro: {
                        ...p,
                        sections: p.sections.map((s, j) =>
                          j === i ? { ...s, name: e.target.value } : s,
                        ),
                      },
                    })
                  }
                />
              </label>
              <label>
                Start
                <input
                  type="number"
                  min="0"
                  max={p.duration}
                  step=".01"
                  value={section.time}
                  onChange={(e) => {
                    if (Number.isFinite(e.target.valueAsNumber))
                      edit({
                        ...project,
                        pro: {
                          ...p,
                          sections: p.sections.map((s, j) =>
                            j === i
                              ? { ...s, time: e.target.valueAsNumber }
                              : s,
                          ),
                        },
                      });
                  }}
                />
              </label>
              <label>
                End
                <input
                  type="number"
                  min="0"
                  max={p.duration}
                  step=".01"
                  value={section.end}
                  onChange={(e) => {
                    if (Number.isFinite(e.target.valueAsNumber))
                      edit({
                        ...project,
                        pro: {
                          ...p,
                          sections: p.sections.map((s, j) =>
                            j === i ? { ...s, end: e.target.valueAsNumber } : s,
                          ),
                        },
                      });
                  }}
                />
              </label>
              <label>
                Singer
                <input
                  maxLength={60}
                  value={section.singer ?? ""}
                  onChange={(e) =>
                    edit({
                      ...project,
                      pro: {
                        ...p,
                        sections: p.sections.map((s, j) =>
                          j === i ? { ...s, singer: e.target.value } : s,
                        ),
                      },
                    })
                  }
                />
              </label>
              <label>
                Language
                <input
                  maxLength={80}
                  value={section.language ?? ""}
                  onChange={(e) =>
                    edit({
                      ...project,
                      pro: {
                        ...p,
                        sections: p.sections.map((s, j) =>
                          j === i ? { ...s, language: e.target.value } : s,
                        ),
                      },
                    })
                  }
                />
              </label>
              <label>
                Scene
                <select
                  value={section.theme ?? ""}
                  onChange={(e) =>
                    edit({
                      ...project,
                      pro: {
                        ...p,
                        sections: p.sections.map((s, j) =>
                          j === i
                            ? {
                                ...s,
                                theme: (e.target.value ||
                                  undefined) as typeof s.theme,
                              }
                            : s,
                        ),
                      },
                    })
                  }
                >
                  <option value="">Project background</option>
                  {Object.entries(videoThemes).map(([id, s]) => (
                    <option key={id} value={id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  edit({
                    ...project,
                    pro: {
                      ...p,
                      sections: p.sections.filter((_, j) => j !== i),
                    },
                  })
                }
              >
                Remove marker
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={p.sections.length >= 60}
          onClick={() =>
            edit({
              ...project,
              pro: {
                ...p,
                sections: [
                  ...p.sections,
                  {
                    id: crypto.randomUUID(),
                    name: "New section",
                    time,
                    end: Math.min(p.duration, time + 10),
                  },
                ].sort((a, b) => a.time - b.time),
              },
            })
          }
        >
          Add section at playhead
        </button>
      </fieldset>
    </details>
  );
}
