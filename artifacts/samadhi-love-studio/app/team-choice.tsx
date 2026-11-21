"use client";
import "./team-choice.css";
import { partSinger, singerTeams, teamById, type SingerTeam } from "./singer-team";

/** "Who sings": Auto follows the person's words; any pick is followed exactly. */
export function TeamChoice({ value, change, heard, note, disabled }: { value: string; change: (id: string) => void; heard?: SingerTeam; note?: string; disabled?: boolean }) {
  const active = value === "auto" ? heard : teamById(value);
  const plan = active && active.voices > 1 ? [
    `Verse 1: ${partSinger(active, "verse", 1)}`,
    `Verse 2: ${partSinger(active, "verse", 2)}`,
    `Chorus: ${partSinger(active, "chorus", 1)}`,
  ] : [];
  return (
    <fieldset className="team-choice" data-testid="team-choice" disabled={disabled}>
      <legend>Who sings</legend>
      <div className="team-options" role="radiogroup" aria-label="Who sings">
        <button type="button" role="radio" aria-checked={value === "auto"} className={value === "auto" ? "active" : ""} onClick={() => change("auto")} data-testid="team-auto">
          <span aria-hidden="true">✦</span> Auto
        </button>
        {singerTeams.map(team => (
          <button type="button" role="radio" key={team.id} aria-checked={value === team.id} className={value === team.id ? "active" : ""} title={team.line} onClick={() => change(value === team.id ? "auto" : team.id)} data-testid={`team-${team.id}`}>
            <span aria-hidden="true">{team.icon}</span> {team.name}
          </button>
        ))}
      </div>
      <p className="muted team-status" role="status" data-testid="text-team">
        {value === "auto"
          ? heard ? <>Your words ask for <strong>{heard.name}</strong>, so that&apos;s what you&apos;ll get.</> : "Auto: the studio picks the singer that fits. Write “duet”, “group chant” or “choir” and it follows you."
          : <><strong>{active?.name}</strong>: {active?.line}.</>}
      </p>
      {plan.length > 0 && <p className="muted team-plan" data-testid="text-team-plan">{plan.join(" · ")}</p>}
      {note && <p className="team-note" data-testid="text-team-note">{note}</p>}
    </fieldset>
  );
}
