import { plans } from "../credits/data";
export function PlanCards({ ready = false }: { ready?: boolean }) {
  return <div className="member-plans">{Object.entries(plans).map(([id, plan]) => <article className={`member-plan ${id === "pro" ? "member-plan-featured" : ""}`} key={id}>
    <div className="member-plan-label">{id === "pro" ? "RECOMMENDED FOR REGULAR CREATORS" : id === "free" ? "START CREATING" : id === "studio" ? "FOR ACTIVE PRODUCTION" : "YOUR FIRST ORIGINALS"}</div>
    <h2>{plan.name}</h2><p>{id === "free" ? "Explore your own private creative workspace." : id === "creator" ? "A measured allowance for new ideas and first releases." : id === "pro" ? "More room for alternate versions, captions and stems." : "Our largest monthly production allowance."}</p>
    <div className="member-plan-price">${plan.price}<small> USD / month</small></div>
    <strong>{plan.credits ? `${plan.credits.toLocaleString()} SAMADHI credits / billing month` : "No card required"}</strong>
    <ul><li>Private songs, projects and recordings</li><li>Studio editing and local lyric-video tools</li><li>Explicit sharing and public publishing controls</li>{plan.credits ? <><li>Up to {Math.floor(plan.credits / 72)} four-minute music generations*</li><li>Up to {plan.concurrent} simultaneous production job(s)</li><li>{plan.daily} Studio-funded attempts per UTC day</li></> : <><li>Local instrumental and meditative creation</li><li>Use your own provider connection for AI processing</li><li>No included Studio-funded AI generation</li></>}</ul>
    <a className={id === "pro" ? "primary" : "secondary"} href={"/members?plan=" + id}>{id === "free" ? "Create free account" : ready ? `Choose ${plan.name}` : `Select ${plan.name} for launch`}</a>
    {id !== "free" && <small>{ready ? "Monthly renewal. Review all charges before paying." : "Proposed plan. No payment will be collected."}</small>}
  </article>)}</div>;
}
