import { musicLanguages, musicDialects, type LanguageProfile } from "./music-language";

export function MusicLanguageSummary({ profile }: { profile?: LanguageProfile }) {
  if (!profile) return null;
  return <p className="muted" aria-label="Saved singing language">
    Singing target: {musicLanguages[profile.resolved]}
    {profile.dialect ? ` · ${musicDialects[profile.dialect]}` : ""}
    {" · "}{profile.source === "selected" ? "Selected by creator" : "Auto suggestion"}
    {" · Singing / dialect fidelity unverified"}
  </p>;
}
