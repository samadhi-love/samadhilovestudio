"use client";
import type {VideoFormat} from "./lyric-video-data";
import {primaryVideoFormats,videoFrameSize} from "./video-format-options";

export function VideoFormatPicker({value,change,disabled=false,resolution=1080}:{value:VideoFormat;change:(format:VideoFormat)=>void;disabled?:boolean;resolution?:1080|720}){
  return <section className="video-shape-picker" aria-label="Choose video shape">
    <h3>Choose your video format</h3>
    <div className="video-shape-options">{primaryVideoFormats.map(option=>{
      const size=videoFrameSize(option.id,resolution);
      return <button type="button" key={option.id} disabled={disabled} aria-pressed={value===option.id} onClick={()=>change(option.id)} className="video-shape-option">
        <span className={`video-shape-icon ${option.id}`} aria-hidden="true"><i/></span>
        <strong>{option.id==="vertical"?"Phone · Reels & Shorts":"YouTube"}</strong><span>{option.shape}</span><small>{size.width} × {size.height}</small>
      </button>;
    })}</div>
    <p className="video-shape-note">{primaryVideoFormats.find(option=>option.id===value)?.note??"Square video for feed posts."} Video shape and clip duration are separate choices.</p>
    <details open={value==="square"||undefined}><summary>More looks · square format</summary><button type="button" disabled={disabled} aria-pressed={value==="square"} onClick={()=>change("square")}>Square feed · 1:1</button></details>
  </section>;
}
