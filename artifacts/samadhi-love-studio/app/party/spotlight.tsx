"use client";
import { useEffect, useState } from "react";
import { Disc3 } from "lucide-react";
import type { Party } from "./data";
export function PartySpotlight() {
  const [parties, setParties] = useState<Party[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/party?featured=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (
          active &&
          data &&
          typeof data === "object" &&
          "parties" in data &&
          Array.isArray(data.parties)
        )
          setParties(data.parties);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="section" style={{ marginBlock: 20 }}>
      <div className="section-heading">
        <h2>
          <Disc3 size={18} /> Party Mix
        </h2>
        <a className="secondary small" href="/party">
          Build a party
        </a>
      </div>
      <p className="muted">
        Create a continuous set from your originals and licensed downloads.
      </p>
      {parties.length > 0 && (
        <div className="actions" aria-label="Featured parties">
          {parties.map((p) => (
            <a
              className="secondary"
              key={p.id}
              href={"/party?party=" + encodeURIComponent(p.id)}
            >
              ♫ {p.name} · {p.tracks.length} tracks
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
