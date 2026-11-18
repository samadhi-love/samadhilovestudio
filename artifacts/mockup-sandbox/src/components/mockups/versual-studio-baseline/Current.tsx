import "./_group.css";

// Extracted directly from the existing Studio sidebar before its redesign.
// Navigation is a no-op in this isolated baseline; no app services are imported.
const brand={name:"Versual Studio",subline:"A SAMADHI LOVE creative studio"};
const icon='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1b1533"/><ellipse cx="32" cy="32" rx="23" ry="10" fill="none" stroke="#f3e9ff" stroke-width="4" transform="rotate(-28 32 32)"/><circle cx="32" cy="32" r="7" fill="#f3e9ff"/><circle cx="50.5" cy="21.5" r="5" fill="#ff2fa8"/></svg>');
export function Current(){
  return <div className="studio-baseline"><aside className="sidebar">
    <button className="brand" onClick={()=>{}}><img src={icon} alt=""/><span><strong>{brand.name}</strong><small>{brand.subline}</small></span></button>
  </aside></div>;
}
