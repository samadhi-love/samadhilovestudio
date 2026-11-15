"use client";

import { cloneElement, useEffect, useId, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Position = { left: number; top: number; arrow: number; above: boolean };

export function HelpTip({ subject, tip, descriptionId }: { subject: string; tip: string; descriptionId?: string }) {
  const generatedId = useId();
  const id = descriptionId ?? generatedId;
  const trigger = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const pinned = useRef(false);
  const focused = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  function keepOpen() {
    window.clearTimeout(timer.current);
    setOpen(true);
  }

  function hide() {
    window.clearTimeout(timer.current);
    pinned.current = false;
    setOpen(false);
    setPosition(null);
  }

  function closeSoon() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!pinned.current && !focused.current) hide();
    }, 140);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    function align() {
      if (!trigger.current || !bubble.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const box = bubble.current.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      if (anchor.bottom <= 0 || anchor.top >= height || anchor.right <= 0 || anchor.left >= width) {
        setPosition(null);
        return;
      }
      const edge = 8;
      const gap = 7;
      const center = (anchor.left + anchor.right) / 2;
      const left = Math.max(edge, Math.min(width - box.width - edge, center - box.width / 2));
      const above = anchor.bottom + gap + box.height > height - edge && anchor.top > height - anchor.bottom;
      const desiredTop = above ? anchor.top - gap - box.height : anchor.bottom + gap;
      const top = Math.max(edge, Math.min(height - box.height - edge, desiredTop));
      const arrow = Math.max(12, Math.min(box.width - 12, center - left));
      setPosition({ left, top, arrow, above });
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      hide();
    }
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !bubble.current?.contains(event.target))
        hide();
    }
    align();
    window.addEventListener("resize", align);
    window.addEventListener("scroll", align, true);
    document.addEventListener("keydown", dismissOnEscape, true);
    document.addEventListener("pointerdown", dismissOutside, true);
    return () => {
      window.removeEventListener("resize", align);
      window.removeEventListener("scroll", align, true);
      document.removeEventListener("keydown", dismissOnEscape, true);
      document.removeEventListener("pointerdown", dismissOutside, true);
    };
  }, [open, tip]);

  return <>
    <button ref={trigger} type="button" className="help-tip-button" aria-label={`Help for ${subject}`} aria-describedby={id}
      onPointerEnter={event => { if (event.pointerType !== "touch") keepOpen(); }}
      onPointerLeave={closeSoon}
      onFocus={event => { if (event.currentTarget.matches(":focus-visible")) { focused.current = true; keepOpen(); } }}
      onBlur={() => { focused.current = false; pinned.current = false; closeSoon(); }}
      onClick={() => {
        if (pinned.current) hide();
        else { pinned.current = true; keepOpen(); }
      }}>?</button>
    {open ? createPortal(<div id={id} ref={bubble} role="tooltip" className="help-tip-bubble"
      data-above={position?.above || undefined} onPointerEnter={keepOpen} onPointerLeave={closeSoon}
      style={position ? { left: position.left, top: position.top, "--help-arrow": position.arrow + "px" } as CSSProperties : { visibility: "hidden" }}>
      {tip}
    </div>, document.body) : <span id={id} hidden>{tip}</span>}
  </>;
}

export function HelpField({ label, subject, tip, children, className = "" }: {
  label: ReactNode; subject?: string; tip: string; children: ReactElement<{ id?: string; "aria-describedby"?: string }>; className?: string;
}) {
  const id = useId();
  const descriptionId = id + "-help";
  const fieldId = children.props.id ?? id;
  const description = [children.props["aria-describedby"], descriptionId].filter(Boolean).join(" ");
  return <div className={`field help-field ${className}`.trim()}>
    <div className="help-field-heading"><label htmlFor={fieldId}>{label}</label>
      <HelpTip subject={subject ?? (typeof label === "string" ? label : "this field")} tip={tip} descriptionId={descriptionId}/></div>
    {cloneElement(children, { id: fieldId, "aria-describedby": description })}
  </div>;
}

export function HelpControl({ subject, tip, children }: { subject: string; tip: string; children: ReactNode }) {
  return <span className="help-control">{children}<HelpTip subject={subject} tip={tip}/></span>;
}
