"use client";
import { useState } from "react";

const tourSteps = [
  {
    title: "Describe or hum your song",
    text: "Describe the subject, mood, style and language—or record a private melody idea. Help me describe it expands your words locally. Nothing is sent until you press Create.",
  },
  {
    title: "Listen and keep your favourite",
    text: "Make one version, or choose two for two separate music requests and twice the provider usage. Both versions stay together in My Songs; listen and favorite the one you prefer.",
  },
  {
    title: "Make a video",
    text: "Make a short, choose a look and move where it starts. Review the captions before export. Your songs and videos stay private until you choose to share them.",
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
