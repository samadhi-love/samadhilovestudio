// Closed lists only. Never include messages, stacks, URLs, form values or media.
export const diagnosticPanels=["studio","create","songs","video","lyric-video","record","explore","radio","settings","video-editor","video-timeline","mix","world-sounds","world","promote","plan-credits","tools","guide"] as const;
export const diagnosticActions=["render","event","unhandled-rejection","try-again"] as const;
const errorTypes=["Error","TypeError","RangeError","ReferenceError","SyntaxError","TimeoutError","AbortError"];
export function crashDiagnostic(panel:string,action:string,error?:unknown) {
  return {
    panel:diagnosticPanels.includes(panel as typeof diagnosticPanels[number])?panel:"studio",
    action:diagnosticActions.includes(action as typeof diagnosticActions[number])?action:"event",
    errorType:errorTypes.includes((error as Error)?.name)?(error as Error).name:"Error",
    occurredAt:new Date().toISOString(),
    requestId:crypto.randomUUID(),
  };
}
export function validateDiagnostic(input:unknown) {
  if(!input||typeof input!=="object"||Array.isArray(input))return null;
  const value=input as Record<string,unknown>;
  if(Object.keys(value).some(key=>!["panel","action","errorType","occurredAt","requestId"].includes(key)))return null;
  if(!diagnosticPanels.includes(value.panel as typeof diagnosticPanels[number])||
    !diagnosticActions.includes(value.action as typeof diagnosticActions[number])||
    !errorTypes.includes(String(value.errorType))||typeof value.requestId!=="string"||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId)||
    typeof value.occurredAt!=="string"||!Number.isFinite(Date.parse(value.occurredAt)))return null;
  return {panel:value.panel,action:value.action,errorType:value.errorType,occurredAt:new Date(value.occurredAt).toISOString(),requestId:value.requestId};
}
