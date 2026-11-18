import config from "../brand.json";

/** Product identity only. Artist credits and saved project text stay unchanged. */
export const brand=Object.freeze(config);
export const brandDescription=`${brand.name} — ${brand.slogan} ${brand.subline}. Create original songs and lyric videos in one beginner-friendly creative space.`;
