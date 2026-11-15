"use client";
import { SignIn } from "@clerk/react";
import "../../auth-pages.css";

export default function SignInPage() {
  return (
    <main className="studio-auth">
      <a className="brand" href="/"><img src="/favicon.svg" alt="" /><strong>SAMADHI LOVE</strong></a>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/creator" />
      <p className="studio-auth-note">New here? Creating an account is free, and you can keep listening without one. <a href="/community">Keep listening</a></p>
    </main>
  );
}
