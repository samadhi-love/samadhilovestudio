"use client";
import {brand} from "../brand";
import { useEffect } from "react";
import { useClerk } from "@clerk/react";
import "../auth-pages.css";

export default function SignOutPage() {
  const { signOut, loaded } = useClerk();
  useEffect(() => {
    if (loaded) void signOut({ redirectUrl: "/" });
  }, [loaded, signOut]);
  return (
    <main className="studio-auth">
      <a className="brand" href="/"><img src="/favicon.svg" alt="" /><strong>{brand.name}</strong></a>
      <p className="studio-auth-note">Signing you out. Your work stays safely saved.</p>
    </main>
  );
}
