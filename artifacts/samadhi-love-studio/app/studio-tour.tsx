"use client";
import { useState } from "react";

const tourSteps = [
  {
    title: "Start with one idea",
    text: "In Create, describe what the song is about and choose a style. Simple keeps the form short; Custom opens lyrics, vocals and more controls. Nothing is submitted until you press Create.",
  },
  {
    title: "Your work stays in My Songs",
    text: "Saved songs and recordings are private. Reopen a song to edit it, keep lyric versions, make a video, or review its Release checklist. A failed save should show an error so you can retry.",
  },
  {
    title: "Review before sharing",
    text: "Choose a video look, then check the actual captions and timing before export. You can record your own voice in Record. Nothing is published or shared automatically.",
  },
];

export function StudioQuickTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = tourSteps[step];
  return <div className="studio-tour" data-testid="studio-quick-tour">
    <p className="eyebrow">GETTING STARTED · {step + 1} OF {tourSteps.length}</p>
    <h3>{current.title}</h3>
    <p>{current.text}</p>
    <div className="tour-progress" aria-label={`Step ${step + 1} of ${tourSteps.length}`}>
      {tourSteps.map((item, index) => <span key={item.title} aria-current={index === step ? "step" : undefined}/>)}
    </div>
    <div className="actions">
      <button type="button" className="text-button" data-testid="button-skip-tour" onClick={onDone}>Skip tour</button>
      {step > 0 && <button type="button" className="secondary" data-testid="button-back-tour" onClick={() => setStep(value => value - 1)}>Back</button>}
      {step < tourSteps.length - 1
        ? <button type="button" className="primary" data-testid="button-next-tour" onClick={() => setStep(value => value + 1)}>Next</button>
        : <button type="button" className="primary" data-testid="button-finish-tour" onClick={onDone}>Finish tour</button>}
    </div>
  </div>;
}
