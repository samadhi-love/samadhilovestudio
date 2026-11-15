"use client";

import { useState } from "react";
import { cleanStyleSuggestion, flagContent, hasExplicitWords, rewriteCleanLine } from "./clean-content";

export function CleanLyricsChecker({ lyrics, change, direction = false, label = "Clean Lyrics Checker", styleContext = "", disabled = false }: {
  lyrics: string; change: (value: string) => void; direction?: boolean; label?: string; styleContext?: string; disabled?: boolean;
}) {
  const [checked, setChecked] = useState(false);
  const blocked = hasExplicitWords(lyrics);
  const segments = lyrics.split(/(\r?\n)/);
  const flagged = (checked || blocked) ? segments.flatMap((line, index) => {
    if (index % 2 !== 0) return [];
    const rules = flagContent(line);
    return rules.length ? [{ index, rules, suggestion: rewriteCleanLine(line, direction) }] : [];
  }) : [];
  const suggested = new Map(flagged.map(item => [item.index, item.suggestion]));
  const apply = (index?: number) => change(segments.map((part, i) =>
    (index === undefined || i === index) ? suggested.get(i) ?? part : part).join(""));
  return <section className="clean-checker" aria-label={label}>
    <div className="section-head"><h3>{label}</h3>
      {!blocked && <button type="button" className="secondary small" disabled={disabled || !lyrics.trim()} onClick={() => setChecked(!checked)}>{checked ? "Hide results" : "Check wording"}</button>}</div>
    {(checked || blocked) && <>
      <p className="muted" role="status">{flagged.length ? `${flagged.length} ${flagged.length === 1 ? "line needs" : "lines need"} a clean rewrite.` :
        blocked ? "A flagged phrase spans multiple lines. Reword those lines to continue." : "No wording was flagged by this check."}</p>
      {blocked && <p className="muted"><strong>Suggested style</strong> {cleanStyleSuggestion(styleContext + " " + lyrics)}</p>}
      {flagged.length > 1 && <button type="button" className="secondary small" disabled={disabled} onClick={() => apply()}>Apply all clean rewrites</button>}
      {!!flagged.length && <ul>{flagged.map(({ index, rules, suggestion }) => <li key={index}>
        <strong>Line {index / 2 + 1} · {rules.map(rule => rule.category).join(", ")}</strong>
        <p>Try “{suggestion}”</p>
        <button className="secondary small" type="button" disabled={disabled} onClick={() => apply(index)}>Replace line {index / 2 + 1}</button>
      </li>)}</ul>}
    </>}
  </section>;
}
