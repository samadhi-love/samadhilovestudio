"use client";
import {cosmicScrollBehavior} from "./cosmic-motion";

import { useState } from "react";
import { Activity, CircleHelp, CreditCard, Menu, Settings2, ShieldCheck, UserRound, X } from "lucide-react";
import type { ComponentType } from "react";
import { screenHome, screenOf, screenSections, type Screen, type SectionView } from "./studio-routes";
import { HelpTip } from "./help-tip";
import { HologramSimpleViewNote } from "./hologram-slogan";

export type WorkspaceView = SectionView;

const sectionLabels: Record<SectionView, string> = {
  overview: "Create", create: "Detailed production", "prompt-lab": "Prompt helpers", "vocal-director": "Vocals", templates: "Start from a recipe",
  "music-library": "Create · World sounds", "rhythm-atlas": "Create · World sounds · Rhythms", "international-tent": "Create · World sounds · International", "meditative-vibes": "Create · World sounds · Meditative",
  recording: "Record · Voice", podcast: "Record · Podcast", "vocal-studio": "Record · Vocal Studio Pro", "my-voices": "Record · My Voices",
  multitrack: "Songs · Mix & edit", compare: "Songs · Mix & edit · Compare",
  songs: "Songs", workflow: "Songs · Song steps", releases: "Songs · Release checklist", distribution: "Songs · Export & release tools",
  promote: "Songs · Logo & ad", radio: "Explore", "lyric-video": "LyriVid",
};
const screenGuidance: Record<Screen, { label: string; tip: string }> = {
  create: { label: "Create", tip: "Start with one song idea. Simple keeps choices light; Custom opens lyrics, language, vocals, prompts and Pro production. Nothing is sent until you press Create." },
  "world-sounds": { label: "World sounds", tip: "Browse a sound or rhythm, then choose Use in my song to fill Create. This does not generate music or use credits." },
  record: { label: "Record", tip: "Choose Voice or Podcast before recording. Your takes stay private; stop recording before switching workspaces." },
  "mix-edit": { label: "Mix & edit", tip: "Use these advanced tools to edit saved audio. Keep the original take and compare versions before choosing a result." },
  songs: { label: "Songs", tip: "Your saved songs stay private. Listen, reopen a song to edit, make a video, or review its Release checklist." },
  promote: { label: "Logo & ad", tip: "Prepare artwork or an ad brief here. Review everything before exporting or sharing; nothing is published automatically." },
  explore: { label: "Explore", tip: "Listen, discover and visit Party Mix. Community sharing and the Listening Room keep their existing access rules." },
  "plan-credits": { label: "Plan & Credits", tip: "Review membership and usage. Viewing plans does not start billing." },
  "lyric-video": { label: "LyriVid", tip: "Choose a look for a local preview. Check caption wording and timing before export; a visual preview does not verify singing alignment." },
};

/** One persistent workspace-level mode control, available from every screen. */
export function WorkspaceModeSwitch({ beginner, change }: { beginner: boolean; change: (value: boolean) => void }) {
  return <div className="workspace-mode-switch">
    <span>Advanced options</span>
    <button type="button" role="switch" data-testid="switch-workspace-mode" aria-checked={!beginner}
      aria-label={beginner ? "Switch to Advanced view" : "Switch to Simple view"}
      onClick={() => change(!beginner)}>
      <span aria-hidden="true">{beginner ? "Off" : "On"}</span>
    </button>
    <HelpTip subject="Advanced options" tip="Off keeps every screen calm. On shows deeper controls inside each screen. Your songs and settings never change."/>
  </div>;
}
export function ScreenContextHelp({ screen }: { screen: Screen }) {
  const guidance = screenGuidance[screen];
  return <div className="screen-context-help" data-testid={`context-help-${screen}`}>
    <HelpTip subject={`${guidance.label} screen`} tip={guidance.tip}/>
    <span>{guidance.label} help</span>
  </div>;
}
/** Kept for breadcrumb/label lookups: every internal subsection with its consolidated label. */
export const workspaceNavigation = (Object.keys(sectionLabels) as SectionView[]).map(id => ({ id, label: sectionLabels[id] }));

type NavIcon = ComponentType<{ size?: number }>;
const svg = (paths: React.ReactNode): NavIcon => Object.assign(({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>, { displayName: "NavGlyph" });
/** Cosmic glyphs: four-point spark (Create), star (Your songs), lens (Video), resonance (Record), orbit (Explore). */
const CreateGlyph = svg(<><path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z"/><path d="M19 16.5c.2 1.6 1 2.3 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.2 2.3-.9 2.5-2.5Z"/></>);
const SongsGlyph = svg(<><path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6-4.5-4.1 6-.7Z"/></>);
const VideoGlyph = svg(<><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/></>);
const RecordGlyph = svg(<><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/></>);
const ExploreGlyph = svg(<><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-25 12 12)"/><circle cx="20" cy="7" r=".9" fill="currentColor"/></>);

/** Exactly five primary destinations. Every other screen opens from inside one of them. */
export const primaryScreens: { screen: Screen; label: string; icon: NavIcon }[] = [
  { screen: "create", label: "Create", icon: CreateGlyph },
  { screen: "songs", label: "Songs", icon: SongsGlyph },
  { screen: "lyric-video", label: "LyriVid", icon: VideoGlyph },
  { screen: "record", label: "Record", icon: RecordGlyph },
  { screen: "explore", label: "Explore", icon: ExploreGlyph },
];
/** Context screens: reached from inside their parent, and highlight the parent in the menu. */
export const contextParent: Partial<Record<Screen, { parent: Screen; label: string }>> = {
  "world-sounds": { parent: "create", label: "Create" },
  "mix-edit": { parent: "songs", label: "Songs" },
  promote: { parent: "songs", label: "Songs" },
};
/** Back link shown at the top of a context screen. */
export function ContextBack({ screen, open }: { screen: Screen; open: (screen: Screen) => void }) {
  const context = contextParent[screen];
  if (!context) return null;
  return <button type="button" className="text-button context-back" data-testid={`button-back-${context.parent}`} onClick={() => open(context.parent)}>← Back to {context.label}</button>;
}

/** Subsection tabs inside a consolidated screen. Pro-only subsections appear when Pro tools are on. */
export function ScreenSections({ activeView, navigate, beginner = true, extra }: { activeView: SectionView; navigate: (view: SectionView) => boolean | undefined; beginner?: boolean; extra?: React.ReactNode }) {
  const screen = screenOf(activeView);
  const items = screenSections[screen].filter(s => !s.pro || !beginner || s.view === activeView);
  if (items.length < 2 && !extra) return null;
  return <nav className="screen-sections" aria-label="Sections" data-testid={`nav-sections-${screen}`}>
    {items.map(s => <button key={s.view} type="button" data-testid={`tab-section-${s.view}`} className={s.view === activeView ? "screen-section-active" : ""} aria-current={s.view === activeView ? "page" : undefined} onClick={() => navigate(s.view)}>{s.label}{s.pro && <small>Pro</small>}</button>)}
    {extra}
  </nav>;
}
/** Legacy export name retained for callers. */
export const SimpleWorkspaceTools = ScreenSections;

export function StudioNavigation({ activeView, activeScreen, activeUtility, owner, navigate, openScreen, settings, guide, beginner = true, changeBeginner }: {
  activeView: WorkspaceView; activeScreen?: Screen; activeUtility?: "settings" | "guide"; owner: boolean;
  navigate: (view: WorkspaceView) => boolean | undefined; openScreen?: (screen: Screen) => boolean | undefined;
  settings: () => void; guide: () => void; visit?: (href: string) => void; beginner?: boolean; changeBeginner?: (value: boolean) => void;
}) {
  const current = activeScreen ?? screenOf(activeView);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(current === "plan-credits");
  const highlighted = contextParent[current]?.parent ?? current;
  const go = (screen: Screen) => { if ((openScreen ?? (sc => navigate(screenHome[sc])))(screen)) { setMobileOpen(false); window.scrollTo?.({ top: 0, behavior: cosmicScrollBehavior() }); } };
  const entry = (item: typeof primaryScreens[number]) => <button key={item.screen} type="button" data-testid={`nav-${item.screen}`} className={`studio-nav-entry${!activeUtility && highlighted === item.screen ? " nav-active" : ""}`} aria-current={!activeUtility && highlighted === item.screen ? "page" : undefined} onClick={() => go(item.screen)}><item.icon size={18}/><span>{item.label}</span></button>;
  return <div className="studio-navigation" data-mobile-open={mobileOpen}>
    <button type="button" className="studio-menu-toggle" aria-expanded={mobileOpen} aria-controls="studio-workspace-navigation" onClick={() => setMobileOpen(!mobileOpen)}>
      {mobileOpen ? <X size={18}/> : <Menu size={18}/>}<span>Studio menu</span>
    </button>
    <nav id="studio-workspace-navigation" className="studio-workspace-navigation" aria-label="Workspace">
      {beginner && <p className="studio-mode-note"><HologramSimpleViewNote/></p>}
      <div className="simple-main-navigation">{primaryScreens.map(entry)}</div>
      <div className="studio-nav-bottom">
        <div className="studio-nav-group nav-account-group" data-active={accountOpen}>
          <button type="button" className="studio-nav-heading" data-testid="toggle-account" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}><UserRound size={16}/><span>Account &amp; settings</span></button>
          {accountOpen && <div className="studio-nav-items">
            <button type="button" data-testid="nav-settings" className={`studio-nav-entry${activeUtility === "settings" ? " nav-active" : ""}`} aria-current={activeUtility === "settings" ? "page" : undefined} onClick={() => { settings(); setMobileOpen(false); }}><Settings2 size={15}/><span>Settings &amp; connections</span></button>
            <button type="button" data-testid="nav-plan-credits" className={`studio-nav-entry${!activeUtility && current === "plan-credits" ? " nav-active" : ""}`} aria-current={!activeUtility && current === "plan-credits" ? "page" : undefined} onClick={() => go("plan-credits")}><CreditCard size={15}/><span>Plan &amp; credits</span></button>
            <button type="button" data-testid="nav-guide" className={`studio-nav-entry${activeUtility === "guide" ? " nav-active" : ""}`} onClick={() => { guide(); setMobileOpen(false); }}><CircleHelp size={15}/><span>Studio Guide</span></button>
            {changeBeginner && <WorkspaceModeSwitch beginner={beginner} change={changeBeginner}/>}
            {owner && <a className="studio-nav-entry" href="/community/moderation" target="_blank" rel="noreferrer"><ShieldCheck size={15}/><span>Community Moderation</span></a>}
            {owner && <a className="studio-nav-entry" href="/admin"><ShieldCheck size={15}/><span>Launch administration</span></a>}
            {owner && <a className="studio-nav-entry" href="/admin/status" data-testid="nav-app-status"><Activity size={15}/><span>App status</span></a>}
          </div>}
        </div>
      </div>
    </nav>
    <nav className="studio-mobile-dock" aria-label="Mobile quick actions">
      {primaryScreens.map(({ screen, label, icon: Icon }) => <button key={screen} type="button" data-testid={`dock-${screen}`} data-cosmic-dock={screen} aria-current={!activeUtility && highlighted === screen ? "page" : undefined} onClick={() => go(screen)}><Icon size={20}/><span>{label}</span></button>)}
    </nav>
  </div>;
}
export { screenHome };
