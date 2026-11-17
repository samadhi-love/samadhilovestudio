import type {VideoFormat} from "./lyric-video-data";

export const videoFormatLabels:Record<VideoFormat,string>={
  wide:"YouTube video · Widescreen 16:9",
  vertical:"Shorts / Reels · Portrait 9:16",
  square:"Square feed · 1:1",
};
export const primaryVideoFormats=[
  {id:"wide",name:"YouTube video",shape:"Widescreen · 16:9",note:"Wide video for YouTube, desktop and TV."},
  {id:"vertical",name:"Phone video",shape:"Full-height phone video · 9:16",note:"Upright video for YouTube Shorts, TikTok and Reels."},
] as const;
export const videoFrameSize=(format:VideoFormat,resolution:1080|720=1080)=>format==="wide"
  ?{width:resolution===1080?1920:1280,height:resolution}
  :format==="square"?{width:resolution,height:resolution}
  :{width:resolution,height:resolution===1080?1920:1280};
