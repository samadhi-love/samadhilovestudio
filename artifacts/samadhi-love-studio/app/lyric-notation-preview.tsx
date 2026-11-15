"use client";
import { useMemo } from "react";
import { parseLyricNotation, performanceLines } from "./lyric-notation";
export function LyricNotationPreview({text}:{text:string}) {
  const parsed = useMemo(()=>parseLyricNotation(text),[text]);
  const words = useMemo(()=>performanceLines(text).join("\n"),[text]);
  return <section className="lyric-notation-preview"><p className="muted">Text in [brackets], (parentheses) or &#123;braces&#125; is direction only. Put every word you want sung or spoken outside them.</p>
    {parsed.errors.map(error=><p className="notice" role="alert" key={error}>{error}</p>)}
    <details><summary>Check lyrics vs directions · {parsed.directions.length} instruction block(s)</summary><h4>Words to perform</h4><pre>{words || "No lyric words outside the instructions yet."}</pre><h4>Production directions · not performed</h4>{parsed.directions.length ? <ul>{parsed.directions.map((d,i)=><li key={i}>{d.text}</li>)}</ul> : <p>No bracketed directions.</p>}</details>
  </section>;
}
