/** Keep keyboard focus within an open dialog and return it to its original trigger. */
export function containDialogFocus(dialog:HTMLElement,trigger:HTMLElement|null){
 const candidates=()=>Array.from(dialog.querySelectorAll<HTMLElement>('summary,button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>!el.matches(':disabled')&&!el.hidden&&!el.closest('[hidden],[inert]')&&el.getAttribute('aria-hidden')!=='true'&&!Array.from(dialog.querySelectorAll('details:not([open])')).some(d=>d.contains(el)&&d.querySelector('summary')!==el)&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
 const focusFirst=()=>{const target=candidates()[0]??dialog;target.focus();};
 if(!dialog.hasAttribute('tabindex'))dialog.tabIndex=-1;
 focusFirst();
 const key=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const items=candidates(),first=items[0],last=items.at(-1);if(!first){e.preventDefault();dialog.focus();return;}if(!dialog.contains(document.activeElement)){e.preventDefault();(e.shiftKey?last:first)?.focus();}else if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){e.preventDefault();first.focus();}};
 const focus=(e:FocusEvent)=>{if(e.target instanceof Node&&!dialog.contains(e.target))focusFirst();};
 document.addEventListener('keydown',key,true);document.addEventListener('focusin',focus,true);
 return()=>{document.removeEventListener('keydown',key,true);document.removeEventListener('focusin',focus,true);if(trigger?.isConnected)trigger.focus();};
}
