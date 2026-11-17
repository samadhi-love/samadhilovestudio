"use client";

import { useState } from "react";
import { CircleHelp, CreditCard, Film, Globe2, Layers3, ListMusic, Megaphone, Menu, Mic, Radio, Settings2, ShieldCheck, Sparkles, X, type LucideIcon } from "lucide-react";
import { screenHome, screenOf, screenSections, type Screen, type SectionView } from "./studio-routes";
import { HelpTip } from "./help-tip";

export type WorkspaceView = SectionView;

const sectionLabels: Record<SectionView, string> = {
  overview: "Create", create: "Detailed production", "prompt-lab": "Prompt helpers", "vocal-director": "Vocals", templates: "Start from a recipe",
  "music-library": "World Sounds · Library", "rhythm-atlas": "World Sounds · Rhythms", "international-tent": "World Sounds · International", "meditative-vibes": "World Sounds · Meditative",
  recording: "Record · Voice", podcast: "Record · Podcast", "vocal-studio": "Record · Vocal Studio Pro",
  multitrack: "Mix & Edit · Timeline", compare: "Mix & Edit · Compare",
  songs: "My Songs", workflow: "My Songs · Song steps", releases: "My Songs · Release checklist", distribution: "My Songs · Export & release tools",
  promote: "Promote", radio: "Explore", "lyric-video": "Video",
};
const screenGuidance: Record<Screen, { label: string; tip: string }> = {
  create: { label: "Create", tip: "Start with one song idea. Simple keeps choices light; Custom opens lyrics, language, vocals, prompts and Pro production. Nothing is sent until you press Create." },
  "world-sounds": { label: "World Sounds", tip: "Browse a sound or rhythm, then choose Use in my song to fill Create. This does not generate music or use credits." },
  record: { label: "Record", tip: "Choose Voice or Podcast before recording. Your takes stay private; stop recording before switching workspaces." },
  "mix-edit": { label: "Mix & Edit", tip: "Use these advanced tools to edit saved audio. Keep the original take and compare versions before choosing a result." },
  songs: { label: "My Songs", tip: "Your saved songs stay private. Listen, reopen a song to edit, make a video, or review its Release checklist." },
  promote: { label: "Promote", tip: "Prepare artwork or an ad brief here. Review everything before exporting or sharing; nothing is published automatically." },
  explore: { label: "Explore", tip: "Listen, discover and visit Party Mix. Community sharing and the Listening Room keep their existing access rules." },
  "plan-credits": { label: "Plan & Credits", tip: "Review membership and usage. Viewing plans does not start billing." },
  "lyric-video": { label: "Video", tip: "Choose a look for a local preview. Check caption wording and timing before export; a visual preview does not verify singing alignment." },
};

/** One persistent workspace-level mode control, available from every screen. */
export function WorkspaceModeSwitch({ beginner, change }: { beginner: boolean; change: (value: boolean) => void }) {
  return <div className="workspace-mode-switch">
    <span>View</span>
    <button type="button" role="switch" data-testid="switch-workspace-mode" aria-checked={!beginner}
      aria-label={beginner ? "Switch to Advanced view" : "Switch to Simple view"}
      onClick={() => change(!beginner)}>
      <span aria-hidden="true">{beginner ? "Simple" : "Advanced"}</span>
    </button>
    <HelpTip subject="Simple and Advanced views" tip="Simple is the guided starting point. Advanced opens Pro navigation and deeper controls without changing your songs or settings."/>
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

export const primaryScreens: { screen: Screen; label: string; icon: LucideIcon; pro?: boolean }[] = [
  { screen: "create", label: "Create", icon: Sparkles },
  { screen: "songs", label: "My Songs", icon: ListMusic },
  { screen: "lyric-video", label: "Video", icon: Film },
  { screen: "record", label: "Record", icon: Mic },
  { screen: "explore", label: "Explore", icon: Radio },
  { screen: "world-sounds", label: "World Sounds", icon: Globe2, pro: true },
  { screen: "mix-edit", label: "Mix & Edit", icon: Layers3, pro: true },
  { screen: "promote", label: "Promote", icon: Megaphone, pro: true },
];

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
  const [helpOpen, setHelpOpen] = useState(current === "plan-credits");
  const visible = primaryScreens.filter(item => !item.pro || !beginner);
  const go = (screen: Screen) => { if ((openScreen ?? (sc => navigate(screenHome[sc])))(screen)) { setMobileOpen(false); window.scrollTo?.({ top: 0, behavior: "smooth" }); } };
  const entry = (item: typeof primaryScreens[number]) => <button key={item.screen} type="button" data-testid={`nav-${item.screen}`} className={`studio-nav-entry${!activeUtility && current === item.screen ? " nav-active" : ""}`} aria-current={!activeUtility && current === item.screen ? "page" : undefined} onClick={() => go(item.screen)}><item.icon size={18}/><span>{item.label}</span>{item.pro && <small className="nav-pro-tag">Pro</small>}</button>;
  return <div className="studio-navigation" data-mobile-open={mobileOpen}>
    <button type="button" className="studio-menu-toggle" aria-expanded={mobileOpen} aria-controls="studio-workspace-navigation" onClick={() => setMobileOpen(!mobileOpen)}>
      {mobileOpen ? <X size={18}/> : <Menu size={18}/>}<span>Studio menu</span>
    </button>
    <nav id="studio-workspace-navigation" className="studio-workspace-navigation" aria-label="Workspace">
      {changeBeginner && <p className="studio-mode-note">{beginner ? "Simple view · start with an idea" : "Advanced view · Pro screens are available below"}</p>}
      <div className="simple-main-navigation">{visible.filter(i => !i.pro).map(entry)}</div>
      {!beginner && <div className="creator-secondary-nav nav-pro-group"><p className="nav-label">PRO TOOLS</p>{visible.filter(i => i.pro).map(entry)}</div>}
      <div className="studio-nav-group nav-help-group" data-active={helpOpen}>
        <button type="button" className="studio-nav-heading" data-testid="toggle-settings-help" aria-expanded={helpOpen} onClick={() => setHelpOpen(!helpOpen)}><Settings2 size={17}/><span>Settings & Help</span></button>
        {helpOpen && <div className="studio-nav-items">
          <button type="button" data-testid="nav-plan-credits" className={`studio-nav-entry${!activeUtility && current === "plan-credits" ? " nav-active" : ""}`} onClick={() => go("plan-credits")}><CreditCard size={15}/><span>Plan & Credits</span></button>
          <button type="button" data-testid="nav-settings" className={`studio-nav-entry${activeUtility === "settings" ? " nav-active" : ""}`} onClick={() => { settings(); setMobileOpen(false); }}><Settings2 size={15}/><span>Settings</span></button>
          <button type="button" data-testid="nav-guide" className={`studio-nav-entry${activeUtility === "guide" ? " nav-active" : ""}`} onClick={() => { guide(); setMobileOpen(false); }}><CircleHelp size={15}/><span>Studio Guide</span></button>
          {owner && <a className="studio-nav-entry" href="/community/moderation" target="_blank" rel="noreferrer"><ShieldCheck size={15}/><span>Community Moderation</span></a>}
          {owner && <a className="studio-nav-entry" href="/admin"><ShieldCheck size={15}/><span>Launch administration</span></a>}
        </div>}
      </div>
    </nav>
    <nav className="studio-mobile-dock" aria-label="Mobile quick actions">
      {primaryScreens.filter(i => !i.pro).map(({ screen, label, icon: Icon }) => <button key={screen} type="button" data-testid={`dock-${screen}`} aria-current={current === screen ? "page" : undefined} onClick={() => go(screen)}><Icon size={20}/><span>{label}</span></button>)}
      <button type="button" data-testid="dock-more" aria-expanded={mobileOpen} aria-controls="studio-workspace-navigation" onClick={() => { setMobileOpen(!mobileOpen); setHelpOpen(true); window.scrollTo?.({ top: 0, behavior: "smooth" }); }}><Menu size={20}/><span>More</span></button>
    </nav>
  </div>;
}
export { screenHome };
