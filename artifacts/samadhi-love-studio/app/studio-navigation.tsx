"use client";

import { useEffect, useState } from "react";
import { BookOpen, CircleHelp, Clapperboard, ClipboardList, FileText, Film, FlaskConical, GitCompareArrows, Globe2, Headphones, House, Layers3, LayoutGrid, ListMusic, Menu, Mic, Radio, Settings2, ShieldCheck, Sparkles, Users, X, type LucideIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

export const workspaceNavigation = [
  { id: "overview", label: "Music Creation", icon: LayoutGrid },
  { id: "workflow", label: "Project Workflow", icon: Layers3 },
  { id: "create", label: "Detailed Song Production", icon: Sparkles },
  { id: "prompt-lab", label: "Creative Prompt Lab", icon: FlaskConical },
  { id: "vocal-director", label: "Vocal Director", icon: Mic },
  { id: "templates", label: "Templates", icon: Layers3 },
  { id: "recording", label: "Recording Desk", icon: Mic },
  { id: "vocal-studio", label: "Vocal Studio Pro", icon: Mic },
  { id: "podcast", label: "Podcast Studio", icon: Mic },
  { id: "multitrack", label: "Audio + Visual Studio", icon: Layers3 },
  { id: "compare", label: "Mix Lab", icon: GitCompareArrows },
  { id: "music-library", label: "Universal Music Library", icon: BookOpen },
  { id: "meditative-vibes", label: "Meditative Vibes", icon: Sparkles },
  { id: "rhythm-atlas", label: "World Rhythm Atlas", icon: Globe2 },
  { id: "international-tent", label: "International Music Tent", icon: Globe2 },
  { id: "songs", label: "My Songs", icon: ListMusic },
  { id: "radio", label: "Radio", icon: Radio },
  { id: "lyric-video", label: "Lyric Videos & Shorts", icon: Film },
  { id: "releases", label: "Release Board", icon: ClipboardList },
  { id: "distribution", label: "Release Tools", icon: Clapperboard },
] as const;

export type WorkspaceView = typeof workspaceNavigation[number]["id"];
type Entry = { view: WorkspaceView } | { label: string; icon: LucideIcon; href: string; newTab?: boolean; ownerOnly?: boolean } | { label: string; icon: LucideIcon; action: "settings" | "guide" };
export const navigationGroups: { id: string; label: string; icon: LucideIcon; entries: Entry[] }[] = [
  { id: "music-creation", label: "Create", icon: Sparkles, entries: [
    { view: "overview" }, { view: "lyric-video" }, { view: "create" }, { view: "prompt-lab" }, { view: "vocal-director" }, { view: "templates" },
  ] },
  { id: "home-projects", label: "Projects & Artist", icon: House, entries: [
    { view: "workflow" },
    { label: "Artist Dashboard", icon: Headphones, href: "/community/artist-dashboard", newTab: true },
  ] },
  { id: "recording-production", label: "Recording & Production", icon: Mic, entries: [
    { view: "recording" }, { view: "vocal-studio" }, { view: "podcast" }, { view: "multitrack" }, { view: "compare" },
  ] },
  { id: "world-sounds", label: "Music & World Sounds", icon: Globe2, entries: [
    { view: "music-library" }, { view: "meditative-vibes" }, { view: "rhythm-atlas" }, { view: "international-tent" }, { view: "songs" },
  ] },
  { id: "entertainment", label: "Entertainment", icon: Radio, entries: [
    { view: "radio" }, { label: "Party Mix", icon: Radio, href: "/party" },
  ] },
  { id: "video-releases", label: "Video & Releases", icon: Film, entries: [
    { view: "releases" }, { view: "distribution" },
  ] },
  { id: "artist-community", label: "Artist & Community", icon: Users, entries: [
    { label: "Community", icon: Users, href: "/community", newTab: true },
    { label: "Subscriber Listening Room", icon: Headphones, href: "/subscriber", newTab: true },
    { label: "Community Moderation", icon: ShieldCheck, href: "/community/moderation", newTab: true, ownerOnly: true },
  ] },
  { id: "settings-help", label: "Settings & Help", icon: Settings2, entries: [
    { label: "My Membership", icon: Users, href: "/members" },
    { label: "Plans", icon: Sparkles, href: "/plans" },
    { label: "Credits & Usage", icon: Sparkles, href: "/credits" },
    { label: "Settings", icon: Settings2, action: "settings" },
    { label: "Studio Guide", icon: CircleHelp, action: "guide" },
    { label: "Launch administration", icon: ShieldCheck, href: "/admin", ownerOnly: true },
  ] },
];

export const simpleWorkspaces: { id: string; label: string; icon: LucideIcon; home: WorkspaceView; views: WorkspaceView[]; primary: WorkspaceView[] }[] = [
  { id: "make", label: "Create", icon: Sparkles, home: "overview", views: ["overview", "create", "templates", "prompt-lab", "vocal-director", "music-library", "meditative-vibes", "rhythm-atlas", "international-tent", "lyric-video", "releases", "distribution"], primary: ["overview", "lyric-video"] },
  { id: "library", label: "My Music", icon: ListMusic, home: "songs", views: ["songs", "workflow"], primary: ["songs"] },
  { id: "record", label: "Record", icon: Mic, home: "recording", views: ["recording", "podcast", "vocal-studio", "multitrack", "compare"], primary: ["recording", "podcast"] },
  { id: "listen", label: "Radio & Community", icon: Radio, home: "radio", views: ["radio"], primary: ["radio"] },
];
const simpleLabels: Partial<Record<WorkspaceView,string>> = {overview:"1 · Music Creation",create:"Detailed production editor",templates:"Song templates",recording:"Record a voice",podcast:"Record a podcast","lyric-video":"2 · Lyric Videos & Shorts",releases:"Release checklist",distribution:"Export & release tools",songs:"Songs & recordings",workflow:"Full project workflow"};
export function SimpleWorkspaceTools({ activeView, navigate, visit }: { activeView: WorkspaceView; navigate: (view: WorkspaceView) => boolean | undefined;visit?:(href:string)=>void }) {
  const group = simpleWorkspaces.find(g=>g.views.includes(activeView))!;
  const extras = group.views.filter(view=>!group.primary.includes(view)&&(group.id!=="make"||["releases","distribution"].includes(view)));
  const button = (view: WorkspaceView) => <button key={view} type="button" className={`secondary small${view===activeView?" simple-tool-active":""}`} aria-current={view===activeView?"page":undefined} onClick={()=>navigate(view)}>{simpleLabels[view]??workspaceNavigation.find(n=>n.id===view)!.label}</button>;
  return <section className="simple-workspace-tools" aria-label={`${group.label} tools`}><div className="actions">{group.primary.map(button)}{group.id==="listen"&&<><a className="secondary small" href="/community">Discover artists</a><a className="secondary small" href="/party">Party Mix</a></>}{group.id==="make"&&<a className="secondary small" href="/community/artist-dashboard" onClick={event=>{if(visit){event.preventDefault();visit("/community/artist-dashboard");}}}>3 · Publish & share</a>}</div>{extras.length>0&&<details key={group.id} open={extras.includes(activeView)||undefined}><summary>More {group.id==="record"?"recording & mixing":group.id==="make"?"release":"creative"} tools</summary><div className="actions">{extras.map(button)}</div></details>}</section>;
}

export function StudioNavigation({ activeView, activeUtility, owner, navigate, settings, guide, visit, beginner = true, changeBeginner }: {
  activeView: WorkspaceView; activeUtility?: "settings" | "guide"; owner: boolean;
  navigate: (view: WorkspaceView) => boolean | undefined;
  settings: () => void; guide: () => void; visit?:(href:string)=>void; beginner?: boolean; changeBeginner?: (value: boolean) => void;
}) {
  const activeGroup = activeUtility ? "settings-help" : navigationGroups.find(group => group.entries.some(entry => "view" in entry && entry.view === activeView))!.id;
  const [expanded, setExpanded] = useState<string[]>([activeGroup]);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setExpanded(current => current.includes(activeGroup) ? current : [...current, activeGroup]);
  }, [activeGroup, activeView, activeUtility]);

  return <div className="studio-navigation" data-mobile-open={mobileOpen}>
    <button type="button" className="studio-menu-toggle" aria-expanded={mobileOpen} aria-controls="studio-workspace-navigation" onClick={() => setMobileOpen(!mobileOpen)}>
      {mobileOpen ? <X size={18}/> : <Menu size={18}/>}<span>Studio menu</span>
    </button>
    <nav id="studio-workspace-navigation" className="studio-workspace-navigation" aria-label="Workspace">
      {changeBeginner && <div className="studio-mode-control"><button type="button" role="switch" aria-checked={!beginner} aria-label="Show Pro tools" onClick={()=>changeBeginner(!beginner)}>Pro tools <span>{beginner?"Off":"On"}</span></button><small>{beginner?"Simple view · start with an idea":"All workspaces · detailed controls"}</small></div>}
      {beginner && <div className="simple-main-navigation">{simpleWorkspaces.filter(group=>["make","library"].includes(group.id)).map(group=><button key={group.id} type="button" className={`studio-nav-entry${!activeUtility&&group.views.includes(activeView)?" nav-active":""}`} aria-current={!activeUtility&&group.views.includes(activeView)?"page":undefined} onClick={()=>{if(navigate(group.home))setMobileOpen(false);}}><group.icon size={18}/><span>{group.label}</span></button>)}<a className="studio-nav-entry" href="/community" onClick={event=>{if(visit){event.preventDefault();visit("/community");}}}><Users size={18}/><span>Explore</span></a></div>}
      {beginner&&<div className="creator-secondary-nav">{simpleWorkspaces.filter(group=>["record","listen"].includes(group.id)).map(group=><button key={group.id} className={`studio-nav-entry${group.views.includes(activeView)?" nav-active":""}`} type="button" onClick={()=>{if(navigate(group.home))setMobileOpen(false);}}><group.icon size={16}/>{group.id==="listen"?"Radio":"Recording tools"}</button>)}</div>}
      <Accordion type="multiple" value={expanded} onValueChange={setExpanded} className="studio-nav-groups">
        {navigationGroups.filter(group=>!beginner||group.id==="settings-help").map(({ id, label, icon: Icon, entries }) => <AccordionItem key={id} value={id} className="studio-nav-group" data-active={activeGroup === id}>
          <AccordionTrigger className="studio-nav-heading"><Icon size={17}/><span>{label}</span></AccordionTrigger>
          <AccordionContent className="studio-nav-content"><div className="studio-nav-items">
            {entries.map(entry => {
              if ("view" in entry) {
                const item = workspaceNavigation.find(item => item.id === entry.view)!;
                const active = !activeUtility && activeView === item.id;
                return <button key={item.id} type="button" className={`studio-nav-entry${active ? " nav-active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => {
                  if (navigate(item.id)) setMobileOpen(false);
                }}><item.icon size={15}/><span>{item.label}</span></button>;
              }
              if ("href" in entry) {
                if (entry.ownerOnly && !owner) return null;
                return <a key={entry.href} className="studio-nav-entry" href={entry.href} target={entry.newTab ? "_blank" : undefined} rel={entry.newTab ? "noreferrer" : undefined}><entry.icon size={15}/><span>{entry.label}</span></a>;
              }
              return <button key={entry.action} type="button" className={`studio-nav-entry${activeUtility === entry.action ? " nav-active" : ""}`} onClick={() => {
                (entry.action === "settings" ? settings : guide)(); setMobileOpen(false);
              }}><entry.icon size={15}/><span>{entry.label}</span></button>;
            })}
          </div></AccordionContent>
        </AccordionItem>)}
      </Accordion>
    </nav>
    <nav className="studio-mobile-dock" aria-label="Mobile quick actions">{[{view:"overview",label:"Create",Icon:Sparkles},{view:"songs",label:"My Songs",Icon:ListMusic},{view:"recording",label:"Record",Icon:Mic},{view:"lyric-video",label:"Video",Icon:Film}].map(({view,label,Icon})=><button key={view} type="button" aria-current={activeView===view?"page":undefined} onClick={()=>{if(navigate(view as WorkspaceView)){setMobileOpen(false);window.scrollTo?.({top:0,behavior:"smooth"});}}}><Icon size={20}/><span>{label}</span></button>)}<button type="button" aria-expanded={mobileOpen} aria-controls="studio-workspace-navigation" onClick={()=>{setMobileOpen(!mobileOpen);window.scrollTo?.({top:0,behavior:"smooth"});}}><Menu size={20}/><span>More</span></button></nav>
  </div>;
}
